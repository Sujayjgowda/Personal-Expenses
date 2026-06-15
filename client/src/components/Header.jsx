import { useApp } from '../context/AppContext';
import './Header.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Header({ dashboardData }) {
  const { selectedMonth, goToPrevMonth, goToNextMonth, setSelectedMonth, user, logout, isDarkTheme, toggleTheme } = useApp();
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthName = MONTH_NAMES[month - 1];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="header-brand">
          <span className="brand-icon">💰</span>
          <h1 className="brand-title">Finance Vault</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <div className="month-nav">
            <button className="btn btn-icon btn-secondary month-btn" onClick={goToPrevMonth} aria-label="Previous month">
              ←
            </button>
            <div className="month-display">
              <span className="month-name">{monthName}</span>
              <span className="month-year">{year}</span>
            </div>
            <button className="btn btn-icon btn-secondary month-btn" onClick={goToNextMonth} aria-label="Next month">
              →
            </button>
          </div>

          {user && (
            <div className="header-profile" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', paddingLeft: 'var(--space-md)', borderLeft: '1px solid var(--glass-border)' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={toggleTheme}
                title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                style={{ height: '32px', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '1rem', borderRadius: 'var(--radius-sm)', minWidth: '36px' }}
              >
                {isDarkTheme ? '☀️' : '🌙'}
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }} title={user.email}>
                👤 {user.username}
              </span>
              <button className="btn btn-sm btn-secondary" onClick={logout} style={{ height: '32px', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {dashboardData && (
        <div className="header-stats">
          <div className="quick-stat">
            <span className="qs-label">Income</span>
            <span className="qs-value income">{formatCurrency(dashboardData.totalIncome)}</span>
          </div>
          <div className="quick-stat-divider" />
          <div className="quick-stat">
            <span className="qs-label">Expenses</span>
            <span className="qs-value expenses">{formatCurrency(dashboardData.totalExpenses)}</span>
          </div>
          <div className="quick-stat-divider" />
          <div className="quick-stat">
            <span className="qs-label">Savings</span>
            <span className="qs-value savings">{formatCurrency(dashboardData.totalSavings)}</span>
          </div>
          <div className="quick-stat-divider" />
          <div className="quick-stat">
            <span className="qs-label">Net Balance</span>
            <span className={`qs-value ${dashboardData.netBalance >= 0 ? 'income' : 'expenses'}`}>
              {formatCurrency(dashboardData.netBalance)}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
