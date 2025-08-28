import { Recipe } from '../types'

function normalizeFromApi(doc: any): Recipe {
  return {
    id: doc._id || doc.id || `db-${Math.random().toString(36).slice(2, 8)}`,
    name: doc.name,
    description: doc.description || '',
    ingredients: Array.isArray(doc.ingredients)
      ? doc.ingredients.map((name: string, index: number) => ({
          id: `${doc._id || 'db'}-ing-${index}`,
          name,
          category: 'Other',
        }))
      : [],
    instructions: Array.isArray(doc.instructions) ? doc.instructions : [],
    nutrition: {
      calories: String(doc.nutrition?.calories ?? '0'),
      protein: String(doc.nutrition?.protein ?? '0g'),
      carbs: String(doc.nutrition?.carbs ?? '0g'),
      fat: String(doc.nutrition?.fat ?? '0g'),
      fiber: String(doc.nutrition?.fiber ?? '0g'),
      sugar: String(doc.nutrition?.sugar ?? '0g'),
      sodium: String(doc.nutrition?.sodium ?? '0mg'),
    },
    difficulty: (doc.difficulty as Recipe['difficulty']) || 'Medium',
    time: doc.time || '30 minutes',
    servings: doc.servings || 2,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    imageUrl: doc.imageUrl || undefined,
    cuisine: doc.cuisine || 'International',
  }
}

function denormalizeForApi(recipe: Recipe) {
  return {
    name: recipe.name,
    ingredients: recipe.ingredients.map((i) => i.name),
    instructions: recipe.instructions,
    nutrition: {
      calories: Number(String(recipe.nutrition.calories).replace(/[^\d.]/g, '')) || 0,
      protein: Number(String(recipe.nutrition.protein).replace(/[^\d.]/g, '')) || 0,
      carbs: Number(String(recipe.nutrition.carbs).replace(/[^\d.]/g, '')) || 0,
      fat: Number(String(recipe.nutrition.fat).replace(/[^\d.]/g, '')) || 0,
    },
    cuisine: recipe.cuisine,
    tags: recipe.tags,
    difficulty: recipe.difficulty,
    time: recipe.time,
  }
}

export async function fetchSavedRecipes(): Promise<Recipe[]> {
  const res = await fetch('/api/recipes', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch recipes')
  const data = await res.json()
  const list = Array.isArray(data.recipes) ? data.recipes : []
  return list.map(normalizeFromApi)
}

export async function saveRecipe(recipe: Recipe): Promise<Recipe> {
  const payload = denormalizeForApi(recipe)
  const res = await fetch('/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to save recipe')
  const data = await res.json()
  return normalizeFromApi(data.recipe)
}

export async function deleteRecipe(id: string): Promise<void> {
  const res = await fetch(`/api/recipes?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete recipe')
}

export async function deleteAllRecipes(): Promise<void> {
  const res = await fetch('/api/recipes?all=true', { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete all recipes')
}


