const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET dashboard summary for a month
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month query param required (YYYY-MM)' });

    const monthDate = `${month}-01`;

    // Total Income
    const incomeResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE month = $1 AND is_archived = FALSE',
      [monthDate]
    );

    // Total Expenses (actual)
    const expenseResult = await pool.query(
      'SELECT COALESCE(SUM(actual), 0) as total FROM expenses WHERE month = $1 AND is_archived = FALSE',
      [monthDate]
    );

    // Total Budgeted (carry forward from previous months if not set)
    const budgetResult = await pool.query(
      `SELECT COALESCE(SUM(carried.amount), 0) as total_budgeted
       FROM (
         SELECT DISTINCT ON (ec.id) COALESCE(cb.amount, 0) as amount
         FROM expense_categories ec
         LEFT JOIN category_budgets cb ON cb.category_id = ec.id AND cb.month <= $1
         ORDER BY ec.id, cb.month DESC NULLS LAST
       ) carried
       WHERE carried.amount > 0`,
      [monthDate]
    );

    // Expense breakdown by category (joined with category budgets)
    const categoryResult = await pool.query(
      `SELECT ec.name, ec.icon,
              COALESCE(SUM(e.actual), 0) as total,
              COALESCE(carried_budget.amount, 0) as budgeted
       FROM expense_categories ec
       LEFT JOIN expenses e ON ec.id = e.category_id AND e.month = $1 AND e.is_archived = FALSE
       LEFT JOIN (
         SELECT DISTINCT ON (category_id) category_id, amount
         FROM category_budgets
         WHERE month <= $1
         ORDER BY category_id, month DESC
       ) carried_budget ON ec.id = carried_budget.category_id
       GROUP BY ec.id, ec.name, ec.icon, carried_budget.amount
       ORDER BY total DESC`,
      [monthDate]
    );

    // Check if there are any uncategorized expenses (due to deleted category)
    const uncategorizedResult = await pool.query(
      'SELECT COALESCE(SUM(actual), 0) as total FROM expenses WHERE month = $1 AND category_id IS NULL AND is_archived = FALSE',
      [monthDate]
    );
    const uncategorizedTotal = parseFloat(uncategorizedResult.rows[0].total);

    // Total Savings
    const savingsResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM savings WHERE month = $1 AND is_archived = FALSE',
      [monthDate]
    );

    // Savings by type
    const savingsTypeResult = await pool.query(
      `SELECT type, COALESCE(SUM(amount), 0) as total
       FROM savings WHERE month = $1 AND is_archived = FALSE
       GROUP BY type ORDER BY total DESC`,
      [monthDate]
    );

    // Total Bills
    const billsResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total,
              COALESCE(SUM(CASE WHEN is_paid THEN amount ELSE 0 END), 0) as total_paid,
              COALESCE(SUM(CASE WHEN NOT is_paid THEN amount ELSE 0 END), 0) as total_unpaid
       FROM bills WHERE month = $1 AND is_archived = FALSE`,
      [monthDate]
    );

    const totalIncome = parseFloat(incomeResult.rows[0].total);
    const totalExpenses = parseFloat(expenseResult.rows[0].total);
    const totalBudgeted = parseFloat(budgetResult.rows[0].total_budgeted);
    const totalSavings = parseFloat(savingsResult.rows[0].total);
    const totalBills = parseFloat(billsResult.rows[0].total);

    let categoryBreakdown = categoryResult.rows;
    if (uncategorizedTotal > 0) {
      categoryBreakdown.push({
        name: 'Uncategorized',
        icon: '📦',
        total: uncategorizedTotal,
        budgeted: 0
      });
      categoryBreakdown.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
    }

    res.json({
      month,
      totalIncome,
      totalExpenses,
      totalBudgeted,
      totalSavings,
      totalBills,
      totalBillsPaid: parseFloat(billsResult.rows[0].total_paid),
      totalBillsUnpaid: parseFloat(billsResult.rows[0].total_unpaid),
      netBalance: totalIncome - totalExpenses - totalBills - totalSavings,
      savingsRate: totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : 0,
      categoryBreakdown,
      savingsByType: savingsTypeResult.rows,
    });
  } catch (err) {
    console.error('GET /dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
