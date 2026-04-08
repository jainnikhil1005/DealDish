const mongoose = require('mongoose');

const groceryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true // index for faster searches when cross-referencing
  },
  store: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GroceryItem', groceryItemSchema);
