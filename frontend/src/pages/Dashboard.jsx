import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (socket) {
      socket.on('list_updated', (data) => {
        setNotifications((prev) => [data.message, ...prev].slice(0, 6)); // keep last 6 messages
        setTotalCost(data.totalCost);
      });

      return () => {
        socket.off('list_updated');
      };
    }
  }, [socket]);

  return (
    <div className="dashboard-grid">
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 className="text-gradient">Optimization Sandbox</h2>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
          Current Estimated Cart Total:
        </p>
        <div style={{ fontSize: '3.5rem', fontWeight: '800', margin: '1rem 0' }}>
          ${totalCost.toFixed(2)}
        </div>
        
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Recipe Engine</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Select a recipe. Our backend will concurrently query different supermarket sources for each ingredient and inject the lowest prices into your shopping list.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                alert('In full version, this triggers POST /api/shopping-list/add-recipe');
            }}>
              Optimize "Chicken Tikka"
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '2rem', animationDelay: '0.1s' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Live Optimization Log</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Real-time Socket.io payload stream directly from the scraping layer.
        </p>
        {notifications.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
            <p style={{ color: 'var(--text-muted)' }}>Awaiting engine events...</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {notifications.map((msg, idx) => (
              <li key={idx} className="animate-fade-in" style={{ 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.06)', 
                borderRadius: '8px',
                borderLeft: '4px solid var(--accent-secondary)',
                fontSize: '0.95rem'
              }}>
                {msg}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
