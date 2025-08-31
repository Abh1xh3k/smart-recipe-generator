# 🍳 Smart Recipe Generator

> **Your AI-powered kitchen companion that turns ingredients into delicious recipes!**

## 🌟 What is This Project?

Imagine having a smart chef in your pocket who can:
- **Look at photos** of your ingredients and tell you what they are
- **Generate personalized recipes** based on what you have
- **Remember your favorite dishes** and cooking preferences
- **Suggest new recipes** you might love

That's exactly what this Smart Recipe Generator does! It's like having a cooking expert who never gets tired and always has new ideas.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Google Gemini API key** (for AI-powered features)

### Installation
```bash
# 1. Clone the project
git clone <your-repo-url>
cd smart-recipe-generator

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 4. Start the development server
npm run dev
```

### Environment Setup
Create a `.env.local` file with:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
MONGODB_URI=your_mongodb_connection_string
```

## 🏗️ Project Structure

```
smart-recipe-generator/
├── 📁 src/                          # Main application code
│   ├── 📁 app/                      # Next.js app router
│   │   ├── 📁 api/                  # Backend API endpoints
│   │   │   ├── 📁 favorites/        # Save favorite recipes
│   │   │   ├── 📁 ratings/          # Rate and review recipes
│   │   │   ├── 📁 recipes/          # Recipe management
│   │   │   └── 📁 recommendations/  # AI-powered suggestions
│   │   ├── 📁 components/           # Reusable UI components
│   │   │   ├── 📁 ui/               # Basic UI elements (buttons, cards, etc.)
│   │   │   ├── 📄 DietaryPreferences.tsx    # Food preference selector
│   │   │   ├── 📄 ImageIngredientRecognition.tsx  # Camera & image upload
│   │   │   ├── 📄 IngredientForm.tsx        # Add ingredients manually
│   │   │   ├── 📄 PersonalizedRecommendations.tsx # AI recipe suggestions
│   │   │   ├── 📄 RatingStars.tsx           # Rate recipes
│   │   │   └── 📄 RecipeDisplay.tsx         # Show recipe details
│   │   ├── 📁 config/               # Configuration files
│   │   │   ├── 📄 aiServices.ts     # AI service settings
│   │   │   └── 📄 geminiConfig.ts   # Google Gemini setup
│   │   ├── 📁 services/             # Business logic
│   │   │   ├── 📄 geminiIntegration.ts      # AI integration
│   │   │   ├── 📄 imageRecognitionService.ts # Photo analysis
│   │   │   ├── 📄 recipeApi.ts      # Recipe data handling
│   │   │   └── 📄 recipeGenerationService.ts # Create recipes
│   │   ├── 📁 models/               # Database models
│   │   │   ├── 📄 Favorite.js       # Saved recipes
│   │   │   ├── 📄 Rating.js         # User ratings
│   │   │   └── 📄 Recipe.js         # Recipe data
│   │   ├── 📁 lib/                  # Utility functions
│   │   │   ├── 📄 db.ts             # Database connection
│   │   │   └── 📄 utils.ts          # Helper functions
│   │   ├── 📄 generate/page.tsx     # Recipe generation page
│   │   ├── 📄 saved/page.tsx        # Saved recipes page
│   │   └── 📄 page.tsx              # Home page
│   └── 📄 types.ts                  # TypeScript type definitions
├── 📁 public/                       # Static assets (images, icons)
├── 📄 package.json                  # Project dependencies
├── 📄 tailwind.config.js            # Styling configuration
└── 📄 tsconfig.json                 # TypeScript configuration
```

## 🎯 How It Works (The Magic Explained!)

### 1. 📸 **Ingredient Detection** (The Smart Eye)
- **Take a photo** of your ingredients using your phone's camera
- **Upload an image** from your gallery
- **AI analyzes the image** and identifies what ingredients you have
- **Smart recognition** works even with messy kitchens and poor lighting!

### 2. 🧠 **Recipe Generation** (The Creative Chef)
- **AI brain** combines your ingredients with cooking knowledge
- **Personalized suggestions** based on your dietary preferences
- **Multiple recipe options** so you never get bored
- **Detailed instructions** with step-by-step guidance

### 3. 💾 **Recipe Management** (Your Digital Cookbook)
- **Save favorite recipes** to your personal collection
- **Rate and review** dishes you've tried
- **Get recommendations** based on what you love
- **Organize by categories** (vegetarian, quick meals, etc.)

## 🔧 Key Features

### 🎥 **Smart Camera Integration**
- **Real-time camera access** with permission handling
- **Photo capture** with instant ingredient recognition
- **Mobile-optimized** for both phones and tablets
- **Drag & drop** image upload for desktop users

### 🤖 **AI-Powered Recognition**
- **Google Gemini integration** for advanced image analysis
- **Fallback simulation** when AI services aren't available
- **Confidence scoring** to show how sure the AI is
- **Multiple ingredient detection** in a single image

### 🍽️ **Recipe Intelligence**
- **Dietary preference handling** (vegetarian, vegan, gluten-free, etc.)
- **Serving size calculations** for any number of people
- **Ingredient substitution** suggestions
- **Cooking time estimates** and difficulty levels

### 💾 **Data Persistence**
- **MongoDB integration** for storing recipes and preferences
- **User favorites** and rating system
- **Recipe history** and learning from your choices
- **Cloud backup** for your personal cookbook

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 15** - Modern React framework with app router
- **React 19** - Latest React with hooks and modern patterns
- **TypeScript** - Type-safe JavaScript for better code quality
- **Tailwind CSS** - Utility-first CSS framework for beautiful designs

### **Backend**
- **Node.js** - JavaScript runtime for server-side logic
- **MongoDB** - NoSQL database for flexible data storage
- **Mongoose** - MongoDB object modeling for Node.js

### **AI & Services**
- **Google Gemini** - Advanced AI for image recognition and recipe generation
- **Image Processing** - Computer vision for ingredient identification
- **Natural Language Processing** - Understanding cooking instructions

### **Development Tools**
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📱 How to Use (Step by Step)

### **Step 1: Get Started**
1. Open the app in your browser
2. Click "Generate Recipe" to begin
3. Choose your dietary preferences (vegetarian, vegan, etc.)

### **Step 2: Add Ingredients**
**Option A: Smart Camera**
1. Click the camera button
2. Allow camera permissions when prompted
3. Point camera at your ingredients
4. Take a photo - AI will identify everything!

**Option B: Manual Entry**
1. Click "Add Ingredient"
2. Type ingredient name
3. Select category and quantity
4. Add more ingredients as needed

### **Step 3: Generate Recipes**
1. Click "Generate Recipe"
2. AI creates multiple recipe options
3. Browse through suggestions
4. Pick the one that sounds delicious!

### **Step 4: Save & Rate**
1. Try the recipe
2. Rate it with stars (1-5)
3. Save to favorites if you love it
4. Get personalized recommendations

## 🎨 User Interface Features

### **Responsive Design**
- **Mobile-first approach** - Works perfectly on phones
- **Tablet optimized** - Great experience on iPads
- **Desktop friendly** - Full features on computers

### **Accessibility**
- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** options
- **Touch-friendly** buttons and controls

### **Visual Appeal**
- **Modern design** with smooth animations
- **Intuitive icons** and clear labels
- **Consistent color scheme** throughout
- **Professional layout** that's easy to navigate

## 🔒 Security & Privacy

### **Data Protection**
- **No personal data** stored without permission
- **Secure API calls** with proper authentication
- **Environment variables** for sensitive information
- **HTTPS only** for secure connections

### **User Control**
- **Delete your data** anytime
- **Export your recipes** if needed
- **Privacy settings** for sharing preferences
- **Anonymous usage** options available

## 🚀 Deployment

### **Local Development**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Check code quality
```

### **Production Deployment**
1. **Build the project**: `npm run build`
2. **Set environment variables** in your hosting platform
3. **Deploy to Vercel, Netlify, or your preferred host**
4. **Configure MongoDB** connection string
5. **Set up Google Gemini API** key

### **Environment Variables**
```env
# Required
GEMINI_API_KEY=your_api_key_here
MONGODB_URI=your_mongodb_connection_string

# Optional
NODE_ENV=production
NEXT_PUBLIC_APP_URL=your_app_url
```

## 🤝 Contributing

### **How to Help**
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request** with detailed description

### **Development Guidelines**
- **Follow TypeScript** best practices
- **Write meaningful commit messages**
- **Test your changes** before submitting
- **Update documentation** for new features

## 🐛 Troubleshooting

### **Common Issues**

**Camera Not Working?**
- Check browser permissions
- Ensure you're on HTTPS
- Try refreshing the page
- Check if another app is using the camera

**AI Recognition Failing?**
- Verify your Gemini API key is correct
- Check internet connection
- Ensure image quality is good
- Try with a different image

**Database Connection Issues?**
- Verify MongoDB connection string
- Check network connectivity
- Ensure database is running
- Check authentication credentials

### **Getting Help**
1. **Check the console** for error messages
2. **Review environment variables** are set correctly
3. **Check network tab** for failed API calls
4. **Open an issue** on GitHub with details

## 📚 Learning Resources

### **Technologies Used**
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Guide](https://tailwindcss.com/docs)
- [MongoDB Tutorial](https://docs.mongodb.com/)

### **AI & Machine Learning**
- [Google Gemini API](https://ai.google.dev/)
- [Computer Vision Basics](https://en.wikipedia.org/wiki/Computer_vision)
- [Natural Language Processing](https://en.wikipedia.org/wiki/Natural_language_processing)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** for providing the AI capabilities
- **Next.js team** for the amazing framework
- **MongoDB** for the flexible database solution
- **Open source community** for the tools and libraries

## 📞 Support & Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/smart-recipe-generator/issues)
- **Discussions**: [Join the community](https://github.com/yourusername/smart-recipe-generator/discussions)
- **Email**: your.email@example.com

---

## 🌟 **Ready to Cook Something Amazing?**

Start your culinary journey with AI-powered recipe generation! Whether you're a beginner cook or a seasoned chef, this tool will help you discover new flavors and make the most of your ingredients.

**Happy Cooking! 🍳✨**