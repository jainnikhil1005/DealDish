import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Recipes from './pages/Recipes';
import ShoppingList from './pages/ShoppingList';
import Deals from './pages/Deals';
import Login from './pages/Login';
import Register from './pages/Register';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  const { token } = useAuth();

  return (
    <>
      {token && <Navbar />}
      <div className="app-container" style={{ paddingTop: token ? '2rem' : '0' }}>
        <main className="animate-fade-in">
          <Routes>
            <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" replace />} />
            <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/recipes" element={<PrivateRoute><Recipes /></PrivateRoute>} />
            <Route path="/shopping-list" element={<PrivateRoute><ShoppingList /></PrivateRoute>} />
            <Route path="/deals" element={<PrivateRoute><Deals /></PrivateRoute>} />
            <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;
