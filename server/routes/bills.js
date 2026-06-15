const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all bills for a month
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month query param required (YYYY-MM)' });

    const monthDate = `${month}-01`;
    const result = await pool.query(
      'SELECT * FROM bills WHERE month = $1 AND is_archived = FALSE ORDER BY due_date ASC, created_at DESC',
      [monthDate]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /bills error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST new bill
router.post('/', async (req, res) => {
  try {
    const { name, category, amount, due_date, month, notes } = req.body;
    const monthDate = `${month}-01`;
    const result = await pool.query(
      `INSERT INTO bills (name, category, amount, due_date, month, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, category, amount, due_date || null, monthDate, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /bills error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update bill
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, amount, due_date, month, notes } = req.body;
    const monthDate = `${month}-01`;
    const result = await pool.query(
      `UPDATE bills SET name=$1, category=$2, amount=$3, due_date=$4,
       month=$5, notes=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
      [name, category, amount, due_date || null, monthDate, notes || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /bills error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH mark bill as paid
router.patch('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE bills SET is_paid = TRUE, paid_date = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /bills/pay error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH archive bill
router.patch('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE bills SET is_archived = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /bills/archive error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
