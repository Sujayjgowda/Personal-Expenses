import { useState, useEffect, useMemo } from 'react';
import { getTrends, getCategoryBreakdown, getSavingsGrowth } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Reports.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#38bdf8'];

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const formatShort = (val) => {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
  return `₹${val}`;
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatMonth = (m) => {
  if (!m) return '';
  const [y, mon] = m.split('-');
  return `${MONTH_SHORT[parseInt(mon) - 1]} ${y.slice(2)}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{formatMonth(label) || label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.stroke || p.fill }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const [range, setRange] = useState(6);
  const [trends, setTrends] = useState([]);
  const [catBreakdown, setCatBreakdown] = useState([]);
  const [savingsData, setSavingsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { from, to } = useMemo(() => {
    const now = new Date();
    const toMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fromDate = new Date(now.getFullYear(), now.getMonth() - range + 1, 1);
    const fromMonth = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}`;
    return { from: fromMonth, to: toMonth };
  }, [range]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTrends(from, to),
      getCategoryBreakdown(from, to),
      getSavingsGrowth(from, to),
    ])
      .then(([t, c, s]) => {
        setTrends(t.map((r) => ({
          month: r.month,
          Income: parseFloat(r.income),
          Expenses: parseFloat(r.expenses),
          Savings: parseFloat(r.savings),
          Bills: parseFloat(r.bills),
          'Net Flow': parseFloat(r.income) - parseFloat(r.expenses) - parseFloat(r.bills),
        })));
        setCatBreakdown(c.filter((r) => parseFloat(r.total_actual) > 0).map((r) => ({
          name: `${r.icon} ${r.name}`,
          value: parseFloat(r.total_actual),
          budgeted: parseFloat(r.total_budgeted),
        })));
        setSavingsData(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [from, to]);

  // Prepare savings area chart data
  const savingsChartData = useMemo(() => {
    const monthMap = {};
    savingsData.forEach((r) => {
      if (!monthMap[r.month]) monthMap[r.month] = {};
      monthMap[r.month][r.type] = parseFloat(r.total);
    });
    const types = [...new Set(savingsData.map((r) => r.type))];
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }, [savingsData]);

  const savingsTypes = [...new Set(savingsData.map((r) => r.type))];

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="reports-container fade-in">
      <div className="reports-header">
        <div>
          <h2 className="section-title">📈 Reports & Analytics</h2>
          <p className="section-sub">Visual breakdown of your financial data</p>
        </div>
        <div className="range-selector">
          {[3, 6, 12].map((r) => (
            <button key={r}
              className={`btn btn-sm ${range === r ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRange(r)}>
              {r}M
            </button>
          ))}
        </div>
      </div>

      {trends.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <span className="empty-icon">📈</span>
            <p className="empty-text">Not enough data for reports</p>
            <p className="empty-sub">Add financial entries across multiple months to see trends</p>
          </div>
        </div>
      ) : (
        <>
          {/* Income vs Expenses Trend */}
          <div className="glass-card chart-section">
            <h3 className="chart-title">Income vs Expenses Trend</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trends} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" />
                <XAxis dataKey="month" tickFormatter={formatMonth} stroke="var(--text-muted)" fontSize={11} />
                <YAxis tickFormatter={formatShort} stroke="var(--text-muted)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Bills" stroke="#f59e0b" strokeWidth={2}
                  dot={{ r: 3, fill: '#f59e0b' }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="charts-row">
            {/* Monthly Comparison - Grouped Bar */}
            <div className="glass-card chart-section">
              <h3 className="chart-title">Monthly Comparison</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={trends} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} stroke="var(--text-muted)" fontSize={11} />
                  <YAxis tickFormatter={formatShort} stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="Savings" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown - Donut */}
            {catBreakdown.length > 0 && (
              <div className="glass-card chart-section">
                <h3 className="chart-title">Expense Categories ({range} months)</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={catBreakdown} cx="50%" cy="50%" innerRadius={65} outerRadius={105}
                      paddingAngle={3} dataKey="value" stroke="none">
                      {catBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Cash Flow */}
          <div className="glass-card chart-section">
            <h3 className="chart-title">Net Cash Flow</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trends} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" />
                <XAxis dataKey="month" tickFormatter={formatMonth} stroke="var(--text-muted)" fontSize={11} />
                <YAxis tickFormatter={formatShort} stroke="var(--text-muted)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Net Flow" radius={[4, 4, 0, 0]} barSize={28}>
                  {trends.map((entry, i) => (
                    <Cell key={i} fill={entry['Net Flow'] >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Savings Growth */}
          {savingsChartData.length > 0 && (
            <div className="glass-card chart-section">
              <h3 className="chart-title">Savings Growth by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={savingsChartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} stroke="var(--text-muted)" fontSize={11} />
                  <YAxis tickFormatter={formatShort} stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  {savingsTypes.map((type, i) => (
                    <Area key={type} type="monotone" dataKey={type}
                      fill={COLORS[i % COLORS.length]} fillOpacity={0.2}
                      stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Budget vs Actual across period */}
          {catBreakdown.length > 0 && (
            <div className="glass-card chart-section">
              <h3 className="chart-title">Budget vs Actual (Cumulative {range} months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={catBreakdown} layout="vertical" margin={{ left: 30, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.06)" />
                  <XAxis type="number" tickFormatter={formatShort} stroke="var(--text-muted)" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={120} stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  <Bar dataKey="budgeted" name="Budgeted" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="value" name="Actual" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
