import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getDashboard } from '../services/api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#38bdf8'];

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label || payload[0]?.name}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { selectedMonth, refreshKey } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDashboard(selectedMonth)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedMonth, refreshKey]);

  if (loading) return <div className="loading-spinner" />;
  if (!data) return null;

  const pieData = data.categoryBreakdown
    ?.filter((c) => parseFloat(c.total) > 0)
    .map((c) => ({ name: `${c.icon} ${c.name}`, value: parseFloat(c.total) }));

  const barData = data.categoryBreakdown
    ?.filter((c) => parseFloat(c.total) > 0 || parseFloat(c.budgeted) > 0)
    .map((c) => ({
      name: c.name,
      Budgeted: parseFloat(c.budgeted),
      Actual: parseFloat(c.total),
    }));

  return (
    <div className="dashboard fade-in">
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>💰</div>
          <div className="stat-label">Total Income</div>
          <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{formatCurrency(data.totalIncome)}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>💸</div>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{formatCurrency(data.totalExpenses)}</div>
          <div className="stat-sub">Budget: {formatCurrency(data.totalBudgeted)}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(20, 184, 166, 0.15)' }}>🏦</div>
          <div className="stat-label">Savings</div>
          <div className="stat-value" style={{ color: 'var(--accent-teal)' }}>{formatCurrency(data.totalSavings)}</div>
          <div className="stat-sub">Rate: {data.savingsRate}%</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>📊</div>
          <div className="stat-label">Net Balance</div>
          <div className="stat-value" style={{ color: data.netBalance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {formatCurrency(data.netBalance)}
          </div>
          <div className="stat-sub">Bills: {formatCurrency(data.totalBills)}</div>
        </div>
      </div>

      <div className="charts-grid">
        {pieData?.length > 0 && (
          <div className="glass-card chart-card">
            <h3 className="section-title">Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {barData?.length > 0 && (
          <div className="glass-card chart-card">
            <h3 className="section-title">Budget vs Actual</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                  stroke="var(--text-muted)" fontSize={11} />
                <YAxis type="category" dataKey="name" width={90}
                  stroke="var(--text-muted)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="Budgeted" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="Actual" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {data.savingsByType?.length > 0 && (
        <div className="glass-card chart-card">
          <h3 className="section-title">Savings Distribution</h3>
          <div className="savings-chips">
            {data.savingsByType.map((s, i) => (
              <div key={i} className="savings-chip" style={{ borderColor: COLORS[i % COLORS.length] }}>
                <span className="chip-type">{s.type}</span>
                <span className="chip-amount" style={{ color: COLORS[i % COLORS.length] }}>
                  {formatCurrency(parseFloat(s.total))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!pieData?.length && !barData?.length) && (
        <div className="glass-card">
          <div className="empty-state">
            <span className="empty-icon">📊</span>
            <p className="empty-text">No data for this month yet</p>
            <p className="empty-sub">Start by adding income and expenses in the other tabs</p>
          </div>
        </div>
      )}
    </div>
  );
}
