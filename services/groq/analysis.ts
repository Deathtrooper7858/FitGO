import { getCuratedRecipes } from '../recipes/curatedRecipes';
import { getLang, fetchGroq, CHAT_MODEL, FAST_MODEL } from './core';

// ─── Weekly analysis ───────────────────────────────────────────────────────────
export async function generateWeeklyAnalysis(data: {
  avgCalories: number;
  targetCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  goal: string;
  daysLogged: number;
}, language: string = 'en'): Promise<string> {
  const targetLang = getLang(language);

  const prompt = `Provide a concise weekly nutrition analysis (max 150 words) for this user:
- Goal: ${data.goal}
- Days logged: ${data.daysLogged}/7
- Average calories: ${data.avgCalories} kcal (target: ${data.targetCalories})
- Average macros: ${data.avgProtein}g protein, ${data.avgCarbs}g carbs, ${data.avgFat}g fat
IMPORTANT: You MUST respond in ${targetLang}.
Give 2-3 specific, actionable tips for next week. Be encouraging.`;

  const responseData = await fetchGroq({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.7,
  });

  return responseData.choices[0]?.message?.content ?? '';
}

// ─── Generate Recipes ─────────────────────────────────────────────────────────
function extractRecipesFromJson(text: string): any[] | null {
  if (!text) return null;
  // Clean markdown backticks
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  // Try extracting array directly
  const start = clean.indexOf('[');
  const end = clean.lastIndexOf(']');

  if (start !== -1 && end !== -1 && end > start) {
    const arrayStr = clean.slice(start, end + 1);
    try {
      const parsed = JSON.parse(arrayStr);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // Partial JSON repair: LLM may have been truncated near token limit
      const items: any[] = [];
      const objectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      let match;
      while ((match = objectRegex.exec(arrayStr)) !== null) {
        try {
          const item = JSON.parse(match[0]);
          if (item && (item.name || item.title)) items.push(item);
        } catch {}
      }
      if (items.length > 0) return items;
    }
  }

  // Check if wrapped in object { "recipes": [...] } or { "items": [...] }
  const objStart = clean.indexOf('{');
  const objEnd = clean.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    try {
      const parsed = JSON.parse(clean.slice(objStart, objEnd + 1));
      if (Array.isArray(parsed.recipes) && parsed.recipes.length > 0) return parsed.recipes;
      if (Array.isArray(parsed.items) && parsed.items.length > 0) return parsed.items;
    } catch {}
  }

  return null;
}

export async function generateRecipes(userGoal: string, language: string = 'en', count: number = 6, foodName?: string): Promise<any[]> {
  const targetLang = getLang(language);
  const safeCount = Math.min(Math.max(count, 3), 6); // Keep reasonable count to prevent token truncation

  const context = foodName 
    ? `based on the query/ingredient: "${foodName}". Identify what food this is (it could be in any language), find the best standard recipes for it, and then output them for someone with the goal: ${userGoal}`
    : `for someone with the goal: ${userGoal}`;

  const prompt = `Generate ${safeCount} healthy, delicious recipe ideas ${context}.
IMPORTANT: You MUST understand the search query regardless of the language it is written in. The final output (recipe names, descriptions, and instructions) MUST be completely translated to ${targetLang}.
Return ONLY valid JSON (no conversational text, no markdown). Structure:
[
  {
    "id": "unique_id",
    "name": "Recipe Name",
    "description": "Short appetizing description",
    "calories": 420,
    "protein": 35,
    "carbs": 40,
    "fat": 12,
    "ingredients": ["150g ingredient 1", "50g ingredient 2"],
    "instructions": ["Step 1 description", "Step 2 description"],
    "prepTime": 20,
    "goal": "${userGoal}"
  }
]
IMPORTANT: All text MUST be in ${targetLang}.`;

  try {
    const data = await fetchGroq({
      model: FAST_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2800,
      temperature: 0.7,
    });

    const text = (data.choices[0]?.message?.content ?? '').trim();
    const rawRecipes = extractRecipesFromJson(text);

    if (rawRecipes && rawRecipes.length > 0) {
      return rawRecipes.map((r, i) => ({
        id: r.id || `recipe_${Date.now()}_${i}`,
        name: r.name || r.title || 'Receta Fit',
        description: r.description || '',
        calories: Math.round(Number(r.calories) || 400),
        protein: Math.round(Number(r.protein) || 30),
        carbs: Math.round(Number(r.carbs) || 35),
        fat: Math.round(Number(r.fat) || 12),
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        instructions: Array.isArray(r.instructions) ? r.instructions : [],
        prepTime: Math.round(Number(r.prepTime) || 20),
        goal: (r.goal === 'lose' || r.goal === 'gain' || r.goal === 'maintain') ? r.goal : (userGoal as any || 'maintain'),
        isFavorite: false,
      }));
    }

    console.warn('[Groq] generateRecipes returned empty or unparseable JSON. Falling back to curated catalog.');
    return getCuratedRecipes(foodName, userGoal, language);
  } catch (err) {
    console.warn('[Groq] generateRecipes network or proxy error, falling back to curated recipes:', err);
    return getCuratedRecipes(foodName, userGoal, language);
  }
}

// ─── Parse Voice/Text Log ─────────────────────────────────────────────────────
export async function parseVoiceLog(text: string, language: string = 'en'): Promise<{ 
  name: string; grams: number; calories: number; protein: number; carbs: number; fat: number;
  sugar?: number; fiber?: number; sodium?: number; iron?: number; calcium?: number; saturatedFat?: number; transFat?: number;
}[]> {
  const targetLang = getLang(language);
  const prompt = `You are an expert nutritionist. Extract food items and portions from: "${text}".
Return ONLY a JSON object with this structure:
{
  "items": [
    { 
      "name": "Food Name in ${targetLang}", 
      "grams": 150, 
      "calories": 200, 
      "protein": 15, 
      "carbs": 20, 
      "fat": 8, 
      "sugar": 5, 
      "fiber": 3, 
      "sodium": 300, 
      "iron": 1.2, 
      "calcium": 150, 
      "saturatedFat": 2, 
      "transFat": 0 
    }
  ]
}
Important: Group multiple units (e.g. "2 eggs") into one entry. DO NOT split mixed dishes (like salads, sandwiches, stews) into individual ingredients; keep them as a single unified food item. Be accurate with nutrition data. Use ${targetLang} for names.`;

  try {
    const data = await fetchGroq({
      model: FAST_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.1,
    });

    let content = (data.choices[0]?.message?.content ?? '').trim();
    
    // Strip markdown if present
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    // Robust JSON extraction
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');
    const arrayStartIndex = content.indexOf('[');
    const arrayEndIndex = content.lastIndexOf(']');
    
    if (arrayStartIndex !== -1 && arrayEndIndex !== -1 && (startIndex === -1 || arrayStartIndex < startIndex)) {
      content = content.slice(arrayStartIndex, arrayEndIndex + 1);
    } else if (startIndex !== -1 && endIndex !== -1) {
      content = content.slice(startIndex, endIndex + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError: any) {
      console.warn('[Groq] parseVoiceLog JSON parse error:', parseError.message, 'Content:', content);
      throw new Error(`Invalid JSON from AI: ${parseError.message}`);
    }

    return Array.isArray(parsed) ? parsed : (parsed.items || []);
  } catch (error) {
    console.warn('[Groq] parseVoiceLog error:', error);
    throw error;
  }
}
// ─── Estimate Activity Calories ───────────────────────────────────────────────
export async function estimateActivityCalories(description: string, duration: number, language: string = 'en'): Promise<number> {
  const targetLang = getLang(language);

  const prompt = `You are a fitness expert. Estimate the total calories burned for this activity: "${description}" for a duration of ${duration} minutes. 
Provide a realistic estimate based on standard MET values for a person of average weight (70kg/154lbs).

Return ONLY a valid JSON object. Structure:
{
  "calories": 250,
  "reasoning": "Brief explanation in ${targetLang}"
}

Important: Return ONLY the JSON.`;

  const data = await fetchGroq({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.2,
  });

  let content = (data.choices[0]?.message?.content ?? '').trim();
  content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    const parsed = JSON.parse(content);
    return Math.round(parsed.calories || 0);
  } catch (err) {
    console.warn('[Groq] estimateActivityCalories parse error:', err);
    return 0;
  }
}
