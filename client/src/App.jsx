import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { getDashboard } from './services/api';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Savings from './pages/Savings';
import Bills from './pages/Bills';
import Reports from './pages/Reports';
import Login from './pages/Login';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { selectedMonth, refreshKey, token, authLoading } = useApp();
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const getLayoutCategory = (width) => {
      if (width <= 768) return 'mobile';
      if (width <= 1024) return 'tablet';
      return 'desktop';
    };

    let prevCategory = getLayoutCategory(window.innerWidth);

    // Initial state setup based on current width
    if (prevCategory === 'tablet') {
      setSidebarCollapsed(true);
    } else if (prevCategory === 'desktop') {
      setSidebarCollapsed(false);
    }

    const handleResize = () => {
      const currentCategory = getLayoutCategory(window.innerWidth);
      if (currentCategory !== prevCategory) {
        if (currentCategory === 'tablet') {
          setSidebarCollapsed(true);
        } else if (currentCategory === 'desktop') {
          setSidebarCollapsed(false);
        }
        prevCategory = currentCategory;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (token) {
      getDashboard(selectedMonth)
        .then(setDashboardData)
        .catch(console.error);
    }
  }, [selectedMonth, refreshKey, token]);

  if (authLoading) {
    return <div className="loading-spinner" />;
  }

  if (!token) {
    return <Login />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'income': return <Income />;
      case 'expenses': return <Expenses />;
      case 'savings': return <Savings />;
      case 'bills': return <Bills />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
      />
      <div className="app-body">
        <Header dashboardData={dashboardData} />
        <main className="app-main">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
