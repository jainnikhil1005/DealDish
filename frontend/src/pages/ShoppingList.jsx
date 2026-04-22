import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const STORE_COLORS = {
  'H-E-B':       '#fca5a5',
  'Kroger':      '#93c5fd',
  'Walmart':     '#86efac',
  'Best Price':  '#c4b5fd',
};

const StorePill = ({ store }) => (
  <span style={{
    fontSize: '0.72rem', fontWeight: '600',
    color: STORE_COLORS[store] || '#c4b5fd',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '20px', padding: '2px 8px',
    whiteSpace: 'nowrap',
  }}>
    {store}
  </span>
);

const QuantityEditor = ({ item, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item.quantityNeeded);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef();

  const commit = async () => {
    const qty = parseFloat(val);
    if (!qty || qty <= 0 || qty === item.quantityNeeded) { setEditing(false); return; }
    setSaving(true);
    await onUpdate(item._id, qty);
    setSaving(false);
    setEditing(false);
  };

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  if (editing) return (
    <input
      ref={inputRef}
      type="number" min="0.01" step="0.01"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      style={{
        width: '64px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--accent-primary)',
        borderRadius: '6px', color: 'white', padding: '2px 6px', fontSize: '0.85rem', textAlign: 'center',
      }}
      disabled={saving}
    />
  );

  return (
    <button
      onClick={() => { setVal(item.quantityNeeded); setEditing(true); }}
      title="Click to edit quantity"
      style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)',
        borderRadius: '6px', color: 'var(--text-muted)', padding: '2px 8px',
        fontSize: '0.85rem', cursor: 'pointer',
      }}
    >
      × {item.quantityNeeded}
    </button>
  );
};

const ShoppingList = () => {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({ ingredientName: '', quantityNeeded: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [clearing, setClearing] = useState(false);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fetchList = () => {
    setLoading(true);
    api.get('/shopping-list')
      .then(({ data }) => setList(data))
      .catch(() => setList(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('list_updated', () => fetchList());
    return () => socket.off('list_updated');
  }, [socket]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setAddError('');
    setAdding(true);
    try {
      const { data } = await api.post('/shopping-list/add', {
        ingredientName: addForm.ingredientName,
        quantityNeeded: Number(addForm.quantityNeeded),
      });
      setList(data);
      setAddForm({ ingredientName: '', quantityNeeded: '' });
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add item.');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateQty = async (itemId, quantityNeeded) => {
    try {
      const { data } = await api.put(`/shopping-list/item/${itemId}`, { quantityNeeded });
      setList(data);
    } catch {/* silently keep old value */}
  };

  const handleDelete = async (itemId) => {
    try {
      const { data } = await api.delete(`/shopping-list/item/${itemId}`);
      setList(data);
    } catch {/* ignore */}
  };

  const handleClear = async () => {
    if (!window.confirm('Clear your entire shopping list?')) return;
    setClearing(true);
    try {
      const { data } = await api.delete('/shopping-list/clear');
      setList(data);
    } finally {
      setClearing(false);
    }
  };

  const items = list?.items || [];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>My Shopping List</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Price-optimized items from your recipes and manual additions.
          </p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }} onClick={() => navigate('/recipes')}>
          Browse Recipes
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* ── Add Item Form ── */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.2rem' }}>Add Item Manually</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            The optimizer finds the cheapest matching product across all scraped stores.
          </p>

          {addError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '1rem', fontSize: '0.9rem', color: '#fca5a5' }}>
              {addError}
            </div>
          )}

          <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text" placeholder="Ingredient name (e.g. Chicken)"
              className="modern-input"
              value={addForm.ingredientName}
              onChange={e => setAddForm(f => ({ ...f, ingredientName: e.target.value }))}
              required
            />
            <input
              type="number" placeholder="Quantity" className="modern-input"
              min="0.01" step="0.01"
              value={addForm.quantityNeeded}
              onChange={e => setAddForm(f => ({ ...f, quantityNeeded: e.target.value }))}
              required
            />
            <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '1rem', opacity: adding ? 0.7 : 1 }} disabled={adding}>
              {adding ? 'Finding Best Price...' : 'Add & Optimize'}
            </button>
          </form>
        </div>

        {/* ── List Items ── */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Current List</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {items.length > 0 && (
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '8px', color: '#fca5a5', padding: '5px 12px',
                    fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500',
                  }}
                >
                  {clearing ? 'Clearing...' : 'Clear All'}
                </button>
              )}
              {list && (
                <div style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', borderRadius: '20px', padding: '4px 14px', fontSize: '0.9rem', fontWeight: '700' }}>
                  ${list.totalCost.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Your list is empty.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Add items above or optimize a recipe.</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {items.map(item => (
                <li key={item._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                  borderRadius: '10px', border: '1px solid var(--glass-border)', gap: '0.75rem',
                }}>
                  {/* Left: name + store */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '500', fontSize: '0.9rem', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.ingredientName}
                    </div>
                    <StorePill store={item.store || 'Best Price'} />
                  </div>

                  {/* Middle: editable qty */}
                  <QuantityEditor item={item} onUpdate={handleUpdateQty} />

                  {/* Right: cost + delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                    <span style={{ color: '#86efac', fontWeight: '700', fontSize: '0.95rem' }}>
                      ${item.estimatedCost.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDelete(item._id)}
                      title="Remove item"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', padding: '2px 4px', lineHeight: 1, borderRadius: '4px' }}
                      onMouseEnter={e => e.target.style.color = '#fca5a5'}
                      onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <div style={{ marginTop: '1.25rem', padding: '12px 14px', background: 'rgba(139,92,246,0.08)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {items.length} item{items.length !== 1 ? 's' : ''} · Estimated total
              </span>
              <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>${list.totalCost.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingList;
