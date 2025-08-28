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
