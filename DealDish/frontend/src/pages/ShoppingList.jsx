import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const ShoppingList = () => {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({ ingredientName: '', quantityNeeded: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fetchList = () => {
    setLoading(true);
    api.get('/shopping-list')
      .then(({ data }) => setList(data))
      .catch(() => setList(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Refresh list when a socket event fires (e.g. after recipe optimization from Dashboard)
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchList();
    socket.on('list_updated', handler);
    return () => socket.off('list_updated', handler);
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

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>My Shopping List</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Price-optimized items from your recipes and manual additions.
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.9rem' }}
          onClick={() => navigate('/recipes')}
        >
          Browse Recipes
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Add Item Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.2rem' }}>Add Item Manually</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            The optimizer will find the cheapest matching product across all grocery sources.
          </p>

          {addError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: '#fca5a5',
            }}>
              {addError}
            </div>
          )}

          <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Ingredient name (e.g. Chicken)"
              className="modern-input"
              value={addForm.ingredientName}
              onChange={e => setAddForm(f => ({ ...f, ingredientName: e.target.value }))}
              required
            />
            <input
              type="number"
              placeholder="Quantity needed"
              className="modern-input"
              min="0.01"
              step="0.01"
              value={addForm.quantityNeeded}
              onChange={e => setAddForm(f => ({ ...f, quantityNeeded: e.target.value }))}
              required
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '12px', fontSize: '1rem', opacity: adding ? 0.7 : 1 }}
              disabled={adding}
            >
              {adding ? 'Finding Best Price...' : 'Add & Optimize'}
            </button>
          </form>
        </div>

        {/* List Items */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Current List</h3>
            {list && (
              <div style={{
                background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '0.9rem',
                fontWeight: '700',
              }}>
                ${list.totalCost.toFixed(2)}
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div style={{
                display: 'inline-block', width: '24px', height: '24px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTop: '3px solid var(--accent-primary)',
                borderRadius: '50%', animation: 'spin 1s linear infinite'
              }} />
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : !list || list.items.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '12px',
              border: '1px dashed var(--glass-border)',
            }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Your list is empty.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Add items manually or optimize a recipe to get started.
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {list.items.map((item, idx) => (
                <li key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                }}>
                  <div>
                    <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{item.ingredientName}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>
                      × {item.quantityNeeded}
                    </span>
                  </div>
                  <span style={{ color: '#86efac', fontWeight: '600', fontSize: '0.95rem' }}>
                    ${item.estimatedCost.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {list && list.items.length > 0 && (
            <div style={{
              marginTop: '1.5rem',
              padding: '14px',
              background: 'rgba(139, 92, 246, 0.08)',
              borderRadius: '10px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {list.items.length} item{list.items.length !== 1 ? 's' : ''} • Estimated total
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
