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
export async function generateRecipes(userGoal: string, language: string = 'en', count: number = 3, foodName?: string): Promise<any[]> {
  const targetLang = getLang(language);

  const context = foodName 
    ? `containing the ingredient/food: "${foodName}" for someone with the goal: ${userGoal}`
    : `for someone with the goal: ${userGoal}`;

  const prompt = `Generate ${count} healthy recipe ideas ${context}.
IMPORTANT: All recipe names, descriptions, and instructions MUST be in ${targetLang}.
Return ONLY valid JSON (no markdown). Structure:
[
  {
    "id": "unique_id",
    "name": "Recipe Name",
    "description": "Short description",
    "calories": 400,
    "protein": 30,
    "carbs": 40,
    "fat": 12,
    "ingredients": ["item 1", "item 2"],
    "instructions": ["step 1", "step 2"],
    "prepTime": 20,
    "goal": "${userGoal}"
  }
]
IMPORTANT: All text MUST be in ${targetLang}.`;

  const data = await fetchGroq({
    model: FAST_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
    temperature: 0.7,
  });

  let text = (data.choices[0]?.message?.content ?? '').trim();
  // Strip markdown if present
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : (parsed.recipes || []);
  } catch (err) {
    console.warn('[Groq] generateRecipes parse error:', err);
    return [];
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
      max_tokens: 600,
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
