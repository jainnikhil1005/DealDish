const mongoose = require('mongoose');

const shoppingListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    groceryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroceryItem'
    },
    ingredientName: String, // as originally queried (e.g., from the recipe)
    quantityNeeded: Number,
    estimatedCost: Number
  }],
  totalCost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
