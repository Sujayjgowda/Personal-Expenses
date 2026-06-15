const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET monthly trends (income vs expenses over time)
router.get('/trends', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to query params required (YYYY-MM)' });

    const fromDate = `${from}-01`;
    const toDate = `${to}-01`;

    const result = await pool.query(
      `SELECT
         to_char(m.month, 'YYYY-MM') as month,
         COALESCE(i.total_income, 0) as income,
         COALESCE(e.total_expenses, 0) as expenses,
         COALESCE(s.total_savings, 0) as savings,
         COALESCE(b.total_bills, 0) as bills
       FROM (
         SELECT DISTINCT month FROM (
           SELECT month FROM income WHERE month >= $1 AND month <= $2
           UNION SELECT month FROM expenses WHERE month >= $1 AND month <= $2
           UNION SELECT month FROM savings WHERE month >= $1 AND month <= $2
           UNION SELECT month FROM bills WHERE month >= $1 AND month <= $2
         ) all_months
       ) m
       LEFT JOIN (
         SELECT month, SUM(amount) as total_income FROM income WHERE is_archived = FALSE GROUP BY month
       ) i ON m.month = i.month
       LEFT JOIN (
         SELECT month, SUM(actual) as total_expenses FROM expenses WHERE is_archived = FALSE GROUP BY month
       ) e ON m.month = e.month
       LEFT JOIN (
         SELECT month, SUM(amount) as total_savings FROM savings WHERE is_archived = FALSE GROUP BY month
       ) s ON m.month = s.month
       LEFT JOIN (
         SELECT month, SUM(amount) as total_bills FROM bills WHERE is_archived = FALSE GROUP BY month
       ) b ON m.month = b.month
       ORDER BY m.month ASC`,
      [fromDate, toDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('GET /reports/trends error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET category breakdown across months
router.get('/category-breakdown', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to query params required (YYYY-MM)' });

    const fromDate = `${from}-01`;
    const toDate = `${to}-01`;

    const result = await pool.query(
      `SELECT ec.name, ec.icon,
              COALESCE(SUM(e.actual), 0) as total_actual,
              COALESCE(carried_sum.total_budgeted, 0) as total_budgeted
       FROM expense_categories ec
       LEFT JOIN expenses e ON ec.id = e.category_id
         AND e.month >= $1 AND e.month <= $2
         AND e.is_archived = FALSE
       LEFT JOIN (
         SELECT category_id, SUM(budget_amount) as total_budgeted
         FROM (
           SELECT DISTINCT ON (ec2.id, m.month)
             ec2.id as category_id,
             COALESCE(cb.amount, 0) as budget_amount
           FROM expense_categories ec2
           CROSS JOIN (
             SELECT generate_series($1::date, $2::date, '1 month'::interval)::date as month
           ) m
           LEFT JOIN category_budgets cb ON cb.category_id = ec2.id AND cb.month <= m.month
           ORDER BY ec2.id, m.month, cb.month DESC NULLS LAST
         ) per_month
         WHERE budget_amount > 0
         GROUP BY category_id
       ) carried_sum ON ec.id = carried_sum.category_id
       GROUP BY ec.id, ec.name, ec.icon, carried_sum.total_budgeted
       ORDER BY total_actual DESC`,
      [fromDate, toDate]
    );

    const uncategorizedResult = await pool.query(
      `SELECT COALESCE(SUM(actual), 0) as total
       FROM expenses
       WHERE category_id IS NULL AND month >= $1 AND month <= $2 AND is_archived = FALSE`,
      [fromDate, toDate]
    );
    const uncategorizedTotal = parseFloat(uncategorizedResult.rows[0].total);

    let rows = result.rows;
    if (uncategorizedTotal > 0) {
      rows.push({
        name: 'Uncategorized',
        icon: '📦',
        total_actual: uncategorizedTotal,
        total_budgeted: 0
      });
      rows.sort((a, b) => parseFloat(b.total_actual) - parseFloat(a.total_actual));
    }

    res.json(rows);
  } catch (err) {
    console.error('GET /reports/category-breakdown error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET savings growth over time
router.get('/savings-growth', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to query params required (YYYY-MM)' });

    const fromDate = `${from}-01`;
    const toDate = `${to}-01`;

    const result = await pool.query(
      `SELECT to_char(month, 'YYYY-MM') as month, type, SUM(amount) as total
       FROM savings
       WHERE month >= $1 AND month <= $2 AND is_archived = FALSE
       GROUP BY month, type
       ORDER BY month ASC`,
      [fromDate, toDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('GET /reports/savings-growth error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
