import { Ingredient } from '../types';
import { GoogleGenAI } from "@google/genai";

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
  private genAI: GoogleGenAI | null = null;
  private model: string = '';

  // Ingredient dictionary for vast categorization
  private ingredientDictionary: Record<string, string> = {
    // Vegetables
    "tomato": "Vegetables", "onion": "Vegetables", "garlic": "Vegetables", "bell pepper": "Vegetables", "chili": "Vegetables", "chilli": "Vegetables", "green chili": "Vegetables", "red chili": "Vegetables", "ginger": "Vegetables", "carrot": "Vegetables", "potato": "Vegetables", "spinach": "Vegetables", "lettuce": "Vegetables", "broccoli": "Vegetables", "cauliflower": "Vegetables", "cabbage": "Vegetables", "eggplant": "Vegetables", "brinjal": "Vegetables", "okra": "Vegetables", "zucchini": "Vegetables", "pumpkin": "Vegetables", "cucumber": "Vegetables", "peas": "Vegetables", "corn": "Vegetables", "radish": "Vegetables", "beetroot": "Vegetables", "celery": "Vegetables", "asparagus": "Vegetables", "kale": "Vegetables", "fenugreek": "Vegetables", "drumstick": "Vegetables",

    // Fruits
    "apple": "Fruits", "banana": "Fruits", "orange": "Fruits", "lemon": "Fruits", "lime": "Fruits", "grape": "Fruits", "strawberry": "Fruits", "blueberry": "Fruits", "mango": "Fruits", "pineapple": "Fruits", "papaya": "Fruits", "watermelon": "Fruits", "muskmelon": "Fruits", "pomegranate": "Fruits", "guava": "Fruits", "pear": "Fruits", "peach": "Fruits", "plum": "Fruits", "apricot": "Fruits", "fig": "Fruits", "kiwi": "Fruits", "starfruit": "Fruits",

    // Meat
    "chicken": "Meat", "beef": "Meat", "pork": "Meat", "lamb": "Meat", "turkey": "Meat", "duck": "Meat", "goat": "Meat",

    // Seafood
    "salmon": "Seafood", "tuna": "Seafood", "shrimp": "Seafood", "prawn": "Seafood", "crab": "Seafood", "lobster": "Seafood", "cod": "Seafood", "tilapia": "Seafood", "mackerel": "Seafood", "anchovy": "Seafood",

    // Dairy
    "milk": "Dairy", "cheese": "Dairy", "yogurt": "Dairy", "butter": "Dairy", "cream": "Dairy", "paneer": "Dairy", "ghee": "Dairy",

    // Grains
    "rice": "Grains", "pasta": "Grains", "bread": "Grains", "flour": "Grains", "quinoa": "Grains", "wheat": "Grains", "oats": "Grains", "barley": "Grains", "millet": "Grains", "sorghum": "Grains",

    // Herbs & Spices
    "salt": "Herbs & Spices", "pepper": "Herbs & Spices", "oregano": "Herbs & Spices", "basil": "Herbs & Spices", "thyme": "Herbs & Spices", "rosemary": "Herbs & Spices", "coriander": "Herbs & Spices", "cilantro": "Herbs & Spices", "cumin": "Herbs & Spices", "turmeric": "Herbs & Spices", "chili powder": "Herbs & Spices", "paprika": "Herbs & Spices", "nutmeg": "Herbs & Spices", "clove": "Herbs & Spices", "cinnamon": "Herbs & Spices", "cardamom": "Herbs & Spices", "mustard seeds": "Herbs & Spices", "fenugreek seeds": "Herbs & Spices"
  };

  // Initialize with Gemini API key
  initialize(apiKey: string) {
    console.log('🔧 Initializing Gemini service...');
    console.log('🔑 API Key provided:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');
    
    try {
      this.genAI = new GoogleGenAI({ apiKey });
      this.model = 'gemini-2.5-flash';
      console.log('✅ Gemini image recognition service initialized successfully');
      console.log('🤖 Model:', this.model);
    } catch (error) {
      console.error('❌ Failed to initialize Gemini service:', error);
      throw new Error('Failed to initialize Gemini image recognition service');
    }
  }

  async recognizeIngredients(request: ImageRecognitionRequest): Promise<ImageRecognitionResponse> {
    console.log('🔍 Starting image recognition process...');
    console.log('📊 Request details:', { 
      hasModel: !!this.model, 
      imageDataLength: request.imageData?.length || 0,
      maxResults: request.maxResults 
    });

    if (!this.model) {
      console.warn('⚠️ Gemini service not initialized - falling back to simulation');
      return this.simulateRecognition(request);
    }

    const startTime = Date.now();

    try {
      console.log('🔄 Processing image data...');
      // Extract the base64 data without the data URL prefix
      const base64Data = request.imageData.includes(',') ? request.imageData.split(',')[1] : request.imageData;
      console.log('✅ Base64 data extracted, length:', base64Data.length);

      const prompt = `Analyze this image and identify ALL food ingredients visible, whether common or uncommon.

Return ONLY a valid JSON array of ingredients with this exact structure (no extra text, no markdown):

[
  {
    "name": "ingredient name",
    "confidence": 0.95,
    "category": "Vegetables|Fruits|Meat|Seafood|Dairy|Grains|Herbs & Spices|Other",
    "quantity": "estimated quantity if visible",
    "unit": "unit of measurement if visible"
  }
]

⚠️ Be precise and specific:
- Distinguish between visually similar items (e.g., Chili vs Tomato vs Bell Pepper).
- Use exact names even if uncommon (e.g., Okra, Starfruit, Kale, Fenugreek leaves).
- Estimate quantities if visible.
- Assign confidence scores.`;

             console.log('🤖 Sending request to Gemini AI...');
       console.log('📸 Base64 data type:', typeof base64Data);
       console.log('📸 Base64 data length:', base64Data.length);
       
       let text: string = '';
       try {
         const contents = [
           {
             role: 'user',
             parts: [
               {
                 inlineData: {
                   data: base64Data,
                   mimeType: 'image/jpeg',
                 },
               },
               {
                 text: prompt,
               },
             ],
           },
         ];

        const config = {
          responseModalities: ['TEXT'],
        };

                 console.log('🤖 Sending request to Gemini AI...');
         const response = await this.genAI!.models.generateContentStream({
           model: this.model,
           config,
           contents,
         });

        // Collect the response text
        for await (const chunk of response) {
          if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
            text += chunk.candidates[0].content.parts[0].text;
          }
        }
        
        console.log('📝 Raw Gemini response:', text);
      } catch (apiError: any) {
        console.error('❌ Gemini API error:', apiError);
        console.error('❌ Error details:', {
          name: apiError?.name,
          message: apiError?.message,
          status: apiError?.status,
          statusText: apiError?.statusText
        });
        throw apiError;
      }

      const ingredients = this.parseGeminiResponse(text);
      console.log('🍅 Parsed ingredients:', ingredients);
      
      const processingTime = Date.now() - startTime;

      return {
        ingredients: ingredients.slice(0, request.maxResults || 50),
        processingTime,
        modelVersion: 'gemini-2.5-flash-image-preview'
      };
    } catch (error) {
      console.error('❌ Gemini image recognition failed:', error);
      console.log('🔄 Falling back to simulation due to Gemini error...');
      return this.simulateRecognition(request);
    }
  }

  private parseGeminiResponse(text: string): DetectedIngredient[] {
    console.log('🔍 Parsing Gemini response...');
    console.log('📝 Response text length:', text.length);
    console.log('📝 Response preview:', text.substring(0, 200) + '...');
    
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('⚠️ No valid JSON array found in response');
        console.log('🔍 Full response text:', text);
        throw new Error('No valid JSON array found in response');
      }

      console.log('✅ Found JSON match:', jsonMatch[0]);
      const ingredients = JSON.parse(jsonMatch[0]);
      console.log('📊 Parsed JSON ingredients:', ingredients);

      const filteredIngredients = ingredients
        .filter((ing: any) => ing.name && typeof ing.name === 'string')
        .map((ing: any) => ({
          name: ing.name.trim(),
          confidence: Math.max(0.5, Math.min(1.0, ing.confidence || 0.8)),
          category: ing.category || this.categorizeIngredient(ing.name),
          quantity: ing.quantity || '1',
          unit: ing.unit || 'piece'
        }))
        .sort((a: DetectedIngredient, b: DetectedIngredient) => b.confidence - a.confidence);
      
      console.log('🎯 Final processed ingredients:', filteredIngredients);
      return filteredIngredients;
    } catch (error) {
      console.error('❌ Failed to parse Gemini response:', error);
      console.log('📝 Raw response:', text);
      console.log('🔄 Using fallback detection...');
      return this.fallbackIngredientDetection();
    }
  }

  private fallbackIngredientDetection(): DetectedIngredient[] {
    console.log('🔄 Using fallback ingredient detection...');
    // Return empty array instead of hardcoded ingredients
    // This ensures we only show ingredients that were actually detected
    console.log('⚠️ No ingredients detected - returning empty array');
    return [];
  }



  private categorizeIngredient(name: string): string {
    const lowerName = name.toLowerCase();
    for (const key in this.ingredientDictionary) {
      if (lowerName.includes(key)) {
        return this.ingredientDictionary[key];
      }
    }
    return 'Other';
  }

  async simulateRecognition(request: ImageRecognitionRequest): Promise<ImageRecognitionResponse> {
    console.log('🎭 Running simulation mode...');
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For debugging purposes, return some test ingredients
    // In production, this would be replaced with actual AI recognition
    const simulatedIngredients: DetectedIngredient[] = [
      { name: 'Test Tomato', confidence: 0.95, category: 'Vegetables', quantity: '1', unit: 'piece' },
      { name: 'Test Onion', confidence: 0.87, category: 'Vegetables', quantity: '1', unit: 'piece' }
    ];

    const processingTime = Date.now() - startTime;
    console.log('🎭 Simulation completed with ingredients:', simulatedIngredients);

    return {
      ingredients: simulatedIngredients,
      processingTime,
      modelVersion: 'simulated-v1'
    };
  }

  isGeminiAvailable(): boolean {
    const available = this.genAI !== null && this.model !== '';
    console.log('🔍 Checking Gemini availability:', available ? 'Available' : 'Not available');
    return available;
  }
}

const imageRecognitionService = new ImageRecognitionService();
export default imageRecognitionService;
