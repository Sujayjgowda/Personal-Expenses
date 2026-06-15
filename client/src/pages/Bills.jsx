import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getBills, addBill, updateBill, archiveBill, payBill } from '../services/api';
import Modal from '../components/Modal';
import './PageCommon.css';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const CATEGORIES = ['Loan', 'Utility', 'Subscription', 'Insurance', 'Other'];

export default function Bills() {
  const { selectedMonth, refreshKey, triggerRefresh } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Loan', amount: '', due_date: '', notes: '' });

  useEffect(() => {
    setLoading(true);
    getBills(selectedMonth).then(setItems).catch(console.error).finally(() => setLoading(false));
  }, [selectedMonth, refreshKey]);

  const totalBills = items.reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalPaid = items.filter((i) => i.is_paid).reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalUnpaid = totalBills - totalPaid;

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', category: 'Loan', amount: '', due_date: '', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      category: item.category || 'Other',
      amount: item.amount,
      due_date: item.due_date ? item.due_date.split('T')[0] : '',
      notes: item.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateBill(editItem.id, { ...form, month: selectedMonth });
      } else {
        await addBill({ ...form, month: selectedMonth });
      }
      setModalOpen(false);
      triggerRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePay = async (id) => {
    await payBill(id);
    triggerRefresh();
  };

  const handleArchive = async (id) => {
    if (!confirm('Archive this bill?')) return;
    await archiveBill(id);
    triggerRefresh();
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="page-container fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">🏠 Bills & Loans</h2>
          <p className="section-sub">
            Total: <strong>{formatCurrency(totalBills)}</strong>
            {' • '}
            <span style={{ color: 'var(--accent-green)' }}>Paid: {formatCurrency(totalPaid)}</span>
            {' • '}
            <span style={{ color: 'var(--accent-amber)' }}>Unpaid: {formatCurrency(totalUnpaid)}</span>
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Bill</button>
      </div>

      {items.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <span className="empty-icon">🏠</span>
            <p className="empty-text">No bills or loan payments for this month</p>
            <p className="empty-sub">Track your House Loan EMI, utility bills, and more</p>
          </div>
        </div>
      ) : (
        <div className="bills-list">
          {items.map((item) => (
            <div key={item.id} className="bill-item">
              <div className="bill-info">
                <div className={`bill-status ${item.is_paid ? 'paid' : 'unpaid'}`} />
                <div className="bill-details">
                  <div className="bill-name">{item.name}</div>
                  <div className="bill-category-label">
                    {item.category}
                    {item.due_date && ` • Due: ${new Date(item.due_date).toLocaleDateString('en-IN')}`}
                    {item.notes && ` • ${item.notes}`}
                  </div>
                </div>
              </div>
              <div className="bill-amount">{formatCurrency(item.amount)}</div>
              <div className="bill-actions">
                {!item.is_paid && (
                  <button className="btn btn-sm btn-success" onClick={() => handlePay(item.id)}>✓ Pay</button>
                )}
                {item.is_paid && <span className="badge badge-green">Paid</span>}
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>✏️</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleArchive(item.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Bill' : 'Add Bill'}>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Bill Name</label>
            <input className="form-input" type="text" required placeholder="e.g. House Loan EMI"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" type="number" step="0.01" min="0" required placeholder="0"
                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-input" type="date" value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
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
