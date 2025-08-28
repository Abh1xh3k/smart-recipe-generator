// geminitest.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load your Gemini API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

async function generateRecipes(ingredients: string, diet: string, servings: number) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
  You are a professional recipe generator.
  Generate exactly 3 unique recipes using the given inputs.
  Each recipe must contain VERY detailed, step-by-step detailed cooking instructions
  (like a cooking book, each step should be clear and thorough).

  Return ONLY valid JSON (no extra text, no markdown, no explanations)
  following this structure exactly:

  {
    "recipes": [
      {
        "name": "string",
        "instructions": ["step 1", "step 2", "step 3", ...],
        "nutrition": {
          "calories": "string",
          "protein": "string",
          "carbs": "string",
          "fat": "string"
        },
        "difficulty": "Easy | Medium | Hard",
        "time": "string (e.g., '30 minutes')"
      }
    ]
  }

  Input Ingredients: ${ingredients}
  Dietary Preference: ${diet}
  Serving Size: ${servings}
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const parsed = JSON.parse(text);
    console.log("✅ Parsed Recipes:", parsed);
  } catch (err) {
    console.error("❌ JSON Parse Error:", err);
    console.log("Raw Output:", text);
  }
}

// Example call
generateRecipes("paneer, spinach, rice, onion, garlic", "vegetarian", 2);
