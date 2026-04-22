import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [optimizing, setOptimizing] = useState(false);

  // Price compare widget
  const [compareQuery, setCompareQuery] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState('');

  const refreshTotal = () =>
    api.get('/shopping-list').then(({ data }) => setTotalCost(data.totalCost || 0)).catch(() => {});

  useEffect(() => {
    api.get('/recipes').then(({ data }) => {
      setRecipes(data);
      if (data.length > 0) setSelectedRecipe(data[0]._id);
    }).catch(() => {});

    refreshTotal();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('list_updated', (data) => {
      setNotifications(prev => [data.message, ...prev].slice(0, 6));
      setTotalCost(data.totalCost);
    });
    return () => socket.off('list_updated');
  }, [socket]);

  const handleOptimize = async () => {
    if (!selectedRecipe) return;
    setOptimizing(true);
    try {
      await api.post('/shopping-list/add-recipe', { recipeId: selectedRecipe });
      await refreshTotal();
    } catch (err) {
      const msg = err.response?.data?.message || 'Optimization failed.';
      setNotifications(prev => [msg, ...prev].slice(0, 6));
    } finally {
      setOptimizing(false);
    }
  };

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!compareQuery.trim()) return;
    setComparing(true);
    setCompareError('');
    setCompareResult(null);
    try {
      const { data } = await api.get(`/deals/compare?ingredient=${encodeURIComponent(compareQuery.trim())}`);
      setCompareResult(data);
    } catch (err) {
      setCompareError(err.response?.data?.message || 'No results found.');
    } finally {
      setComparing(false);
    }
  };

  const STORE_COLORS = { 'H-E-B': '#fca5a5', 'Kroger': '#93c5fd', 'Walmart': '#86efac' };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>
          Welcome back, <span className="text-gradient">{user?.name}</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Real-time grocery optimization dashboard.</p>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        {/* ── Optimization Sandbox ── */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Optimization Sandbox</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Current estimated cart total</p>
          <div style={{ fontSize: '3.5rem', fontWeight: '800', margin: '0.75rem 0 1.5rem' }}>
            ${totalCost.toFixed(2)}
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Recipe Engine</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
              Select a recipe — the backend finds the cheapest price for each ingredient across all scraped stores.
            </p>

            {recipes.length > 0 ? (
              <>
                <select
                  className="modern-input"
                  style={{ marginBottom: '1rem', cursor: 'pointer' }}
                  value={selectedRecipe}
                  onChange={e => setSelectedRecipe(e.target.value)}
                >
                  {recipes.map(r => (
                    <option key={r._id} value={r._id} style={{ background: '#17171d' }}>{r.title}</option>
                  ))}
                </select>
                <button
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', opacity: optimizing ? 0.7 : 1 }}
                  onClick={handleOptimize}
                  disabled={optimizing}
                >
                  {optimizing ? 'Optimizing...' : 'Run Optimizer'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>No recipes yet.</p>
                <button className="btn-primary" style={{ padding: '10px 20px' }} onClick={() => navigate('/recipes')}>
                  Go to Recipes
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/shopping-list')}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-muted)', padding: '10px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            View Full Shopping List →
          </button>
        </div>

        {/* ── Live Log ── */}
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', animationDelay: '0.1s' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Live Optimization Log</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Real-time Socket.io events from the price-matching layer.
          </p>
          {notifications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Awaiting engine events...</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Run the optimizer to see live updates here.</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.map((msg, idx) => (
                <li key={idx} className="animate-fade-in" style={{ padding: '1rem', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', borderLeft: '4px solid var(--accent-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Price Compare Widget ── */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Price Comparison</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Search any ingredient to compare prices across all stores instantly.
        </p>

        <form onSubmit={handleCompare} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            className="modern-input"
            style={{ flex: 1, minWidth: '200px' }}
            placeholder="e.g. avocado, chicken, milk..."
            value={compareQuery}
            onChange={e => setCompareQuery(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '12px 24px', opacity: comparing ? 0.7 : 1, whiteSpace: 'nowrap' }}
            disabled={comparing}
          >
            {comparing ? 'Searching...' : 'Compare'}
          </button>
        </form>

        {compareError && (
          <p style={{ color: '#fca5a5', fontSize: '0.9rem', marginBottom: '1rem' }}>{compareError}</p>
        )}

        {compareResult && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '10px 16px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cheapest: </span>
                <strong style={{ color: '#86efac' }}>{compareResult.cheapest.store}</strong>
                <strong style={{ color: 'white', marginLeft: '8px' }}>${compareResult.cheapest.price.toFixed(2)}</strong>
              </div>
              {compareResult.maxSavings > 0 && (
                <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '10px', padding: '10px 16px', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Max savings: </span>
                  <strong style={{ color: '#c4b5fd' }}>${compareResult.maxSavings.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {compareResult.results.map((item, idx) => {
                const isChp = idx === 0;
                const pct = compareResult.results.length > 1
                  ? (item.price / compareResult.results[compareResult.results.length - 1].price) * 100
                  : 100;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px 14px', background: isChp ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isChp ? 'rgba(34,197,94,0.2)' : 'var(--glass-border)'}`, borderRadius: '10px' }}>
                    <span style={{ width: '80px', fontSize: '0.8rem', fontWeight: '600', color: STORE_COLORS[item.store] || '#c4b5fd', flexShrink: 0 }}>{item.store}</span>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: isChp ? '#86efac' : 'rgba(255,255,255,0.2)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: isChp ? '#86efac' : 'white', flexShrink: 0 }}>${item.price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
