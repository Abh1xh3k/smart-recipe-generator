'use client';

import { useState, useRef, useEffect } from 'react';
import { Ingredient } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, X, ChefHat, Zap, Star, Sparkles } from 'lucide-react';

interface IngredientInputProps {
  onAddIngredient: (ingredient: Ingredient) => void;
  onRemoveIngredient: (id: string) => void;
  ingredients: Ingredient[];
}

// Predefined ingredients database
const PREDEFINED_INGREDIENTS: Ingredient[] = [
  // Vegetables
  { id: '1', name: 'Tomatoes', category: 'Vegetables' },
  { id: '2', name: 'Onions', category: 'Vegetables' },
  { id: '3', name: 'Garlic', category: 'Vegetables' },
  { id: '4', name: 'Bell Peppers', category: 'Vegetables' },
  { id: '5', name: 'Carrots', category: 'Vegetables' },
  { id: '6', name: 'Broccoli', category: 'Vegetables' },
  { id: '7', name: 'Spinach', category: 'Vegetables' },
  { id: '8', name: 'Mushrooms', category: 'Vegetables' },
  { id: '9', name: 'Zucchini', category: 'Vegetables' },
  { id: '10', name: 'Potatoes', category: 'Vegetables' },
  
  // Proteins
  { id: '11', name: 'Chicken Breast', category: 'Proteins' },
  { id: '12', name: 'Ground Beef', category: 'Proteins' },
  { id: '13', name: 'Salmon', category: 'Proteins' },
  { id: '14', name: 'Eggs', category: 'Proteins' },
  { id: '15', name: 'Tofu', category: 'Proteins' },
  { id: '16', name: 'Chickpeas', category: 'Proteins' },
  { id: '17', name: 'Black Beans', category: 'Proteins' },
  { id: '18', name: 'Shrimp', category: 'Proteins' },
  
  // Grains
  { id: '19', name: 'Rice', category: 'Grains' },
  { id: '20', name: 'Pasta', category: 'Grains' },
  { id: '21', name: 'Quinoa', category: 'Grains' },
  { id: '22', name: 'Bread', category: 'Grains' },
  { id: '23', name: 'Oats', category: 'Grains' },
  
  // Dairy
  { id: '24', name: 'Cheese', category: 'Dairy' },
  { id: '25', name: 'Milk', category: 'Dairy' },
  { id: '26', name: 'Yogurt', category: 'Dairy' },
  { id: '27', name: 'Butter', category: 'Dairy' },
  { id: '28', name: 'Cream', category: 'Dairy' },
  
  // Herbs & Spices
  { id: '29', name: 'Basil', category: 'Herbs & Spices' },
  { id: '30', name: 'Oregano', category: 'Herbs & Spices' },
  { id: '31', name: 'Thyme', category: 'Herbs & Spices' },
  { id: '32', name: 'Cumin', category: 'Herbs & Spices' },
  { id: '33', name: 'Paprika', category: 'Herbs & Spices' },
  { id: '34', name: 'Black Pepper', category: 'Herbs & Spices' },
  { id: '35', name: 'Salt', category: 'Herbs & Spices' },
];

export default function IngredientInput({ onAddIngredient, onRemoveIngredient, ingredients }: IngredientInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [customIngredient, setCustomIngredient] = useState({ name: '', quantity: '', unit: '' });
  const [showCustomForm, setShowCustomForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter ingredients based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredIngredients(PREDEFINED_INGREDIENTS);
    } else {
      const filtered = PREDEFINED_INGREDIENTS.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredIngredients(filtered);
    }
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleIngredientSelect = (ingredient: Ingredient) => {
    onAddIngredient(ingredient);
    setSearchTerm('');
    // Keep dropdown open for multi-select workflow
    setShowDropdown(true);
    // Refocus input for faster consecutive additions
    inputRef.current?.focus();
  };

  const handleCustomIngredientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customIngredient.name.trim()) {
      const newIngredient: Ingredient = {
        id: `custom-${Date.now()}`,
        name: customIngredient.name.trim(),
        category: 'Custom',
        quantity: customIngredient.quantity || undefined,
        unit: customIngredient.unit || undefined,
      };
      onAddIngredient(newIngredient);
      setCustomIngredient({ name: '', quantity: '', unit: '' });
      setShowCustomForm(false);
    }
  };

  const getCategoryVariant = (category: string) => {
    const variants: { [key: string]: any } = {
      'Vegetables': 'vegetables',
      'Proteins': 'proteins',
      'Grains': 'grains',
      'Dairy': 'dairy',
      'Herbs & Spices': 'spices',
      'Custom': 'custom',
    };
    return variants[category] || 'default';
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Search Input with more vibrant colors */}
      <div className="relative group">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-pink-400 group-hover:text-purple-500 transition-colors duration-300" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for ingredients or type custom ones..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="pl-14 h-16 text-base border-pink-200 focus:border-purple-500 focus:ring-purple-500 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50"
          />
        </div>
        
        {/* Enhanced Dropdown with more vibrant styling */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="z-20 w-full mt-3 bg-white/95 backdrop-blur-xl border border-pink-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-200"
          >
            {/* Enhanced Custom Ingredient Option */}
            <div className="p-4 border-b border-pink-100 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50">
              <Button
                onClick={() => {
                  setShowCustomForm(true);
                  setShowDropdown(false);
                }}
                variant="ghost"
                className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-100 h-auto p-4 rounded-xl transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-lg">Add Custom Ingredient</span>
                  <Sparkles className="w-5 h-5 text-pink-400" />
                </div>
              </Button>
            </div>
            
            {/* Enhanced Predefined Ingredients */}
            {filteredIngredients.map((ingredient) => (
              <Button
                key={ingredient.id}
                onClick={() => handleIngredientSelect(ingredient)}
                variant="ghost"
                className="w-full justify-between h-auto p-4 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all duration-300 group rounded-xl"
              >
                <span className="font-medium text-slate-700 group-hover:text-purple-900">{ingredient.name}</span>
                <Badge variant={getCategoryVariant(ingredient.category)} className="group-hover:scale-110 transition-transform duration-300">
                  {ingredient.category}
                </Badge>
              </Button>
            ))}
            
            {filteredIngredients.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <ChefHat className="h-16 w-16 mx-auto mb-4 text-pink-300" />
                <p className="text-xl font-medium">No ingredients found</p>
                <p className="text-sm text-slate-400 mt-2">Try adding a custom one!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Custom Ingredient Form with more vibrant colors */}
      {showCustomForm && (
        <Card className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-pink-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-purple-800 text-xl font-bold">Add Custom Ingredient</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCustomIngredientSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Ingredient name *"
                  value={customIngredient.name}
                  onChange={(e) => setCustomIngredient(prev => ({ ...prev, name: e.target.value }))}
                  className="border-pink-200 focus:border-purple-500 focus:ring-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80"
                  required
                />
                <Input
                  placeholder="Quantity (optional)"
                  value={customIngredient.quantity}
                  onChange={(e) => setCustomIngredient(prev => ({ ...prev, quantity: e.target.value }))}
                  className="border-pink-200 focus:border-purple-500 focus:ring-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80"
                />
                <Input
                  placeholder="Unit (optional)"
                  value={customIngredient.unit}
                  onChange={(e) => setCustomIngredient(prev => ({ ...prev, unit: e.target.value }))}
                  className="border-pink-200 focus:border-purple-500 focus:ring-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80"
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-white font-semibold">
                  <Plus className="mr-2 w-5 h-5" />
                  Add Ingredient
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCustomForm(false);
                    setCustomIngredient({ name: '', quantity: '', unit: '' });
                  }}
                  className="border-slate-300 hover:border-purple-400 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Selected Ingredients with more vibrant styling */}
      {ingredients.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-slate-800 text-xl">Selected Ingredients ({ingredients.length})</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ingredients.map((ingredient) => (
              <Card key={ingredient.id} className="border-pink-200 hover:border-purple-300 transition-all duration-300 shadow-xl hover:shadow-2xl group bg-gradient-to-br from-white via-pink-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate mb-3 text-lg group-hover:text-purple-700 transition-colors duration-300">
                        {ingredient.name}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant={getCategoryVariant(ingredient.category)} className="group-hover:scale-105 transition-transform duration-300">
                          {ingredient.category}
                        </Badge>
                        {(ingredient.quantity || ingredient.unit) && (
                          <span className="text-sm text-slate-600 bg-gradient-to-r from-pink-100 to-purple-100 px-3 py-1.5 rounded-full font-medium border border-pink-200">
                            {ingredient.quantity} {ingredient.unit}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => onRemoveIngredient(ingredient.id)}
                      variant="ghost"
                      size="icon"
                      className="ml-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 group-hover:scale-110"
                      title="Remove ingredient"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
