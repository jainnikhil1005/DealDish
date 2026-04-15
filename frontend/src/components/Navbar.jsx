import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkStyle = ({ isActive }) => ({
    color: isActive ? 'white' : 'var(--text-muted)',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '0.95rem',
    transition: 'color 0.2s ease',
    borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
    paddingBottom: '2px',
  });

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(9, 9, 11, 0.8)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--glass-border)',
      padding: '0 2rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        height: '64px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span className="text-gradient" style={{ fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif', fontWeight: '800' }}>
            DealDish
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/deals" style={linkStyle}>Deals</NavLink>
          <NavLink to="/recipes" style={linkStyle}>Recipes</NavLink>
          <NavLink to="/shopping-list" style={linkStyle}>My List</NavLink>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              color: 'white',
              padding: '7px 16px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
