import i18n from '../../i18n';
import { getLang, isRomanceLang, prepareImageData, fetchGroq, VISION_MODEL } from './core';

// ─── Robust JSON Parsing Helper ────────────────────────────────────────────────
function parseVisionJSON(rawText: string, fallbackType: 'food' | 'physique'): any {
  let text = (rawText ?? '').trim();
  // Strip reasoning <think>...</think> tags if emitted by model
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Robust JSON extraction (find first { and last })
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex > startIndex) {
      const candidate = text.slice(startIndex, endIndex + 1);
      try {
        parsed = JSON.parse(candidate);
      } catch {
        try {
          // Remove trailing commas before closing braces/brackets
          const cleaned = candidate.replace(/,\s*([}\]])/g, '$1');
          parsed = JSON.parse(cleaned);
        } catch {
          console.error('[Vision] Failed to parse JSON candidate:', candidate);
          throw new Error(i18n.t('groq.failedToValidateJson', 'The AI couldn\'t process the image right now. Please try again.'));
        }
      }
    } else {
      console.error('[Vision] No JSON object found in response text:', text);
      throw new Error(i18n.t('groq.failedToValidateJson', 'The AI couldn\'t process the image right now. Please try again.'));
    }
  }

  // Defensive normalization to protect UI callers from crashing on .map() or missing properties
  if (fallbackType === 'food') {
    if (!parsed || typeof parsed !== 'object') parsed = {};
    if (!Array.isArray(parsed.foods)) parsed.foods = [];
    if (typeof parsed.totalCalories !== 'number') {
      parsed.totalCalories = parsed.foods.reduce((acc: number, f: any) => acc + (Number(f.calories) || 0), 0);
    }
    if (!parsed.confidence) parsed.confidence = 'medium';
    if (typeof parsed.notes !== 'string') parsed.notes = '';
  } else if (fallbackType === 'physique') {
    if (!parsed || typeof parsed !== 'object') parsed = {};
    if (typeof parsed.feedback !== 'string') parsed.feedback = 'Evaluación completada con éxito.';
    if (!Array.isArray(parsed.strengths)) {
      parsed.strengths = parsed.strengths ? [String(parsed.strengths)] : ['Buen desarrollo físico'];
    }
    if (!Array.isArray(parsed.improvements)) {
      parsed.improvements = parsed.improvements ? [String(parsed.improvements)] : ['Mantener progresión constante'];
    }
    if (typeof parsed.estimatedFatPercentage !== 'string') {
      parsed.estimatedFatPercentage = parsed.estimatedFatPercentage ? String(parsed.estimatedFatPercentage) : '15-18%';
    }
    if (parsed.recommendations && !Array.isArray(parsed.recommendations)) {
      parsed.recommendations = [String(parsed.recommendations)];
    }
  }

  return parsed;
}

// ─── Food photo analysis ───────────────────────────────────────────────────────
export async function analyzeFoodPhoto(base64Image: string, language: string = 'en'): Promise<{
  foods: { 
    name: string; grams: number; calories: number; protein: number; carbs: number; fat: number;
    sugar?: number; fiber?: number; sodium?: number; iron?: number; calcium?: number; saturatedFat?: number; transFat?: number;
  }[];
  totalCalories: number;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}> {
  if (!base64Image) {
    throw new Error('Image data is missing or empty.');
  }

  const targetLang = getLang(language);
  const exampleName = isRomanceLang(targetLang) ? 'Ensalada de pollo' : 'Chicken salad';

  const prompt = `Analyze this food image and return ONLY a JSON object with this structure: {"foods": [{"name": "${exampleName}", "grams": 150, "calories": 250, "protein": 20, "carbs": 30, "fat": 8, "sugar": 5, "fiber": 3, "sodium": 300, "iron": 1.2, "calcium": 150, "saturatedFat": 2, "transFat": 0}], "totalCalories": 250, "confidence": "high", "notes": ""}. Important: DO NOT split mixed dishes (like salads, sandwiches, stews) into individual ingredients; keep them as a single unified food item. Use ${targetLang} for names and notes.`;

  try {
    const prepared = prepareImageData(base64Image);
    if (!prepared) {
      throw new Error(i18n.t('groq.imageProcessFailed'));
    }
    
    const data = await fetchGroq({
      model: VISION_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition expert that analyzes food images and returns data strictly in JSON format.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: prepared.dataUrl },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const text = (data.choices[0]?.message?.content ?? '').trim();
    return parseVisionJSON(text, 'food');
  } catch (error: any) {
    console.warn('[Groq] Analyze food photo error:', error);
    throw error;
  }
}

// ─── Physique photo analysis ───────────────────────────────────────────────────
export async function analyzePhysiquePhoto(base64Image: string, language: string = 'en', targetArea: string = 'full', userContext: string = ''): Promise<{
  feedback: string;
  strengths: string[];
  improvements: string[];
  estimatedFatPercentage: string;
  postureAnalysis?: string;
  symmetry?: string;
  recommendations?: string[];
}> {
  if (!base64Image) {
    throw new Error('Image data is missing or empty.');
  }

  const targetLang = getLang(language);
  
  const areaInstructions: Record<string, string> = {
    'full': 'Evaluate the entire full body physique.',
    'upper': 'Focus your evaluation EXCLUSIVELY on the Upper Body (chest, shoulders, upper back). Ignore the lower body.',
    'lower': 'Focus your evaluation EXCLUSIVELY on the Lower Body (legs, glutes, calves). Ignore the upper body.',
    'back': 'Focus your evaluation EXCLUSIVELY on the Back (lats, traps, lower back). Ignore the front.',
    'arms': 'Focus your evaluation EXCLUSIVELY on the Arms (biceps, triceps, forearms).',
    'core': 'Focus your evaluation EXCLUSIVELY on the Core and Abdominals (abs, obliques).',
  };
  const focusInstruction = areaInstructions[targetArea] || areaInstructions['full'];
  const userContextStr = userContext ? `\nUSER CONTEXT (Treat this as absolute truth): ${userContext}` : '';

  const prompt = `You are a professional biomechanics analyst and elite fitness coach. Perform a deep, comprehensive analysis of this physique photo.
CRITICAL FOCUS INSTRUCTION: ${focusInstruction}${userContextStr}
Return ONLY a valid JSON object with this exact structure:
{
  "feedback": "A comprehensive, highly detailed, and constructive assessment focusing on the requested area in ${targetLang}",
  "strengths": ["Strong point 1, e.g., 'Good shoulder development'", "Strong point 2"],
  "improvements": ["Area to focus 1, e.g., 'Upper chest volume'", "Area to focus 2"],
  "estimatedFatPercentage": "12-15%",
  "postureAnalysis": "Brief analysis of visible posture (e.g., rounded shoulders, anterior pelvic tilt, or good alignment) in ${targetLang}",
  "symmetry": "Analysis of left/right balance and proportions in ${targetLang}",
  "recommendations": ["Specific actionable advice for training 1", "Specific actionable advice for nutrition 2"]
}
CRITICAL RULES:
1. Do NOT mention age, age estimation, or lack of context. 
2. Do NOT say you cannot determine precision. Provide a confident assessment and estimated fat percentage based strictly on the visual information available.
3. Be realistic, analytical, and highly encouraging.
If the image is not a physique photo, kindly mention it in the feedback but try your best to return the JSON structure. Use ${targetLang} for all text fields.`;

  try {
    const prepared = prepareImageData(base64Image);
    if (!prepared) {
      throw new Error(i18n.t('groq.imageProcessFailed'));
    }
    
    const data = await fetchGroq({
      model: VISION_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a professional biomechanics analyst and elite fitness coach. You respond strictly in JSON format matching the schema.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: prepared.dataUrl },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const text = (data.choices[0]?.message?.content ?? '').trim();
    return parseVisionJSON(text, 'physique');
  } catch (error: any) {
    console.warn('[Groq] Analyze physique photo error:', error);
    throw error;
  }
}
