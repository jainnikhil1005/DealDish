import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Spinner = () => (
  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
    <div style={{
      display: 'inline-block', width: '30px', height: '30px',
      border: '3px solid rgba(255,255,255,0.1)',
      borderTop: '3px solid var(--accent-primary)',
      borderRadius: '50%', animation: 'spin 1s linear infinite'
    }} />
    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/recipes')
      .then(({ data }) => setRecipes(data))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, []);

  const handleOptimize = async (recipe) => {
    setOptimizing(recipe._id);
    setFeedback(null);
    try {
      await api.post('/shopping-list/add-recipe', { recipeId: recipe._id });
      setFeedback({ type: 'success', message: `"${recipe.title}" added to your list! Check the Dashboard for live updates.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to optimize recipe.' });
    } finally {
      setOptimizing(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Curated Recipes</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Choose a recipe and automatically find the cheapest ingredients across stores.
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.9rem' }}
          onClick={() => navigate('/shopping-list')}
        >
          View My List
        </button>
      </div>

      {feedback && (
        <div style={{
          background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '1.5rem',
          fontSize: '0.95rem',
          color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : recipes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No recipes found in the database yet.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Seed recipes via <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>POST /api/recipes</code> to get started.
          </p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {recipes.map((recipe) => (
            <div key={recipe._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>{recipe.title}</h3>
              {recipe.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.8rem', lineHeight: '1.4' }}>
                  {recipe.description}
                </p>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {recipe.prepTimeMinutes && `⏱ ${recipe.prepTimeMinutes} min  •  `}
                {recipe.ingredients.length} ingredients
              </p>

              <ul style={{ color: 'var(--text-muted)', fontSize: '0.9rem', paddingLeft: '1.2rem', marginBottom: '2rem', flexGrow: 1 }}>
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>
                    {ing.quantity} {ing.unit} {ing.name}
                  </li>
                ))}
              </ul>

              <button
                className="btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', opacity: optimizing === recipe._id ? 0.7 : 1 }}
                onClick={() => handleOptimize(recipe)}
                disabled={optimizing === recipe._id}
              >
                {optimizing === recipe._id ? 'Optimizing...' : 'Optimize & Add to List'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recipes;
