const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all savings for a month
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month query param required (YYYY-MM)' });

    const monthDate = `${month}-01`;
    const result = await pool.query(
      'SELECT * FROM savings WHERE month = $1 AND is_archived = FALSE ORDER BY created_at DESC',
      [monthDate]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /savings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST new savings
router.post('/', async (req, res) => {
  try {
    const { type, name, amount, month, notes } = req.body;
    const monthDate = `${month}-01`;
    const result = await pool.query(
      'INSERT INTO savings (type, name, amount, month, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [type, name, amount, monthDate, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /savings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update savings
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, amount, month, notes } = req.body;
    const monthDate = `${month}-01`;
    const result = await pool.query(
      'UPDATE savings SET type=$1, name=$2, amount=$3, month=$4, notes=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [type, name, amount, monthDate, notes || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /savings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH archive savings
router.patch('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE savings SET is_archived = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /savings/archive error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
