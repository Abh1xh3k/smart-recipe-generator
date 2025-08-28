const mongoose = require('mongoose')

const NutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
  },
  { _id: false }
)

const RecipeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    ingredients: { type: [String], default: [] },
    instructions: { type: [String], default: [] },
    nutrition: { type: NutritionSchema, default: {} },
    cuisine: { type: String, index: true },
    tags: { type: [String], index: true, default: [] },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
    time: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema)


