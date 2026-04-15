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

  useEffect(() => {
    api.get('/recipes').then(({ data }) => {
      setRecipes(data);
      if (data.length > 0) setSelectedRecipe(data[0]._id);
    }).catch(() => {});

    api.get('/shopping-list').then(({ data }) => {
      if (data?.totalCost) setTotalCost(data.totalCost);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('list_updated', (data) => {
      setNotifications((prev) => [data.message, ...prev].slice(0, 6));
      setTotalCost(data.totalCost);
    });
    return () => socket.off('list_updated');
  }, [socket]);

  const handleOptimize = async () => {
    if (!selectedRecipe) return;
    setOptimizing(true);
    try {
      await api.post('/shopping-list/add-recipe', { recipeId: selectedRecipe });
    } catch (err) {
      const msg = err.response?.data?.message || 'Optimization failed.';
      setNotifications(prev => [msg, ...prev].slice(0, 6));
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>
          Welcome back, <span className="text-gradient">{user?.name}</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Here's your real-time grocery optimization dashboard.
        </p>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Optimization Sandbox</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Current estimated cart total</p>
          <div style={{ fontSize: '3.5rem', fontWeight: '800', margin: '0.75rem 0 1.5rem' }}>
            ${totalCost.toFixed(2)}
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Recipe Engine</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
              Select a recipe. The backend will concurrently query all grocery sources for each ingredient and inject the cheapest prices into your list.
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
                    <option key={r._id} value={r._id} style={{ background: '#17171d' }}>
                      {r.title}
                    </option>
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  No recipes yet.
                </p>
                <button className="btn-primary" style={{ padding: '10px 20px' }} onClick={() => navigate('/recipes')}>
                  Go to Recipes
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/shopping-list')}
            style={{
              marginTop: '1rem',
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              color: 'var(--text-muted)',
              padding: '10px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = 'white'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = 'var(--text-muted)'; }}
          >
            View Full Shopping List →
          </button>
        </div>

        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', animationDelay: '0.1s' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Live Optimization Log</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Real-time Socket.io events from the price-scraping layer.
          </p>
          {notifications.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              border: '1px dashed var(--glass-border)',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Awaiting engine events...</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Run the optimizer to see live updates here.
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.map((msg, idx) => (
                <li key={idx} className="animate-fade-in" style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  borderLeft: '4px solid var(--accent-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                }}>
                  {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
