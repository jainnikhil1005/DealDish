import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, { _id: data._id, name: data.name, email: data.email });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>Welcome Back</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          Sign in to optimize your grocery lists.
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            color: '#fca5a5',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <input
            type="email"
            placeholder="Email Address"
            className="modern-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="modern-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '1rem', padding: '14px', fontSize: '1.05rem', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Don't have an account?{' '}
          <Link to="/register" className="text-gradient" style={{ fontWeight: 'bold', textDecoration: 'none' }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
