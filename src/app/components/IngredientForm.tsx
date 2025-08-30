'use client';

import { useState, useEffect } from 'react';
import IngredientInput from './IngredientInput';
import DietaryPreferences from './DietaryPreferences';
import RecipeGenerationForm from './RecipeGenerationForm';
import RecipeDisplay from './RecipeDisplay';
import ImageIngredientRecognition from './ImageIngredientRecognition';
import { Ingredient, DietaryPreference, Recipe, RecipeGenerationRequest } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, ChefHat, Sparkles, Target, Heart, Zap, Star, ArrowLeft, Camera } from 'lucide-react';
import recipeGenerationService from '../services/recipeGenerationService';
import { fetchSavedRecipes } from '../services/recipeApi';
import RatingStars from './RatingStars';
import PersonalizedRecommendations from './PersonalizedRecommendations';
import { initializeGeminiImageRecognition, getGeminiStatus } from '../config/geminiConfig';

export default function IngredientForm() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreference[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[] | null>(null);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [showImageRecognition, setShowImageRecognition] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{
    available: boolean;
    status: string;
    message: string;
    icon: string;
  } | null>(null);

  useEffect(() => {
    const initialize = async () => {
      await initializeGeminiImageRecognition();
      const status = await getGeminiStatus();
      setGeminiStatus(status);
      console.log('Gemini status:', status);
    };
    initialize();
  }, []);

  const handleAddIngredient = (ingredient: Ingredient) => {
    setIngredients(prev => [...prev, ingredient]);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
  };

  const handleIngredientsFromImage = (detectedIngredients: Ingredient[]) => {
    setIngredients(prev => [...prev, ...detectedIngredients]);
    setShowImageRecognition(false);
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
    <div className="space-y-8">
      <div className="text-center">
        <CardTitle className="text-3xl font-bold text-slate-900 mb-2">What's in your kitchen?</CardTitle>
        <CardDescription className="text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Add your available ingredients and dietary preferences to get personalized recipe suggestions
        </CardDescription>
      </div>

      {/* Vertical layout: stack sections for consistent mobile/desktop behavior */}
      <div className="space-y-6">
        {/* Left: Ingredients */}
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
            <div className="space-y-4">
              {/* Image Recognition Button */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">AI-Powered Recognition</h4>
                      <p className="text-sm text-slate-600">Take a photo or upload an image to automatically detect ingredients</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowImageRecognition(true)}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Scan Ingredients
                  </Button>
                </div>

                {/* Gemini Status Indicator */}
                {geminiStatus && (
                  <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                    geminiStatus.available 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <span className="text-2xl">{geminiStatus.icon}</span>
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${
                        geminiStatus.available ? 'text-green-800' : 'text-amber-800'
                      }`}>
                        {geminiStatus.status}
                      </div>
                      <div className={`text-xs ${
                        geminiStatus.available ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {geminiStatus.message}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <IngredientInput 
                onAddIngredient={handleAddIngredient}
                onRemoveIngredient={handleRemoveIngredient}
                ingredients={ingredients}
              />
            </div>
          </CardContent>
        </Card>

        {/* Middle: Dietary Preferences */}
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
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

        {/* Right: Actions, CTA, Summary */}
        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Ready to generate?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={() => setShowRecipeForm(true)}
                  disabled={false}
                  className="w-full h-12 text-base font-semibold"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ChefHat className="w-5 h-5" />
                    <span>Next: Configure Recipe Generation</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
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
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                      {dietaryPreferences.length} dietary preference{dietaryPreferences.length !== 1 ? 's' : ''} applied
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-slate-900">{ingredients.length}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Ingredients</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading skeletons when generating (mobile/desktop) */}
          {isGenerating && (
            <div className="space-y-3" aria-hidden>
              <div className="h-10 bg-slate-200/70 rounded-lg animate-pulse" />
              <div className="h-10 bg-slate-200/70 rounded-lg animate-pulse" />
              <div className="h-10 bg-slate-200/70 rounded-lg animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Personalized Recommendations Section */}
      <PersonalizedRecommendations 
        className="mt-8"
        onRecipeClick={(recipe) => {
          // Navigate to recipe detail or add to current list
          console.log('Recommended recipe clicked:', recipe.name);
        }}
      />

      {/* Sticky mobile CTA */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 z-40">
        <div className="rounded-2xl shadow-lg border border-slate-200 bg-white p-3">
          <Button
            type="button"
            onClick={() => setShowRecipeForm(true)}
            disabled={false}
            className="w-full h-12"
          >
            <ChefHat className="w-4 h-4 mr-2" /> Generate
          </Button>
        </div>
      </div>

      {/* Image Recognition Modal */}
      {showImageRecognition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <ImageIngredientRecognition
            onIngredientsDetected={handleIngredientsFromImage}
            onClose={() => setShowImageRecognition(false)}
          />
        </div>
      )}
    </div>
  );
}

