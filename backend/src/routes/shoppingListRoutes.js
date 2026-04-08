const express = require('express');
const router = express.Router();
const { addItemToList, addRecipeToList } = require('../controllers/shoppingListController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addItemToList);
router.post('/add-recipe', protect, addRecipeToList);

module.exports = router;
