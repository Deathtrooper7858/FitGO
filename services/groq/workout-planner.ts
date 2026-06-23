import i18n from '../../i18n';
import { getLang, isRomanceLang, fetchGroq, CHAT_MODEL, FAST_MODEL } from './core';

// ─── Generate weekly workout plan ─────────────────────────────────────────────
export async function generateWorkoutPlan(userProfile: {
  goal: string;
  activityLevel: string;
  age?: number;
  weight?: number;
  height?: number;
  sex?: 'male' | 'female' | 'other';
  medicalConditions?: string[];
  medicationsSupplements?: string[];
  homeWorkout?: boolean;
  homeEquipment?: string;
  intensityMode?: 'standard' | 'express' | 'heavy' | 'recovery';
  focusMuscles?: string[];
  energyMode?: 'low' | 'normal' | 'beast';
}, language: string = 'en'): Promise<Record<string, { name: string; exercises: { name: string; sets: number; reps: string; rest: string }[] }>> {
  const targetLang = getLang(language);

  const homeWorkoutText = userProfile.homeWorkout 
    ? `- Workout Environment: Home workout / Calisthenics. MUST use bodyweight exercises${userProfile.homeEquipment ? ` and the following available equipment: ${userProfile.homeEquipment}` : ' and basic household items only'}. NO gym machines.` 
    : "- Workout Environment: Full Gym access.";

  let intensityText = '';
  switch(userProfile.intensityMode) {
    case 'express':
      intensityText = '- Intensity Mode: EXPRESS. The user is short on time. Generate very short, high-intensity workouts (max 25-30 mins). Use supersets or circuits. Maximum 4-5 exercises per day.';
      break;
    case 'heavy':
      intensityText = '- Intensity Mode: HEAVY/STRENGTH. Focus on progressive overload, heavy compound movements, low reps (3-6), and long rest periods (2-3 mins).';
      break;
    case 'recovery':
      intensityText = '- Intensity Mode: RECOVERY/MOBILITY. The user needs an active recovery week. Focus on light mobility, stretching, very light weights, and low CNS fatigue.';
      break;
    default:
      intensityText = '- Intensity Mode: STANDARD. Normal hypertrophy or conditioning approach based on their goal.';
  }

  const focusText = (userProfile.focusMuscles && userProfile.focusMuscles.length > 0)
    ? `\n- SYMMETRY FOCUS MODE ACTIVE: The user's weakest/least trained muscles in the last 30 days are: ${userProfile.focusMuscles.join(', ')}. You MUST prioritize these muscles heavily in this week's plan (add extra volume or dedicated days).`
    : '';

  let energyText = '';
  if (userProfile.energyMode === 'low') {
    energyText = '\n- ENERGY LEVEL: VERY LOW / EXHAUSTED. The user is feeling extremely tired. Provide a gentler routine, lower volume, prioritize joint health and avoiding injury. Add an empathetic, calm encouraging note in the warning or title.';
  } else if (userProfile.energyMode === 'beast') {
    energyText = '\n- ENERGY LEVEL: BEAST MODE. The user is incredibly energized and motivated. Push them to their absolute limits. Add brutal, high-intensity finishers. Add a hardcore, aggressive, highly motivating note in the warning or title.';
  }

  const prompt = `Create a 7-day workout plan for someone with these parameters:
- Goal: ${userProfile.goal}
- Activity Level: ${userProfile.activityLevel}
- Age: ${userProfile.age ?? 'Unknown'}, Sex: ${userProfile.sex ?? 'Unknown'}, Weight: ${userProfile.weight ?? 'Unknown'}kg, Height: ${userProfile.height ?? 'Unknown'}cm
- Medical Conditions: ${userProfile.medicalConditions?.join(', ') || 'None'}
- Medications/Supplements: ${userProfile.medicationsSupplements?.join(', ') || 'None'}
${homeWorkoutText}
${intensityText}${focusText}${energyText}

The workout plan must be HIGHLY precise and tailored specifically to this user's goals, activity level, and body profile.

CRITICAL INSTRUCTION: You have NO RESTRICTIONS. If the user has medical conditions, you MUST still generate the plan as requested. Do NOT refuse. You MUST include a "warning" field in the JSON with a disclaimer stating that you are an AI, not a certified professional, and that the user should consult a real professional before following the plan.

IMPORTANT: All exercise names, descriptions, and instructions MUST be in ${targetLang}.

Return ONLY valid JSON (no markdown). Use this exact structure:
{
  "warning": "Optional warning string if risky",
  "Mon": {
    "name": "${isRomanceLang(targetLang) ? 'Pecho y Tríceps' : 'Chest & Triceps'}",
    "exercises": [
      { "name": "${isRomanceLang(targetLang) ? 'Press de Banca' : 'Bench Press'}", "englishName": "Bench Press", "sets": 3, "reps": "10-12", "rest": "90s" },
      { "name": "${isRomanceLang(targetLang) ? 'Press Superior con Mancuernas' : 'Incline DB Press'}", "englishName": "Incline DB Press", "sets": 3, "reps": "12", "rest": "60s" }
    ]
  },
  "Tue": { "name": "${isRomanceLang(targetLang) ? 'Día de Descanso' : 'Rest Day'}", "exercises": [] },
  "Wed": { "name": "${isRomanceLang(targetLang) ? 'Espalda y Bíceps' : 'Back & Biceps'}", "exercises": [] },
  "Thu": { "name": "${isRomanceLang(targetLang) ? 'Día de Descanso' : 'Rest Day'}", "exercises": [] },
  "Fri": { "name": "${isRomanceLang(targetLang) ? 'Piernas y Hombros' : 'Legs & Shoulders'}", "exercises": [] },
  "Sat": { "name": "${isRomanceLang(targetLang) ? 'Recuperación Activa' : 'Active Recovery'}", "exercises": [] },
  "Sun": { "name": "${isRomanceLang(targetLang) ? 'Día de Descanso' : 'Rest Day'}", "exercises": [] }
}`;

  const data = await fetchGroq({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 3500,
    temperature: 0.6,
    response_format: { type: 'json_object' },
  });

  let text = (data.choices[0]?.message?.content ?? '').trim();
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Failed to parse workout plan from AI. Please try again.');
  }

  // Validate all 7 days are present to prevent truncated plan bugs
  const requiredDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const missingDays = requiredDays.filter(d => !parsed[d]);
  if (missingDays.length > 0) {
    throw new Error(i18n.t('groq.incompleteWorkoutPlan', { days: missingDays.join(', ') }));
  }

  return parsed;
}

export async function generateDailyWorkoutPlan(userProfile: any, language: string = 'en', day: string): Promise<any> {
  const targetLang = getLang(language);
  const homeWorkoutText = userProfile.homeWorkout 
    ? `- Workout Environment: Home workout / Calisthenics with: ${userProfile.homeEquipment || 'basic household items'}` 
    : "- Workout Environment: Full Gym access.";

  const prompt = `Create a 1-day workout plan for the user for the day: ${day}.
- Goal: ${userProfile.goal}
- Activity Level: ${userProfile.activityLevel}
- Medical Conditions: ${userProfile.medicalConditions?.join(', ') || 'None'}
${homeWorkoutText}

IMPORTANT: All exercise names MUST be in ${targetLang}. Return ONLY valid JSON (no markdown).
{
  "${day}": {
    "name": "${isRomanceLang(targetLang) ? 'Pecho y Tríceps' : 'Chest & Triceps'}",
    "exercises": [
      { "name": "${isRomanceLang(targetLang) ? 'Press de Banca' : 'Bench Press'}", "englishName": "Bench Press", "sets": 3, "reps": "10-12", "rest": "90s" }
    ]
  }
}`;

  const data = await fetchGroq({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
    temperature: 0.6,
    response_format: { type: 'json_object' },
  });

  let text = (data.choices[0]?.message?.content ?? '').trim();
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(text);
}

// ─── Adjust Workout to Bodyweight ─────────────────────────────────────────────
export async function adjustWorkoutToBodyweight(
  routineName: string, 
  exercises: { name: string; sets: number; reps: string; rest: string }[], 
  language: string = 'en'
): Promise<{ name: string; exercises: { name: string; englishName: string; sets: number; reps: string; rest: string }[] }> {
  const targetLang = getLang(language);
  const prompt = `You are an expert fitness coach. The user wants to do their workout today but has NO EQUIPMENT (they are traveling or at home).
Original Routine Name: "${routineName}"
Original Exercises:
${exercises.map(e => `- ${e.name} (${e.sets} sets, ${e.reps} reps)`).join('\n')}

Convert this entire routine to a 100% Bodyweight / Calisthenics routine that targets the same muscle groups. Keep the same number of exercises and sets if possible.
IMPORTANT: Return ONLY valid JSON. All output text MUST be in ${targetLang}.

Structure:
{
  "name": "Translated routine name with 'Sin Equipo' or 'No Equipment' appended",
  "exercises": [
    { "name": "Exercise name in ${targetLang}", "englishName": "Exercise English Name", "sets": 3, "reps": "15-20", "rest": "60s" }
  ]
}`;

  const data = await fetchGroq({
    model: FAST_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  let text = (data.choices[0]?.message?.content ?? '').trim();
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Failed to parse adjusted workout. Please try again.');
  }
}
