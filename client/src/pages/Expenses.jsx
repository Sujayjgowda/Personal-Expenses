import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  getExpenses,
  getExpenseCategories,
  addExpense,
  updateExpense,
  archiveExpense,
  getExpenseBudgets,
  setExpenseBudget,
  addExpenseCategory,
  deleteExpenseCategory,
  reorderExpenseCategories
} from '../services/api';
import Modal from '../components/Modal';
import './PageCommon.css';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const EMOJIS = ['🍔', '🚗', '⚽', '🎮', '🧹', '🏠', '🏦', '🏡', '💡', '🏥', '📚', '🎁', '💅', '💸', '📈', '🛒', '🍽️', '⛽', '🎓', '📦'];

export default function Expenses() {
  const { selectedMonth, refreshKey, triggerRefresh } = useApp();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Expense states
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ category_id: '', description: '', actual: '', notes: '' });

  // Inline Confirm states
  const [confirmArchiveId, setConfirmArchiveId] = useState(null);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState(null);

  // Budget & Category Manage states
  const [budgetsOpen, setBudgetsOpen] = useState(false);
  const [editingBudgets, setEditingBudgets] = useState({});
  const [originalBudgets, setOriginalBudgets] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('🛒');

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, catsData, budgetsData] = await Promise.all([
        getExpenses(selectedMonth),
        getExpenseCategories(),
        getExpenseBudgets(selectedMonth)
      ]);
      setItems(itemsData);
      setCategories(catsData);
      setBudgets(budgetsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, refreshKey]);

  // Group expenses by category
  const grouped = categories.map((cat) => {
    const catItems = items.filter((i) => i.category_id === cat.id);
    const budgetObj = budgets.find((b) => b.category_id === cat.id);
    const totalBudgeted = budgetObj ? parseFloat(budgetObj.amount) : 0;
    const isCarriedForward = budgetObj ? budgetObj.is_carried_forward : false;
    const totalActual = catItems.reduce((s, i) => s + parseFloat(i.actual || 0), 0);
    return { ...cat, items: catItems, totalBudgeted, totalActual, isCarriedForward };
  });

  // Check for uncategorized expenses (e.g. if category was deleted)
  const uncategorizedItems = items.filter((i) => !i.category_id || !categories.some((c) => c.id === i.category_id));
  if (uncategorizedItems.length > 0) {
    grouped.push({
      id: null,
      name: 'Uncategorized',
      icon: '📦',
      items: uncategorizedItems,
      totalBudgeted: 0,
      totalActual: uncategorizedItems.reduce((s, i) => s + parseFloat(i.actual || 0), 0)
    });
  }

  const totalExpenses = items.reduce((s, i) => s + parseFloat(i.actual || 0), 0);
  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);

  const openAdd = (categoryId) => {
    setEditItem(null);
    setForm({
      category_id: categoryId || (categories[0]?.id || ''),
      description: '',
      actual: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      category_id: item.category_id || (categories[0]?.id || ''),
      description: item.description || '',
      actual: item.actual || '',
      notes: item.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        category_id: form.category_id ? parseInt(form.category_id) : null,
        description: form.description,
        actual: parseFloat(form.actual || 0),
        notes: form.notes
      };

      if (editItem) {
        await updateExpense(editItem.id, { ...payload, month: selectedMonth });
      } else {
        await addExpense({ ...payload, month: selectedMonth });
      }
      setModalOpen(false);
      triggerRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleArchive = async (id) => {
    await archiveExpense(id);
    setConfirmArchiveId(null);
    triggerRefresh();
  };

  // Manage Budgets Modal Open
  const openManageBudgets = () => {
    const initialEditing = {};
    const initialOriginal = {};
    categories.forEach((cat) => {
      const b = budgets.find((b) => b.category_id === cat.id);
      const val = b ? String(parseFloat(b.amount)) : '';
      initialEditing[cat.id] = val;
      initialOriginal[cat.id] = val;
    });
    setEditingBudgets(initialEditing);
    setOriginalBudgets(initialOriginal);
    setNewCategoryName('');
    setNewCategoryIcon('🛒');
    setConfirmDeleteCatId(null);
    setBudgetsOpen(true);
  };

  const handleSaveBudgets = async (e) => {
    e.preventDefault();
    try {
      const promises = [];
      categories.forEach((cat) => {
        const originalVal = originalBudgets[cat.id] || '';
        const currentVal = editingBudgets[cat.id] || '';

        // Only save if the value was modified
        if (currentVal !== originalVal) {
          const amount = currentVal ? parseFloat(currentVal) : 0;
          promises.push(
            setExpenseBudget({
              category_id: cat.id,
              amount,
              month: selectedMonth
            })
          );
        }
      });

      if (promises.length > 0) {
        await Promise.all(promises);
      }
      setBudgetsOpen(false);
      triggerRefresh();
    } catch (err) {
      alert('Failed to save budgets: ' + err.message);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const newCat = await addExpenseCategory({
        name: newCategoryName.trim(),
        icon: newCategoryIcon
      });
      setNewCategoryName('');
      // Reload categories list
      const catsData = await getExpenseCategories();
      setCategories(catsData);
      setEditingBudgets((prev) => ({ ...prev, [newCat.id]: '0' }));
      triggerRefresh();
    } catch (err) {
      alert('Failed to add category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteExpenseCategory(id);
      setConfirmDeleteCatId(null);
      triggerRefresh();
      // Reload lists
      const [catsData, budgetsData] = await Promise.all([
        getExpenseCategories(),
        getExpenseBudgets(selectedMonth)
      ]);
      setCategories(catsData);
      setBudgets(budgetsData);
    } catch (err) {
      alert('Failed to delete category: ' + err.message);
    }
  };

  const handleMoveCategory = async (index, direction) => {
    const newList = [...categories];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newList.length) return;
    [newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]];
    setCategories(newList);
    try {
      await reorderExpenseCategories(newList.map((c) => c.id));
      triggerRefresh();
    } catch (err) {
      console.error('Reorder failed:', err);
      // revert on failure
      const catsData = await getExpenseCategories();
      setCategories(catsData);
    }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="page-container fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">📋 Expenses</h2>
          <p className="section-sub">
            Actual: <strong style={{ color: 'var(--accent-red)' }}>{formatCurrency(totalExpenses)}</strong>
            {' / '}
            Budget: <strong style={{ color: 'var(--accent-primary)' }}>{formatCurrency(totalBudget)}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-secondary" onClick={openManageBudgets}>⚙️ Budgets & Categories</button>
          <button className="btn btn-primary" onClick={() => openAdd()}>+ Add Expense</button>
        </div>
      </div>

      <div className="category-grid">
        {grouped.map((cat) => {
          const pct = cat.totalBudgeted > 0 ? Math.min((cat.totalActual / cat.totalBudgeted) * 100, 150) : 0;
          const isOver = cat.totalActual > cat.totalBudgeted && cat.totalBudgeted > 0;

          return (
            <div key={cat.id || 'uncategorized'} className="glass-card category-card">
              <div className="cat-header">
                <div className="cat-title">
                  <span className="cat-icon">{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
                {cat.id && <button className="btn btn-sm btn-secondary" onClick={() => openAdd(cat.id)}>+</button>}
              </div>

              <div className="cat-amounts">
                <span>
                  Budget: {formatCurrency(cat.totalBudgeted)}
                  {cat.isCarriedForward && cat.totalBudgeted > 0 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-amber)', marginLeft: '4px', fontWeight: 500 }} title="Carried forward from previous month">↩ prev</span>
                  )}
                </span>
                <span className="actual" style={{ color: isOver ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                  Actual: {formatCurrency(cat.totalActual)}
                </span>
              </div>

              <div className="cat-progress">
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${isOver ? 'over-budget' : 'under-budget'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              {cat.items.length > 0 && (
                <div className="cat-items">
                  {cat.items.map((item) => (
                    <div key={item.id} className="cat-item">
                      <span className="cat-item-desc">{item.description || 'Expense'}</span>
                      <span className="cat-item-amount">{formatCurrency(item.actual)}</span>
                      <div className="cat-item-actions" style={{ alignItems: 'center' }}>
                        <button className="btn btn-icon btn-sm btn-secondary" onClick={() => openEdit(item)}>✏️</button>
                        {confirmArchiveId === item.id ? (
                          <button className="btn btn-sm btn-danger" style={{ padding: '2px 6px', fontSize: '0.7rem', height: '28px', borderRadius: 'var(--radius-sm)' }}
                            onClick={() => handleArchive(item.id)}>Confirm</button>
                        ) : (
                          <button className="btn btn-icon btn-sm btn-danger" onClick={() => setConfirmArchiveId(item.id)}>🗑️</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Expense Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Expense' : 'Add Expense'}>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" type="text" placeholder="e.g. Weekly groceries" required
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input className="form-input" type="number" step="0.01" min="0.01" required placeholder="0"
              value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" placeholder="Optional notes"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      {/* Budgets & Categories Modal */}
      <Modal open={budgetsOpen} onClose={() => setBudgetsOpen(false)} title="⚙️ Manage Budgets & Categories">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Section 1: Set Budgets */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
              Category Budgets ({selectedMonth})
            </h4>
            <form onSubmit={handleSaveBudgets}>
              <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: 'var(--space-md)', paddingRight: '4px', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-sm)' }}>
                {categories.map((cat, idx) => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)', padding: 'var(--space-xs) 0', borderBottom: '1px solid var(--glass-border)' }}>
                    {/* Reorder arrows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <button type="button" className="btn-reorder" disabled={idx === 0}
                        onClick={() => handleMoveCategory(idx, -1)}
                        style={{ opacity: idx === 0 ? 0.25 : 1, cursor: idx === 0 ? 'default' : 'pointer', background: 'none', border: 'none', padding: '1px 4px', fontSize: '0.7rem', lineHeight: 1, color: 'var(--text-secondary)' }}
                        title="Move up">▲</button>
                      <button type="button" className="btn-reorder" disabled={idx === categories.length - 1}
                        onClick={() => handleMoveCategory(idx, 1)}
                        style={{ opacity: idx === categories.length - 1 ? 0.25 : 1, cursor: idx === categories.length - 1 ? 'default' : 'pointer', background: 'none', border: 'none', padding: '1px 4px', fontSize: '0.7rem', lineHeight: 1, color: 'var(--text-secondary)' }}
                        title="Move down">▼</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                      <span style={{ fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <input className="form-input" type="number" placeholder="Budget ₹" style={{ width: '100px', padding: '0.375rem 0.5rem', fontSize: '0.85rem' }}
                        value={editingBudgets[cat.id] || ''} onChange={(e) => setEditingBudgets({ ...editingBudgets, [cat.id]: e.target.value })} />
                      {confirmDeleteCatId === cat.id ? (
                        <button type="button" className="btn btn-sm btn-danger" style={{ padding: '4px 8px', fontSize: '0.7rem', borderRadius: 'var(--radius-sm)' }}
                          onClick={() => handleDeleteCategory(cat.id)}>Confirm</button>
                      ) : (
                        <button type="button" className="btn btn-icon btn-sm btn-danger" style={{ width: '28px', height: '28px' }}
                          onClick={() => setConfirmDeleteCatId(cat.id)}>🗑️</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary btn-sm">Save All Budgets</button>
              </div>
            </form>
          </div>

          {/* Section 2: Create Custom Category */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-md)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
              Create Custom Category
            </h4>
            <form className="modal-form" onSubmit={handleAddCategory}>
              <div className="form-row">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Category Name</label>
                  <input className="form-input" type="text" placeholder="e.g. Hobbies" required
                    value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Select Icon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '100px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '6px' }}>
                  {EMOJIS.map((emoji) => (
                    <button key={emoji} type="button"
                      style={{ fontSize: '1.25rem', padding: '4px', cursor: 'pointer', border: newCategoryIcon === emoji ? '2px solid var(--accent-primary)' : '2px solid transparent', borderRadius: '4px', background: 'transparent' }}
                      onClick={() => setNewCategoryIcon(emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-secondary btn-sm">+ Add Category</button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}
