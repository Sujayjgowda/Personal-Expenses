import { useApp } from '../context/AppContext';
import './Header.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const INCOME_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
  </svg>
);

const EXPENSES_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
  </svg>
);

const SAVINGS_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const BALANCE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const CHEVRON_LEFT = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const CHEVRON_RIGHT = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function Header({ dashboardData }) {
  const { selectedMonth, goToPrevMonth, goToNextMonth } = useApp();
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthName = MONTH_NAMES[month - 1];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const totalIncome = dashboardData?.totalIncome || 0;
  const totalExpenses = dashboardData?.totalExpenses || 0;
  const spendRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : (totalExpenses > 0 ? 100 : 0);
  const spendRatioClamped = Math.min(Math.round(spendRatio), 100);

  // Determine indicator color class
  let ratioClass = 'ratio-safe';
  let ratioLabel = 'Excellent Control';
  if (spendRatioClamped >= 80) {
    ratioClass = 'ratio-danger';
    ratioLabel = 'Over Budget Limit';
  } else if (spendRatioClamped >= 50) {
    ratioClass = 'ratio-warning';
    ratioLabel = 'Moderate Spend';
  }

  return (
    <header className="app-header">
      <div className="header-layout">
        {/* Left Side: Month Navigator */}
        <div className="month-nav">
          <button className="month-btn" onClick={goToPrevMonth} aria-label="Previous month">
            {CHEVRON_LEFT}
          </button>
          <div className="month-display">
            <span className="month-name">{monthName}</span>
            <span className="month-year">{year}</span>
          </div>
          <button className="month-btn" onClick={goToNextMonth} aria-label="Next month">
            {CHEVRON_RIGHT}
          </button>
        </div>

        {/* Right Side: Quick Stats Grid */}
        {dashboardData && (
          <div className="header-stats-grid">
            <div className="header-stat-card income">
              <div className="stat-card-icon">{INCOME_ICON}</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Income</span>
                <span className="stat-card-value">{formatCurrency(dashboardData.totalIncome)}</span>
              </div>
            </div>

            <div className="header-stat-card expenses">
              <div className="stat-card-icon">{EXPENSES_ICON}</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Expenses</span>
                <span className="stat-card-value">{formatCurrency(dashboardData.totalExpenses)}</span>
              </div>
            </div>

            <div className="header-stat-card savings">
              <div className="stat-card-icon">{SAVINGS_ICON}</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Savings</span>
                <span className="stat-card-value">{formatCurrency(dashboardData.totalSavings)}</span>
              </div>
            </div>

            <div className="header-stat-card net-balance">
              <div className="stat-card-icon">{BALANCE_ICON}</div>
              <div className="stat-card-info">
                <span className="stat-card-label">Net Balance</span>
                <span className={`stat-card-value ${dashboardData.netBalance >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(dashboardData.netBalance)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Expenses/Income Track Bar (High Graphics Progress Indicator) */}
      {dashboardData && (
        <div className="budget-track-container">
          <div className="budget-track-info">
            <span className="budget-track-label">
              Budget Usage ratio: <strong>{spendRatioClamped}%</strong> of income spent
            </span>
            <span className={`budget-track-status ${ratioClass}`}>{ratioLabel}</span>
          </div>
          <div className="budget-track-progress">
            <div 
              className={`budget-track-fill ${ratioClass}`} 
              style={{ width: `${spendRatioClamped}%` }}
            />
          </div>
        </div>
      )}
    </header>
  );
}
