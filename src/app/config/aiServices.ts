// AI Service Configuration
// Add your API keys and service URLs here for production use

export const AI_SERVICES_CONFIG = {
  // Google Cloud Vision API
  GOOGLE_CLOUD_VISION: {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY || '',
    serviceUrl: 'https://vision.googleapis.com',
    enabled: false // Set to true when you have valid credentials
  },

  // Azure Computer Vision
  AZURE_COMPUTER_VISION: {
    apiKey: process.env.NEXT_PUBLIC_AZURE_COMPUTER_VISION_API_KEY || '',
    endpoint: process.env.NEXT_PUBLIC_AZURE_COMPUTER_VISION_ENDPOINT || '',
    enabled: false
  },

  // AWS Rekognition
  AWS_REKOGNITION: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    enabled: false
  },

  // OpenAI Vision API (GPT-4V)
  OPENAI_VISION: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    model: 'gpt-4-vision-preview',
    enabled: false
  }
};

// Development/Testing mode
export const isDevelopmentMode = process.env.NODE_ENV === 'development';

// Feature flags
export const FEATURE_FLAGS = {
  IMAGE_RECOGNITION: true,
  CAMERA_CAPTURE: true,
  AI_PROCESSING: true,
  SIMULATION_MODE: isDevelopmentMode // Use simulation in development
};

// Image processing settings
export const IMAGE_SETTINGS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_RESOLUTION: 4096, // Max width/height
  COMPRESSION_QUALITY: 0.8, // JPEG quality
  THUMBNAIL_SIZE: 300 // Thumbnail size for preview
};

// AI Model settings
export const AI_MODEL_SETTINGS = {
  CONFIDENCE_THRESHOLD: 0.7, // Minimum confidence for detection
  MAX_DETECTIONS: 20, // Maximum number of ingredients to detect
  PROCESSING_TIMEOUT: 30000, // 30 seconds timeout
  RETRY_ATTEMPTS: 3
};

// Food ingredient categories for better organization
export const INGREDIENT_CATEGORIES = {
  VEGETABLES: [
    'tomato', 'onion', 'garlic', 'bell pepper', 'mushroom', 'carrot', 'potato',
    'lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'zucchini', 'eggplant',
    'cucumber', 'celery', 'asparagus', 'artichoke', 'beet', 'radish', 'turnip'
  ],
  FRUITS: [
    'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry',
    'raspberry', 'blackberry', 'peach', 'plum', 'cherry', 'pineapple', 'mango',
    'kiwi', 'avocado', 'coconut', 'fig', 'date', 'raisin'
  ],
  MEAT: [
    'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'goose', 'veal',
    'bacon', 'ham', 'sausage', 'steak', 'ground beef', 'pork chop'
  ],
  SEAFOOD: [
    'salmon', 'tuna', 'shrimp', 'cod', 'tilapia', 'mackerel', 'sardine',
    'anchovy', 'oyster', 'clam', 'mussel', 'lobster', 'crab', 'scallop'
  ],
  DAIRY: [
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese',
    'ricotta', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'goat cheese'
  ],
  GRAINS: [
    'rice', 'pasta', 'bread', 'flour', 'quinoa', 'oats', 'barley', 'rye',
    'corn', 'wheat', 'buckwheat', 'millet', 'amaranth', 'teff'
  ],
  HERBS_SPICES: [
    'salt', 'pepper', 'oregano', 'basil', 'thyme', 'rosemary', 'sage', 'parsley',
    'cilantro', 'dill', 'mint', 'chives', 'bay leaf', 'cinnamon', 'nutmeg'
  ]
};

// Helper function to get category for an ingredient
export function getIngredientCategory(ingredientName: string): string {
  const lowerName = ingredientName.toLowerCase();
  
  for (const [category, ingredients] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (ingredients.some(ing => lowerName.includes(ing))) {
      return category.replace('_', ' & ');
    }
  }
  
  return 'Other';
}

// Helper function to check if ingredient is in a specific category
export function isIngredientInCategory(ingredientName: string, category: string): boolean {
  const lowerName = ingredientName.toLowerCase();
  const categoryIngredients = INGREDIENT_CATEGORIES[category as keyof typeof INGREDIENT_CATEGORIES] || [];
  
  return categoryIngredients.some(ing => lowerName.includes(ing));
}
