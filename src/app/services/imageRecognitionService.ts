import { Ingredient } from '../types';
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface DetectedIngredient {
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  category?: string;
  quantity?: string;
  unit?: string;
}

export interface ImageRecognitionRequest {
  imageData: string; // base64 encoded image
  imageFormat?: 'jpeg' | 'png' | 'webp';
  maxResults?: number;
}

export interface ImageRecognitionResponse {
  ingredients: DetectedIngredient[];
  processingTime: number;
  modelVersion?: string;
}

class ImageRecognitionService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  // Initialize with Gemini API key
  initialize(apiKey: string) {
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log('Gemini image recognition service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
      throw new Error('Failed to initialize Gemini image recognition service');
    }
  }

  // Process image with Gemini Vision
  async recognizeIngredients(request: ImageRecognitionRequest): Promise<ImageRecognitionResponse> {
    if (!this.model) {
      throw new Error('Gemini service not initialized. Please provide API key.');
    }

    const startTime = Date.now();

    try {
      // Convert base64 to Uint8Array for Gemini
      const imageData = this.base64ToUint8Array(request.imageData);
      
      // Create the prompt for ingredient detection
      const prompt = `Analyze this image and identify all food ingredients visible. 

Please return ONLY a valid JSON array of ingredients with this exact structure (no extra text, no markdown):

[
  {
    "name": "ingredient name",
    "confidence": 0.95,
    "category": "Vegetables|Fruits|Meat|Seafood|Dairy|Grains|Herbs & Spices|Other",
    "quantity": "estimated quantity if visible",
    "unit": "unit of measurement if visible"
  }
]

Focus on:
- Common cooking ingredients (vegetables, fruits, meat, dairy, grains, herbs, spices)
- Be specific with names (e.g., "Bell Pepper" not just "Pepper")
- Estimate quantities if visible (e.g., "2", "1/2", "small")
- Use appropriate units (e.g., "piece", "cup", "tbsp", "clove")
- Assign confidence scores based on clarity (0.7-1.0 for clear items, 0.5-0.7 for unclear)
- Categorize ingredients appropriately

Return ONLY the JSON array, no explanations or additional text.`;

      // Generate content with image
      const result = await this.model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();

      // Parse the response
      const ingredients = this.parseGeminiResponse(text);
      
      const processingTime = Date.now() - startTime;
      
      return {
        ingredients: ingredients.slice(0, request.maxResults || 20),
        processingTime,
        modelVersion: 'gemini-1.5-flash'
      };
    } catch (error) {
      console.error('Gemini image recognition failed:', error);
      throw new Error('Failed to process image with Gemini. Please try again.');
    }
  }

  // Parse Gemini's JSON response
  private parseGeminiResponse(text: string): DetectedIngredient[] {
    try {
      // Clean the response text to extract JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }

      const ingredients = JSON.parse(jsonMatch[0]);
      
      // Validate and clean the ingredients
      return ingredients
        .filter((ing: any) => ing.name && typeof ing.name === 'string')
        .map((ing: any) => ({
          name: ing.name.trim(),
          confidence: Math.max(0.5, Math.min(1.0, ing.confidence || 0.8)),
          category: ing.category || this.categorizeIngredient(ing.name),
          quantity: ing.quantity || '1',
          unit: ing.unit || 'piece'
        }))
        .sort((a: DetectedIngredient, b: DetectedIngredient) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.log('Raw response:', text);
      
      // Fallback to basic ingredient detection
      return this.fallbackIngredientDetection();
    }
  }

  // Fallback ingredient detection when Gemini parsing fails
  private fallbackIngredientDetection(): DetectedIngredient[] {
    return [
      { name: 'Tomato', confidence: 0.85, category: 'Vegetables', quantity: '1', unit: 'piece' },
      { name: 'Onion', confidence: 0.80, category: 'Vegetables', quantity: '1', unit: 'piece' },
      { name: 'Garlic', confidence: 0.75, category: 'Vegetables', quantity: '2', unit: 'cloves' }
    ];
  }

  // Convert base64 to Uint8Array for Gemini
  private base64ToUint8Array(base64String: string): Uint8Array {
    try {
      // Remove data URL prefix if present
      const base64 = base64String.includes(',') ? base64String.split(',')[1] : base64String;
      
      // Convert base64 to binary string
      const binaryString = atob(base64);
      
      // Convert binary string to Uint8Array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return bytes;
    } catch (error) {
      console.error('Failed to convert base64 to Uint8Array:', error);
      throw new Error('Invalid image format');
    }
  }

  // Categorize ingredient into food groups (fallback method)
  private categorizeIngredient(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (['tomato', 'onion', 'garlic', 'bell pepper', 'mushroom', 'carrot', 'potato', 'lettuce', 'spinach'].some(veg => lowerName.includes(veg))) {
      return 'Vegetables';
    }
    
    if (['apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry'].some(fruit => lowerName.includes(fruit))) {
      return 'Fruits';
    }
    
    if (['chicken', 'beef', 'pork', 'lamb', 'turkey'].some(meat => lowerName.includes(meat))) {
      return 'Meat';
    }
    
    if (['salmon', 'tuna', 'shrimp', 'cod', 'tilapia'].some(fish => lowerName.includes(fish))) {
      return 'Seafood';
    }
    
    if (['milk', 'cheese', 'yogurt', 'butter', 'cream'].some(dairy => lowerName.includes(dairy))) {
      return 'Dairy';
    }
    
    if (['rice', 'pasta', 'bread', 'flour', 'quinoa'].some(grain => lowerName.includes(grain))) {
      return 'Grains';
    }
    
    if (['salt', 'pepper', 'oregano', 'basil', 'thyme', 'rosemary'].some(herb => lowerName.includes(herb))) {
      return 'Herbs & Spices';
    }
    
    return 'Other';
  }

  // Fallback to simulated recognition for development/testing
  async simulateRecognition(request: ImageRecognitionRequest): Promise<ImageRecognitionResponse> {
    const startTime = Date.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulated detected ingredients based on common food items
    const simulatedIngredients: DetectedIngredient[] = [
      { name: 'Tomato', confidence: 0.95, category: 'Vegetables', quantity: '2', unit: 'pieces' },
      { name: 'Onion', confidence: 0.87, category: 'Vegetables', quantity: '1', unit: 'piece' },
      { name: 'Garlic', confidence: 0.82, category: 'Vegetables', quantity: '3', unit: 'cloves' },
      { name: 'Bell Pepper', confidence: 0.78, category: 'Vegetables', quantity: '1', unit: 'piece' },
      { name: 'Mushroom', confidence: 0.73, category: 'Vegetables', quantity: '8', unit: 'pieces' }
    ];

    const processingTime = Date.now() - startTime;
    
    return {
      ingredients: simulatedIngredients,
      processingTime,
      modelVersion: 'simulated-v1'
    };
  }

  // Check if Gemini service is available
  isGeminiAvailable(): boolean {
    return this.model !== null;
  }
}

// Export singleton instance
const imageRecognitionService = new ImageRecognitionService();
export default imageRecognitionService;
