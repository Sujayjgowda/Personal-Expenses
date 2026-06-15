import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getSavings, addSaving, updateSaving, archiveSaving } from '../services/api';
import Modal from '../components/Modal';
import './PageCommon.css';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const TYPES = ['PPF', 'FD', 'Mutual Fund', 'Stocks', 'Gold', 'Other'];
const TYPE_ICONS = { PPF: '🏦', FD: '🏛️', 'Mutual Fund': '📈', Stocks: '📊', Gold: '🥇', Other: '💰' };
const TYPE_COLORS = { PPF: '#6366f1', FD: '#10b981', 'Mutual Fund': '#f59e0b', Stocks: '#ec4899', Gold: '#f59e0b', Other: '#a855f7' };

export default function Savings() {
  const { selectedMonth, refreshKey, triggerRefresh } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ type: 'PPF', name: '', amount: '', notes: '' });

  useEffect(() => {
    setLoading(true);
    getSavings(selectedMonth).then(setItems).catch(console.error).finally(() => setLoading(false));
  }, [selectedMonth, refreshKey]);

  const total = items.reduce((sum, i) => sum + parseFloat(i.amount), 0);

  // Group by type
  const grouped = TYPES.map((type) => {
    const typeItems = items.filter((i) => i.type === type);
    const typeTotal = typeItems.reduce((s, i) => s + parseFloat(i.amount), 0);
    return { type, items: typeItems, total: typeTotal };
  }).filter((g) => g.items.length > 0);

  const openAdd = (type) => {
    setEditItem(null);
    setForm({ type: type || 'PPF', name: '', amount: '', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ type: item.type, name: item.name, amount: item.amount, notes: item.notes || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateSaving(editItem.id, { ...form, month: selectedMonth });
      } else {
        await addSaving({ ...form, month: selectedMonth });
      }
      setModalOpen(false);
      triggerRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Archive this savings entry?')) return;
    await archiveSaving(id);
    triggerRefresh();
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="page-container fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">🏦 Savings & Investments</h2>
          <p className="section-sub">Total: <strong style={{ color: 'var(--accent-teal)' }}>{formatCurrency(total)}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => openAdd()}>+ Add Savings</button>
      </div>

      {grouped.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <span className="empty-icon">🏦</span>
            <p className="empty-text">No savings entries for this month</p>
            <p className="empty-sub">Track your PPF, FD, mutual funds, and more</p>
          </div>
        </div>
      ) : (
        <div className="savings-grid">
          {grouped.map((group) => (
            <div key={group.type} className="glass-card savings-type-card">
              <div className="savings-type-header">
                <div className="savings-type-icon"
                  style={{ background: `${TYPE_COLORS[group.type]}20` }}>
                  {TYPE_ICONS[group.type]}
                </div>
                <div className="savings-type-info">
                  <div className="savings-type-name">{group.type}</div>
                  <div className="savings-type-total" style={{ color: TYPE_COLORS[group.type] }}>
                    {formatCurrency(group.total)}
                  </div>
                </div>
                <button className="btn btn-sm btn-secondary" onClick={() => openAdd(group.type)}>+</button>
              </div>

              <div className="cat-items">
                {group.items.map((item) => (
                  <div key={item.id} className="cat-item">
                    <span className="cat-item-desc">{item.name}</span>
                    <span className="cat-item-amount">{formatCurrency(item.amount)}</span>
                    <div className="cat-item-actions">
                      <button className="btn btn-icon btn-sm btn-secondary" onClick={() => openEdit(item)}>✏️</button>
                      <button className="btn btn-icon btn-sm btn-danger" onClick={() => handleArchive(item.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Savings' : 'Add Savings'}>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" type="text" required placeholder="e.g. PPF Account"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input className="form-input" type="number" step="0.01" min="0" required placeholder="Enter amount"
              value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
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
    </div>
  );
}
