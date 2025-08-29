'use client';

import { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, ChefHat, Utensils, Heart, Star, Sparkles, TrendingUp } from 'lucide-react';
import { fetchRecommendations, addFavorite, removeFavorite, fetchFavorites, rateRecipe, saveRecipe } from '../services/recipeApi';
import RatingStars from './RatingStars';

interface PersonalizedRecommendationsProps {
  className?: string;
  onRecipeClick?: (recipe: Recipe) => void;
}

export default function PersonalizedRecommendations({ className = '', onRecipeClick }: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  // Helper function to ensure recipe has database ID
  const ensureRecipeHasDbId = async (recipe: Recipe): Promise<string> => {
    // Check if recipe ID looks like a MongoDB ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(recipe.id)) {
      return recipe.id;
    }
    // Save recipe to get database ID
    const saved = await saveRecipe(recipe);
    return saved.id;
  };

  useEffect(() => {
    loadRecommendations();
    loadUserData();
  }, []);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      const recipes = await fetchRecommendations();
      setRecommendations(recipes);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const [favorites, ratings] = await Promise.all([
        fetchFavorites(),
        Promise.resolve({}) // TODO: Implement getUserRating for multiple recipes
      ]);
      setFavoriteIds(new Set(favorites));
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleFavoriteToggle = async (recipe: Recipe) => {
    try {
      const dbId = await ensureRecipeHasDbId(recipe);
      if (favoriteIds.has(dbId)) {
        await removeFavorite(dbId);
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(dbId);
          return newSet;
        });
        alert('Removed from favorites');
      } else {
        await addFavorite(dbId);
        setFavoriteIds(prev => new Set(prev).add(dbId));
        alert('Added to fav');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('Failed to toggle favorite');
    }
  };

  const handleRatingChange = async (recipe: Recipe, rating: number) => {
    try {
      const dbId = await ensureRecipeHasDbId(recipe);
      await rateRecipe(dbId, rating);
      setUserRatings(prev => ({ ...prev, [dbId]: rating }));
      alert('Thank you for your rating');
    } catch (error) {
      console.error('Failed to save rating:', error);
      alert('Failed to save rating');
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Personalized Recommendations</CardTitle>
                <p className="text-slate-600 text-sm">Analyzing your preferences...</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={className}>
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Personalized Recommendations</CardTitle>
                <p className="text-slate-600 text-sm">Rate some recipes to get personalized suggestions</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Start rating and favoriting recipes to see recommendations tailored to your taste!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Personalized Recommendations</CardTitle>
                <p className="text-slate-600 text-sm">Based on your ratings and favorites</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRecommendations}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 6).map((recipe) => (
              <div
                key={recipe.id}
                className="group cursor-pointer rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all duration-200 hover:border-purple-200"
                onClick={() => onRecipeClick?.(recipe)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 group-hover:text-purple-700 transition-colors line-clamp-2">
                      {recipe.name}
                    </h4>
                    {recipe.description && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{recipe.description}</p>
                    )}
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-md flex items-center justify-center ml-2 flex-shrink-0">
                    <Utensils className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Quick rating and favorite */}
                <div className="flex items-center justify-between mb-3">
                  <RatingStars
                    value={userRatings[recipe.id] || 0}
                    onChange={(rating) => handleRatingChange(recipe, rating)}
                    size="sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavoriteToggle(recipe);
                    }}
                    className="p-1 h-8 w-8"
                  >
                    <Heart 
                      className={`w-4 h-4 ${favoriteIds.has(recipe.id) ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} 
                    />
                  </Button>
                </div>

                {/* Recipe meta */}
                <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {recipe.time}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {recipe.servings}
                  </div>
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {recipe.difficulty}
                  </Badge>
                </div>

                {/* Top tags */}
                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                    {recipe.tags.length > 2 && (
                      <span className="text-xs text-slate-500">+{recipe.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
