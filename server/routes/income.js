const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all income for a month
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month query param required (YYYY-MM)' });

    const monthDate = `${month}-01`;
    const result = await pool.query(
      'SELECT * FROM income WHERE user_id = $1 AND month = $2 AND is_archived = FALSE ORDER BY created_at DESC',
      [req.userId, monthDate]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /income error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST new income
router.post('/', async (req, res) => {
  try {
    const { source, amount, month, notes } = req.body;
    const monthDate = `${month}-01`;
    const result = await pool.query(
      'INSERT INTO income (user_id, source, amount, month, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, source, amount, monthDate, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /income error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update income
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { source, amount, month, notes } = req.body;
    const monthDate = `${month}-01`;
    const result = await pool.query(
      'UPDATE income SET source=$1, amount=$2, month=$3, notes=$4, updated_at=NOW() WHERE id=$5 AND user_id=$6 RETURNING *',
      [source, amount, monthDate, notes || null, id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /income error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH archive income (soft delete)
router.patch('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE income SET is_archived = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /income/archive error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
