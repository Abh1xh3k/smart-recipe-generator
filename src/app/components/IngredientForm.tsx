'use client';

import { useState } from 'react';
import IngredientInput from './IngredientInput';
import DietaryPreferences from './DietaryPreferences';
import RecipeGenerationForm from './RecipeGenerationForm';
import RecipeDisplay from './RecipeDisplay';
import { Ingredient, DietaryPreference, Recipe, RecipeGenerationRequest } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, ChefHat, Sparkles, Target, Heart, Zap, Star, ArrowLeft } from 'lucide-react';
import recipeGenerationService from '../services/recipeGenerationService';
import { fetchSavedRecipes } from '../services/recipeApi';

export default function IngredientForm() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreference[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[] | null>(null);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);

  const handleAddIngredient = (ingredient: Ingredient) => {
    setIngredients(prev => [...prev, ingredient]);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
  };

  const handleDietaryPreferenceChange = (preference: DietaryPreference) => {
    setDietaryPreferences(prev => {
      const exists = prev.find(p => p.id === preference.id);
      if (exists) {
        return prev.filter(p => p.id !== preference.id);
      } else {
        return [...prev, preference];
      }
    });
  };

  const handleGenerateRecipes = async (request: RecipeGenerationRequest) => {
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Complete the request with current ingredients and preferences
      const completeRequest: RecipeGenerationRequest = {
        ...request,
        ingredients,
        dietaryPreferences
      };

      // Generate recipes using the service
      const response = await recipeGenerationService.generateRecipes(completeRequest);
      
      setGeneratedRecipes(response.recipes);
      setShowRecipes(true);
      setShowRecipeForm(false);
      
      console.log('Generated recipes:', response);
    } catch (error) {
      console.error('Error generating recipes:', error);
      alert('Failed to generate recipes. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackToForm = () => {
    setShowRecipes(false);
    setShowRecipeForm(false);
    setGeneratedRecipes([]);
    setSavedRecipes(null);
  };

  const handleBackToIngredients = () => {
    setShowRecipeForm(false);
  };

  // Show recipe display for either saved or generated recipes
  if (showRecipes) {
    const list = savedRecipes !== null ? savedRecipes : generatedRecipes;
    return <RecipeDisplay recipes={list} onBack={handleBackToForm} />;
  }

  // Show recipe generation form
  if (showRecipeForm) {
    return (
      <div className="space-y-8">
        {/* Back Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleBackToIngredients}
            variant="ghost"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Ingredients
          </Button>
        </div>

        {/* Recipe Generation Form */}
        <RecipeGenerationForm 
          onGenerate={handleGenerateRecipes}
          isGenerating={isGenerating}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="text-center">
        <CardTitle className="text-3xl font-bold text-slate-900 mb-2">What's in your kitchen?</CardTitle>
        <CardDescription className="text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Add your available ingredients and dietary preferences to get personalized recipe suggestions
        </CardDescription>
      </div>

      {/* Enhanced Ingredients Section with more vibrant colors */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900 font-semibold">Available Ingredients</CardTitle>
              <p className="text-slate-600 text-sm">Select from our database or add custom ones</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <IngredientInput 
            onAddIngredient={handleAddIngredient}
            onRemoveIngredient={handleRemoveIngredient}
            ingredients={ingredients}
          />
        </CardContent>
      </Card>

      {/* Enhanced Dietary Preferences Section with more vibrant colors */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900 font-semibold">Dietary Preferences</CardTitle>
              <p className="text-slate-600 text-sm">Choose your dietary restrictions and preferences</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DietaryPreferences 
            selectedPreferences={dietaryPreferences}
            onPreferenceChange={handleDietaryPreferenceChange}
          />
        </CardContent>
      </Card>

      {/* Enhanced Generate Button with more vibrant styling */}
      <div className="pt-4">
        <Separator className="mb-6" />
        <div className="relative">
          <Button
            type="button"
            onClick={() => setShowRecipeForm(true)}
            disabled={false}
            size="xl"
            className="w-full h-14 text-base font-semibold"
          >
            <div className="flex items-center justify-center gap-2">
              <ChefHat className="w-5 h-5" />
              <span>Next: Configure Recipe Generation</span>
            </div>
          </Button>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                try {
                  const list = await fetchSavedRecipes();
                  // Force showing saved set and clear any generated recipes to avoid fallback
                  setGeneratedRecipes([]);
                  setSavedRecipes(list);
                  setShowRecipes(true);
                } catch (e: any) {
                  alert('Failed to load saved recipes: ' + (e?.message || ''));
                }
              }}
            >
              View Saved Recipes
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Summary with more vibrant styling */}
      {ingredients.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 text-lg">Summary</h4>
                <div className="text-slate-600 space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                    {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} selected
                  </p>
                  {dietaryPreferences.length > 0 && (
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                      {dietaryPreferences.length} dietary preference{dietaryPreferences.length !== 1 ? 's' : ''} applied
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-slate-900">{ingredients.length}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Ingredients</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
