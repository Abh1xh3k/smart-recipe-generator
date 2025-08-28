// This file contains the actual Gemini integration
// Replace the mock service in recipeGenerationService.ts with this

export interface GeminiResponse {
  recipes: Array<{
    name: string;
    description?: string;
    ingredients: Array<{
      name: string;
      quantity?: string;
      unit?: string;
    }>;
    instructions: string[];
    nutrition: {
      calories: string;
      protein: string;
      carbs: string;
      fat: string;
      fiber?: string;
      sugar?: string;
      sodium?: string;
    };
    difficulty: 'Easy' | 'Medium' | 'Hard';
    time: string;
    servings: number;
    tags: string[];
    cuisine: string;
  }>;
}

type CallOptions = {
  seed?: string | number;
  numRecipes?: number;
  creativity?: 'low' | 'medium' | 'high';
};

type Context = {
  ingredients?: Array<{ name: string }>;
  dietary?: string[];
  servings?: number;
};

// Pseudo-random generator from seed for deterministic variability
const seededRandom = (seed: number) => {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

const pick = <T,>(rand: () => number, arr: T[]) => arr[Math.floor(rand() * arr.length)];

const buildInstructions = (style: string, main: string, rand: () => number) => {
  const aromatics = pick(rand, ['onion', 'garlic', 'ginger', 'shallot']);
  const oil = pick(rand, ['olive oil', 'vegetable oil', 'ghee']);
  const herb = pick(rand, ['basil', 'parsley', 'cilantro', 'thyme']);

  switch (style) {
    case 'Bake':
      return [
        '1) Preheat the oven to 200°C/400°F. Line a baking tray with parchment.',
        `2) Prep ${main}: cut into bite-size pieces. Pat dry to promote browning.`,
        `3) Toss with 2 tbsp ${oil}, 1 tsp salt and 1/2 tsp pepper. Optionally add 1 tsp paprika.`,
        '4) Spread in a single layer. Roast 18–22 min until edges are caramelized; flip halfway.',
        `5) Meanwhile, mix a quick dressing: 1 tbsp lemon juice, 1 tbsp ${oil}, pinch of chili flakes.`,
        `6) Remove from oven; rest 3 min. Toss with the dressing and chopped ${herb}.`,
        '7) Taste and adjust seasoning. Serve warm with yogurt or grains.',
        '8) Storage: refrigerate up to 3 days; reheat at 180°C/350°F for 8–10 min.'
      ];
    case 'Stir-Fry':
      return [
        '1) Prep all ingredients first; a stir-fry moves quickly.',
        `2) Heat a wok over high until lightly smoking. Add 1 tbsp ${oil}.`,
        `3) Add ${aromatics}; stir 30–45 sec until fragrant.`,
        `4) Add ${main}; spread into a single layer. Sear 1–2 min without moving, then stir.`,
        '5) Add firm vegetables first, tender ones last; cook 3–5 min to crisp-tender.',
        '6) Splash 2 tbsp water to steam if needed. Reduce heat to medium.',
        '7) Add sauce (soy 1 tbsp, vinegar 1 tsp, sugar 1/2 tsp); toss 30–60 sec to glaze.',
        `8) Finish with ${herb} and sesame oil. Serve immediately over rice or noodles.`,
        '9) Tip: keep heat high and avoid overcrowding to prevent steaming.'
      ];
    case 'Soup':
      return [
        `1) In a pot, warm 1 tbsp ${oil} over medium.`,
        `2) Sweat diced ${aromatics} 3–4 min until translucent.`,
        `3) Add ${main} and other vegetables; cook 2 min to coat in fat.`,
        '4) Add 4 cups stock/water, bay leaf and salt. Bring to a boil; reduce to a gentle simmer.',
        '5) Simmer 15–25 min until vegetables are tender.',
        '6) Optional: blend partially for body, leaving some texture.',
        `7) Stir in chopped ${herb}; add lemon juice to brighten.`,
        '8) Season to taste. Serve with crusty bread. Storage: 4 days chilled.'
      ];
    case 'Salad':
      return [
        `1) Prep ${main} and vegetables; keep pieces similar in size.`,
        `2) Make dressing: 2 tbsp ${oil}, 1 tbsp acid (lemon/vinegar), 1 tsp mustard, salt & pepper.`,
        '3) Toss sturdy ingredients with half the dressing. Let sit 5–10 min to marinate.',
        '4) Add tender leaves/herbs. Toss with remaining dressing until lightly coated.',
        `5) Garnish with ${herb}, nuts or seeds. Serve immediately.`,
        '6) Tip: salt vegetables first to draw moisture, then dress.'
      ];
    default: // Skillet / Curry etc.
      return [
        `1) Heat 1 tbsp ${oil} in a large skillet over medium-high.`,
        `2) Add ${aromatics}; cook 2–3 min until fragrant.`,
        `3) Add ${main}; brown 3–4 min, stirring occasionally.`,
        '4) Add spices/tomato paste; cook 1 min to bloom.',
        '5) Pour in 1/2 cup liquid (stock/water). Scrape fond; simmer 5–8 min.',
        `6) Finish with chopped ${herb} and a squeeze of lemon.`,
        '7) Season to taste. Serve with grains or flatbread.',
        '8) Storage: refrigerate up to 3 days.'
      ];
  }
};

// Example of how to integrate with your existing Gemini setup:
export const callGeminiAPI = async (prompt: string, options: CallOptions = {}, context: Context = {}): Promise<GeminiResponse | string> => {
  try {
    console.log('Gemini prompt:', prompt);

    const count = Math.max(1, Math.min(6, options.numRecipes ?? 4));
    const seed = Number(options.seed ?? Date.now());
    const rand = seededRandom(seed);

    const styles = ['Skillet', 'Stir-Fry', 'Bake', 'Salad', 'Soup', 'Curry'];
    const diffs: Array<'Easy'|'Medium'|'Hard'> = ['Easy','Medium','Hard'];
    const times = ['15 minutes','20 minutes','25 minutes','30 minutes','40 minutes','1 h'];

    const baseIngredients = (context.ingredients || []).map(i => i.name);
    const dietary = (context.dietary || []).map(d => d.toLowerCase());

    const makeIngredients = () => {
      const list = [] as Array<{ name: string; quantity?: string; unit?: string }>;
      baseIngredients.slice(0, 6).forEach(name => list.push({ name, quantity: '1', unit: 'unit' }));
      ['Olive Oil', 'Salt', 'Pepper'].forEach(name => list.push({ name, quantity: '1', unit: 'tsp' }));
      return list;
    };

    const makeTags = () => {
      const tags = new Set<string>();
      dietary.forEach(d => tags.add(d.replace(/\b\w/g, c => c.toUpperCase())));
      return Array.from(tags);
    };

    const buildName = (idx: number, style: string) => {
      const main = baseIngredients[idx % Math.max(1, baseIngredients.length)] || "Chef's Choice";
      return `${main} ${style}`;
    };

    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      recipes: Array.from({ length: count }).map((_, i) => {
        const style = pick(rand, styles);
        const name = buildName(i, style);
        return {
          name,
          description: `A ${style.toLowerCase()} built around your provided ingredients with minimal pantry staples.`,
          ingredients: makeIngredients(),
          instructions: buildInstructions(style, baseIngredients[i % Math.max(1, baseIngredients.length)] || 'ingredients', rand),
          nutrition: {
            calories: `${320 + Math.floor(rand()*120)}`,
            protein: `${8 + Math.floor(rand()*15)}g`,
            carbs: `${20 + Math.floor(rand()*40)}g`,
            fat: `${6 + Math.floor(rand()*12)}g`,
            fiber: `${3 + Math.floor(rand()*5)}g`,
            sugar: `${3 + Math.floor(rand()*6)}g`,
            sodium: `${300 + Math.floor(rand()*400)}mg`,
          },
          difficulty: pick(rand, diffs),
          time: pick(rand, times),
          servings: context.servings || 4,
          tags: makeTags(),
          cuisine: 'Custom',
        };
      })
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate recipes with Gemini');
  }
};

// To use this with your existing Gemini setup:
// 1. Replace the mock implementation with a real API call
// 2. Keep the options (seed, numRecipes, creativity) to control variability
// 3. Ensure the response parsing matches the expected format
