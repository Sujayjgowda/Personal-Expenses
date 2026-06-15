import './TabNav.css';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'income', label: 'Income', icon: '💰' },
  { id: 'expenses', label: 'Expenses', icon: '📋' },
  { id: 'savings', label: 'Savings', icon: '🏦' },
  { id: 'bills', label: 'Bills & Loans', icon: '🏠' },
  { id: 'reports', label: 'Reports', icon: '📈' },
];

export default function TabNav({ activeTab, onTabChange }) {
  return (
    <nav className="tab-nav">
      <div className="tab-nav-inner">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
