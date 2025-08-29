'use client';

import { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, ChefHat, Utensils, Heart, Star, Trash2, ArrowLeft } from 'lucide-react';
import { fetchSavedRecipes, deleteRecipe, addFavorite, removeFavorite, fetchFavorites } from '../services/recipeApi';
import RatingStars from '../components/RatingStars';
import Link from 'next/link';

export default function SavedRecipesPage() {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSavedRecipes();
    loadUserData();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      setIsLoading(true);
      const recipes = await fetchSavedRecipes();
      setSavedRecipes(recipes);
    } catch (error) {
      console.error('Failed to load saved recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const favorites = await fetchFavorites();
      setFavoriteIds(new Set(favorites));
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;
    
    try {
      await deleteRecipe(recipeId);
      setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null);
      }
    } catch (error) {
      alert('Failed to delete recipe');
    }
  };

  const handleFavoriteToggle = async (recipe: Recipe) => {
    try {
      if (favoriteIds.has(recipe.id)) {
        await removeFavorite(recipe.id);
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipe.id);
          return newSet;
        });
      } else {
        await addFavorite(recipe.id);
        setFavoriteIds(prev => new Set(prev).add(recipe.id));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleRatingChange = async (recipe: Recipe, rating: number) => {
    try {
      // TODO: Implement rateRecipe call
      setUserRatings(prev => ({ ...prev, [recipe.id]: rating }));
    } catch (error) {
      console.error('Failed to save rating:', error);
    }
  };

  // Detail View
  if (selectedRecipe) {
    return (
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button
            onClick={() => setSelectedRecipe(null)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Saved Recipes
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteRecipe(selectedRecipe.id)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Recipe Detail Card */}
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

            {/* Rating in detail view */}
            <div className="flex items-center justify-center mb-4">
              <RatingStars
                value={userRatings[selectedRecipe.id] || 0}
                onChange={(next) => handleRatingChange(selectedRecipe, next)}
                size="lg"
              />
            </div>

            {/* Recipe Meta Information */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200">
                <Clock className="w-4 h-4 text-slate-700" />
                <span className="text-slate-700 font-medium">{selectedRecipe.time}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200">
                <Users className="w-4 h-4 text-slate-700" />
                <span className="text-slate-700 font-medium">{selectedRecipe.servings} servings</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-slate-100 text-slate-800 border-slate-200">
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
                        {ingredient.quantity} {ingredient.unit}
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

  // List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <Link href="/generate">
                <Button variant="outline" className="flex items-center gap-2 px-6 py-3">
                  <ArrowLeft className="w-5 h-5" />
                  Back to Generate
                </Button>
              </Link>
              <div className="text-center flex-1">
                <div className="inline-flex items-center justify-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Saved Recipes</h1>
                    <p className="text-xl text-slate-600">
                      {isLoading ? 'Loading...' : `You have ${savedRecipes.length} saved recipe${savedRecipes.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-[220px] flex justify-end">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={async () => {
                    if (!confirm('Delete all saved recipes?')) return;
                    try {
                      // TODO: Implement deleteAllRecipes
                      setSavedRecipes([]);
                    } catch (e: any) {
                      alert('Failed to delete all: ' + (e?.message || ''));
                    }
                  }}
                  className="px-6 py-3 text-red-600 border-red-200 hover:bg-red-50"
                >
                  Delete All
                </Button>
              </div>
            </div>
          </div>

          {/* Recipe Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="rounded-2xl border border-slate-200 p-8 bg-white animate-pulse shadow-sm">
                  <div className="h-6 w-3/4 bg-slate-200 rounded mb-4" />
                  <div className="h-4 w-full bg-slate-200 rounded mb-6" />
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="h-12 bg-slate-100 rounded" />
                    <div className="h-12 bg-slate-100 rounded" />
                    <div className="h-12 bg-slate-100 rounded" />
                  </div>
                  <div className="h-10 bg-slate-100 rounded" />
                </div>
              ))
            ) : savedRecipes.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-600 mb-3">No saved recipes yet</h3>
                <p className="text-lg text-slate-500 mb-6">Start generating and saving recipes to see them here</p>
                <Link href="/generate">
                  <Button size="lg" className="px-8 py-3">Generate Recipes</Button>
                </Link>
              </div>
            ) : (
              savedRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="cursor-pointer hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50 hover:scale-105 group shadow-lg"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-700 transition-colors line-clamp-2">
                          {recipe.name}
                        </h3>
                        {recipe.description && (
                          <p className="text-slate-600 text-base mb-4 line-clamp-3 leading-relaxed">{recipe.description}</p>
                        )}
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center ml-4 shadow-lg">
                        <Utensils className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Quick rating + favorite row */}
                    <div className="flex items-center justify-between mb-6">
                      <RatingStars
                        value={userRatings[recipe.id] || 0}
                        onChange={(next) => handleRatingChange(recipe, next)}
                        size="md"
                      />
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavoriteToggle(recipe);
                        }}
                        className="p-2 h-12 w-12 hover:bg-red-50"
                      >
                        <Heart 
                          className={`w-6 h-6 ${favoriteIds.has(recipe.id) ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} 
                        />
                      </Button>
                    </div>

                    {/* Recipe Meta */}
                    <div className="flex items-center gap-6 mb-6 flex-wrap">
                      <div className="flex items-center gap-2 text-base text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">{recipe.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-base text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200">
                        <Users className="w-5 h-5" />
                        <span className="font-medium">{recipe.servings} servings</span>
                      </div>
                      <Badge className="bg-slate-100 text-slate-800 border-slate-200 px-4 py-2 text-base">
                        {recipe.difficulty}
                      </Badge>
                    </div>

                    {/* Top tags */}
                    {recipe.tags.length > 0 && (
                      <div className="flex items-center gap-3 flex-wrap mb-6">
                        {recipe.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-sm px-3 py-1">
                            {tag}
                          </Badge>
                        ))}
                        {recipe.tags.length > 3 && (
                          <span className="text-sm text-slate-500">+{recipe.tags.length - 3} more</span>
                        )}
                      </div>
                    )}

                    <div className="mt-6 text-center">
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" size="lg" className="w-full py-3" onClick={(e) => { e.stopPropagation(); setSelectedRecipe(recipe); }}>
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full py-3 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleDeleteRecipe(recipe.id);
                          }}
                        >
                          <Trash2 className="w-5 h-5 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


