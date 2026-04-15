const axios = require('axios');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/html, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

const SEARCH_TERMS = [
  { term: 'chicken breast', category: 'Meat & Seafood' },
  { term: 'ground beef', category: 'Meat & Seafood' },
  { term: 'salmon fillet', category: 'Meat & Seafood' },
  { term: 'whole milk gallon', category: 'Dairy' },
  { term: 'large eggs dozen', category: 'Dairy' },
  { term: 'cheddar cheese', category: 'Dairy' },
  { term: 'sourdough bread', category: 'Bakery' },
  { term: 'avocado', category: 'Produce' },
  { term: 'roma tomatoes', category: 'Produce' },
  { term: 'yellow onion', category: 'Produce' },
  { term: 'russet potatoes', category: 'Produce' },
  { term: 'baby spinach', category: 'Produce' },
  { term: 'penne pasta', category: 'Pantry' },
  { term: 'basmati rice', category: 'Pantry' },
  { term: 'olive oil', category: 'Pantry' },
  { term: 'black beans canned', category: 'Pantry' },
  { term: 'chicken broth', category: 'Pantry' },
];

// ─── H-E-B Scraper ────────────────────────────────────────────────────────────
async function scrapeHEB() {
  const storeStart = Date.now();
  const termResults = [];
  const items = [];
  let httpError = null;

  for (const { term, category } of SEARCH_TERMS.slice(0, 10)) {
    const termStart = Date.now();
    try {
      const url = `https://www.heb.com/heb-api/products/v2/search?query=${encodeURIComponent(term)}&store=530&channel=web&size=3`;
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 7000 });
      const products = data.products || data.data?.products || [];
      const found = [];

      for (const p of products.slice(0, 2)) {
        const price = p.currentPrice?.value ?? p.lowestPrice?.value;
        if (!price) continue;
        const item = {
          name: p.name || p.description || term,
          store: 'H-E-B',
          price: parseFloat(price.toFixed(2)),
          originalPrice: p.wasPrice?.value ? parseFloat(p.wasPrice.value.toFixed(2)) : null,
          unit: p.currentPrice?.unitOfMeasure || 'each',
          category,
          imageUrl: p.images?.[0]?.url || null,
          isOnSale: !!(p.onSale || p.wasPrice),
        };
        items.push(item);
        found.push({ name: item.name, price: item.price, unit: item.unit, isOnSale: item.isOnSale });
      }

      termResults.push({ term, category, found, durationMs: Date.now() - termStart });
      await new Promise(r => setTimeout(r, 250));
    } catch (err) {
      httpError = httpError || `${err.response?.status || err.code || err.message}`;
      termResults.push({ term, category, found: [], error: String(err.response?.status || err.message), durationMs: Date.now() - termStart });
    }
  }

  const totalDurationMs = Date.now() - storeStart;
  const blocked = items.length === 0 && httpError;

  return {
    store: 'H-E-B',
    status: blocked ? 'blocked' : items.length > 0 ? 'live' : 'no_results',
    itemsFound: items.length,
    totalDurationMs,
    error: blocked ? httpError : null,
    terms: termResults,
    items,
  };
}

// ─── Kroger Scraper ───────────────────────────────────────────────────────────
async function scrapeKroger() {
  const storeStart = Date.now();
  const termResults = [];
  const items = [];
  let httpError = null;

  for (const { term, category } of SEARCH_TERMS.slice(0, 10)) {
    const termStart = Date.now();
    try {
      const url = `https://www.kroger.com/atlas/v1/products/v1/products?query=${encodeURIComponent(term)}&store-id=01400943&fulfillment=ais&start=0&count=3`;
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 7000 });
      const products = data.data?.products || data.products || [];
      const found = [];

      for (const p of products.slice(0, 2)) {
        const priceInfo = p.items?.[0]?.price;
        if (!priceInfo?.regular) continue;
        const isOnSale = !!(priceInfo.promo && priceInfo.promo < priceInfo.regular);
        const item = {
          name: p.description || term,
          store: 'Kroger',
          price: parseFloat((isOnSale ? priceInfo.promo : priceInfo.regular).toFixed(2)),
          originalPrice: isOnSale ? parseFloat(priceInfo.regular.toFixed(2)) : null,
          unit: p.items?.[0]?.size || 'each',
          category,
          imageUrl: p.images?.find(i => i.perspective === 'front')?.sizes?.find(s => s.size === 'medium')?.url || null,
          isOnSale,
        };
        items.push(item);
        found.push({ name: item.name, price: item.price, unit: item.unit, isOnSale: item.isOnSale });
      }

      termResults.push({ term, category, found, durationMs: Date.now() - termStart });
      await new Promise(r => setTimeout(r, 250));
    } catch (err) {
      httpError = httpError || `${err.response?.status || err.code || err.message}`;
      termResults.push({ term, category, found: [], error: String(err.response?.status || err.message), durationMs: Date.now() - termStart });
    }
  }

  const totalDurationMs = Date.now() - storeStart;
  const blocked = items.length === 0 && httpError;

  return {
    store: 'Kroger',
    status: blocked ? 'blocked' : items.length > 0 ? 'live' : 'no_results',
    itemsFound: items.length,
    totalDurationMs,
    error: blocked ? httpError : null,
    terms: termResults,
    items,
  };
}

// ─── Fallback Seed Data ───────────────────────────────────────────────────────
function getFallbackDeals() {
  return [
    { name: 'H-E-B Chicken Breast Boneless Skinless', store: 'H-E-B', price: 3.97, originalPrice: 5.49, unit: 'lb', category: 'Meat & Seafood', isOnSale: true, imageUrl: null },
    { name: 'H-E-B 80/20 Ground Beef', store: 'H-E-B', price: 4.79, originalPrice: 6.29, unit: 'lb', category: 'Meat & Seafood', isOnSale: true, imageUrl: null },
    { name: 'H-E-B Atlantic Salmon Fillet', store: 'H-E-B', price: 8.97, originalPrice: null, unit: 'lb', category: 'Meat & Seafood', isOnSale: false, imageUrl: null },
    { name: 'H-E-B Whole Milk Gallon', store: 'H-E-B', price: 3.28, originalPrice: null, unit: 'gallon', category: 'Dairy', isOnSale: false, imageUrl: null },
    { name: 'H-E-B Large Eggs (12 ct)', store: 'H-E-B', price: 2.89, originalPrice: 3.79, unit: 'dozen', category: 'Dairy', isOnSale: true, imageUrl: null },
    { name: 'H-E-B Sharp Cheddar Cheese 16 oz', store: 'H-E-B', price: 4.97, originalPrice: 6.49, unit: '16 oz', category: 'Dairy', isOnSale: true, imageUrl: null },
    { name: 'H-E-B Sourdough Bread Loaf', store: 'H-E-B', price: 3.49, originalPrice: null, unit: 'loaf', category: 'Bakery', isOnSale: false, imageUrl: null },
    { name: 'H-E-B Avocados', store: 'H-E-B', price: 0.88, originalPrice: 1.29, unit: 'each', category: 'Produce', isOnSale: true, imageUrl: null },
    { name: 'H-E-B Roma Tomatoes', store: 'H-E-B', price: 0.99, originalPrice: null, unit: 'lb', category: 'Produce', isOnSale: false, imageUrl: null },
    { name: 'H-E-B Yellow Onions 3 lb Bag', store: 'H-E-B', price: 2.49, originalPrice: null, unit: '3 lb bag', category: 'Produce', isOnSale: false, imageUrl: null },
    { name: 'H-E-B Russet Potatoes 5 lb Bag', store: 'H-E-B', price: 3.49, originalPrice: 4.49, unit: '5 lb bag', category: 'Produce', isOnSale: true, imageUrl: null },
    { name: 'H-E-B Baby Spinach 5 oz', store: 'H-E-B', price: 2.97, originalPrice: null, unit: '5 oz', category: 'Produce', isOnSale: false, imageUrl: null },
    { name: 'H-E-B Penne Pasta 16 oz', store: 'H-E-B', price: 1.27, originalPrice: null, unit: '16 oz', category: 'Pantry', isOnSale: false, imageUrl: null },
    { name: 'H-E-B Basmati Rice 2 lb', store: 'H-E-B', price: 3.49, originalPrice: 4.29, unit: '2 lb', category: 'Pantry', isOnSale: true, imageUrl: null },
    { name: 'H-E-B Extra Virgin Olive Oil 16.9 oz', store: 'H-E-B', price: 6.98, originalPrice: null, unit: '16.9 oz', category: 'Pantry', isOnSale: false, imageUrl: null },
    { name: 'H-E-B Black Beans Canned 15 oz', store: 'H-E-B', price: 0.97, originalPrice: null, unit: '15 oz', category: 'Pantry', isOnSale: false, imageUrl: null },
    { name: 'H-E-B Chicken Broth 32 oz', store: 'H-E-B', price: 1.78, originalPrice: 2.49, unit: '32 oz', category: 'Pantry', isOnSale: true, imageUrl: null },
    { name: 'Kroger Boneless Chicken Breast', store: 'Kroger', price: 4.29, originalPrice: 5.99, unit: 'lb', category: 'Meat & Seafood', isOnSale: true, imageUrl: null },
    { name: 'Kroger 85/15 Ground Beef', store: 'Kroger', price: 5.49, originalPrice: null, unit: 'lb', category: 'Meat & Seafood', isOnSale: false, imageUrl: null },
    { name: 'Kroger 2% Reduced Fat Milk Gallon', store: 'Kroger', price: 3.49, originalPrice: null, unit: 'gallon', category: 'Dairy', isOnSale: false, imageUrl: null },
    { name: 'Kroger Grade A Large Eggs (18 ct)', store: 'Kroger', price: 3.49, originalPrice: 4.29, unit: '18 ct', category: 'Dairy', isOnSale: true, imageUrl: null },
    { name: 'Kroger Mild Cheddar Shredded 8 oz', store: 'Kroger', price: 2.49, originalPrice: 3.29, unit: '8 oz', category: 'Dairy', isOnSale: true, imageUrl: null },
    { name: 'Kroger White Sandwich Bread', store: 'Kroger', price: 2.99, originalPrice: null, unit: 'loaf', category: 'Bakery', isOnSale: false, imageUrl: null },
    { name: 'Kroger Hass Avocados', store: 'Kroger', price: 1.19, originalPrice: 1.49, unit: 'each', category: 'Produce', isOnSale: true, imageUrl: null },
    { name: 'Kroger Beefsteak Tomatoes', store: 'Kroger', price: 1.29, originalPrice: null, unit: 'lb', category: 'Produce', isOnSale: false, imageUrl: null },
    { name: 'Kroger Sweet Yellow Onion', store: 'Kroger', price: 1.49, originalPrice: null, unit: 'lb', category: 'Produce', isOnSale: false, imageUrl: null },
    { name: 'Kroger Baby Potato Medley 1.5 lb', store: 'Kroger', price: 3.99, originalPrice: null, unit: '1.5 lb', category: 'Produce', isOnSale: false, imageUrl: null },
    { name: 'Kroger Rotini Pasta 16 oz', store: 'Kroger', price: 1.49, originalPrice: null, unit: '16 oz', category: 'Pantry', isOnSale: false, imageUrl: null },
    { name: 'Kroger Long Grain White Rice 2 lb', store: 'Kroger', price: 2.29, originalPrice: 3.19, unit: '2 lb', category: 'Pantry', isOnSale: true, imageUrl: null },
    { name: 'Kroger Pure Olive Oil 16.9 oz', store: 'Kroger', price: 5.99, originalPrice: 7.49, unit: '16.9 oz', category: 'Pantry', isOnSale: true, imageUrl: null },
    { name: 'Kroger Dark Red Kidney Beans 15.5 oz', store: 'Kroger', price: 1.09, originalPrice: null, unit: '15.5 oz', category: 'Pantry', isOnSale: false, imageUrl: null },
    { name: 'Great Value Chicken Breasts Frozen 4 lb', store: 'Walmart', price: 9.98, originalPrice: null, unit: '4 lb', category: 'Meat & Seafood', isOnSale: false, imageUrl: null },
    { name: 'Great Value 93/7 Ground Turkey 1 lb', store: 'Walmart', price: 3.97, originalPrice: 5.24, unit: 'lb', category: 'Meat & Seafood', isOnSale: true, imageUrl: null },
    { name: 'Great Value Whole Milk Gallon', store: 'Walmart', price: 3.17, originalPrice: null, unit: 'gallon', category: 'Dairy', isOnSale: false, imageUrl: null },
    { name: 'Great Value Large White Eggs (12 ct)', store: 'Walmart', price: 2.64, originalPrice: null, unit: 'dozen', category: 'Dairy', isOnSale: false, imageUrl: null },
    { name: 'Great Value Shredded Mozzarella 8 oz', store: 'Walmart', price: 2.12, originalPrice: 2.97, unit: '8 oz', category: 'Dairy', isOnSale: true, imageUrl: null },
    { name: 'Great Value White Sandwich Bread 20 oz', store: 'Walmart', price: 1.28, originalPrice: null, unit: '20 oz', category: 'Bakery', isOnSale: false, imageUrl: null },
    { name: 'Fresh Avocados', store: 'Walmart', price: 0.94, originalPrice: 1.28, unit: 'each', category: 'Produce', isOnSale: true, imageUrl: null },
    { name: 'Marketside Grape Tomatoes 10 oz', store: 'Walmart', price: 2.48, originalPrice: null, unit: '10 oz', category: 'Produce', isOnSale: false, imageUrl: null },
    { name: 'Yellow Onion 3 lb Bag', store: 'Walmart', price: 2.27, originalPrice: null, unit: '3 lb bag', category: 'Produce', isOnSale: false, imageUrl: null },
    { name: 'Russet Potatoes 10 lb Bag', store: 'Walmart', price: 4.98, originalPrice: 6.48, unit: '10 lb bag', category: 'Produce', isOnSale: true, imageUrl: null },
    { name: 'Great Value Penne Pasta 16 oz', store: 'Walmart', price: 0.98, originalPrice: null, unit: '16 oz', category: 'Pantry', isOnSale: false, imageUrl: null },
    { name: 'Great Value Long Grain Enriched Rice 5 lb', store: 'Walmart', price: 3.47, originalPrice: null, unit: '5 lb', category: 'Pantry', isOnSale: false, imageUrl: null },
    { name: 'Great Value Pure Olive Oil 16.9 oz', store: 'Walmart', price: 5.47, originalPrice: 6.98, unit: '16.9 oz', category: 'Pantry', isOnSale: true, imageUrl: null },
    { name: 'Great Value Black Beans 15.25 oz', store: 'Walmart', price: 0.78, originalPrice: null, unit: '15.25 oz', category: 'Pantry', isOnSale: false, imageUrl: null },
    { name: 'Great Value Chicken Broth 32 oz', store: 'Walmart', price: 1.48, originalPrice: null, unit: '32 oz', category: 'Pantry', isOnSale: false, imageUrl: null },
  ];
}

// Build the fallback scrape report so the UI still shows a meaningful report
function getFallbackReport(reason) {
  const terms = SEARCH_TERMS.slice(0, 10).map(({ term, category }) => ({
    term, category, found: [], error: 'blocked — using curated dataset',
  }));
  return {
    store: 'H-E-B / Kroger',
    status: 'blocked',
    itemsFound: 0,
    totalDurationMs: 0,
    error: reason,
    terms,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────
async function scrapeAllStores() {
  const start = Date.now();
  console.log('[Scraper] Starting scrape run...');

  const [hebResult, krogerResult] = await Promise.all([
    scrapeHEB().catch(err => ({
      store: 'H-E-B', status: 'error', itemsFound: 0,
      totalDurationMs: 0, error: err.message, terms: [], items: [],
    })),
    scrapeKroger().catch(err => ({
      store: 'Kroger', status: 'error', itemsFound: 0,
      totalDurationMs: 0, error: err.message, terms: [], items: [],
    })),
  ]);

  const liveItems = [...hebResult.items, ...krogerResult.items];
  const totalDurationMs = Date.now() - start;

  console.log(`[Scraper] H-E-B: ${hebResult.itemsFound} items (${hebResult.status})`);
  console.log(`[Scraper] Kroger: ${krogerResult.itemsFound} items (${krogerResult.status})`);
  console.log(`[Scraper] Total live items: ${liveItems.length} in ${totalDurationMs}ms`);

  if (liveItems.length < 5) {
    const reason = `Live scrapers returned only ${liveItems.length} items — stores may be blocking automated requests`;
    console.log(`[Scraper] ${reason}. Switching to curated fallback.`);
    const fallbackItems = getFallbackDeals();
    return {
      items: fallbackItems,
      fallbackUsed: true,
      report: {
        fallbackUsed: true,
        fallbackReason: reason,
        totalItems: fallbackItems.length,
        totalDurationMs,
        stores: [getFallbackReport(reason)],
      },
    };
  }

  return {
    items: liveItems,
    fallbackUsed: false,
    report: {
      fallbackUsed: false,
      fallbackReason: null,
      totalItems: liveItems.length,
      totalDurationMs,
      stores: [hebResult, krogerResult].map(r => ({
        store: r.store,
        status: r.status,
        itemsFound: r.itemsFound,
        totalDurationMs: r.totalDurationMs,
        error: r.error,
        terms: r.terms,
      })),
    },
  };
}

module.exports = { scrapeAllStores };
