const Recipe = require('../models/Recipe');

// @desc    Get all recipes
// @route   GET /api/recipes
// @access  Public
const getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a recipe
// @route   POST /api/recipes
// @access  Private
const createRecipe = async (req, res) => {
  const { title, description, ingredients, instructions, prepTimeMinutes } = req.body;

  try {
    const recipe = await Recipe.create({
      title,
      description,
      ingredients,
      instructions,
      prepTimeMinutes
    });
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getRecipes, createRecipe };
