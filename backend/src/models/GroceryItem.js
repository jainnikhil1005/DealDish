const mongoose = require('mongoose');

const groceryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  store: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    default: null
  },
  unit: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'General'
  },
  imageUrl: {
    type: String,
    default: null
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GroceryItem', groceryItemSchema);
