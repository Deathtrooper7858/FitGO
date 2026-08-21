import { supabase } from '../services/supabase';
import { calculateTDEE, calculateMacros, resolveActivityLevel } from '../services/foodDatabase';
import { useNutritionStore, useBodyStore, UserProfile } from '../store';
import { getLocalDateString } from '../utils/date';

export function calculateProgressPct(
  goal: string | undefined,
  initialWeight: number,
  currentWeight: number,
  targetWeight: number
): number {
  let progressPct = 0;
  if (goal === 'lose') {
    const totalToLose = initialWeight - targetWeight;
    const lostSoFar = initialWeight - currentWeight;
    if (totalToLose > 0) {
      progressPct = Math.max(0, Math.min(100, (lostSoFar / totalToLose) * 100));
    } else {
      progressPct = currentWeight <= targetWeight ? 100 : 0;
    }
  } else if (goal === 'gain') {
    const totalToGain = targetWeight - initialWeight;
    const gainedSoFar = currentWeight - initialWeight;
    if (totalToGain > 0) {
      progressPct = Math.max(0, Math.min(100, (gainedSoFar / totalToGain) * 100));
    } else {
      progressPct = currentWeight >= targetWeight && initialWeight > targetWeight ? 0 : (currentWeight >= targetWeight ? 100 : 0);
    }
  } else {
    const diff = Math.abs(currentWeight - targetWeight);
    progressPct = diff <= 1.5 ? 100 : Math.max(0, 100 - (diff * 10));
  }
  return Number.isFinite(progressPct) ? progressPct : 0;
}

export async function handleGoalSave(
  newData: any,
  profile: UserProfile | null,
  setProfile: (profile: UserProfile) => void,
  setGoalModalVisible: (visible: boolean) => void,
  showAlert: (type: string, title: string, message: string) => void,
  t: (key: string) => string
) {
  if (!profile) return;
  try {
    const finalActivityLevel = resolveActivityLevel(newData.lifestyle, newData.exerciseLevel);

    const { tdee } = calculateTDEE({
      weight: newData.weight,
      height: profile.height,
      age: profile.age,
      sex: profile.sex,
      activityLevel: finalActivityLevel,
      lifestyleLevel: newData.lifestyle
    });
    
    const { targetCalories, protein, carbs, fat } = calculateMacros(tdee, newData.goal);

    const newStartingWeight = profile.goal !== newData.goal ? newData.weight : (profile.startingWeight || newData.weight);

    const { error: upsertError } = await supabase
      .from('users')
      .update({
        weight: newData.weight,
        target_weight: newData.targetWeight,
        starting_weight: newStartingWeight,
        goal: newData.goal,
        lifestyle: newData.lifestyle,
        activity_level: finalActivityLevel,
        tdee,
        target_calories: targetCalories,
        macros: { protein, carbs, fat },
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (upsertError) throw upsertError;

    const { addMeasurement } = useBodyStore.getState();
    await addMeasurement({
      id: `bm-${Date.now()}`,
      date: getLocalDateString(),
      weight: newData.weight,
    });

    setProfile({
      ...profile,
      weight: newData.weight,
      startingWeight: newStartingWeight,
      targetWeight: newData.targetWeight,
      goal: newData.goal,
      lifestyle: newData.lifestyle,
      activityLevel: finalActivityLevel,
      tdee,
      targetCalories,
      macros: { protein, carbs, fat }
    });

    const { setNeat, setExerciseLevel } = useNutritionStore.getState();
    setNeat(newData.lifestyle);
    setExerciseLevel(newData.exerciseLevel);

    setGoalModalVisible(false);
    showAlert('success', t('common.success'), t('profile.updateSuccess'));
  } catch (err) {
    console.error('Error updating goals:', err);
    showAlert('error', t('common.error'), t('profile.updateFailed'));
  }
}
