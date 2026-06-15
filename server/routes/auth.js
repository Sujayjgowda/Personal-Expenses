const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'finance-vault-secret-key-12345';

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [trimmedUsername, trimmedEmail]
    );
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email is already taken' });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Start transaction for user creation and potential migration
    const client = await pool.connect();
    let newUser;
    try {
      await client.query('BEGIN');
      
      // Check how many users exist BEFORE inserting this one
      const userCountResult = await client.query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(userCountResult.rows[0].count);

      // Insert new user
      const insertResult = await client.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
        [trimmedUsername, trimmedEmail, passwordHash]
      );
      newUser = insertResult.rows[0];

      // If this is the FIRST registered user, migrate existing orphaned records
      if (userCount === 0) {
        console.log(`🚀 First user registered (ID: ${newUser.id}). Migrating existing data...`);
        await client.query('UPDATE income SET user_id = $1 WHERE user_id IS NULL', [newUser.id]);
        await client.query('UPDATE expenses SET user_id = $1 WHERE user_id IS NULL', [newUser.id]);
        await client.query('UPDATE savings SET user_id = $1 WHERE user_id IS NULL', [newUser.id]);
        await client.query('UPDATE bills SET user_id = $1 WHERE user_id IS NULL', [newUser.id]);
        await client.query('UPDATE category_budgets SET user_id = $1 WHERE user_id IS NULL', [newUser.id]);
      }

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    // Generate JWT token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const searchStr = usernameOrEmail.trim();
    
    // Find user by username or email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [searchStr, searchStr.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const user = userResult.rows[0];

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /me (verify token & return profile)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userResult.rows[0]);
  } catch (err) {
    console.error('Verify user error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
