import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const STORE_COLORS = {
  'H-E-B':   { bg: 'rgba(220, 38, 38, 0.15)',  border: 'rgba(220, 38, 38, 0.3)',  text: '#fca5a5'  },
  'Kroger':  { bg: 'rgba(37, 99, 235, 0.15)',   border: 'rgba(37, 99, 235, 0.3)',  text: '#93c5fd'  },
  'Walmart': { bg: 'rgba(30, 157, 62, 0.15)',   border: 'rgba(30, 157, 62, 0.3)',  text: '#86efac'  },
};
const DEFAULT_COLOR = { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', text: '#c4b5fd' };

const StoreBadge = ({ store, small }) => {
  const c = STORE_COLORS[store] || DEFAULT_COLOR;
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      borderRadius: '20px',
      padding: small ? '2px 8px' : '3px 10px',
      fontSize: small ? '0.7rem' : '0.75rem',
      fontWeight: '600', whiteSpace: 'nowrap',
    }}>
      {store}
    </span>
  );
};

const SaleBadge = () => (
  <span style={{
    background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
    borderRadius: '20px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: '700', color: 'white',
  }}>
    SALE
  </span>
);

// ─── Scrape Report Panel ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  live:       { color: '#86efac', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)',  label: 'LIVE' },
  blocked:    { color: '#fca5a5', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  label: 'BLOCKED' },
  error:      { color: '#fca5a5', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  label: 'ERROR' },
  no_results: { color: '#fcd34d', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'EMPTY' },
};

const StatusPill = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.error;
  return (
    <span style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
      borderRadius: '20px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: '700',
      letterSpacing: '0.05em',
    }}>
      {cfg.label}
    </span>
  );
};

const StoreReport = ({ storeData }) => {
  const [expanded, setExpanded] = useState(false);
  const foundTerms  = storeData.terms?.filter(t => t.found?.length > 0) || [];
  const blockedTerms = storeData.terms?.filter(t => !t.found?.length) || [];

  return (
    <div style={{
      border: '1px solid var(--glass-border)',
      borderRadius: '14px',
      overflow: 'hidden',
    }}>
      {/* Store header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      >
        <StoreBadge store={storeData.store} />
        <StatusPill status={storeData.status} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {storeData.itemsFound} items
        </span>
        {storeData.totalDurationMs > 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {(storeData.totalDurationMs / 1000).toFixed(1)}s
          </span>
        )}
        {storeData.error && (
          <span style={{ color: '#fca5a5', fontSize: '0.8rem', flex: 1, textAlign: 'right', fontFamily: 'monospace' }}>
            {storeData.error}
          </span>
        )}
        <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.85rem' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Per-term results table */}
      {expanded && storeData.terms?.length > 0 && (
        <div style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 1.25rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '4px 8px 8px 0', fontWeight: '600', width: '30%' }}>Search term</th>
                <th style={{ padding: '4px 8px 8px', fontWeight: '600', width: '15%' }}>Category</th>
                <th style={{ padding: '4px 8px 8px', fontWeight: '600' }}>Result</th>
                <th style={{ padding: '4px 0 8px 8px', fontWeight: '600', textAlign: 'right', width: '10%' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {storeData.terms.map((t, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  }}
                >
                  <td style={{ padding: '7px 8px 7px 0', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {t.term}
                  </td>
                  <td style={{ padding: '7px 8px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {t.category}
                  </td>
                  <td style={{ padding: '7px 8px' }}>
                    {t.found?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {t.found.map((f, fi) => (
                          <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#86efac', fontSize: '0.75rem', fontWeight: '600' }}>✓</span>
                            <span style={{ color: 'white', fontSize: '0.82rem' }}>{f.name}</span>
                            <span style={{ color: '#86efac', fontWeight: '700', fontSize: '0.82rem' }}>${f.price.toFixed(2)}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/ {f.unit}</span>
                            {f.isOnSale && <SaleBadge />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#fca5a5', fontSize: '0.8rem' }}>
                        ✗ {t.error || 'not found'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '7px 0 7px 8px', color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'right' }}>
                    {t.durationMs != null ? `${t.durationMs}ms` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.82rem' }}>
            <span style={{ color: '#86efac' }}>{foundTerms.length} terms found</span>
            <span style={{ color: '#fca5a5' }}>{blockedTerms.length} terms blocked/empty</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ScrapeReport = ({ report }) => {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      marginBottom: '2rem',
      border: '1px solid rgba(139,92,246,0.3)',
      borderRadius: '16px',
      overflow: 'hidden',
      background: 'rgba(139,92,246,0.05)',
    }}>
      {/* Report header */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '1rem 1.5rem', background: 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Scrape Report</span>
        {report.fallbackUsed ? (
          <span style={{ color: '#fcd34d', fontSize: '0.8rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '2px 10px' }}>
            Curated fallback used
          </span>
        ) : (
          <span style={{ color: '#86efac', fontSize: '0.8rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', padding: '2px 10px' }}>
            Live data
          </span>
        )}
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {report.totalItems} items · {(report.totalDurationMs / 1000).toFixed(1)}s total
        </span>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {open ? '▲ hide' : '▼ show'}
        </span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid rgba(139,92,246,0.2)', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {report.fallbackReason && (
            <p style={{ color: '#fcd34d', fontSize: '0.85rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '8px 12px' }}>
              {report.fallbackReason}
            </p>
          )}
          {report.stores?.map((s, i) => (
            <StoreReport key={i} storeData={s} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Deal Card ────────────────────────────────────────────────────────────────
const DealCard = ({ item }) => {
  const savings = item.isOnSale && item.originalPrice
    ? ((item.originalPrice - item.price) / item.originalPrice * 100).toFixed(0)
    : null;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--glass-border)',
      borderRadius: '14px',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
    >
      {item.isOnSale && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '60px', height: '60px',
          background: 'linear-gradient(135deg, transparent 50%, rgba(236,72,153,0.5) 50%)',
          borderTopRightRadius: '14px',
        }} />
      )}
      <p style={{ fontWeight: '500', fontSize: '0.9rem', lineHeight: '1.3' }}>{item.name}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <StoreBadge store={item.store} small />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{item.category}</span>
        {item.isOnSale && <SaleBadge />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: '800' }}>${item.price.toFixed(2)}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ {item.unit}</span>
        {item.isOnSale && item.originalPrice && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'line-through' }}>
            ${item.originalPrice.toFixed(2)}
          </span>
        )}
        {savings && (
          <span style={{ color: '#86efac', fontSize: '0.8rem', fontWeight: '600' }}>-{savings}%</span>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Deals = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeReport, setScrapeReport] = useState(null);
  const [filterStore, setFilterStore] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const { socket } = useSocket();

  const fetchDeals = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStore !== 'All') params.set('store', filterStore);
    if (filterCategory !== 'All') params.set('category', filterCategory);
    if (onSaleOnly) params.set('onSale', 'true');
    api.get(`/deals?${params}`)
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [filterStore, filterCategory, onSaleOnly]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  useEffect(() => {
    if (!socket) return;
    socket.on('deals_updated', (payload) => {
      if (payload.report) setScrapeReport(payload.report);
      fetchDeals();
    });
    return () => socket.off('deals_updated');
  }, [socket, fetchDeals]);

  const handleScrape = async () => {
    setScraping(true);
    setScrapeReport(null);
    try {
      const { data: result } = await api.post('/deals/scrape');
      setScrapeReport(result.report);
      fetchDeals();
    } catch (err) {
      setScrapeReport({
        fallbackUsed: false, fallbackReason: null, totalItems: 0, totalDurationMs: 0,
        stores: [{ store: 'All', status: 'error', itemsFound: 0, totalDurationMs: 0, error: err.response?.data?.message || err.message, terms: [] }],
      });
    } finally {
      setScraping(false);
    }
  };

  const allItems = data ? Object.values(data.grouped).flat() : [];
  const saleCount = allItems.filter(i => i.isOnSale).length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Grocery Deals</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {data?.total ? (
              <>
                <strong style={{ color: 'white' }}>{data.total}</strong> items across{' '}
                <strong style={{ color: 'white' }}>{data.stores?.length}</strong> stores
                {saleCount > 0 && <> · <strong style={{ color: '#86efac' }}>{saleCount} on sale</>}</>}
              </>
            ) : 'Scrape stores to see current deals.'}
          </p>
          {data?.lastUpdated && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        <button
          className="btn-primary"
          style={{ padding: '10px 22px', opacity: scraping ? 0.7 : 1 }}
          onClick={handleScrape}
          disabled={scraping}
        >
          {scraping ? 'Scraping...' : 'Refresh Prices'}
        </button>
      </div>

      {/* Scrape Report */}
      {scrapeReport && <ScrapeReport report={scrapeReport} />}

      {/* Filters */}
      {data?.total > 0 && (
        <div style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem',
          padding: '1rem 1.25rem',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '14px',
          border: '1px solid var(--glass-border)',
          alignItems: 'flex-end',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Store</label>
            <select className="modern-input" style={{ padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer', minWidth: '130px' }}
              value={filterStore} onChange={e => setFilterStore(e.target.value)}>
              <option value="All">All Stores</option>
              {data.stores?.map(s => <option key={s} value={s} style={{ background: '#17171d' }}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
            <select className="modern-input" style={{ padding: '8px 12px', fontSize: '0.9rem', cursor: 'pointer', minWidth: '160px' }}
              value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="All">All Categories</option>
              {data.categories?.map(c => <option key={c} value={c} style={{ background: '#17171d' }}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={() => setOnSaleOnly(v => !v)}
            style={{
              padding: '9px 16px', borderRadius: '10px',
              border: `1px solid ${onSaleOnly ? 'rgba(236,72,153,0.5)' : 'var(--glass-border)'}`,
              background: onSaleOnly ? 'rgba(236,72,153,0.15)' : 'rgba(0,0,0,0.2)',
              color: onSaleOnly ? '#f9a8d4' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
            }}
          >
            On Sale Only
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{
            display: 'inline-block', width: '36px', height: '36px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid var(--accent-primary)',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Loading deals...</p>
        </div>
      ) : allItems.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>No deals found</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            {data?.total === 0
              ? 'Hit "Refresh Prices" to scrape current grocery deals.'
              : 'Try changing your filters.'}
          </p>
          {data?.total === 0 && (
            <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={handleScrape} disabled={scraping}>
              {scraping ? 'Scraping...' : 'Scrape Now'}
            </button>
          )}
        </div>
      ) : (
        <>
          {filterStore === 'All' ? (
            Object.entries(data?.grouped || {}).map(([store, items]) => (
              <div key={store} style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <StoreBadge store={store} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {items.length} items · {items.filter(i => i.isOnSale).length} on sale
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                  {items.map(item => <DealCard key={item._id} item={item} />)}
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {allItems.map(item => <DealCard key={item._id} item={item} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Deals;
