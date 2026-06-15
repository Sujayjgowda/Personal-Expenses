import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { getDashboard } from './services/api';
import Header from './components/Header';
import TabNav from './components/TabNav';
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
  const { selectedMonth, refreshKey, token, authLoading } = useApp();
  const [dashboardData, setDashboardData] = useState(null);

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
    <div className="app">
      <Header dashboardData={dashboardData} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="app-main">
        {renderPage()}
      </main>
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
