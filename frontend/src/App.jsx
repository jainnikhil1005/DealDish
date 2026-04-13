import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <div className="app-container">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem' }}>DealDish</h1>
          <p style={{ color: 'var(--text-muted)' }}>Smart Grocery Optimizer</p>
        </div>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>Dashboard</Link>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '500' }}>Recipes</Link>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '500' }}>Settings</Link>
        </nav>
      </header>

      <main className="animate-fade-in">
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
