const mongoose = require('mongoose')

const FavoriteSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true, index: true },
  },
  { timestamps: true }
)

FavoriteSchema.index({ userId: 1, recipeId: 1 }, { unique: true })

module.exports = mongoose.models.Favorite || mongoose.model('Favorite', FavoriteSchema)


