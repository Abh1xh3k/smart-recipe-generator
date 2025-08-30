# 🍅 Image Ingredient Recognition with Gemini AI

This feature uses **Google's Gemini AI** to automatically detect ingredients from photos using advanced computer vision. Users can either upload images or take photos with their camera to instantly identify food ingredients with high accuracy.

## ✨ Features

- **📸 Camera Capture**: Take photos directly from the device camera
- **📁 Image Upload**: Upload existing images (JPG, PNG, WebP)
- **🤖 Gemini AI Recognition**: Powered by Google's latest AI model
- **🏷️ Smart Categorization**: Automatically categorizes ingredients (Vegetables, Fruits, Meat, etc.)
- **📱 Mobile Optimized**: Responsive design for mobile and desktop
- **⚡ Real-time Processing**: Fast AI processing with progress indicators
- **🔄 Fallback Mode**: Simulation mode when Gemini is not available

## 🚀 How It Works

1. **Capture/Upload**: User takes a photo or uploads an image
2. **Gemini Processing**: Image is sent to Gemini AI for ingredient detection
3. **Smart Detection**: AI identifies food items with confidence scores and quantities
4. **Categorization**: Ingredients are automatically categorized by type
5. **Add to List**: Detected ingredients can be added to the recipe generator

## 🛠️ Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Environment Variables

Create a `.env.local` file in your project root and add your Gemini API key:

```bash
# Gemini API Key (Required for real AI recognition)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Install Dependencies

Make sure you have the Google Generative AI package:

```bash
npm install @google/generative-ai
```

### 4. Restart Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

## 📱 Usage

### For Users

1. **Open the App**: Navigate to the recipe generation page
2. **Check AI Status**: Look for the status indicator showing "Connected" or "Simulation Mode"
3. **Click "Scan Ingredients"**: Look for the blue "Scan Ingredients" button
4. **Choose Method**:
   - **Camera**: Take a photo of your ingredients
   - **Upload**: Select an existing image from your device
5. **Process Image**: Click "Detect Ingredients" to analyze with Gemini AI
6. **Review Results**: Check detected ingredients, confidence scores, and quantities
7. **Add to List**: Click "Add All Ingredients" to include them

### For Developers

#### Basic Integration

```typescript
import ImageIngredientRecognition from './components/ImageIngredientRecognition';

function MyComponent() {
  const [showRecognition, setShowRecognition] = useState(false);
  
  const handleIngredientsDetected = (ingredients: Ingredient[]) => {
    // Add detected ingredients to your form
    console.log('Detected ingredients:', ingredients);
  };

  return (
    <div>
      <button onClick={() => setShowRecognition(true)}>
        Scan Ingredients
      </button>
      
      {showRecognition && (
        <ImageIngredientRecognition
          onIngredientsDetected={handleIngredientsDetected}
          onClose={() => setShowRecognition(false)}
        />
      )}
    </div>
  );
}
```

#### Using the Service Directly

```typescript
import imageRecognitionService from './services/imageRecognitionService';

// Initialize with your Gemini API key
imageRecognitionService.initialize(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// Process an image
const result = await imageRecognitionService.recognizeIngredients({
  imageData: base64Image,
  maxResults: 10
});

console.log('Detected ingredients:', result.ingredients);
```

## 🔧 How Gemini Integration Works

### AI Model
- **Model**: `gemini-1.5-flash` (latest and fastest)
- **Capabilities**: Advanced image understanding, ingredient recognition, quantity estimation
- **Response Format**: Structured JSON with ingredient details

### Prompt Engineering
The system uses carefully crafted prompts to ensure Gemini returns structured data:

```typescript
const prompt = `Analyze this image and identify all food ingredients visible. 

Please return ONLY a valid JSON array of ingredients with this exact structure:

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
- Common cooking ingredients
- Specific names (e.g., "Bell Pepper" not just "Pepper")
- Quantity estimation when visible
- Appropriate categorization
- Confidence scoring based on clarity

Return ONLY the JSON array, no explanations.`;
```

### Response Parsing
- **JSON Extraction**: Automatically extracts JSON from Gemini's response
- **Validation**: Ensures all required fields are present
- **Fallback**: Graceful degradation if parsing fails
- **Error Handling**: User-friendly error messages

## 🧪 Testing

### Development Mode (No API Key)
- Uses simulated recognition for testing
- 2-second processing simulation
- Sample ingredients for development

### Production Mode (With API Key)
- Real Gemini AI processing
- Actual image analysis
- High accuracy ingredient detection

### Testing with Real Images
1. **Set up Gemini API key** in `.env.local`
2. **Restart development server**
3. **Test with food photos** to verify accuracy
4. **Monitor API usage** in Google AI Studio

## 📊 Performance & Optimization

### Image Processing
- **Format Support**: JPG, PNG, WebP
- **Size Limits**: 10MB maximum
- **Compression**: Automatic optimization for API calls
- **Base64 Conversion**: Efficient binary handling for Gemini

### AI Processing
- **Fast Response**: Gemini 1.5 Flash is optimized for speed
- **Batch Processing**: Can handle multiple ingredients per image
- **Confidence Scoring**: Helps users understand detection accuracy
- **Fallback Handling**: Graceful degradation on errors

### Caching & Optimization
- **Session Caching**: Results cached during the session
- **Image Caching**: Processed images cached to avoid reprocessing
- **Error Recovery**: Automatic retry and fallback mechanisms

## 🔒 Security & Privacy

### API Key Security
- **Environment Variables**: Never committed to version control
- **Client-Side**: Keys are exposed to the client (use with caution)
- **Server-Side**: Consider moving AI processing to backend for production

### Data Privacy
- **Image Storage**: Images processed in memory, not stored permanently
- **API Logs**: Google may log your images for service improvement
- **User Consent**: Inform users about image processing
- **Local Processing**: Images stay on user's device until sent to Gemini

## 🚨 Troubleshooting

### Common Issues

1. **"Simulation Mode" Status**
   - Check if `.env.local` file exists
   - Verify `NEXT_PUBLIC_GEMINI_API_KEY` is set correctly
   - Restart development server after adding environment variable

2. **API Key Errors**
   - Verify API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Check API key permissions and quotas
   - Ensure key is not expired or revoked

3. **Image Processing Errors**
   - Check image format (JPG, PNG, WebP supported)
   - Verify image size (under 10MB)
   - Ensure image contains visible food ingredients

4. **Slow Processing**
   - Check network connection
   - Verify Gemini API status
   - Consider image compression for large files

### Debug Mode

Enable debug logging in development:

```typescript
// Check Gemini status
console.log('Gemini available:', imageRecognitionService.isGeminiAvailable());

// Check environment variable
console.log('API Key set:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
```

## 📈 Future Enhancements

### Planned Features
- **Batch Processing**: Process multiple images at once
- **Recipe Suggestions**: AI-powered recommendations based on detected ingredients
- **Nutritional Analysis**: Automatic nutritional information from images
- **Allergen Detection**: Identify potential allergens in ingredients
- **Portion Estimation**: More accurate quantity estimation

### Integration Opportunities
- **Smart Fridges**: Connect with IoT devices
- **Shopping Lists**: Automatic grocery list generation
- **Meal Planning**: AI-powered meal suggestions
- **Social Sharing**: Share ingredient discoveries with friends

## 💰 Cost Considerations

### Gemini API Pricing
- **Free Tier**: Generous free usage for development
- **Paid Tier**: Very affordable for production use
- **Cost Control**: Set usage limits in Google AI Studio
- **Monitoring**: Track usage and costs in real-time

### Optimization Tips
- **Image Compression**: Reduce file sizes before processing
- **Batch Processing**: Process multiple ingredients per image
- **Caching**: Avoid reprocessing the same images
- **Fallback Mode**: Use simulation for development/testing

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Implement your changes**
4. **Add tests** for new functionality
5. **Submit a pull request**

## 📄 License

This feature is part of the Smart Recipe Generator project. See the main LICENSE file for details.

## 🆘 Support

For issues or questions:

1. **Check the troubleshooting section** above
2. **Review the code** in `src/app/components/ImageIngredientRecognition.tsx`
3. **Check the service** in `src/app/services/imageRecognitionService.ts`
4. **Verify Gemini setup** in `src/app/config/geminiConfig.ts`
5. **Open an issue** on GitHub with detailed information

---

**Happy Cooking with AI! 🍳🤖✨**
