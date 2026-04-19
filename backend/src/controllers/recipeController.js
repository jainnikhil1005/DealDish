// In-memory recipe store — no MongoDB needed
let recipes = [
  {
    _id: 'r1',
    title: 'Chicken Tikka Masala',
    description: 'A rich, creamy Indian curry with tender chicken.',
    prepTimeMinutes: 45,
    ingredients: [
      { name: 'Chicken', quantity: 1, unit: 'lb' },
      { name: 'Curry Paste', quantity: 2, unit: 'tbsp' },
      { name: 'Heavy Cream', quantity: 0.5, unit: 'cup' },
      { name: 'Tomatoes', quantity: 2, unit: 'each' },
      { name: 'Yellow Onion', quantity: 1, unit: 'each' },
    ],
    instructions: ['Marinate chicken', 'Cook onions and paste', 'Add chicken', 'Stir in cream and simmer'],
  },
  {
    _id: 'r2',
    title: 'Avocado Toast & Egg',
    description: 'Quick and nutritious breakfast or brunch.',
    prepTimeMinutes: 10,
    ingredients: [
      { name: 'Avocado', quantity: 1, unit: 'each' },
      { name: 'Sourdough Bread', quantity: 2, unit: 'slices' },
      { name: 'Eggs', quantity: 2, unit: 'each' },
    ],
    instructions: ['Toast bread', 'Mash avocado', 'Fry eggs', 'Assemble'],
  },
  {
    _id: 'r3',
    title: 'Spicy Beef Stir Fry',
    description: 'Fast weeknight stir fry with bold flavors.',
    prepTimeMinutes: 25,
    ingredients: [
      { name: 'Flank Steak', quantity: 1, unit: 'lb' },
      { name: 'Soy Sauce', quantity: 3, unit: 'tbsp' },
      { name: 'Bell Peppers', quantity: 2, unit: 'each' },
      { name: 'Yellow Onion', quantity: 1, unit: 'each' },
      { name: 'Olive Oil', quantity: 1, unit: 'tbsp' },
    ],
    instructions: ['Slice beef thin', 'Stir fry vegetables', 'Add beef and sauce', 'Serve over rice'],
  },
  {
    _id: 'r4',
    title: 'Pasta Primavera',
    description: 'Light pasta loaded with fresh vegetables.',
    prepTimeMinutes: 20,
    ingredients: [
      { name: 'Penne Pasta', quantity: 8, unit: 'oz' },
      { name: 'Baby Spinach', quantity: 2, unit: 'cups' },
      { name: 'Roma Tomatoes', quantity: 2, unit: 'each' },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp' },
      { name: 'Cheddar Cheese', quantity: 0.5, unit: 'cup' },
    ],
    instructions: ['Boil pasta', 'Sauté vegetables in olive oil', 'Toss together', 'Top with cheese'],
  },
];

// GET /api/recipes
const getRecipes = (req, res) => {
  const { search } = req.query;
  let result = recipes;
  if (search) {
    const re = new RegExp(search, 'i');
    result = recipes.filter(r => re.test(r.title) || re.test(r.description));
  }
  res.status(200).json(result);
};

// GET /api/recipes/:id
const getRecipeById = (req, res) => {
  const recipe = recipes.find(r => r._id === req.params.id);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  res.status(200).json(recipe);
};

// POST /api/recipes
const createRecipe = (req, res) => {
  const { title, description, ingredients, instructions, prepTimeMinutes } = req.body;
  if (!title || !ingredients?.length) {
    return res.status(400).json({ message: 'title and ingredients are required' });
  }
  const recipe = {
    _id: `r${Date.now()}`,
    title,
    description: description || '',
    ingredients,
    instructions: instructions || [],
    prepTimeMinutes: prepTimeMinutes || null,
  };
  recipes.push(recipe);
  res.status(201).json(recipe);
};

// PUT /api/recipes/:id
const updateRecipe = (req, res) => {
  const idx = recipes.findIndex(r => r._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Recipe not found' });
  recipes[idx] = { ...recipes[idx], ...req.body, _id: recipes[idx]._id };
  res.status(200).json(recipes[idx]);
};

// DELETE /api/recipes/:id
const deleteRecipe = (req, res) => {
  const idx = recipes.findIndex(r => r._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Recipe not found' });
  recipes.splice(idx, 1);
  res.status(200).json({ message: 'Recipe deleted' });
};

// Internal helper used by shoppingListController
const getRecipesData = () => recipes;

module.exports = { getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe, getRecipesData };
