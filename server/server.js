const express = require('express');
const cors = require('cors');
require('dotenv').config();

const incomeRoutes = require('./routes/income');
const expensesRoutes = require('./routes/expenses');
const savingsRoutes = require('./routes/savings');
const billsRoutes = require('./routes/bills');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
