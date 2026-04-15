const GroceryItem = require('../models/GroceryItem');
const { scrapeAllStores } = require('../services/scraperService');

// @desc    Get all current deals from DB, grouped by store
// @route   GET /api/deals
// @access  Public
const getDeals = async (req, res) => {
  try {
    const { store, category, onSale } = req.query;
    const filter = {};
    if (store) filter.store = store;
    if (category) filter.category = category;
    if (onSale === 'true') filter.isOnSale = true;

    const items = await GroceryItem.find(filter).sort({ isOnSale: -1, price: 1 });

    // Group by store for the frontend
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.store]) acc[item.store] = [];
      acc[item.store].push(item);
      return acc;
    }, {});

    // Metadata
    const categories = [...new Set(items.map(i => i.category))].sort();
    const stores = [...new Set(items.map(i => i.store))].sort();
    const lastUpdated = items.length > 0
      ? items.reduce((latest, i) => i.updatedAt > latest ? i.updatedAt : latest, items[0].updatedAt)
      : null;

    res.json({ grouped, categories, stores, total: items.length, lastUpdated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Trigger a fresh scrape and upsert results into DB
// @route   POST /api/deals/scrape
// @access  Public (rate-limited in production; demo uses no auth for ease)
const triggerScrape = async (req, res) => {
  try {
    console.log('[Scraper] Manual scrape triggered via API');
    const { items, fallbackUsed, report } = await scrapeAllStores();

    if (items.length === 0) {
      return res.status(500).json({ message: 'Scraper returned no results.' });
    }

    // Upsert: update by name+store pair to avoid duplicates on repeated scrapes
    const ops = items.map(item => ({
      updateOne: {
        filter: { name: item.name, store: item.store },
        update: { $set: { ...item, lastUpdated: new Date() } },
        upsert: true,
      },
    }));

    const result = await GroceryItem.bulkWrite(ops);

    const stores = [...new Set(items.map(i => i.store))];

    // Broadcast to all connected clients via Socket.io
    if (req.io) {
      req.io.emit('deals_updated', {
        message: `Deal data refreshed — ${items.length} items from ${stores.join(', ')}`,
        count: items.length,
        fallbackUsed,
        report,
      });
    }

    res.json({
      message: `Scrape complete. ${items.length} items upserted.`,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
      fallbackUsed,
      report,
    });
  } catch (error) {
    console.error('[Scraper] Error:', error);
    res.status(500).json({ message: 'Scrape failed', error: error.message });
  }
};

module.exports = { getDeals, triggerScrape };
