import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Spinner = () => (
  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
    <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

const EMPTY_FORM = { title: '', description: '', prepTimeMinutes: '', ingredients: [{ name: '', quantity: '', unit: '' }], instructions: [''] };

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchRecipes = (q = search) => {
    const params = q ? `?search=${encodeURIComponent(q)}` : '';
    api.get(`/recipes${params}`)
      .then(({ data }) => setRecipes(data))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecipes(''); }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchRecipes(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleOptimize = async (recipe) => {
    setOptimizing(recipe._id);
    setFeedback(null);
    try {
      await api.post('/shopping-list/add-recipe', { recipeId: recipe._id });
      setFeedback({ type: 'success', message: `"${recipe.title}" added to your list!` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to optimize recipe.' });
    } finally {
      setOptimizing(null);
    }
  };

  const handleDelete = async (recipe) => {
    if (!window.confirm(`Delete "${recipe.title}"?`)) return;
    setDeleting(recipe._id);
    try {
      await api.delete(`/recipes/${recipe._id}`);
      setRecipes(prev => prev.filter(r => r._id !== recipe._id));
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete recipe.' });
    } finally {
      setDeleting(null);
    }
  };

  // ── Form helpers ──
  const setIngredient = (idx, field, value) => {
    setForm(f => {
      const ings = [...f.ingredients];
      ings[idx] = { ...ings[idx], [field]: value };
      return { ...f, ingredients: ings };
    });
  };
  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: '', quantity: '', unit: '' }] }));
  const removeIngredient = (idx) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));

  const setInstruction = (idx, value) => {
    setForm(f => {
      const ins = [...f.instructions];
      ins[idx] = value;
      return { ...f, instructions: ins };
    });
  };
  const addInstruction = () => setForm(f => ({ ...f, instructions: [...f.instructions, ''] }));
  const removeInstruction = (idx) => setForm(f => ({ ...f, instructions: f.instructions.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        prepTimeMinutes: form.prepTimeMinutes ? Number(form.prepTimeMinutes) : null,
        ingredients: form.ingredients
          .filter(i => i.name.trim())
          .map(i => ({ name: i.name.trim(), quantity: Number(i.quantity) || 1, unit: i.unit.trim() || 'each' })),
        instructions: form.instructions.filter(s => s.trim()),
      };
      const { data } = await api.post('/recipes', payload);
      setRecipes(prev => [data, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setFeedback({ type: 'success', message: `Recipe "${data.title}" created.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to create recipe.' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.9rem' };

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Recipes</h2>
          <p style={{ color: 'var(--text-muted)' }}>Choose a recipe to auto-optimize the cheapest ingredients.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.9rem' }} onClick={() => { setShowForm(v => !v); setFeedback(null); }}>
            {showForm ? 'Cancel' : '+ New Recipe'}
          </button>
          <button onClick={() => navigate('/shopping-list')} style={{ padding: '10px 18px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', cursor: 'pointer' }}>
            View My List
          </button>
        </div>
      </div>

      {/* ── Feedback ── */}
      {feedback && (
        <div style={{ background: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${feedback.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '12px', padding: '12px 18px', marginBottom: '1.5rem', fontSize: '0.95rem', color: feedback.type === 'success' ? '#86efac' : '#fca5a5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>
      )}

      {/* ── Create Recipe Form ── */}
      {showForm && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>New Recipe</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '600', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title *</label>
                <input style={inputStyle} placeholder="e.g. Pasta Carbonara" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '600', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prep Time (min)</label>
                <input style={inputStyle} type="number" min="1" placeholder="e.g. 30" value={form.prepTimeMinutes} onChange={e => setForm(f => ({ ...f, prepTimeMinutes: e.target.value }))} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '600', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
              <input style={inputStyle} placeholder="Short description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingredients *</label>
                <button type="button" onClick={addIngredient} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>+ Add</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {form.ingredients.map((ing, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                    <input style={inputStyle} placeholder="Name" value={ing.name} onChange={e => setIngredient(idx, 'name', e.target.value)} />
                    <input style={inputStyle} type="number" min="0.01" step="0.01" placeholder="Qty" value={ing.quantity} onChange={e => setIngredient(idx, 'quantity', e.target.value)} />
                    <input style={inputStyle} placeholder="Unit" value={ing.unit} onChange={e => setIngredient(idx, 'unit', e.target.value)} />
                    {form.ingredients.length > 1 && (
                      <button type="button" onClick={() => removeIngredient(idx)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructions</label>
                <button type="button" onClick={addInstruction} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>+ Add Step</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {form.instructions.map((step, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minWidth: '20px' }}>{idx + 1}.</span>
                    <input style={inputStyle} placeholder={`Step ${idx + 1}`} value={step} onChange={e => setInstruction(idx, e.target.value)} />
                    {form.instructions.length > 1 && (
                      <button type="button" onClick={() => removeInstruction(idx)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '1rem', opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Recipe'}
            </button>
          </form>
        </div>
      )}

      {/* ── Search ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          className="modern-input"
          placeholder="Search recipes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '360px' }}
        />
      </div>

      {/* ── Recipe Grid ── */}
      {loading ? <Spinner /> : recipes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            {search ? `No recipes matching "${search}"` : 'No recipes yet.'}
          </p>
          {!search && <button className="btn-primary" style={{ padding: '10px 20px' }} onClick={() => setShowForm(true)}>Create First Recipe</button>}
        </div>
      ) : (
        <div className="dashboard-grid">
          {recipes.map(recipe => (
            <div key={recipe._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', lineHeight: '1.3' }}>{recipe.title}</h3>
                <button
                  onClick={() => handleDelete(recipe)}
                  disabled={deleting === recipe._id}
                  title="Delete recipe"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.95rem', flexShrink: 0, padding: '2px 4px' }}
                  onMouseEnter={e => e.target.style.color = '#fca5a5'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                >
                  {deleting === recipe._id ? '...' : '✕'}
                </button>
              </div>

              {recipe.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.8rem', lineHeight: '1.4' }}>
                  {recipe.description}
                </p>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {recipe.prepTimeMinutes ? `⏱ ${recipe.prepTimeMinutes} min  •  ` : ''}
                {recipe.ingredients.length} ingredients
              </p>

              <ul style={{ color: 'var(--text-muted)', fontSize: '0.88rem', paddingLeft: '1.2rem', marginBottom: '1.5rem', flexGrow: 1 }}>
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx} style={{ marginBottom: '0.2rem' }}>
                    {ing.quantity} {ing.unit} {ing.name}
                  </li>
                ))}
              </ul>

              <button
                className="btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem', opacity: optimizing === recipe._id ? 0.7 : 1 }}
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
