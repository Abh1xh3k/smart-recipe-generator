export interface Ingredient {
  id: string;
  name: string;
  category: string;
  quantity?: string;
  unit?: string;
}

export interface DietaryPreference {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Nutrition {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  sugar?: string;
  sodium?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time: string;
  servings: number;
  tags: string[];
  imageUrl?: string;
  cuisine?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
}

export interface RecipeGenerationRequest {
  ingredients: Ingredient[];
  dietaryPreferences: DietaryPreference[];
  servings: number;
  cuisine?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  maxTime?: string;
  numRecipes?: number;
  seed?: string | number;
  creativity?: 'low' | 'medium' | 'high';
}

export interface RecipeGenerationResponse {
  recipes: Recipe[];
  totalGenerated: number;
  generationTime: number;
}

export interface FavoriteDocument {
  userId: string;
  recipeId: string;
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RatingDocument {
  userId: string;
  recipeId: string;
  rating: number;
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PreferenceProfile {
  ingredients: Map<string, number>;
  cuisines: Map<string, number>;
  difficulties: Map<string, number>;
  tags: Map<string, number>;
  nutritionRanges: {
    calories: { min: number; max: number; avg: number };
    protein: { min: number; max: number; avg: number };
    carbs: { min: number; max: number; avg: number };
    fat: { min: number; max: number; avg: number };
  };
}

export interface ScoredRecipe {
  recipe: Recipe;
  score: number;
}
