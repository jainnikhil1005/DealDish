const express = require('express');
const router = express.Router();
const { addItemToList } = require('../controllers/shoppingListController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addItemToList);

module.exports = router;
