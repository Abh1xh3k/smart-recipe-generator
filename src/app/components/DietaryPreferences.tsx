'use client';

import { DietaryPreference } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Lightbulb, X, Sparkles, Heart, Shield, Zap } from 'lucide-react';

interface DietaryPreferencesProps {
  selectedPreferences: DietaryPreference[];
  onPreferenceChange: (preference: DietaryPreference) => void;
}

// Predefined dietary preferences
const DIETARY_PREFERENCES: DietaryPreference[] = [
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    description: 'No meat, fish, or poultry. Includes dairy and eggs.',
    icon: '🥬'
  },
  {
    id: 'vegan',
    name: 'Vegan',
    description: 'No animal products including dairy, eggs, and honey.',
    icon: '🌱'
  },
  {
    id: 'gluten-free',
    name: 'Gluten-Free',
    description: 'No wheat, barley, rye, or other gluten-containing grains.',
    icon: '🌾'
  },
  {
    id: 'dairy-free',
    name: 'Dairy-Free',
    description: 'No milk, cheese, yogurt, or other dairy products.',
    icon: '🥛'
  },
  {
    id: 'nut-free',
    name: 'Nut-Free',
    description: 'No tree nuts or peanuts.',
    icon: '🥜'
  },
  {
    id: 'low-carb',
    name: 'Low-Carb',
    description: 'Limited carbohydrates, focusing on protein and healthy fats.',
    icon: '🥑'
  },
  {
    id: 'keto',
    name: 'Keto',
    description: 'Very low-carb, high-fat diet for ketosis.',
    icon: '🥩'
  },
  {
    id: 'paleo',
    name: 'Paleo',
    description: 'Whole foods, avoiding processed foods and grains.',
    icon: '🍖'
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    description: 'Heart-healthy diet rich in vegetables, fish, and olive oil.',
    icon: '🐟'
  },
  {
    id: 'low-sodium',
    name: 'Low-Sodium',
    description: 'Limited salt intake for heart health.',
    icon: '🧂'
  },
  {
    id: 'diabetic-friendly',
    name: 'Diabetic-Friendly',
    description: 'Low glycemic index foods to manage blood sugar.',
    icon: '📊'
  },
  {
    id: 'halal',
    name: 'Halal',
    description: 'Foods prepared according to Islamic dietary laws.',
    icon: '☪️'
  },
  {
    id: 'kosher',
    name: 'Kosher',
    description: 'Foods prepared according to Jewish dietary laws.',
    icon: '✡️'
  }
];

export default function DietaryPreferences({ selectedPreferences, onPreferenceChange }: DietaryPreferencesProps) {
  const isSelected = (preferenceId: string) => {
    return selectedPreferences.some(p => p.id === preferenceId);
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Description with more vibrant colors */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-6 py-3 rounded-full border border-emerald-200 mb-6 shadow-lg">
          <Shield className="w-5 h-5 text-emerald-600" />
          <span className="text-emerald-700 text-base font-semibold">Dietary Preferences</span>
          <Zap className="w-4 h-4 text-teal-500 animate-pulse" />
        </div>
        <p className="text-slate-700 text-lg leading-relaxed max-w-3xl mx-auto font-medium">
          Select any dietary restrictions or preferences to filter recipe suggestions accordingly.
        </p>
      </div>

      {/* Enhanced Preferences Grid with more vibrant styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DIETARY_PREFERENCES.map((preference) => {
          const selected = isSelected(preference.id);
          return (
            <Card
              key={preference.id}
              className={`
                relative cursor-pointer transition-all duration-300 hover:scale-110 group
                ${selected
                  ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 shadow-2xl shadow-emerald-200/50'
                  : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xl'
                }
              `}
              onClick={() => onPreferenceChange(preference)}
            >
              <CardContent className="p-6">
                {/* Enhanced Selection Indicator */}
                {selected && (
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-xl animate-in zoom-in duration-300">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                )}

                {/* Enhanced Content */}
                <div className="flex items-start gap-4">
                  <div className={`
                    text-4xl transform transition-all duration-300
                    ${selected ? 'scale-110' : 'group-hover:scale-110'}
                  `}>
                    {preference.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold mb-3 text-lg transition-colors duration-300 ${
                      selected ? 'text-emerald-800' : 'text-slate-800 group-hover:text-emerald-700'
                    }`}>
                      {preference.name}
                    </h4>
                    <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                      selected ? 'text-emerald-700' : 'text-slate-600 group-hover:text-emerald-600'
                    }`}>
                      {preference.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enhanced Selected Count with more vibrant styling */}
      {selectedPreferences.length > 0 && (
        <Card className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardContent className="pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800 mb-2 text-xl">
                    {selectedPreferences.length} Dietary Preference{selectedPreferences.length !== 1 ? 's' : ''} Selected
                  </h4>
                  <p className="text-emerald-700 text-base">
                    Recipes will be filtered to match your preferences
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  // Clear all preferences
                  selectedPreferences.forEach(pref => onPreferenceChange(pref));
                }}
                variant="outline"
                size="sm"
                className="text-emerald-600 border-emerald-300 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Help Text with more vibrant styling */}
      <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="pt-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-blue-800 mb-3 text-xl">Pro Tip</h4>
              <p className="text-blue-700 leading-relaxed text-base">
                You can select multiple dietary preferences. The system will find recipes that satisfy all your requirements.
                If no exact matches are found, we'll suggest the closest alternatives.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                <span className="text-blue-600 text-base font-semibold">Smart filtering ensures perfect matches!</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
