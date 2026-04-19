// In-memory shopping list store — keyed by userId
const lists = {};

function getList(userId) {
  if (!lists[userId]) lists[userId] = { items: [], totalCost: 0, status: 'active' };
  return lists[userId];
}

function recalcTotal(list) {
  list.totalCost = parseFloat(
    list.items.reduce((sum, i) => sum + i.estimatedCost, 0).toFixed(2)
  );
}

function findCheapest(ingredientName, dealItems) {
  const regex = new RegExp(ingredientName, 'i');
  const matches = dealItems.filter(i => regex.test(i.name));
  if (!matches.length) return null;
  return matches.reduce((a, b) => a.price < b.price ? a : b);
}

// GET /api/shopping-list
const getActiveList = (req, res) => {
  const userId = req.user?._id || 'demo';
  res.status(200).json(getList(userId));
};

// POST /api/shopping-list/add
const addItemToList = (req, res) => {
  const { ingredientName, quantityNeeded } = req.body;
  if (!ingredientName || !quantityNeeded) {
    return res.status(400).json({ message: 'ingredientName and quantityNeeded are required' });
  }

  const userId = req.user?._id || 'demo';
  const list = getList(userId);
  const dealItems = require('./dealsController').getCacheItems();
  const cheapest = findCheapest(ingredientName, dealItems);
  const unitPrice = cheapest?.price ?? 1.99;
  const itemCost = parseFloat((unitPrice * quantityNeeded).toFixed(2));

  const item = {
    _id: `item-${Date.now()}`,
    ingredientName,
    quantityNeeded,
    estimatedCost: itemCost,
    unitPrice,
    store: cheapest?.store || 'Best Price',
  };

  list.items.push(item);
  recalcTotal(list);

  if (req.io) {
    req.io.to(`user_${userId}`).emit('list_updated', {
      message: `Added ${ingredientName} from ${item.store} @ $${unitPrice.toFixed(2)}`,
      addedItem: ingredientName,
      totalCost: list.totalCost,
    });
  }

  res.status(200).json(list);
};

// POST /api/shopping-list/add-recipe
const addRecipeToList = (req, res) => {
  const { recipeId } = req.body;
  if (!recipeId) return res.status(400).json({ message: 'recipeId is required' });

  const recipes = require('./recipeController').getRecipesData();
  const recipe = recipes.find(r => r._id === recipeId);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

  const userId = req.user?._id || 'demo';
  const list = getList(userId);
  const dealItems = require('./dealsController').getCacheItems();

  let addedCount = 0;
  for (const ingredient of recipe.ingredients) {
    const cheapest = findCheapest(ingredient.name, dealItems);
    const unitPrice = cheapest?.price ?? 1.99;
    const itemCost = parseFloat((unitPrice * ingredient.quantity).toFixed(2));

    list.items.push({
      _id: `item-${Date.now()}-${addedCount}`,
      ingredientName: ingredient.name,
      quantityNeeded: ingredient.quantity,
      estimatedCost: itemCost,
      unitPrice,
      store: cheapest?.store || 'Best Price',
    });
    addedCount++;
  }

  recalcTotal(list);

  if (req.io) {
    req.io.to(`user_${userId}`).emit('list_updated', {
      message: `Added ${addedCount} ingredients from "${recipe.title}"`,
      totalCost: list.totalCost,
    });
  }

  res.status(200).json(list);
};

// PUT /api/shopping-list/item/:itemId
const updateItem = (req, res) => {
  const { quantityNeeded } = req.body;
  if (!quantityNeeded || quantityNeeded <= 0) {
    return res.status(400).json({ message: 'quantityNeeded must be a positive number' });
  }

  const userId = req.user?._id || 'demo';
  const list = getList(userId);
  const item = list.items.find(i => i._id === req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });

  item.quantityNeeded = quantityNeeded;
  item.estimatedCost = parseFloat((item.unitPrice * quantityNeeded).toFixed(2));
  recalcTotal(list);

  res.status(200).json(list);
};

// DELETE /api/shopping-list/item/:itemId
const removeItem = (req, res) => {
  const userId = req.user?._id || 'demo';
  const list = getList(userId);
  const idx = list.items.findIndex(i => i._id === req.params.itemId);
  if (idx === -1) return res.status(404).json({ message: 'Item not found' });

  list.items.splice(idx, 1);
  recalcTotal(list);

  res.status(200).json(list);
};

// DELETE /api/shopping-list/clear
const clearList = (req, res) => {
  const userId = req.user?._id || 'demo';
  lists[userId] = { items: [], totalCost: 0, status: 'active' };
  res.status(200).json(lists[userId]);
};

module.exports = { getActiveList, addItemToList, addRecipeToList, updateItem, removeItem, clearList };
