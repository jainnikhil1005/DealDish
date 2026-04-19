const { scrapeAllStores } = require('../services/scraperService');

// In-memory cache — survives without MongoDB
let cache = { items: [], lastUpdated: null };

// @desc    Get all current deals, grouped by store
// @route   GET /api/deals
// @access  Public
const getDeals = async (req, res) => {
  try {
    const { store, category, onSale } = req.query;

    let items = cache.items;
    if (store)           items = items.filter(i => i.store === store);
    if (category)        items = items.filter(i => i.category === category);
    if (onSale === 'true') items = items.filter(i => i.isOnSale);

    const grouped = items.reduce((acc, item) => {
      if (!acc[item.store]) acc[item.store] = [];
      acc[item.store].push(item);
      return acc;
    }, {});

    const categories = [...new Set(cache.items.map(i => i.category))].sort();
    const stores     = [...new Set(cache.items.map(i => i.store))].sort();

    res.json({
      grouped,
      categories,
      stores,
      total: items.length,
      lastUpdated: cache.lastUpdated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Trigger a fresh scrape and store results in memory
// @route   POST /api/deals/scrape
// @access  Public
const triggerScrape = async (req, res) => {
  try {
    console.log('[Scraper] Manual scrape triggered via API');
    const { items, fallbackUsed, report } = await scrapeAllStores();

    if (items.length === 0) {
      return res.status(500).json({ message: 'Scraper returned no results.' });
    }

    // Upsert into in-memory cache by name+store key
    const map = new Map(cache.items.map(i => [`${i.store}::${i.name}`, i]));
    for (const item of items) {
      map.set(`${item.store}::${item.name}`, { ...item, _id: `${item.store}-${item.name}`.replace(/\s+/g, '-') });
    }
    cache.items = [...map.values()];
    cache.lastUpdated = new Date();

    const stores = [...new Set(items.map(i => i.store))];

    if (req.io) {
      req.io.emit('deals_updated', {
        message: `Deal data refreshed — ${items.length} items from ${stores.join(', ')}`,
        count: items.length,
        fallbackUsed,
        report,
      });
    }

    res.json({
      message: `Scrape complete. ${items.length} items loaded.`,
      total: cache.items.length,
      fallbackUsed,
      report,
    });
  } catch (error) {
    console.error('[Scraper] Error:', error);
    res.status(500).json({ message: 'Scrape failed', error: error.message });
  }
};

// GET /api/deals/compare?ingredient=chicken
// Returns all matching items across stores sorted cheapest first
const comparePrice = (req, res) => {
  const { ingredient } = req.query;
  if (!ingredient) return res.status(400).json({ message: 'ingredient query param is required' });

  const regex = new RegExp(ingredient, 'i');
  const matches = cache.items
    .filter(i => regex.test(i.name))
    .sort((a, b) => a.price - b.price);

  if (!matches.length) {
    return res.status(404).json({ message: `No items found matching "${ingredient}"` });
  }

  const cheapest = matches[0];
  const savings = matches.length > 1
    ? parseFloat((matches[matches.length - 1].price - cheapest.price).toFixed(2))
    : 0;

  res.json({
    ingredient,
    results: matches,
    cheapest,
    mostExpensive: matches[matches.length - 1],
    maxSavings: savings,
    storesChecked: [...new Set(matches.map(i => i.store))],
  });
};

const getCacheItems = () => cache.items;

module.exports = { getDeals, triggerScrape, comparePrice, getCacheItems };
