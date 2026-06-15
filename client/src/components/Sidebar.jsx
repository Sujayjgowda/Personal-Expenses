import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', description: 'Overview' },
  { id: 'income', label: 'Income', icon: '💰', description: 'Earnings' },
  { id: 'expenses', label: 'Expenses', icon: '📋', description: 'Spending' },
  { id: 'savings', label: 'Savings', icon: '🏦', description: 'Investments' },
  { id: 'bills', label: 'Bills & Loans', icon: '🏠', description: 'Payments' },
  { id: 'reports', label: 'Reports', icon: '📈', description: 'Analytics' },
];

export default function Sidebar({ activeTab, onTabChange, collapsed, onCollapse }) {
  const { user, logout, isDarkTheme, toggleTheme } = useApp();
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
          <div className="sidebar-brand-icon">💰</div>
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
              <span className="sidebar-nav-icon">{item.icon}</span>
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
          {/* Theme Toggle */}
          <button
            className="sidebar-theme-toggle"
            onClick={toggleTheme}
            title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="sidebar-nav-icon">{isDarkTheme ? '☀️' : '🌙'}</span>
            {!collapsed && (
              <span className="sidebar-nav-label-text">
                {isDarkTheme ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>

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
