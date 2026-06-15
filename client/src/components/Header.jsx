import { useApp } from '../context/AppContext';
import './Header.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Header({ dashboardData }) {
  const { selectedMonth, goToPrevMonth, goToNextMonth, setSelectedMonth } = useApp();
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
          <h1 className="brand-title">ExpenseFlow</h1>
        </div>
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
