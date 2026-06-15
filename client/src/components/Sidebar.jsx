import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './Sidebar.css';

const ICONS = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  income: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <polyline points="19 12 12 19 5 12"></polyline>
    </svg>
  ),
  expenses: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
  ),
  savings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  bills: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  reports: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
};

const BRAND_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="8" x2="12" y2="6" />
    <line x1="12" y1="16" x2="12" y2="18" />
    <line x1="8" y1="12" x2="6" y2="12" />
    <line x1="16" y1="12" x2="18" y2="12" />
  </svg>
);

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', description: 'Overview' },
  { id: 'income', label: 'Income', description: 'Earnings' },
  { id: 'expenses', label: 'Expenses', description: 'Spending' },
  { id: 'savings', label: 'Savings', description: 'Investments' },
  { id: 'bills', label: 'Bills & Loans', description: 'Payments' },
  { id: 'reports', label: 'Reports', description: 'Analytics' },
];

export default function Sidebar({ activeTab, onTabChange, collapsed, onCollapse }) {
  const { user, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id) => {
    onTabChange(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        className="sidebar-mobile-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">{BRAND_ICON}</div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <h1 className="sidebar-brand-name">Finance Vault</h1>
              <span className="sidebar-brand-tagline">Personal Finance</span>
            </div>
          )}
          {/* Mobile Close Button */}
          <button
            className="sidebar-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">{collapsed ? '—' : 'MENU'}</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-nav-icon">{ICONS[item.id]}</span>
              {!collapsed && (
                <div className="sidebar-nav-text">
                  <span className="sidebar-nav-label-text">{item.label}</span>
                  <span className="sidebar-nav-desc">{item.description}</span>
                </div>
              )}
              {!collapsed && activeTab === item.id && (
                <span className="sidebar-nav-active-dot" />
              )}
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div className="sidebar-spacer" />

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          {/* User Profile */}
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">{user.username}</span>
                  <span className="sidebar-user-email">{user.email}</span>
                </div>
              )}
              {!collapsed && (
                <button
                  className="sidebar-logout-btn"
                  onClick={logout}
                  title="Logout"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => onCollapse(prev => !prev)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </aside>
    </>
  );
}
