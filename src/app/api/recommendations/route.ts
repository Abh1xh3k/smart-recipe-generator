import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '../../../../lib/mongodb'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Recipe = require('../../../../models/Recipe')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Rating = require('../../../../models/Rating')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Favorite = require('../../../../models/Favorite')

function getUserId(req: NextRequest): string { return req.headers.get('x-user-id') || 'demo-user' }

// Enhanced recommendation algorithm
async function getRecommendations(userId: string, limit: number = 12) {
  try {
    // Get user's preferences from ratings and favorites
    const [userRatings, userFavorites] = await Promise.all([
      Rating.find({ userId }).lean(),
      Favorite.find({ userId }).lean()
    ]);

    // Extract recipe IDs that user has interacted with
    const ratedRecipeIds = userRatings.map((r: any) => String(r.recipeId));
    const favoritedRecipeIds = userFavorites.map((f: any) => String(f.recipeId));
    const interactedRecipeIds = new Set([...ratedRecipeIds, ...favoritedRecipeIds]);

    if (interactedRecipeIds.size === 0) {
      // Cold start: return trending recipes
      return await Recipe.find({})
        .sort({ avgRating: -1, ratingsCount: -1 })
        .limit(limit)
        .lean();
    }

    // Get user's preferred recipes
    const preferredRecipes = await Recipe.find({
      _id: { $in: Array.from(interactedRecipeIds) }
    }).lean();

    // Build preference profile
    const preferenceProfile = buildPreferenceProfile(preferredRecipes, userRatings);

    // Get candidate recipes (exclude already interacted ones)
    const candidateRecipes = await Recipe.find({
      _id: { $nin: Array.from(interactedRecipeIds) }
    }).lean();

    // Score and rank candidates
    const scoredRecipes = candidateRecipes.map((recipe: any) => ({
      recipe,
      score: calculateRecipeScore(recipe, preferenceProfile)
    }));

    // Sort by score and return top results
    return scoredRecipes
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.recipe);

  } catch (error) {
    console.error('Error in getRecommendations:', error);
    throw error;
  }
}

function buildPreferenceProfile(preferredRecipes: any[], userRatings: any[]) {
  const profile = {
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
  };

  let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
  let recipeCount = 0;

  preferredRecipes.forEach((recipe: any) => {
    // Find user's rating for this recipe
    const rating = userRatings.find((r: any) => String(r.recipeId) === String(recipe._id));
    const weight = rating ? rating.rating : 3; // Default weight for favorites

    // Weight ingredients
    (recipe.ingredients || []).forEach((ingredient: string) => {
      const current = profile.ingredients.get(ingredient) || 0;
      profile.ingredients.set(ingredient, current + weight);
    });

    // Weight cuisines
    if (recipe.cuisine) {
      const current = profile.cuisines.get(recipe.cuisine) || 0;
      profile.cuisines.set(recipe.cuisine, current + weight);
    }

    // Weight difficulties
    if (recipe.difficulty) {
      const current = profile.difficulties.get(recipe.difficulty) || 0;
      profile.difficulties.set(recipe.difficulty, current + weight);
    }

    // Weight tags
    (recipe.tags || []).forEach((tag: string) => {
      const current = profile.tags.get(tag) || 0;
      profile.tags.set(tag, current + weight);
    });

    // Track nutrition ranges
    if (recipe.nutrition) {
      const { calories, protein, carbs, fat } = recipe.nutrition;
      
      if (calories) {
        profile.nutritionRanges.calories.min = Math.min(profile.nutritionRanges.calories.min, calories);
        profile.nutritionRanges.calories.max = Math.max(profile.nutritionRanges.calories.max, calories);
        totalCalories += calories;
      }
      
      if (protein) {
        profile.nutritionRanges.protein.min = Math.min(profile.nutritionRanges.protein.min, protein);
        profile.nutritionRanges.protein.max = Math.max(profile.nutritionRanges.protein.max, protein);
        totalProtein += protein;
      }
      
      if (carbs) {
        profile.nutritionRanges.carbs.min = Math.min(profile.nutritionRanges.carbs.min, carbs);
        profile.nutritionRanges.carbs.max = Math.max(profile.nutritionRanges.carbs.max, carbs);
        totalCarbs += carbs;
      }
      
      if (fat) {
        profile.nutritionRanges.fat.min = Math.min(profile.nutritionRanges.fat.min, fat);
        profile.nutritionRanges.fat.max = Math.max(profile.nutritionRanges.fat.max, fat);
        totalFat += fat;
      }
      
      recipeCount++;
    }
  });

  // Calculate averages
  if (recipeCount > 0) {
    profile.nutritionRanges.calories.avg = totalCalories / recipeCount;
    profile.nutritionRanges.protein.avg = totalProtein / recipeCount;
    profile.nutritionRanges.carbs.avg = totalCarbs / recipeCount;
    profile.nutritionRanges.fat.avg = totalFat / recipeCount;
  }

  return profile;
}

function calculateRecipeScore(recipe: any, profile: any): number {
  let score = 0;

  // Ingredient similarity (highest weight)
  (recipe.ingredients || []).forEach((ingredient: string) => {
    const preference = profile.ingredients.get(ingredient) || 0;
    score += preference * 2; // Double weight for ingredients
  });

  // Cuisine preference
  if (recipe.cuisine && profile.cuisines.has(recipe.cuisine)) {
    score += profile.cuisines.get(recipe.cuisine) * 1.5;
  }

  // Difficulty preference
  if (recipe.difficulty && profile.difficulties.has(recipe.difficulty)) {
    score += profile.difficulties.get(recipe.difficulty) * 1.2;
  }

  // Tag similarity
  (recipe.tags || []).forEach((tag: string) => {
    const preference = profile.tags.get(tag) || 0;
    score += preference * 1.3;
  });

  // Nutrition similarity
  if (recipe.nutrition) {
    const { calories, protein, carbs, fat } = recipe.nutrition;
    
    if (calories && profile.nutritionRanges.calories.avg > 0) {
      const calDiff = Math.abs(calories - profile.nutritionRanges.calories.avg);
      const calRange = profile.nutritionRanges.calories.max - profile.nutritionRanges.calories.min;
      if (calRange > 0) {
        score += Math.max(0, 5 - (calDiff / calRange) * 5);
      }
    }
    
    if (protein && profile.nutritionRanges.protein.avg > 0) {
      const proDiff = Math.abs(protein - profile.nutritionRanges.protein.avg);
      const proRange = profile.nutritionRanges.protein.max - profile.nutritionRanges.protein.min;
      if (proRange > 0) {
        score += Math.max(0, 3 - (proDiff / proRange) * 3);
      }
    }
  }

  // Popularity boost (existing ratings)
  if (recipe.avgRating && recipe.ratingsCount) {
    score += (recipe.avgRating / 5) * Math.log(recipe.ratingsCount + 1) * 0.5;
  }

  return score;
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


