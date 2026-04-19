const express = require('express');
const router = express.Router();
const { getActiveList, addItemToList, addRecipeToList, updateItem, removeItem, clearList } = require('../controllers/shoppingListController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',                    protect, getActiveList);
router.post('/add',                protect, addItemToList);
router.post('/add-recipe',         protect, addRecipeToList);
router.put('/item/:itemId',        protect, updateItem);
router.delete('/item/:itemId',     protect, removeItem);
router.delete('/clear',            protect, clearList);

module.exports = router;
