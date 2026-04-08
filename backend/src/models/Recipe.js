const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  ingredients: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true }
  }],
  instructions: [String],
  prepTimeMinutes: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('Recipe', recipeSchema);
