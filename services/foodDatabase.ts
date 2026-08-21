/**
 * OpenFoodFacts + Edamam food database service.
 */
import axios from 'axios';
import { OPEN_FOOD_FACTS_URL } from '../constants/urls';
import { getFoodByBarcodeAI } from './groq';
import { supabase } from './supabase';

const OFF_BASE = OPEN_FOOD_FACTS_URL;

export interface FoodItem {
  id:       string;
  name:     string;
  brand?:   string;
  calories: number;  // per 100g
  protein:  number;
  carbs:    number;
  fat:      number;
  saturatedFat?: number;
  transFat?:     number;
  cholesterol?: number;
  sugar?:   number;
  fiber?:   number;
  sodium?:  number;
  iron?:    number;
  calcium?: number;
  imageUrl?: string;
  source:   'openfoodfacts' | 'edamam' | 'custom';
}

// ─── OpenFoodFacts ─────────────────────────────────────────────────────────────
function mapOFFProduct(p: any, langKey: string = 'en'): FoodItem | null {
  const nut = p.nutriments || {};
  let name = p[`product_name_${langKey}`] || p.product_name || p.product_name_en || p[`generic_name_${langKey}`] || p.generic_name;
  
  if (!name) {
    const localizedKey = Object.keys(p).find(k => k.startsWith('product_name_') && p[k]);
    if (localizedKey) name = p[localizedKey];
  }

  if (!name || !p.nutriments) return null;
  const cal = nut['energy-kcal_100g'] ?? (nut['energy_100g'] ? Math.round(nut['energy_100g'] / 4.184) : 0);
  return {
    id:       p.id ?? p.code ?? p._id,
    name,
    brand:    p.brands,
    calories: Math.round(cal),
    protein:  Math.round(nut['proteins_100g']      ?? 0),
    carbs:    Math.round(nut['carbohydrates_100g'] ?? 0),
    fat:      Math.round(nut['fat_100g']           ?? 0),
    saturatedFat: Math.round(nut['saturated-fat_100g'] ?? 0),
    transFat:     Math.round(nut['trans-fat_100g']     ?? 0),
    fiber:    Math.round(nut['fiber_100g']         ?? 0),
    sugar:    Math.round(nut['sugars_100g']        ?? 0),
    sodium:   Math.round((nut['sodium_100g']  ?? 0) * 1000),
    iron:     Math.round((nut['iron_100g']    ?? 0) * 1000),
    calcium:  Math.round((nut['calcium_100g'] ?? 0) * 1000),
    imageUrl: p.image_front_small_url,
    source:   'openfoodfacts' as const,
  };
}

export async function searchFoodOFF(query: string, language: string = 'en', page = 1): Promise<FoodItem[]> {
  const langKey = language.substring(0, 2).toLowerCase();
  
  const { data } = await axios.get(`${OFF_BASE}/cgi/search.pl`, {
    headers: {
      'User-Agent': 'FitGO - Android/iOS - 1.0.0 - fitgoenterprise@gmail.com',
    },
    params: {
      search_terms: query,
      search_simple: 1,
      action: 'process',
      json: 1,
      page_size: 25,
      page,
      fields: `id,_id,code,product_name,product_name_${langKey},product_name_en,generic_name,generic_name_${langKey},brands,nutriments,image_front_small_url`,
      // NOTE: No lc/categories_lc filter — it causes 0 results for many Spanish queries
    },
    timeout: 10000,
  });

  return (data.products ?? [])
    .map((p: any) => mapOFFProduct(p, langKey))
    .filter((item: FoodItem | null): item is FoodItem => item !== null);
}

// ─── OpenFoodFacts barcode lookup ──────────────────────────────────────────────
export async function getFoodByBarcode(barcode: string, language: string = 'es'): Promise<FoodItem | null> {
  try {
    const { data } = await axios.get(`${OFF_BASE}/api/v0/product/${barcode}.json`, {
      headers: {
        'User-Agent': 'FitGO - Android/iOS - 1.0.0 - fitgoenterprise@gmail.com',
      },
      timeout: 8000,
    });

    if (data && data.status === 1 && data.product) {
      const p = data.product;
      const nut = p.nutriments || {};
      const cal = nut['energy-kcal_100g'] ?? (nut['energy_100g'] ? Math.round(nut['energy_100g'] / 4.184) : 0);

      // Try multiple language variations for product name
      const name = p.product_name_es || 
                   p.product_name || 
                   p.product_name_en || 
                   p.generic_name_es || 
                   p.generic_name || 
                   p.product_name_fr || 
                   p.product_name_pt || 
                   p.product_name_de || 
                   p.product_name_it || 
                   p.product_name_ru || 
                   '';

      if (name && name !== 'Unknown product') {
        return {
          id:       barcode,
          name:     name,
          brand:    p.brands || p.brand || p.brands_tags?.[0] || '',
          calories: Math.round(cal),
          protein:  Math.round(nut['proteins_100g']    ?? 0),
          carbs:    Math.round(nut['carbohydrates_100g'] ?? 0),
          fat:      Math.round(nut['fat_100g']          ?? 0),
          saturatedFat: Math.round(nut['saturated-fat_100g'] ?? 0),
          transFat:     Math.round(nut['trans-fat_100g']     ?? 0),
          sugar:    Math.round(nut['sugars_100g']        ?? 0),
          fiber:    Math.round(nut['fiber_100g']         ?? 0),
          sodium:   Math.round((nut['sodium_100g']       ?? 0) * 1000),
          iron:     Math.round((nut['iron_100g']       ?? 0) * 1000),
          calcium:  Math.round((nut['calcium_100g']    ?? 0) * 1000),
          imageUrl: p.image_front_small_url,
          source:   'openfoodfacts' as const,
        };
      }
    }
  } catch (err) {
    console.warn('[OpenFoodFacts] Barcode fetch error:', err);
  }

  // Fallback to Groq AI barcode lookup
  console.log(`[Barcode fallback] OpenFoodFacts lookup failed or returned empty name for barcode: ${barcode}. Attempting Groq AI lookup...`);
  try {
    const aiFood = await getFoodByBarcodeAI(barcode, language);
    if (aiFood) {
      return {
        id:       barcode,
        name:     aiFood.name,
        brand:    aiFood.brand,
        calories: aiFood.calories,
        protein:  aiFood.protein,
        carbs:    aiFood.carbs,
        fat:      aiFood.fat,
        sugar:    aiFood.sugar,
        fiber:    aiFood.fiber,
        sodium:   aiFood.sodium,
        saturatedFat: aiFood.saturatedFat,
        transFat:     aiFood.transFat,
        iron:     aiFood.iron,
        calcium:  aiFood.calcium,
        source:   'custom' as const,
      };
    }
  } catch (err) {
    console.warn('[Barcode fallback] Groq AI lookup error:', err);
  }

  return null;
}

// ─── Edamam search (fallback / enrichment) ─────────────────────────────────────
// NOTE: Edamam requires EDAMAM_APP_ID + EDAMAM_APP_KEY to be set as Supabase secrets.
// If not configured, this silently returns [] and the app uses OpenFoodFacts only.
export async function searchFoodEdamam(query: string): Promise<FoodItem[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return [];

    const { data, error } = await supabase.functions.invoke('edamam-proxy', {
      body: { query }
    });

    if (error) throw error;
    if (!data?.hints) return [];

    return (data.hints ?? []).slice(0, 15).map((h: any) => ({
      id:       h.food.foodId,
      name:     h.food.label,
      brand:    h.food.brand,
      calories: Math.round(h.food.nutrients?.ENERC_KCAL ?? 0),
      protein:  Math.round(h.food.nutrients?.PROCNT      ?? 0),
      carbs:    Math.round(h.food.nutrients?.CHOCDF      ?? 0),
      fat:      Math.round(h.food.nutrients?.FAT         ?? 0),
      sugar:    Math.round(h.food.nutrients?.SUGAR       ?? 0),
      fiber:    Math.round(h.food.nutrients?.FIBTG       ?? 0),
      iron:     Math.round(h.food.nutrients?.FE          ?? 0),
      calcium:  Math.round(h.food.nutrients?.CA          ?? 0),
      imageUrl: h.food.image,
      source:   'edamam' as const,
    }));
  } catch {
    // Silently ignore — Edamam is optional enrichment
    return [];
  }
}

// ─── Combined search ───────────────────────────────────────────────────────────
export async function searchFood(query: string, language: string = 'en'): Promise<FoodItem[]> {
  const [off, edamam] = await Promise.allSettled([
    searchFoodOFF(query, language),
    searchFoodEdamam(query),
  ]);

  const offResults    = off.status    === 'fulfilled' ? off.value    : [];
  const edamamResults = edamam.status === 'fulfilled' ? edamam.value : [];

  // Deduplicate by name (case-insensitive)
  const seen = new Set<string>();
  return [...offResults, ...edamamResults].filter(f => {
    if (!f.name) return false;
    const key = f.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── TDEE calculator ───────────────────────────────────────────────────────────
export function calculateTDEE(params: {
  weight: number;    // kg
  height: number;    // cm
  age: number;
  sex: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  lifestyleLevel?: 'seated' | 'standing_sometimes' | 'standing_mostly' | 'moving' | 'physical_work';
}): { bmr: number; tdee: number } {
  // Mifflin-St Jeor
  const bmrMale = 10 * params.weight + 6.25 * params.height - 5 * params.age + 5;
  const bmrFemale = 10 * params.weight + 6.25 * params.height - 5 * params.age - 161;
  const bmr = params.sex === 'male' ? bmrMale : params.sex === 'female' ? bmrFemale : (bmrMale + bmrFemale) / 2;

  // Base multipliers for NEAT (Non-Exercise Activity Thermogenesis)
  const lifestyleMultipliers = {
    seated: 1.15,
    standing_sometimes: 1.25,
    standing_mostly: 1.35,
    moving: 1.45,
    physical_work: 1.55,
  };

  // Additions for EAT (Exercise Activity Thermogenesis)
  const exerciseAdditions = {
    sedentary:   0.05,
    light:       0.15,
    moderate:    0.25,
    active:      0.40,
    very_active: 0.55,
  };

  const lifestyleBase = lifestyleMultipliers[params.lifestyleLevel || 'seated'];
  const exerciseBonus = exerciseAdditions[params.activityLevel];
  const totalMultiplier = lifestyleBase + exerciseBonus;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(bmr * totalMultiplier),
  };
}

export function calculateMacros(calories: number, goal: 'lose' | 'maintain' | 'gain'): {
  protein: number; carbs: number; fat: number; targetCalories: number;
} {
  const adjustedCalories = goal === 'lose'
    ? calories - 500
    : goal === 'gain'
    ? calories + 300
    : calories;

  return {
    targetCalories: Math.round(adjustedCalories),
    protein: Math.round((adjustedCalories * 0.30) / 4),  // 30% protein
    carbs:   Math.round((adjustedCalories * 0.40) / 4),  // 40% carbs
    fat:     Math.round((adjustedCalories * 0.30) / 9),  // 30% fat
  };
}

export function resolveActivityLevel(
  lifestyle: string,
  exerciseLevel: string
): 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' {
  const LIFESTYLE_MAP: Record<string, number> = { seated: 0, standing_sometimes: 1, standing_mostly: 2, moving: 3, physical_work: 4 };
  const EXERCISE_MAP: Record<string, number> = { none: 0, '1-2': 1, '3-4': 2, '5-6': 3, daily: 4 };
  const REVERSE_MAP: Record<number, 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'> = { 0: 'sedentary', 1: 'light', 2: 'moderate', 3: 'active', 4: 'very_active' };

  const lifeScore = LIFESTYLE_MAP[lifestyle] || 0;
  const exeScore  = EXERCISE_MAP[exerciseLevel] || 0;
  return REVERSE_MAP[Math.max(lifeScore, exeScore)] || 'sedentary';
}
