const express = require('express');
const router = express.Router();
const { getDeals, triggerScrape } = require('../controllers/dealsController');

router.get('/', getDeals);
router.post('/scrape', triggerScrape);

module.exports = router;
