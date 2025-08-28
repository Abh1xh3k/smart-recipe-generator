import { RecipeGenerationRequest, Recipe, RecipeGenerationResponse } from '../types';
import { callGeminiAPI } from './geminiIntegration';

export class RecipeGenerationService {
  private static instance: RecipeGenerationService;

  private constructor() {}

  public static getInstance(): RecipeGenerationService {
    if (!RecipeGenerationService.instance) {
      RecipeGenerationService.instance = new RecipeGenerationService();
    }
    return RecipeGenerationService.instance;
  }

  public async generateRecipes(request: RecipeGenerationRequest): Promise<RecipeGenerationResponse> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildPrompt(request);

      // Try Gemini first
      const rawResponse = await callGeminiAPI(prompt, {
        seed: request.seed ?? Date.now(),
        numRecipes: request.numRecipes ?? 4,
        creativity: request.creativity ?? 'medium',
      } as any, {
        ingredients: request.ingredients,
        dietary: request.dietaryPreferences.map(d => d.name),
        servings: request.servings,
      } as any);

      // Some providers return a JSON string; normalize
      const response = typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;

      const recipes = this.processGeminiResponse(response, request);

      const generationTime = Date.now() - startTime;
      return {
        recipes,
        totalGenerated: recipes.length,
        generationTime,
      };
    } catch (error) {
      console.error('Error generating recipes via Gemini. Falling back to local suggestions.', error);
      // Fallback to randomized local suggestions
      const recipes = this.generateFallbackRecipes(request);
      return {
        recipes,
        totalGenerated: recipes.length,
        generationTime: Date.now() - startTime,
      };
    }
  }

  private buildPrompt(request: RecipeGenerationRequest): string {
    const ingredientsList = request.ingredients.map(ing => 
      `${ing.name}${ing.quantity ? ` (${ing.quantity} ${ing.unit || 'units'})` : ''}`
    ).join(', ');

    const dietaryPrefs = request.dietaryPreferences.length > 0 
      ? request.dietaryPreferences.map(pref => pref.name).join(', ')
      : 'No specific dietary restrictions';

    const cuisineFilter = request.cuisine ? `\nCuisine preference: ${request.cuisine}` : '';
    const difficultyFilter = request.difficulty ? `\nDifficulty level: ${request.difficulty}` : '';
    const timeFilter = request.maxTime ? `\nMaximum cooking time: ${request.maxTime}` : '';
    const count = request.numRecipes ?? 4;

    return `You are a professional chef and nutritionist. Generate ${count} diverse and unique recipes using ONLY the provided ingredients as primaries. You may add 1-3 pantry staples (oil, salt, pepper, water, basic spices) if absolutely needed.

Available Ingredients (must be used prominently): ${ingredientsList}
Dietary Preferences: ${dietaryPrefs}
Servings: ${request.servings}${cuisineFilter}${difficultyFilter}${timeFilter}

Strict Rules:
- Each recipe must include at least 70% of ingredients from the provided list (or clearly derived variants)
- If an ingredient is missing, propose a close substitution and list it
- Ensure compliance with dietary preferences
- Recipes must be distinct (technique, flavor, or cuisine)
- INSTRUCTIONS MUST BE THOROUGH: provide 6-12 numbered steps including temperatures, pan/pot sizes, timings, cues (e.g., "until translucent"), and tips
- Include preheat/prep steps, cooking sequence, finishing/garnish, and storage/reheat tips
- Provide nutritional info per serving (calories, protein, carbs, fat)
- Include total time and difficulty

Return ONLY valid JSON (no extra text, no markdown) in this exact structure:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Short description",
      "ingredients": [{"name":"string","quantity":"string","unit":"string"}],
      "instructions": ["1) Prep ...", "2) Preheat oven to 200°C/400°F ...", "3) Sauté for 4-5 min ...", "..."],
      "nutrition": {"calories":"XXX","protein":"XXg","carbs":"XXg","fat":"XXg"},
      "difficulty": "Easy|Medium|Hard",
      "time": "e.g., 35 minutes",
      "servings": ${request.servings},
      "tags": ["Vegetarian", "Gluten-Free"],
      "cuisine": "Cuisine"
    }
  ]
}`;
  }

  private processGeminiResponse(response: any, request: RecipeGenerationRequest): Recipe[] {
    if (!response) throw new Error('Empty response');
    const list = Array.isArray(response.recipes) ? response.recipes : [];
    if (list.length === 0) throw new Error('Invalid response format from Gemini');

    return list.map((recipeData: any, index: number) => ({
      id: `recipe-${Date.now()}-${index}`,
      name: recipeData.name || `Recipe ${index + 1}`,
      description: recipeData.description || '',
      ingredients: (recipeData.ingredients || []).map((i: any) => ({
        id: `${index}-${i.name || 'item'}-${Math.random().toString(36).slice(2, 7)}`,
        name: i.name || 'Ingredient',
        category: 'Other',
        quantity: i.quantity,
        unit: i.unit,
      })),
      instructions: recipeData.instructions || [],
      nutrition: {
        calories: recipeData.nutrition?.calories || '0',
        protein: recipeData.nutrition?.protein || '0g',
        carbs: recipeData.nutrition?.carbs || '0g',
        fat: recipeData.nutrition?.fat || '0g',
        fiber: recipeData.nutrition?.fiber || '0g',
        sugar: recipeData.nutrition?.sugar || '0g',
        sodium: recipeData.nutrition?.sodium || '0mg'
      },
      difficulty: recipeData.difficulty || 'Medium',
      time: recipeData.time || '30 minutes',
      servings: recipeData.servings || request.servings,
      tags: recipeData.tags || request.dietaryPreferences.map(d => d.name),
      cuisine: recipeData.cuisine || request.cuisine || 'International',
      imageUrl: recipeData.imageUrl || undefined
    }));
  }

  // Randomized fallback recipe generation
  public generateFallbackRecipes(request: RecipeGenerationRequest): Recipe[] {
    const bases = ['Stir-Fry', 'Pasta', 'Soup', 'Salad', 'Skillet', 'Bake'];
    const difficulties: Array<'Easy'|'Medium'|'Hard'> = ['Easy','Medium','Hard'];
    const times = ["15 minutes","25 minutes","35 minutes","45 minutes","1 h"];
    const num = request.numRecipes ?? 3;

    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    const recipes: Recipe[] = Array.from({ length: num }).map((_, idx) => {
      const ingredientNames = request.ingredients.map(i => i.name);
      const main = ingredientNames[idx % Math.max(1, ingredientNames.length)] || 'Mixed Veggies';
      const used = request.ingredients.slice(0, Math.max(2, Math.min(6, request.ingredients.length)));
      return {
        id: `fallback-${Date.now()}-${idx}`,
        name: `${main} ${pick(bases)}`,
        description: `A quick ${main.toLowerCase()} ${pick(['meal','dish','recipe'])} using your ingredients.`,
        ingredients: used,
        instructions: [
          'Prep all ingredients and heat pan/pot.',
          'Sauté aromatics, then add main ingredients.',
          'Season to taste and finish with garnish.',
        ],
        nutrition: {
          calories: `${300 + Math.floor(Math.random()*150)}`,
          protein: `${8 + Math.floor(Math.random()*15)}g`,
          carbs: `${20 + Math.floor(Math.random()*40)}g`,
          fat: `${5 + Math.floor(Math.random()*15)}g`,
          fiber: `${3 + Math.floor(Math.random()*6)}g`,
          sugar: `${2 + Math.floor(Math.random()*6)}g`,
          sodium: `${300 + Math.floor(Math.random()*400)}mg`
        },
        difficulty: pick(difficulties),
        time: pick(times),
        servings: request.servings,
        tags: request.dietaryPreferences.map(d => d.name),
        cuisine: request.cuisine || 'International',
      };
    });

    return recipes;
  }
}

export default RecipeGenerationService.getInstance();
