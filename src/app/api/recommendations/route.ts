import { NextRequest, NextResponse } from 'next/server'
import { dbConnect, Recipe, Rating, Favorite } from '@/lib/db'
import { Recipe as RecipeType, RatingDocument, FavoriteDocument, PreferenceProfile } from '@/app/types'

function getUserId(req: NextRequest): string {
  return req.headers.get('x-user-id') || 'demo-user'
}

// Enhanced recommendation algorithm
async function getRecommendations(userId: string, limit: number = 12) {
  try {
    // Get user's preferences from ratings and favorites
    const [userRatings, userFavorites] = await Promise.all([
      Rating.find({ userId }).exec() as Promise<RatingDocument[]>,
      Favorite.find({ userId }).exec() as Promise<FavoriteDocument[]>
    ])

    // Extract recipe IDs that user has interacted with
    const ratedRecipeIds = userRatings.map(r => String(r.recipeId))
    const favoritedRecipeIds = userFavorites.map(f => String(f.recipeId))
    const interactedRecipeIds = new Set([...ratedRecipeIds, ...favoritedRecipeIds])

    if (interactedRecipeIds.size === 0) {
      // Cold start: return trending recipes
      const trendingRecipes = await Recipe.find({})
        .sort({ avgRating: -1, ratingsCount: -1 })
        .limit(limit)
        .exec()
      return trendingRecipes as RecipeType[]
    }

    // Get user's preferred recipes
    const preferredRecipes = await Recipe.find({
      _id: { $in: Array.from(interactedRecipeIds) }
    }).exec() as RecipeType[]

    // Build preference profile
    const preferenceProfile = buildPreferenceProfile(preferredRecipes, userRatings)

    // Get candidate recipes (exclude already interacted ones)
    const candidateRecipes = await Recipe.find({
      _id: { $nin: Array.from(interactedRecipeIds) }
    }).exec() as RecipeType[]

    // Score and rank candidates
    const scoredRecipes = candidateRecipes.map(recipe => ({
      recipe,
      score: calculateRecipeScore(recipe, preferenceProfile)
    }))

    // Sort by score and return top results
    return scoredRecipes
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.recipe)

  } catch (error) {
    console.error('Error in getRecommendations:', error)
    throw error
  }
}

function buildPreferenceProfile(preferredRecipes: RecipeType[], userRatings: RatingDocument[]): PreferenceProfile {
  const profile: PreferenceProfile = {
    ingredients: new Map<string, number>(),
    cuisines: new Map<string, number>(),
    difficulties: new Map<string, number>(),
    tags: new Map<string, number>(),
    nutritionRanges: {
      calories: { min: Infinity, max: -Infinity, avg: 0 },
      protein: { min: Infinity, max: -Infinity, avg: 0 },
      carbs: { min: Infinity, max: -Infinity, avg: 0 },
      fat: { min: Infinity, max: -Infinity, avg: 0 }
    }
  }

  let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0
  let recipeCount = 0

  preferredRecipes.forEach((recipe:any) => {
    const rating = userRatings.find(r => String(r.recipeId) === String(recipe?._id))
    const weight = rating ? rating.rating : 3

    recipe.ingredients?.forEach((ingredient:any) => {
      const current = profile.ingredients.get(ingredient) || 0
      profile.ingredients.set(ingredient, current + weight)
    })

    if (recipe.cuisine) {
      const current = profile.cuisines.get(recipe.cuisine) || 0
      profile.cuisines.set(recipe.cuisine, current + weight)
    }

    if (recipe.difficulty) {
      const current = profile.difficulties.get(recipe.difficulty) || 0
      profile.difficulties.set(recipe.difficulty, current + weight)
    }

    recipe.tags?.forEach((tag:any) => {
      const current = profile.tags.get(tag) || 0
      profile.tags.set(tag, current + weight)
    })

    if (recipe.nutrition) {
      const { calories, protein, carbs, fat } = recipe.nutrition

      if (calories !== undefined) {
        profile.nutritionRanges.calories.min = Math.min(profile.nutritionRanges.calories.min, Number(calories))
        profile.nutritionRanges.calories.max = Math.max(profile.nutritionRanges.calories.max, Number(calories))
        totalCalories += Number(calories)
      }

      if (protein !== undefined) {
        profile.nutritionRanges.protein.min = Math.min(profile.nutritionRanges.protein.min, Number(protein))
        profile.nutritionRanges.protein.max = Math.max(profile.nutritionRanges.protein.max, Number(protein))
        totalProtein += Number(protein)
      }

      if (carbs !== undefined) {
        profile.nutritionRanges.carbs.min = Math.min(profile.nutritionRanges.carbs.min, Number(carbs))
        profile.nutritionRanges.carbs.max = Math.max(profile.nutritionRanges.carbs.max, Number(carbs))
        totalCarbs += Number(carbs)
      }

      if (fat !== undefined) {
        profile.nutritionRanges.fat.min = Math.min(profile.nutritionRanges.fat.min, Number(fat))
        profile.nutritionRanges.fat.max = Math.max(profile.nutritionRanges.fat.max, Number(fat))
        totalFat += Number(fat)
      }

      recipeCount++
    }
  })

  if (recipeCount > 0) {
    profile.nutritionRanges.calories.avg = totalCalories / recipeCount
    profile.nutritionRanges.protein.avg = totalProtein / recipeCount
    profile.nutritionRanges.carbs.avg = totalCarbs / recipeCount
    profile.nutritionRanges.fat.avg = totalFat / recipeCount
  }

  return profile
}

function calculateRecipeScore(recipe: RecipeType, profile: PreferenceProfile): number {
  let score = 0

  recipe.ingredients?.forEach((ingredient:any) => {
    const preference = profile.ingredients.get(ingredient) || 0
    score += preference * 2
  })

  if (recipe.cuisine && profile.cuisines.has(recipe.cuisine)) {
    score += (profile.cuisines.get(recipe.cuisine) || 0) * 1.5
  }

  if (recipe.difficulty && profile.difficulties.has(recipe.difficulty)) {
    score += (profile.difficulties.get(recipe.difficulty) || 0) * 1.2
  }

  recipe.tags?.forEach(tag => {
    const preference = profile.tags.get(tag) || 0
    score += preference * 1.3
  })

  if (recipe.nutrition) {
    const { calories, protein, carbs, fat } = recipe.nutrition

    if (calories !== undefined && profile.nutritionRanges.calories.avg > 0) {
      const calDiff = Math.abs(Number(calories) - profile.nutritionRanges.calories.avg)
      const calRange = profile.nutritionRanges.calories.max - profile.nutritionRanges.calories.min
      if (calRange > 0) {
        score += (1 - (calDiff / calRange)) * 0.5
      }
    }

    if (protein !== undefined && profile.nutritionRanges.protein.avg > 0) {
      const proteinDiff = Math.abs(Number(protein) - profile.nutritionRanges.protein.avg)
      const proteinRange = profile.nutritionRanges.protein.max - profile.nutritionRanges.protein.min
      score += (1 - (proteinDiff / (proteinRange || 1))) * 0.5
    }

    if (carbs !== undefined && profile.nutritionRanges.carbs.avg > 0) {
      const carbsDiff = Math.abs(Number(carbs) - profile.nutritionRanges.carbs.avg)
      const carbsRange = profile.nutritionRanges.carbs.max - profile.nutritionRanges.carbs.min
      score += (1 - (carbsDiff / (carbsRange || 1))) * 0.5
    }

    if (fat !== undefined && profile.nutritionRanges.fat.avg > 0) {
      const fatDiff = Math.abs(Number(fat) - profile.nutritionRanges.fat.avg)
      const fatRange = profile.nutritionRanges.fat.max - profile.nutritionRanges.fat.min
      score += (1 - (fatDiff / (fatRange || 1))) * 0.5
    }
  }

  let {avgRating, ratingsCount } = recipe as any;
  
  if (avgRating && ratingsCount) {
    score += (Number(avgRating) / 5) * Math.log(Number(ratingsCount) + 1) * 0.5
  }

  return score
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
  } catch {
    return NextResponse.json({ ok: false, error: 'DB_CONNECTION_FAILED' }, { status: 500 })
  }

  const userId = getUserId(req)
  const limit = Number(req.nextUrl.searchParams.get('limit') || 12)

  try {
    const recipes = await getRecommendations(userId, limit)
    return NextResponse.json({ ok: true, recipes })
  } catch (e) {
    console.error('Recommendation error:', e)
    return NextResponse.json({ ok: false, error: 'RECOMMENDATION_FAILED' }, { status: 500 })
  }
}
