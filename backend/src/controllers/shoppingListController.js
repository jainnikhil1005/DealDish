const ShoppingList = require('../models/ShoppingList');
const GroceryItem = require('../models/GroceryItem');

// @desc    Add item to shopping list (finding cheapest option)
// @route   POST /api/shopping-list/add
// @access  Private
const addItemToList = async (req, res) => {
  const { ingredientName, quantityNeeded } = req.body;

  if (!ingredientName || !quantityNeeded) {
    return res.status(400).json({ message: 'Please provide ingredientName and quantityNeeded' });
  }

  try {
    // 1. Find the cheapest matching grocery item on the market
    const cheapestItem = await GroceryItem.findOne({ 
      name: { $regex: ingredientName, $options: 'i' } 
    }).sort({ price: 1 });

    if (!cheapestItem) {
      return res.status(404).json({ message: `No grocery item found for ${ingredientName}` });
    }

    // 2. Find or create an active shopping list for the user
    let list = await ShoppingList.findOne({ user: req.user._id, status: 'active' });
    if (!list) {
      list = await ShoppingList.create({ user: req.user._id, items: [], totalCost: 0 });
    }

    // 3. Add to list and calculate contribution to total cost
    const itemCost = cheapestItem.price * quantityNeeded;
    list.items.push({
      groceryItem: cheapestItem._id,
      ingredientName,
      quantityNeeded,
      estimatedCost: itemCost
    });

    list.totalCost += itemCost;
    await list.save();

    // 4. Emit WebSocket notification for real-time list updates
    if (req.io) {
      req.io.to(`user_${req.user._id}`).emit('list_updated', {
        message: `Optimization complete: ${ingredientName} added from ${cheapestItem.store}`,
        addedItem: ingredientName,
        totalCost: list.totalCost
      });
    }

    res.status(200).json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = { addItemToList };
