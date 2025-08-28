'use client';

import { useState } from 'react';
import { RecipeGenerationRequest } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, ChefHat, Globe, Target, Zap } from 'lucide-react';

interface RecipeGenerationFormProps {
  onGenerate: (request: RecipeGenerationRequest) => void;
  isGenerating: boolean;
}

const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'American', 
  'French', 'Thai', 'Japanese', 'Chinese', 'Greek', 'Spanish', 'Moroccan'
];

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'] as const;

export default function RecipeGenerationForm({ onGenerate, isGenerating }: RecipeGenerationFormProps) {
  const [servings, setServings] = useState(4);
  const [cuisine, setCuisine] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | ''>('');
  const [maxTime, setMaxTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const request: RecipeGenerationRequest = {
      ingredients: [], // Will be passed from parent
      dietaryPreferences: [], // Will be passed from parent
      servings,
      cuisine: cuisine || undefined,
      difficulty: difficulty || undefined,
      maxTime: maxTime || undefined
    };

    onGenerate(request);
  };

  const handleQuickGenerate = () => {
    const request: RecipeGenerationRequest = {
      ingredients: [], // Will be passed from parent
      dietaryPreferences: [], // Will be passed from parent
      servings: 4
    };
    onGenerate(request);
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-md flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg text-slate-900 font-semibold">Recipe Generation Options</CardTitle>
            <p className="text-slate-600 text-sm">Customize your recipe generation preferences</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Servings */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-slate-700 font-medium">
              <Users className="w-4 h-4 text-pink-600" />
              Number of Servings
            </label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setServings(Math.max(1, servings - 1))}
                disabled={servings <= 1}
                className="w-10 h-10 p-0"
              >
                -
              </Button>
              <div className="w-16 text-center">
                <span className="text-2xl font-bold text-slate-800">{servings}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setServings(servings + 1)}
                className="w-10 h-10 p-0"
              >
                +
              </Button>
            </div>
          </div>

          {/* Cuisine Preference */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-slate-700 font-medium">
              <Globe className="w-4 h-4 text-purple-600" />
              Cuisine Preference (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((cuisineOption) => (
                <Badge
                  key={cuisineOption}
                  variant={cuisine === cuisineOption ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-200 ${
                    cuisine === cuisineOption 
                      ? 'bg-purple-500 text-white hover:bg-purple-600' 
                      : 'hover:bg-purple-50 hover:border-purple-300'
                  }`}
                  onClick={() => setCuisine(cuisine === cuisineOption ? '' : cuisineOption)}
                >
                  {cuisineOption}
                </Badge>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-slate-700 font-medium">
              <Target className="w-4 h-4 text-blue-600" />
              Difficulty Level (Optional)
            </label>
            <div className="flex gap-3">
              {DIFFICULTY_OPTIONS.map((difficultyOption) => (
                <Button
                  key={difficultyOption}
                  type="button"
                  variant={difficulty === difficultyOption ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDifficulty(difficulty === difficultyOption ? '' : difficultyOption)}
                  className={`transition-all duration-200 ${
                    difficulty === difficultyOption 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  {difficultyOption}
                </Button>
              ))}
            </div>
          </div>

          {/* Maximum Cooking Time */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-slate-700 font-medium">
              <Clock className="w-4 h-4 text-emerald-600" />
              Maximum Cooking Time (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g., 30 minutes, 1 hour, 2 hours"
              value={maxTime}
              onChange={(e) => setMaxTime(e.target.value)}
              className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-500">
              Leave empty for no time restriction
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isGenerating} className="flex-1">
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating Recipes...
                </>
              ) : (
                <>
                  <ChefHat className="w-4 h-4 mr-2" />
                  Generate Custom Recipes
                </>
              )}
            </Button>
            
            <Button type="button" onClick={handleQuickGenerate} disabled={isGenerating} variant="outline" className="px-6">
              Quick Generate
            </Button>
          </div>
        </form>

        {/* Quick Tips */}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-slate-900" />
            Quick Tips
          </h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• More specific preferences = Better recipe matches</li>
            <li>• Leave options empty for maximum variety</li>
            <li>• Difficulty affects cooking time and complexity</li>
            <li>• Cuisine preference influences flavor profiles</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
