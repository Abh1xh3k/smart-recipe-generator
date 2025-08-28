'use client';

import { Recipe } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, ChefHat, Utensils, Heart, Star, Share2, Bookmark, Printer, Filter, Plus, Minus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { saveRecipe, deleteRecipe, deleteAllRecipes } from '../services/recipeApi';

interface RecipeDisplayProps {
  recipes: Recipe[];
  onBack: () => void;
}

// Utilities for filtering and quantity scaling
const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return Number.MAX_SAFE_INTEGER;
  const lower = timeStr.toLowerCase();
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*h/);
  const minMatch = lower.match(/(\d+(?:\.\d+)?)\s*m/);
  let total = 0;
  if (hourMatch) total += parseFloat(hourMatch[1]) * 60;
  if (minMatch) total += parseFloat(minMatch[1]);
  if (!hourMatch && !minMatch) {
    const onlyNum = lower.match(/\d+(?:\.\d+)?/);
    if (onlyNum) total += parseFloat(onlyNum[0]);
  }
  return total || Number.MAX_SAFE_INTEGER;
};

const safeEvalFraction = (token: string): number | null => {
  // Converts common fraction formats like 1/2, 3/4 to decimals
  const frac = token.trim();
  if (/^\d+\/\d+$/.test(frac)) {
    const [a, b] = frac.split('/').map(Number);
    return b ? a / b : null;
  }
  return null;
};

const parseQuantity = (quantity?: string): { value: number | null; rest: string } => {
  if (!quantity) return { value: null, rest: '' };
  const q = quantity.trim();
  // Try fraction first (e.g., 1/2 cup)
  const frac = safeEvalFraction(q.split(/\s+/)[0]);
  if (frac !== null) {
    const rest = q.substring(q.indexOf(' ')).trim();
    return { value: frac, rest };
  }
  // Try number (supports decimals)
  const numMatch = q.match(/^\s*(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const value = parseFloat(numMatch[1]);
    const rest = q.slice(numMatch[0].length).trim();
    return { value, rest };
  }
  return { value: null, rest: q };
};

const scaleQuantityString = (quantity?: string, factor: number = 1): string | undefined => {
  if (!quantity || factor === 1) return quantity;
  const { value, rest } = parseQuantity(quantity);
  if (value === null) return quantity; // cannot parse
  const scaled = +(value * factor).toFixed(2);
  // Remove trailing .00 / .0
  const formatted = Number.isInteger(scaled) ? String(Math.trunc(scaled)) : String(scaled);
  return rest ? `${formatted} ${rest}` : formatted;
};

export default function RecipeDisplay({ recipes, onBack }: RecipeDisplayProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showNutrition, setShowNutrition] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [list, setList] = useState<Recipe[]>(recipes);

  // Filters
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [maxTimeMins, setMaxTimeMins] = useState<number | null>(null);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);

  // Serving size scaling (applies in detail view)
  const [desiredServings, setDesiredServings] = useState<number | null>(null);

  const availableDietaryTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach(r => (r.tags || []).forEach(t => tagSet.add(t)));
    // fallback common tags
    const base = ['Vegetarian','Vegan','Gluten-Free','Dairy-Free','Nut-Free','Keto','Paleo','Low-Carb','Mediterranean'];
    base.forEach(t => tagSet.add(t));
    return Array.from(tagSet).sort();
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    return list.filter(r => {
      if (selectedDifficulty !== 'All' && r.difficulty !== selectedDifficulty) return false;
      if (maxTimeMins !== null && parseTimeToMinutes(r.time) > maxTimeMins) return false;
      if (dietaryFilters.length > 0) {
        const recipeTags = (r.tags || []).map(t => t.toLowerCase());
        const ok = dietaryFilters.every(df => recipeTags.includes(df.toLowerCase()));
        if (!ok) return false;
      }
      return true;
    });
  }, [list, selectedDifficulty, maxTimeMins, dietaryFilters]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
      case 'Medium':
      case 'Hard':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '😊';
      case 'Medium': return '😐';
      case 'Hard': return '\ud83d\ude30';
      default: return '🤔';
    }
  };

  // Detail View
  if (selectedRecipe) {
    const baseServings = selectedRecipe.servings || 1;
    const targetServings = desiredServings ?? baseServings;
    const factor = Math.max(0.1, targetServings / Math.max(1, baseServings));

    return (
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button
            onClick={() => setSelectedRecipe(null)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChefHat className="w-4 h-4" />
            Back to Recipes
          </Button>

          {/* Serving size control */}
          <div className="flex items-center gap-3 bg-white/70 px-3 py-2 rounded-xl border border-slate-200">
            <Users className="w-4 h-4 text-slate-600" />
            <span className="text-slate-700 text-sm">Servings</span>
            <Button size="sm" variant="outline" className="p-0 w-8 h-8" onClick={() => setDesiredServings(Math.max(1, targetServings - 1))}><Minus className="w-4 h-4" /></Button>
            <div className="min-w-[2rem] text-center font-semibold text-slate-800">{targetServings}</div>
            <Button size="sm" variant="outline" className="p-0 w-8 h-8" onClick={() => setDesiredServings(targetServings + 1)}><Plus className="w-4 h-4" /></Button>
            {targetServings !== baseServings && (
              <Button size="sm" variant="ghost" onClick={() => setDesiredServings(baseServings)} className="text-slate-600">Reset</Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!selectedRecipe) return;
                try {
                  const saved = await saveRecipe(selectedRecipe);
                  setSavedIds(prev => new Set(prev).add(selectedRecipe.id));
                  alert('Recipe saved!');
                } catch (e: any) {
                  alert('Failed to save recipe: ' + (e?.message || ''));
                }
              }}
              className={`${savedIds.has(selectedRecipe.id) ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <Bookmark className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!selectedRecipe) return;
                try {
                  await deleteRecipe(selectedRecipe.id);
                  setList(prev => prev.filter(r => r.id !== selectedRecipe.id));
                  setSelectedRecipe(null);
                } catch (e: any) {
                  alert('Failed to delete: ' + (e?.message || ''));
                }
              }}
            >
              Delete
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <Card className="shadow-sm border border-slate-200 bg-white">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-14 h-14 bg-slate-900 rounded-md flex items-center justify-center">
                <Utensils className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-slate-900">
                  {selectedRecipe.name}
                </CardTitle>
                {selectedRecipe.description && (
                  <p className="text-slate-600 text-lg mt-2">{selectedRecipe.description}</p>
                )}
              </div>
            </div>

            {/* Recipe Meta Information */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200">
                <Clock className="w-4 h-4 text-slate-700" />
                <span className="text-slate-700 font-medium">{selectedRecipe.time}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200">
                <Users className="w-4 h-4 text-slate-700" />
                <span className="text-slate-700 font-medium">{targetServings} servings</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getDifficultyColor(selectedRecipe.difficulty)}`}>
                <span className="text-lg">{getDifficultyIcon(selectedRecipe.difficulty)}</span>
                <span className="font-medium">{selectedRecipe.difficulty}</span>
              </div>
              {selectedRecipe.cuisine && (
                <Badge variant="outline" className="px-4 py-2 text-base">
                  {selectedRecipe.cuisine}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Ingredients Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-slate-900" />
                Ingredients
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <span className="font-medium text-slate-800">{ingredient.name}</span>
                    {(ingredient.quantity || ingredient.unit) && (
                      <Badge variant="secondary" className="ml-auto">
                        {scaleQuantityString(ingredient.quantity, factor)} {ingredient.unit && !String(ingredient.quantity || '').toLowerCase().includes(ingredient.unit.toLowerCase()) ? ingredient.unit : ''}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-slate-900" />
                Instructions
              </h3>
              <div className="space-y-4">
                {selectedRecipe.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-slate-700 leading-relaxed text-base">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-slate-900" />
                  Nutritional Information (per serving)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNutrition(!showNutrition)}
                  className="text-slate-700 hover:text-slate-900"
                >
                  {showNutrition ? 'Hide' : 'Show'} Details
                </Button>
              </div>
              
              {showNutrition && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
                    <div className="text-2xl font-bold text-emerald-700">{selectedRecipe.nutrition.calories}</div>
                    <div className="text-sm text-emerald-600">Calories</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{selectedRecipe.nutrition.protein}</div>
                    <div className="text-sm text-blue-600">Protein</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-200">
                    <div className="text-2xl font-bold text-orange-700">{selectedRecipe.nutrition.carbs}</div>
                    <div className="text-sm text-orange-600">Carbs</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                    <div className="text-2xl font-bold text-red-700">{selectedRecipe.nutrition.fat}</div>
                    <div className="text-sm text-red-600">Fat</div>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {selectedRecipe.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-600 font-medium">Tags:</span>
                {selectedRecipe.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-700">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // List View with Filters
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
          <ChefHat className="w-4 h-4" />
          Back to Home
        </Button>
        <div className="text-center flex-1">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-900 rounded-md flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Recipes</h2>
          </div>
          <p className="text-slate-600 mb-2">We've created {recipes.length} recipes based on your inputs</p>
        </div>
        <div className="w-[220px] flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!confirm('Delete all saved recipes?')) return;
              try {
                await deleteAllRecipes();
                setList(prev => prev.filter(() => false));
              } catch (e: any) {
                alert('Failed to delete all: ' + (e?.message || ''));
              }
            }}
          >
            Delete All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3 text-slate-700 font-semibold">
            <Filter className="w-4 h-4" /> Filters
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Difficulty */}
            <div>
              <div className="text-sm text-slate-600 mb-2">Difficulty</div>
              <div className="flex flex-wrap gap-2">
                {(['All','Easy','Medium','Hard'] as const).map(d => (
                  <Button key={d} size="sm" variant={selectedDifficulty === d ? 'default' : 'outline'} onClick={() => setSelectedDifficulty(d)}>
                    {d}
                  </Button>
                ))}
              </div>
            </div>

            {/* Max Time */}
            <div>
              <div className="text-sm text-slate-600 mb-2">Max Time (minutes)</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setMaxTimeMins(15)}>15</Button>
                <Button size="sm" variant="outline" onClick={() => setMaxTimeMins(30)}>30</Button>
                <Button size="sm" variant="outline" onClick={() => setMaxTimeMins(45)}>45</Button>
                <Button size="sm" variant="outline" onClick={() => setMaxTimeMins(60)}>60</Button>
                <Button size="sm" variant="ghost" onClick={() => setMaxTimeMins(null)} className="text-slate-600">Clear</Button>
              </div>
            </div>

            {/* Dietary Tags */}
            <div>
              <div className="text-sm text-slate-600 mb-2">Dietary Restrictions</div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-auto pr-1">
                {availableDietaryTags.map(tag => {
                  const active = dietaryFilters.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={active ? 'default' : 'outline'}
                      className={`${active ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'hover:bg-emerald-50 hover:border-emerald-300'} cursor-pointer`}
                      onClick={() => setDietaryFilters(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRecipes.map((recipe) => (
          <Card
            key={recipe.id}
            className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white via-pink-50 to-purple-50 hover:scale-105 group"
            onClick={() => {
              setSelectedRecipe(recipe);
              setDesiredServings(null);
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-purple-700 transition-colors">
                    {recipe.name}
                  </h3>
                  {recipe.description && (
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-600 rounded-xl flex items-center justify-center ml-4">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Recipe Meta */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  {recipe.time}
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Users className="w-4 h-4" />
                  {recipe.servings} servings
                </div>
                <Badge className={`${getDifficultyColor(recipe.difficulty)}`}>
                  {getDifficultyIcon(recipe.difficulty)} {recipe.difficulty}
                </Badge>
              </div>

              {/* Quick Nutrition Preview */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center bg-white/60 rounded-lg p-2 border border-pink-200">
                  <div className="text-sm font-bold text-slate-800">{recipe.nutrition.calories}</div>
                  <div className="text-xs text-slate-600">cal</div>
                </div>
                <div className="text-center bg-white/60 rounded-lg p-2 border border-purple-200">
                  <div className="text-sm font-bold text-slate-800">{recipe.nutrition.protein}</div>
                  <div className="text-xs text-slate-600">protein</div>
                </div>
                <div className="text-center bg-white/60 rounded-lg p-2 border border-blue-200">
                  <div className="text-sm font-bold text-slate-800">{recipe.nutrition.carbs}</div>
                  <div className="text-xs text-slate-600">carbs</div>
                </div>
              </div>

              {/* Tags */}
              {recipe.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {recipe.tags.slice(0, 3).map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {recipe.tags.length > 3 && (
                    <span className="text-xs text-slate-500">+{recipe.tags.length - 3} more</span>
                  )}
                </div>
              )}

              <div className="mt-4 text-center">
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); setSelectedRecipe(recipe); }}>
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full ${savedIds.has(recipe.id) ? 'opacity-60 pointer-events-none' : ''}`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const saved = await saveRecipe(recipe);
                        setSavedIds(prev => new Set(prev).add(recipe.id));
                        alert('Recipe saved!');
                      } catch (err: any) {
                        alert('Failed to save: ' + (err?.message || ''));
                      }
                    }}
                  >
                    {savedIds.has(recipe.id) ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const id = recipe.id;
                      try {
                        await deleteRecipe(id);
                        setList(prev => prev.filter(r => r.id !== id));
                      } catch (err: any) {
                        alert('Failed to delete: ' + (err?.message || ''));
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredRecipes.length === 0 && (
          <div className="text-center text-slate-600 py-12">No recipes match the current filters.</div>
        )}
      </div>

      <div className="text-center">
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ChefHat className="w-4 h-4 mr-2" />
          Generate More Recipes
        </Button>
      </div>
    </div>
  );
}
