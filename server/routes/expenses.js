const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all expense categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expense_categories ORDER BY sort_order ASC, id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /expenses/categories error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all expenses for a month
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month query param required (YYYY-MM)' });

    const monthDate = `${month}-01`;
    const result = await pool.query(
      `SELECT e.*, ec.name as category_name, ec.icon as category_icon
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.month = $1 AND e.is_archived = FALSE
       ORDER BY e.created_at DESC`,
      [monthDate]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /expenses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST new expense
router.post('/', async (req, res) => {
  try {
    const { category_id, description, budgeted, actual, month, notes } = req.body;
    const monthDate = `${month}-01`;
    const result = await pool.query(
      `INSERT INTO expenses (category_id, description, budgeted, actual, month, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [category_id, description, budgeted || 0, actual || 0, monthDate, notes || null]
    );

    // Fetch with category info
    const full = await pool.query(
      `SELECT e.*, ec.name as category_name, ec.icon as category_icon
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.id = $1`,
      [result.rows[0].id]
    );
    res.status(201).json(full.rows[0]);
  } catch (err) {
    console.error('POST /expenses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, description, budgeted, actual, month, notes } = req.body;
    const monthDate = `${month}-01`;
    const result = await pool.query(
      `UPDATE expenses SET category_id=$1, description=$2, budgeted=$3, actual=$4,
       month=$5, notes=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
      [category_id, description, budgeted || 0, actual || 0, monthDate, notes || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const full = await pool.query(
      `SELECT e.*, ec.name as category_name, ec.icon as category_icon
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.id = $1`,
      [id]
    );
    res.json(full.rows[0]);
  } catch (err) {
    console.error('PUT /expenses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH archive expense
router.patch('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE expenses SET is_archived = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /expenses/archive error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST new expense category (dynamic custom categories)
router.post('/categories', async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const result = await pool.query(
      'INSERT INTO expense_categories (name, icon) VALUES ($1, $2) RETURNING *',
      [name, icon || '📦']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /expenses/categories error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE expense category (dynamic delete)
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM expense_categories WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted successfully', category: result.rows[0] });
  } catch (err) {
    console.error('DELETE /expenses/categories error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT reorder categories
router.put('/categories/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ error: 'orderedIds array is required' });
    }
    // Use a transaction for atomicity
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(
          'UPDATE expense_categories SET sort_order = $1 WHERE id = $2',
          [i + 1, orderedIds[i]]
        );
      }
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
    const result = await pool.query('SELECT * FROM expense_categories ORDER BY sort_order ASC, id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('PUT /expenses/categories/reorder error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all category budgets for a month (carry forward from previous months)
router.get('/budgets', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month query param required (YYYY-MM)' });
    const monthDate = `${month}-01`;

    // For each category, get the budget for this month,
    // or fall back to the most recent previous month's budget.
    const result = await pool.query(
      `SELECT DISTINCT ON (ec.id)
         cb.id,
         ec.id as category_id,
         COALESCE(cb.amount, 0) as amount,
         COALESCE(cb.month, $1::date) as month,
         cb.month IS NOT NULL AND cb.month < $1::date as is_carried_forward
       FROM expense_categories ec
       LEFT JOIN category_budgets cb ON cb.category_id = ec.id AND cb.month <= $1
       ORDER BY ec.id, cb.month DESC NULLS LAST`,
      [monthDate]
    );
    // Filter out rows where no budget was ever set (cb.id is null)
    const rows = result.rows.map(r => ({
      ...r,
      amount: r.id ? parseFloat(r.amount) : 0,
      is_carried_forward: r.is_carried_forward || false
    }));
    res.json(rows);
  } catch (err) {
    console.error('GET /expenses/budgets error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST set/update category budget (upsert)
router.post('/budgets', async (req, res) => {
  try {
    const { category_id, amount, month } = req.body;
    if (!category_id || !month) return res.status(400).json({ error: 'category_id and month are required' });
    const monthDate = `${month}-01`;
    const result = await pool.query(
      `INSERT INTO category_budgets (category_id, amount, month, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (category_id, month)
       DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
       RETURNING *`,
      [category_id, amount || 0, monthDate]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /expenses/budgets error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
