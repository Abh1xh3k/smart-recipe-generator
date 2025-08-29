const mongoose = require('mongoose')

const RatingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
)

RatingSchema.index({ userId: 1, recipeId: 1 }, { unique: true })

module.exports = mongoose.models.Rating || mongoose.model('Rating', RatingSchema)


