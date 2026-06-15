import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getIncome, addIncome, updateIncome, archiveIncome } from '../services/api';
import Modal from '../components/Modal';
import './PageCommon.css';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const SOURCES = ['Salary', 'Freelance', 'Business', 'Investment Returns', 'Rental', 'Other'];

export default function Income() {
  const { selectedMonth, refreshKey, triggerRefresh } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ source: 'Salary', amount: '', notes: '' });

  useEffect(() => {
    setLoading(true);
    getIncome(selectedMonth).then(setItems).catch(console.error).finally(() => setLoading(false));
  }, [selectedMonth, refreshKey]);

  const total = items.reduce((sum, i) => sum + parseFloat(i.amount), 0);

  const openAdd = () => {
    setEditItem(null);
    setForm({ source: 'Salary', amount: '', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ source: item.source, amount: item.amount, notes: item.notes || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateIncome(editItem.id, { ...form, month: selectedMonth });
      } else {
        await addIncome({ ...form, month: selectedMonth });
      }
      setModalOpen(false);
      triggerRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Archive this income entry?')) return;
    await archiveIncome(id);
    triggerRefresh();
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="page-container fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">💰 Income</h2>
          <p className="section-sub">Total: <strong style={{ color: 'var(--accent-green)' }}>{formatCurrency(total)}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Income</button>
      </div>

      {items.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <span className="empty-icon">💰</span>
            <p className="empty-text">No income entries for this month</p>
            <p className="empty-sub">Click "Add Income" to get started</p>
          </div>
        </div>
      ) : (
        <div className="glass-card table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Amount</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><span className="badge badge-green">{item.source}</span></td>
                  <td className="amount positive">{formatCurrency(item.amount)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.notes || '—'}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>✏️</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleArchive(item.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Income' : 'Add Income'}>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Source</label>
            <select className="form-select" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input className="form-input" type="number" step="0.01" min="0" required
              placeholder="Enter amount" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
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
