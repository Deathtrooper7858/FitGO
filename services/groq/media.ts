import axios from 'axios';
import { supabase } from '../supabase';
import { getLang, fetchGroq, AUDIO_MODEL, FAST_MODEL } from './core';

// ─── Transcribe Audio ─────────────────────────────────────────────────────────
export async function transcribeAudio(uri: string): Promise<string> {
  const fileExt = uri.split('.').pop()?.split('?')[0] || 'm4a';
  const mimeType = fileExt === 'wav' ? 'audio/wav' : fileExt === 'mp3' ? 'audio/mpeg' : 'audio/m4a';

  const formData = new FormData();
  formData.append('file', { uri, name: `audio.${fileExt}`, type: mimeType } as any);
  formData.append('model', AUDIO_MODEL);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || supabaseAnonKey;

  const response = await axios.post(`${supabaseUrl}/functions/v1/groq-proxy`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
    timeout: 30000,
  });

  return response.data?.text ?? '';
}

// ─── Get Food by Barcode using AI ─────────────────────────────────────────────
export async function getFoodByBarcodeAI(barcode: string, language: string = 'en'): Promise<{
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
  sodium?: number;
  saturatedFat?: number;
  transFat?: number;
  iron?: number;
  calcium?: number;
} | null> {
  const targetLang = getLang(language);
  const prompt = `You are a nutrition database expert. Identify the food product, brand, and nutrition facts per 100g for this EAN/UPC barcode: "${barcode}".
Search your extensive knowledge base of product barcodes.
If you know or can identify the product with high confidence, return a JSON object with this exact structure:
{
  "found": true,
  "name": "Product Name in ${targetLang}",
  "brand": "Brand Name",
  "calories": 250,
  "protein": 12,
  "carbs": 30,
  "fat": 8,
  "sugar": 5,
  "fiber": 2,
  "sodium": 200,
  "saturatedFat": 2,
  "transFat": 0,
  "iron": 1,
  "calcium": 100
}
If you do not know this barcode or cannot identify the product with high confidence, return:
{
  "found": false
}
Return ONLY valid JSON. Do not include any explanations or markdown formatting outside the JSON.`;

  try {
    const data = await fetchGroq({
      model: FAST_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    let content = (data.choices[0]?.message?.content ?? '').trim();
    // Robust JSON extraction
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      content = content.slice(startIndex, endIndex + 1);
    }

    const parsed = JSON.parse(content);
    if (parsed.found && parsed.name) {
      return {
        name: parsed.name,
        brand: parsed.brand,
        calories: parsed.calories ?? 0,
        protein: parsed.protein ?? 0,
        carbs: parsed.carbs ?? 0,
        fat: parsed.fat ?? 0,
        sugar: parsed.sugar,
        fiber: parsed.fiber,
        sodium: parsed.sodium,
        saturatedFat: parsed.saturatedFat,
        transFat: parsed.transFat,
        iron: parsed.iron,
        calcium: parsed.calcium,
      };
    }
    return null;
  } catch (error) {
    console.warn('[Groq] getFoodByBarcodeAI error:', error);
    return null;
  }
}

// ─── Translate Exercise Details ───────────────────────────────────────────────
export async function translateExerciseDetails(name: string, instructions: string[], language: string = 'en'): Promise<{ name: string; instructions: string[] }> {
  if (language.startsWith('en')) return { name, instructions };
  
  const targetLang = getLang(language);
  const prompt = `Translate this exercise name and its instructions to ${targetLang}.
Return ONLY a valid JSON object. Structure:
{
  "name": "Translated name",
  "instructions": ["Translated step 1", "Translated step 2"]
}
Original Name: "${name}"
Original Instructions: ${JSON.stringify(instructions)}`;

  try {
    const data = await fetchGroq({
      model: FAST_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    let content = (data.choices[0]?.message?.content ?? '').trim();
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      content = content.slice(startIndex, endIndex + 1);
    }

    const parsed = JSON.parse(content);
    return {
      name: parsed.name || name,
      instructions: parsed.instructions || instructions
    };
  } catch (err) {
    console.warn('[Groq] translateExerciseDetails error:', err);
    return { name, instructions };
  }
}

// ─── Generate Daily Tip ───────────────────────────────────────────────────────
export async function generateDailyTip(
  userProfile: any,
  workouts: any[],
  streakDays: number,
  language: string = 'en'
): Promise<string> {
  const targetLang = getLang(language);
  const currentHour = new Date().getHours();
  
  let timeContext = 'night';
  if (currentHour >= 5 && currentHour < 12) timeContext = 'morning';
  else if (currentHour >= 12 && currentHour < 18) timeContext = 'afternoon';
  else if (currentHour >= 18 && currentHour < 22) timeContext = 'evening';

  const recentWorkouts = workouts.slice(0, 3).map((w: any) => ({
    date: w.date,
    name: w.routineName,
    exercises: w.exercises.length
  }));

  const prompt = `You are Fitz, the user's AI personal trainer. 
User Name: ${userProfile.name || 'Athlete'}
Current time context: ${timeContext}
Current workout streak: ${streakDays} days
Recent workouts: ${JSON.stringify(recentWorkouts)}

Write a SINGLE, short, highly motivating sentence (max 15 words) to greet the user. It should sound like a quick push notification from a coach. 
Use ${targetLang}. 
Do NOT use quotes. Do NOT add hashtags. Use exactly one relevant emoji.
Example: "¡Buenos días bestia! Llevas 3 días imparable, a romperla hoy. 🦍"`;

  try {
    const data = await fetchGroq({
      model: FAST_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.8,
    });
    return data.choices[0]?.message?.content?.trim() || `¡A darle con todo hoy! 🔥`;
  } catch {
    return `¡A darle con todo hoy! 🔥`;
  }
}
