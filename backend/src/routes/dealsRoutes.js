const express = require('express');
const router = express.Router();
const { getDeals, triggerScrape, comparePrice } = require('../controllers/dealsController');

router.get('/compare', comparePrice);   // must be before /:id if added later
router.get('/',        getDeals);
router.post('/scrape', triggerScrape);

module.exports = router;
