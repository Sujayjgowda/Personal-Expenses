const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

// Authentication
export const loginUser = (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const registerUser = (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const verifyUser = () => request('/auth/me');

// Income
export const getIncome = (month) => request(`/income?month=${month}`);
export const addIncome = (data) => request('/income', { method: 'POST', body: JSON.stringify(data) });
export const updateIncome = (id, data) => request(`/income/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const archiveIncome = (id) => request(`/income/${id}/archive`, { method: 'PATCH' });

// Expenses
export const getExpenses = (month) => request(`/expenses?month=${month}`);
export const getExpenseCategories = () => request('/expenses/categories');
export const addExpense = (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) });
export const updateExpense = (id, data) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const archiveExpense = (id) => request(`/expenses/${id}/archive`, { method: 'PATCH' });
export const getExpenseBudgets = (month) => request(`/expenses/budgets?month=${month}`);
export const setExpenseBudget = (data) => request('/expenses/budgets', { method: 'POST', body: JSON.stringify(data) });
export const addExpenseCategory = (data) => request('/expenses/categories', { method: 'POST', body: JSON.stringify(data) });
export const deleteExpenseCategory = (id) => request(`/expenses/categories/${id}`, { method: 'DELETE' });
export const reorderExpenseCategories = (orderedIds) => request('/expenses/categories/reorder', { method: 'PUT', body: JSON.stringify({ orderedIds }) });

// Savings
export const getSavings = (month) => request(`/savings?month=${month}`);
export const addSaving = (data) => request('/savings', { method: 'POST', body: JSON.stringify(data) });
export const updateSaving = (id, data) => request(`/savings/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const archiveSaving = (id) => request(`/savings/${id}/archive`, { method: 'PATCH' });

// Bills
export const getBills = (month) => request(`/bills?month=${month}`);
export const addBill = (data) => request('/bills', { method: 'POST', body: JSON.stringify(data) });
export const updateBill = (id, data) => request(`/bills/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const archiveBill = (id) => request(`/bills/${id}/archive`, { method: 'PATCH' });
export const payBill = (id) => request(`/bills/${id}/pay`, { method: 'PATCH' });

// Dashboard
export const getDashboard = (month) => request(`/dashboard?month=${month}`);

// Reports
export const getTrends = (from, to) => request(`/reports/trends?from=${from}&to=${to}`);
export const getCategoryBreakdown = (from, to) => request(`/reports/category-breakdown?from=${from}&to=${to}`);
export const getSavingsGrowth = (from, to) => request(`/reports/savings-growth?from=${from}&to=${to}`);
