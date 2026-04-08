const express = require('express');
const router = express.Router();
const { getRecipes, createRecipe } = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getRecipes);
router.post('/', protect, createRecipe);

module.exports = router;
