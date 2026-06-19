import React, { useState, useMemo } from 'react';
import {
  View, ScrollView, Alert, Linking,
  LayoutAnimation, useWindowDimensions, Share,
  Text, TouchableOpacity
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { decode } from 'base64-arraybuffer';
import { useTranslation } from 'react-i18next';
import {
  Mail, Info, FileText, Share2, ShieldCheck, Globe, Smartphone, Camera,
  MessageSquare, Heart, Target, Bell, Palette, LogOut,
} from 'lucide-react-native';
import { cacheDirectory, EncodingType, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';

import {
  useAuthStore, useBodyStore, useSettingsStore, useNutritionStore,
  useCoachStore, useRecipesStore, useProgressStore, useSocialStore,
  usePlannerStore, usePurchaseStore, useWorkoutHistoryStore,
} from '../../../store';
import { supabase } from '../../../services/supabase';
import { calculateTDEE, calculateMacros, resolveActivityLevel } from '../../../services/foodDatabase';
import { useTheme } from '../../../hooks/useTheme';
import { useAchievements, ALL_BADGES } from '../../../hooks/useAchievements';
import LanguageModal from '../../../components/LanguageModal';
import { Spacing } from '../../../constants';
import { convertMass, convertLength } from '../../../utils/units';

import { CustomAlert, AlertType } from '../../../components/CustomAlert';
import { UnitSelectionModal } from '../../../components/UnitSelectionModal';
import { PhotoSourceModal } from '../../../components/PhotoSourceModal';
import { getLocalDateString } from '../../../utils/date';
import { GlobalBackground } from '../../../components/GlobalBackground';
import { GoalWizardModal, ACTIVITY_TO_EXERCISE } from '../../../components/GoalWizardModal';

import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { WeightChart } from '../../../components/profile/WeightChart';
import { SettingsSection } from '../../../components/profile/SettingsSection';
import { SettingsItem } from '../../../components/profile/SettingsItem';
import { GoalsSection } from '../../../components/profile/GoalsSection';
import { HealthSection } from '../../../components/profile/HealthSection';
import { AppearanceSection } from '../../../components/profile/AppearanceSection';
import { AccountSection } from '../../../components/profile/AccountSection';
import { EditModal } from '../../../components/profile/EditModal';
import { BadgeSelectionModal } from '../../../components/profile/BadgeSelectionModal';
import { SexSelectionModal } from '../../../components/profile/SexSelectionModal';
import { VitrinaTrofeos } from '../../../components/profile/VitrinaTrofeos';
import { CustomToast } from '../../../components/profile/CustomToast';


export default function ProfileScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const {
    theme, setTheme, language, setLanguage, massUnit, setMassUnit, volumeUnit,
    setVolumeUnit, lengthUnit, setLengthUnit, energyUnit, setEnergyUnit,
    tempUnit, setTempUnit, premiumColor,
  } = useSettingsStore();
  const { profile, setProfile } = useAuthStore();
  const { isPro } = usePurchaseStore();
  const { setNeat, setExerciseLevel } = useNutritionStore();
  const { latest: latestMeasurement, addMeasurement, measurements } = useBodyStore();
  const lastMeasure = latestMeasurement();
  const { achievements } = useAchievements();

  const [editModal, setEditModal] = useState<any>({ visible: false, field: '', title: '', placeholder: '' });
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [showInterface, setShowInterface] = useState(false);
  const [unitModal, setUnitModal] = useState<any>({ visible: false, title: '', options: [], selectedValue: '', onSelect: () => {} });
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [sexModalVisible, setSexModalVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [alert, setAlert] = useState<any>({ visible: false, type: 'info' as AlertType, title: '', message: '', onConfirm: () => {} });
  const showAlert = (type: AlertType, title: string, message: string, onConfirm?: () => void, onCancel?: () => void, confirmText?: string, cancelText?: string) =>
    setAlert({ visible: true, type, title, message, confirmText, cancelText, onConfirm: () => { onConfirm?.(); setAlert((p: any) => ({ ...p, visible: false })); }, onCancel: onCancel ? () => { onCancel(); setAlert((p: any) => ({ ...p, visible: false })); } : undefined });

  const availableBadges = useMemo(() => {
    const list = ['verified', 'early_adopter'];
    if (profile?.role === 'owner') list.push('owner', 'super_admin', 'admin', 'pro', 'beast_mode', 'fitness_enthusiast');
    else if (profile?.role === 'super_admin') list.push('super_admin', 'admin', 'pro', 'beast_mode', 'fitness_enthusiast');
    else if (profile?.role === 'admin') list.push('admin', 'pro', 'beast_mode');
    else if (profile?.isPro) list.push('pro', 'fitness_enthusiast');
    if (profile?.badges) profile.badges.forEach((b: string) => { if (!list.includes(b)) list.push(b); });
    return list;
  }, [profile]);

  const currentBadgeId = profile?.selectedBadge || (profile?.role === 'owner' ? 'owner' : profile?.role === 'super_admin' ? 'super_admin' : profile?.role === 'admin' ? 'admin' : profile?.isPro ? 'pro' : 'verified');
  const currentBadge = ALL_BADGES[currentBadgeId] || ALL_BADGES.verified;
  const toggleSection = (setter: any, current: boolean) => { (LayoutAnimation as any).configureNext((LayoutAnimation as any).Presets.easeInEaseOut); setter(!current); };

  const openEdit = (field: string, title: string, placeholder: string, keyboardType: 'numeric' | 'default' = 'default') => {
    let initialVal = '';
    if (profile) {
      const rawVal = (profile as any)[field];
      if (rawVal !== undefined && rawVal !== null) {
        if (field === 'weight') initialVal = convertMass(rawVal, 'kg', massUnit).toFixed(1);
        else if (field === 'height') initialVal = convertLength(rawVal, 'cm', lengthUnit).toFixed(1);
        else initialVal = String(rawVal);
      }
    }
    setEditModal({ visible: true, field, title, placeholder, keyboardType, initialValue: initialVal });
  };

  const updateProfileFields = async (updates: Partial<any>) => {
    if (!profile) return;
    let userId = profile.id;
    if (!userId || userId === '') {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? '';
    }
    if (!userId) { Alert.alert(t('common.error'), t('profile.userIdNotFound')); return; }
    const newProfile = { ...profile, ...updates, id: userId };
    const triggerFields = ['weight', 'height', 'age', 'sex', 'activityLevel', 'goal'];
    if (Object.keys(updates).some(k => triggerFields.includes(k))) {
      const { tdee } = calculateTDEE({
        weight: newProfile.weight, height: newProfile.height, age: newProfile.age,
        sex: newProfile.sex, activityLevel: newProfile.activityLevel,
      });
      const { targetCalories, protein, carbs, fat } = calculateMacros(tdee, newProfile.goal);
      newProfile.tdee = tdee; newProfile.targetCalories = targetCalories; newProfile.macros = { protein, carbs, fat };
    }
    try {
      const { error } = await supabase.from('users').update({
        name: newProfile.name, avatar_url: newProfile.avatarUrl, name_color: newProfile.nameColor,
        weight: newProfile.weight, height: newProfile.height, age: newProfile.age, sex: newProfile.sex,
        activity_level: newProfile.activityLevel, goal: newProfile.goal, target_weight: newProfile.targetWeight,
        tdee: newProfile.tdee, target_calories: newProfile.targetCalories, macros: newProfile.macros,
        available_foods: newProfile.availableFoods, extra_snacks: newProfile.extraSnacks,
        selected_badge: newProfile.selectedBadge, badges: newProfile.badges,
      }).eq('id', userId);
      if (error) throw error;
      setProfile(newProfile);
      if (updates.weight !== undefined && updates.weight !== profile.weight) {
        addMeasurement({ id: Date.now().toString(), date: getLocalDateString(), weight: updates.weight, bodyFat: lastMeasure?.bodyFat });
      }
      showAlert('success', t('common.success'), t('profile.updateSuccess'));
    } catch (_err) { console.error('Update profile error:', _err); showAlert('error', t('common.error'), t('profile.updateFailed')); }
  };
  const updateProfileField = (field: string, value: any) => updateProfileFields({ [field]: value });

  const uploadAvatarImage = async (base64: string, uri: string) => {
    try {
      let userId = profile?.id;
      if (!userId || userId === '') { const { data: { user } } = await supabase.auth.getUser(); userId = user?.id ?? ''; }
      if (!userId) throw new Error(t('profile.notAuth', 'Usuario no autenticado'));
      const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, decode(base64), { contentType: `image/${fileExt}`, upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await updateProfileField('avatarUrl', publicUrl);
    } catch (err) { console.error('Upload avatar error:', err); Alert.alert(t('common.error'), t('profile.uploadFailed')); }
  };
  const pickImage = async (pickerFn: () => Promise<any>) => {
    try {
      const result = await pickerFn();
      if (!result.canceled && result.assets && result.assets[0].base64) await uploadAvatarImage(result.assets[0].base64, result.assets[0].uri);
    } catch (err) { console.error('Pick image error:', err); Alert.alert(t('common.error'), t('profile.galleryFailed', 'Error al seleccionar imagen')); }
  };
  const handleSelectGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert(t('common.error'), t('profile.galleryPermission', 'Se necesitan permisos de galería.')); return; }
    await pickImage(() => ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true }));
  };
  const handleSelectCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert(t('common.error'), t('profile.cameraPermission', 'Se necesitan permisos de cámara.')); return; }
    await pickImage(() => ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true }));
  };

  const handleSaveEdit = (val: string, color?: string) => {
    if (!val.trim() && editModal.field !== 'availableFoods') return;
    const field = editModal.field;
    if (field === 'availableFoods') { updateProfileField('availableFoods', val.split(',').map(s => s.trim()).filter(s => s.length > 0)); return; }
    if (field === 'name') { updateProfileFields({ name: val, nameColor: color || '' }); return; }
    const numericFields = ['weight', 'height', 'age'];
    let parsed: any = numericFields.includes(field) ? parseFloat(val) : val;
    if (numericFields.includes(field)) {
      if (isNaN(parsed)) return;
      if (field === 'weight') parsed = Math.min(Math.max(convertMass(parsed, massUnit, 'kg'), 20), 300);
      else if (field === 'height') parsed = Math.min(Math.max(convertLength(parsed, lengthUnit, 'cm'), 50), 250);
      else if (field === 'age') parsed = Math.min(Math.max(parsed, 5), 120);
    }
    updateProfileField(field, parsed);
  };

  const handleSaveGoal = async (newData: any) => {
    if (!profile) return;
    const finalActivityLevel = resolveActivityLevel(newData.lifestyle, newData.exerciseLevel);
    const { tdee } = calculateTDEE({ weight: newData.weight || profile.weight, height: profile.height, age: profile.age, sex: profile.sex, activityLevel: finalActivityLevel, lifestyleLevel: newData.lifestyle });
    const { targetCalories, protein, carbs, fat } = calculateMacros(tdee, newData.goal);
    const updatedProfile = { ...profile, weight: newData.weight, goal: newData.goal, targetWeight: newData.targetWeight, activityLevel: finalActivityLevel, lifestyle: newData.lifestyle, tdee, targetCalories, macros: { protein, carbs, fat }, startingWeight: profile?.startingWeight || profile?.weight || newData.weight };
    setProfile(updatedProfile); setGoalModalVisible(false);
    try {
      const { error } = await supabase.from('users').update({ weight: newData.weight, goal: newData.goal, target_weight: newData.targetWeight, activity_level: finalActivityLevel, lifestyle: newData.lifestyle, tdee, target_calories: targetCalories, macros: { protein, carbs, fat }, starting_weight: profile?.startingWeight || profile?.weight || newData.weight, exercise_level: newData.exerciseLevel }).eq('id', profile.id);
      if (error) throw error;
      setNeat(newData.lifestyle); setExerciseLevel(newData.exerciseLevel);
      if (newData.weight !== profile.weight) { addMeasurement({ id: Date.now().toString(), date: getLocalDateString(), weight: newData.weight, bodyFat: lastMeasure?.bodyFat }); }
      showAlert('success', t('common.success'), t('profile.updateSuccess'));
    } catch { showAlert('error', t('common.error'), t('profile.updateFailed')); }
  };

  const handleEditSex = () => setSexModalVisible(true);



  const makeUnitHandler = (title: string, options: any[], sel: string, onSelect: any) => () => setUnitModal({ visible: true, title, options, selectedValue: sel, onSelect });
  const unitHandlers = {
    mass: makeUnitHandler(t('profile.massUnit', 'Unidad de masa'), [{ value: 'g', label: 'Gramos (g)' }, { value: 'kg', label: 'Kilogramos (kg)' }, { value: 'lb', label: 'Libras (lb)' }], massUnit, setMassUnit),
    volume: makeUnitHandler(t('profile.volumeUnit', 'Unidad de volumen'), [{ value: 'ml', label: 'Mililitros (ml)' }, { value: 'l', label: 'Litros (l)' }, { value: 'oz', label: 'Onzas (oz)' }], volumeUnit, setVolumeUnit),
    length: makeUnitHandler(t('profile.lengthUnit', 'Unidad de longitud'), [{ value: 'cm', label: 'Centímetros (cm)' }, { value: 'm', label: 'Metros (m)' }, { value: 'in', label: 'Pulgadas (in)' }, { value: 'ft', label: 'Pies (ft)' }], lengthUnit, setLengthUnit),
    energy: makeUnitHandler(t('profile.energyUnit', 'Unidad de energía'), [{ value: 'kcal', label: 'Kilocalorías (kcal)' }, { value: 'kj', label: 'Kilojulios (kJ)' }], energyUnit, setEnergyUnit),
    temp: makeUnitHandler(t('profile.tempUnit', 'Unidad de temperatura'), [{ value: 'c', label: 'Celsius (°C)' }, { value: 'f', label: 'Fahrenheit (°F)' }], tempUnit, setTempUnit),
  };

  const handleExportData = async () => {
    // Helper: escape a CSV value
    const escCSV = (v: any): string => {
      if (v === undefined || v === null) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rowToCSV = (row: Record<string, any>, headers: string[]): string =>
      headers.map(h => escCSV(row[h])).join(',');
    const sheetToCSV = (rows: Record<string, any>[]): string => {
      if (!rows || rows.length === 0) return '';
      const headers = Object.keys(rows[0]);
      return [headers.map(escCSV).join(','), ...rows.map(r => rowToCSV(r, headers))].join('\n');
    };

    try {
      setToastMsg({ text: t('profile.exporting', 'Exportando datos...'), type: 'success' });

      let measurementsData: any[] = measurements;
      let foodLogsData: any[] = useNutritionStore.getState().todayLogs;
      let waterData = useNutritionStore.getState().dailyWater;
      let stepsData = useNutritionStore.getState().dailySteps;
      let sleepData = useNutritionStore.getState().dailySleep;
      let neatData = useNutritionStore.getState().dailyNeat;
      let exerciseData = useNutritionStore.getState().dailyExercise;
      let activityLogsData = useNutritionStore.getState().activityLogs;

      if (profile?.id) {
        try {
          const [resMeas, resFood, resMetrics, resAct] = await Promise.all([
            supabase.from('body_measurements').select('*').eq('user_id', profile.id).order('measured_at', { ascending: false }),
            supabase.from('food_logs').select('*').eq('user_id', profile.id).order('logged_at', { ascending: false }),
            supabase.from('daily_metrics').select('*').eq('user_id', profile.id).order('date', { ascending: false }),
            supabase.from('activity_logs').select('*').eq('user_id', profile.id).order('logged_at', { ascending: false })
          ]);

          if (resMeas.data && resMeas.data.length > 0) {
            measurementsData = resMeas.data.map((m: any) => ({
              id: m.id,
              date: m.measured_at,
              weight: m.weight ?? undefined,
              bodyFat: m.body_fat_pct ?? undefined,
              chest: m.chest_cm ?? undefined,
              waist: m.waist_cm ?? undefined,
              hips: m.hip_cm ?? undefined,
              arms: m.arms_cm ?? undefined,
              legs: m.legs_cm ?? undefined,
              neck: m.neck_cm ?? undefined,
              notes: m.notes ?? undefined,
            }));
          }

          if (resFood.data && resFood.data.length > 0) {
            foodLogsData = resFood.data.map((d: any) => ({
              id: d.id,
              foodItem: {
                id: d.food_id ?? d.id, name: d.food_name,
                calories: d.calories, protein: d.protein, carbs: d.carbs, fat: d.fat,
              },
              grams: d.grams, meal: d.meal, loggedAt: d.logged_at,
              calories: d.calories, protein: d.protein, carbs: d.carbs, fat: d.fat,
              fiber: d.fiber, sugar: d.sugar, sodium: d.sodium, iron: d.iron, calcium: d.calcium,
              saturatedFat: d.saturated_fat, transFat: d.trans_fat, cholesterol: d.cholesterol,
            }));
          }

          if (resAct.data && resAct.data.length > 0) {
            activityLogsData = resAct.data.map((a: any) => ({
              id: a.id,
              name: a.name,
              icon: a.icon,
              calories: a.calories,
              duration: a.duration,
              loggedAt: a.logged_at
            }));
          }

          if (resMetrics.data && resMetrics.data.length > 0) {
            const waterMap: Record<string, number> = {};
            const stepsMap: Record<string, number> = {};
            const sleepMap: Record<string, number> = {};
            const neatMap: Record<string, string> = {};
            const exerciseMap: Record<string, string> = {};
            resMetrics.data.forEach((m: any) => {
              waterMap[m.date] = m.water_ml ?? 0;
              stepsMap[m.date] = m.steps ?? 0;
              sleepMap[m.date] = m.sleep_hours ?? 0;
              neatMap[m.date] = m.neat_level ?? '';
              exerciseMap[m.date] = m.exercise_level ?? '';
            });
            waterData = waterMap;
            stepsData = stepsMap;
            sleepData = sleepMap;
            neatData = neatMap;
            exerciseData = exerciseMap;
          }
        } catch (dbErr) {
          console.warn('Supabase fetch failed during export:', dbErr);
        }
      }

      // Build section rows for profile
      const profileRows = [
        { [t('profile.field', 'Campo')]: t('profile.editName', 'Nombre'), [t('profile.value', 'Valor')]: profile?.name },
        { [t('profile.field', 'Campo')]: t('auth.email', 'Email'), [t('profile.value', 'Valor')]: profile?.email },
        { [t('profile.field', 'Campo')]: 'ID Usuario', [t('profile.value', 'Valor')]: profile?.id },
        { [t('profile.field', 'Campo')]: t('onboarding.goal', 'Meta'), [t('profile.value', 'Valor')]: profile?.goal },
        { [t('profile.field', 'Campo')]: t('profile.weight', 'Peso Inicial (kg)'), [t('profile.value', 'Valor')]: profile?.weight },
        { [t('profile.field', 'Campo')]: t('profile.height', 'Altura (cm)'), [t('profile.value', 'Valor')]: profile?.height },
        { [t('profile.field', 'Campo')]: t('profile.age', 'Edad'), [t('profile.value', 'Valor')]: profile?.age },
        { [t('profile.field', 'Campo')]: t('profile.sex', 'Sexo'), [t('profile.value', 'Valor')]: profile?.sex },
        { [t('profile.field', 'Campo')]: 'TDEE (kcal)', [t('profile.value', 'Valor')]: profile?.tdee },
        { [t('profile.field', 'Campo')]: t('tracker.target', 'Objetivo de Calorías (kcal)'), [t('profile.value', 'Valor')]: profile?.targetCalories },
        { [t('profile.field', 'Campo')]: 'Objetivo Proteínas (g)', [t('profile.value', 'Valor')]: profile?.macros?.protein },
        { [t('profile.field', 'Campo')]: 'Objetivo Carbohidratos (g)', [t('profile.value', 'Valor')]: profile?.macros?.carbs },
        { [t('profile.field', 'Campo')]: 'Objetivo Grasas (g)', [t('profile.value', 'Valor')]: profile?.macros?.fat },
      ];

      const measRows = measurementsData.map((m: any) => ({
        [t('common.date', 'Fecha')]: m.date,
        [t('profile.weight', 'Peso (kg)')]: m.weight,
        [t('profile.bodyFat', 'Grasa %')]: m.bodyFat,
        [t('profile.waist', 'Cintura (cm)')]: m.waist,
        [t('profile.hips', 'Cadera (cm)')]: m.hips,
        [t('profile.chest', 'Pecho (cm)')]: m.chest,
        [t('profile.arms', 'Brazos (cm)')]: m.arms,
        [t('profile.legs', 'Piernas (cm)')]: m.legs,
        [t('profile.neck', 'Cuello (cm)')]: m.neck,
        [t('common.notes', 'Notas')]: m.notes,
      }));

      const foodRows = foodLogsData.map((l: any) => ({
        [t('common.date', 'Fecha')]: l.loggedAt ? l.loggedAt.split('T')[0] : '',
        [t('tracker.meal', 'Comida')]: l.meal,
        [t('tracker.food', 'Alimento')]: l.foodItem?.name || '',
        [t('tracker.grams', 'Cantidad (g)')]: l.grams,
        [t('tracker.calories', 'Calorías (kcal)')]: l.calories,
        [t('tracker.protein', 'Proteínas (g)')]: l.protein,
        [t('tracker.carbs', 'Carbohidratos (g)')]: l.carbs,
        [t('tracker.fat', 'Grasas (g)')]: l.fat,
        'Fibra (g)': l.fiber || 0,
        'Azúcar (g)': l.sugar || 0,
        'Sodio (mg)': l.sodium || 0,
      }));

      const metricDates = Array.from(new Set([...Object.keys(waterData), ...Object.keys(stepsData), ...Object.keys(sleepData)])).sort().reverse();
      const metricRows = metricDates.map((d: string) => ({
        [t('common.date', 'Fecha')]: d,
        [t('tracker.steps', 'Pasos')]: stepsData[d] || 0,
        [t('tracker.water', 'Agua (ml)')]: waterData[d] || 0,
        [t('tracker.sleep', 'Sueño (h)')]: sleepData[d] || 0,
        'Actividad Cotidiana (NEAT)': neatData[d] || '',
        [t('profile.activity', 'Ejercicio')]: exerciseData[d] || '',
      }));

      const activityRows = activityLogsData.map((a: any) => ({
        [t('common.date', 'Fecha')]: a.loggedAt ? a.loggedAt.split('T')[0] : '',
        [t('profile.activity', 'Actividad')]: a.name,
        'Duración (min)': a.duration,
        [t('tracker.calories', 'Calorías Quemadas')]: a.calories,
      }));

      const workouts2 = useWorkoutHistoryStore.getState().getWorkoutsForUser(profile?.id);
      const workoutRows: any[] = [];
      workouts2.forEach((w: any) => {
        w.exercises.forEach((ex: any) => {
          workoutRows.push({
            [t('common.date', 'Fecha')]: w.date,
            'Rutina': w.routineName,
            'Ejercicio': ex.name,
            'Series': ex.sets,
            'Repeticiones': ex.reps,
            'Peso': ex.weight || '',
            'RPE': ex.rpe || '',
          });
        });
      });

      // Build a single CSV with section separators
      const sections = [
        { title: t('profile.sheetProfile', 'PERFIL'), rows: profileRows },
        { title: t('profile.sheetWeight', 'PESO Y MEDIDAS'), rows: measRows },
        { title: t('profile.sheetNutrition', 'COMIDAS Y NUTRICIÓN'), rows: foodRows },
        { title: t('profile.sheetMetrics', 'MÉTRICAS DIARIAS'), rows: metricRows },
        { title: 'CARDIO Y ACTIVIDADES', rows: activityRows },
        { title: 'ENTRENAMIENTOS', rows: workoutRows },
      ];

      const csvContent = sections.map(s =>
        `===== ${s.title} =====\n${sheetToCSV(s.rows)}`
      ).join('\n\n');

      const uri = cacheDirectory + `FitGO_Data_${getLocalDateString()}.csv`;
      await writeAsStringAsync(uri, csvContent, { encoding: EncodingType.UTF8 });
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: t('profile.exportData', 'Exportar Data'), UTI: 'public.comma-separated-values-text' });
    } catch (err) {
      console.error('Export error:', err);
      setToastMsg({ text: t('profile.exportFailed', 'Error al exportar datos'), type: 'error' });
    }
  };

  const handleManageSubscription = async () => router.push('/modals/paywall');
  const handleCancelSubscription = () => showAlert('confirm', t('profile.cancelSubscription', 'Cancelar Suscripción'), t('profile.cancelSubscriptionConfirm', '¿Estás seguro de que deseas cancelar tu suscripción Pro?'), async () => { await usePurchaseStore.getState().cancelPro(); setToastMsg({ text: t('profile.subscriptionCancelled', 'Suscripción cancelada correctamente'), type: 'success' }); }, () => {}, t('profile.cancelSubscription', 'Cancelar Suscripción'), t('common.cancel'));
  const handleVerifySubscription = async () => { const p = await usePurchaseStore.getState().verifyProStatus(); if (p) setToastMsg({ text: t('profile.verifySuccess', 'Suscripción verificada correctamente'), type: 'success' }); else showAlert('info', t('profile.notPremiumTitle', 'Sin Suscripción Activa'), t('profile.notPremiumDesc', 'No hemos encontrado una suscripción Pro asociada a tu cuenta.'), () => router.push('/modals/paywall'), () => {}, t('profile.upgradeNow', 'Mejorar ahora'), t('common.cancel')); };
  const handleCopyID = async () => { if (!profile?.id) return; try { await Clipboard.setStringAsync(profile.id); setToastMsg({ text: t('profile.idCopied'), type: 'success' }); } catch { await Share.share({ message: profile.id }); } };
  const handleDeleteAccount = () => showAlert('confirm', t('profile.deleteAccount', 'Eliminar Cuenta'), t('profile.deleteAccountConfirm', '¿Estás seguro?'), async () => { try { const { error } = await supabase.rpc('delete_user'); if (error) throw error; useNutritionStore.getState().reset(); useCoachStore.getState().resetAll(); useBodyStore.getState().reset(); useRecipesStore.getState().reset(); useProgressStore.getState().reset(); useSocialStore.getState().reset(); usePlannerStore.getState().clearPlans(); usePurchaseStore.setState({ isPro: false, customerInfo: null }); await supabase.auth.signOut(); } catch { setTimeout(() => showAlert('error', t('common.error'), t('profile.deleteAccountError', 'No se pudo eliminar la cuenta.'), () => {}, undefined, t('common.ok'))); } }, () => {}, t('common.delete'), t('common.cancel'));
  const handleInviteFriends = async () => { try { await Share.share({ message: t('profile.inviteMessage', '¡Únete a FitGO!'), title: 'FitGO' }); } catch {} };
  const handleLogout = () => showAlert('confirm', t('profile.signOut'), t('profile.signOutConfirm'), async () => { useNutritionStore.getState().reset(); useCoachStore.getState().resetAll(); useBodyStore.getState().reset(); useRecipesStore.getState().reset(); useSocialStore.getState().reset(); await supabase.auth.signOut(); }, () => {}, t('profile.signOut'), t('common.cancel'));
  const handleLanguageSelect = async (lang: string) => { setLanguage(lang as any); setLangModalVisible(false); if (profile?.id) await supabase.auth.updateUser({ data: { language: lang } }); };

  const isAdminRole = profile?.role === 'owner' || profile?.role === 'super_admin' || profile?.role === 'admin';
  const safePremiumColor = premiumColor === 'admin_glow' ? '#00F0FF' : (premiumColor && premiumColor.startsWith('#') ? premiumColor : null);
  const isPremiumCustom = (isPro || profile?.isPro || isAdminRole) && !!safePremiumColor;

  return (
    <View style={{ flex: 1 }}>
      <GlobalBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <EditModal visible={editModal.visible} field={editModal.field} title={editModal.title} placeholder={editModal.placeholder} keyboardType={editModal.keyboardType} initialValue={editModal.initialValue} onSave={handleSaveEdit} onClose={() => setEditModal((p: any) => ({ ...p, visible: false }))} massUnit={massUnit} lengthUnit={lengthUnit} isPro={profile?.isPro} initialNameColor={profile?.nameColor} role={profile?.role} premiumColor={premiumColor} />
        {toastMsg && <CustomToast message={toastMsg.text} type={toastMsg.type} onHide={() => setToastMsg(null)} />}
        <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} confirmText={alert.confirmText} cancelText={alert.cancelText} onConfirm={alert.onConfirm} onCancel={alert.onCancel} />
        <LanguageModal visible={langModalVisible} currentLang={language} onSelect={handleLanguageSelect} onClose={() => setLangModalVisible(false)} />
        <GoalWizardModal visible={goalModalVisible} onClose={() => setGoalModalVisible(false)} onSave={handleSaveGoal} initialData={{ weight: lastMeasure?.weight || profile?.weight || 70, goal: profile?.goal, activityLevel: profile?.activityLevel, lifestyle: profile?.lifestyle || 'standing_sometimes', exerciseLevel: ACTIVITY_TO_EXERCISE[profile?.activityLevel || 'moderate'], targetWeight: profile?.targetWeight || lastMeasure?.weight || profile?.weight || 70 }} />
        <UnitSelectionModal visible={unitModal.visible} title={unitModal.title} options={unitModal.options} selectedValue={unitModal.selectedValue} onSelect={unitModal.onSelect} onClose={() => setUnitModal((p: any) => ({ ...p, visible: false }))} />
        <BadgeSelectionModal visible={badgeModalVisible} onClose={() => setBadgeModalVisible(false)} onSelect={(id) => updateProfileField('selectedBadge', id)} availableBadges={availableBadges} selectedBadge={currentBadgeId} />
        <PhotoSourceModal visible={photoModalVisible} onSelectCamera={handleSelectCamera} onSelectGallery={handleSelectGallery} onClose={() => setPhotoModalVisible(false)} />
        <SexSelectionModal visible={sexModalVisible} onClose={() => setSexModalVisible(false)} onSelect={(val) => updateProfileField('sex', val)} selectedValue={profile?.sex} premiumColor={premiumColor} />

        <ScrollView nestedScrollEnabled style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
          <ProfileHeader profile={profile} currentBadge={currentBadge} safePremiumColor={safePremiumColor} isPremiumCustom={isPremiumCustom} onAvatarPress={() => setPhotoModalVisible(true)} onNamePress={() => openEdit('name', t('profile.editName'), t('profile.enterName'))} onBadgePress={() => setBadgeModalVisible(true)} />

          <VitrinaTrofeos pinnedAchievements={profile?.pinnedAchievements} achievements={achievements} onEdit={() => router.push('/modals/achievements')} premiumColor={premiumColor || undefined} isPro={isPro || profile?.isPro || isAdminRole} />

          <WeightChart profile={profile} measurements={measurements} massUnit={massUnit} language={language} isPremiumCustom={isPremiumCustom} safePremiumColor={safePremiumColor} SCREEN_WIDTH={SCREEN_WIDTH} onHistoryPress={() => router.push('/modals/body-measurements' as any)} onAddMeasurement={() => router.push('/modals/body-measurements' as any)} />

          <SettingsSection title={t('profile.settings', 'Configuración')}>
            <GoalsSection onEditPress={() => setGoalModalVisible(true)} />
            <SettingsItem icon={Target} label={t('profile.mealPlanFoods', 'Tus Comidas Disponibles')} onPress={() => router.push('/modals/food-selection' as any)} iconColor="#10B981" />
            <HealthSection profile={profile} expanded={showHealth} onToggle={() => toggleSection(setShowHealth, showHealth)} onHealthPress={() => router.push('/modals/health-profile' as any)} />
            <SettingsItem icon={Bell} label={t('profile.reminders', 'Recordatorios')} onPress={() => router.push('/modals/reminders' as any)} iconColor="#F59E0B" />
            <SettingsItem icon={Palette} label={t('profile.interface', 'Interfaz')} rightIcon={showInterface ? '▼' : '›'} onPress={() => toggleSection(setShowInterface, showInterface)} iconColor="#8B5CF6" />
            {showInterface && <AppearanceSection theme={theme} setTheme={setTheme} premiumColor={premiumColor} language={language} massUnit={massUnit} volumeUnit={volumeUnit} lengthUnit={lengthUnit} energyUnit={energyUnit} tempUnit={tempUnit} safePremiumColor={safePremiumColor} onLanguagePress={() => setLangModalVisible(true)} onMassUnitPress={unitHandlers.mass} onVolumeUnitPress={unitHandlers.volume} onLengthUnitPress={unitHandlers.length} onEnergyUnitPress={unitHandlers.energy} onTempUnitPress={unitHandlers.temp} onPremiumColorPress={() => router.push('/modals/premium-colors' as any)} />}
            <AccountSection profile={profile} massUnit={massUnit} lengthUnit={lengthUnit} isPro={!!(isPro || profile?.isPro || isAdminRole)} expanded={showAccount} onToggle={() => toggleSection(setShowAccount, showAccount)} onEditName={() => openEdit('name', t('profile.editName'), t('profile.enterName'))} onEditWeight={() => openEdit('weight', t('profile.weight'), t('profile.enterWeight'), 'numeric')} onEditHeight={() => openEdit('height', t('profile.height'), t('profile.enterHeight'), 'numeric')} onEditAge={() => openEdit('age', t('profile.age'), t('profile.enterAge'), 'numeric')} onEditSex={handleEditSex} onExportData={handleExportData} onManageSubscription={handleManageSubscription} onCancelSubscription={handleCancelSubscription} onVerifySubscription={handleVerifySubscription} onCopyID={handleCopyID} onUpdateEmail={() => router.push('/modals/update-account')} onDeleteAccount={handleDeleteAccount} />
          </SettingsSection>

          <SettingsSection title={t('about.title', 'SOBRE FITGO')} accentColor="#8B5CF6" opacity={0.4}>
            <SettingsItem icon={Share2} label={t('profile.inviteFriends', 'Invitar Amigos')} onPress={handleInviteFriends} iconColor="#10B981" />
            <SettingsItem icon={FileText} label={t('profile.terms', 'Términos y Condiciones')} onPress={() => router.push({ pathname: '/modals/terms', params: { tab: 'terms' } } as any)} iconColor="#6366F1" />
            <SettingsItem icon={ShieldCheck} label={t('profile.privacy', 'Política de Privacidad')} onPress={() => router.push({ pathname: '/modals/terms', params: { tab: 'privacy' } } as any)} iconColor="#10B981" />
            <SettingsItem icon={Info} label={t('about.moreInfo', 'Más sobre FitGO')} rightIcon={showAbout ? '▼' : '›'} onPress={() => toggleSection(setShowAbout, showAbout)} iconColor="#3B82F6" />
            {showAbout && (
              <View style={{ backgroundColor: colors.surfaceAlt + '10', borderTopWidth: 1, borderTopColor: colors.border + '10' }}>
                <SettingsItem icon={Globe} label={t('about.website', 'Sitio Web')} value="FitGO" indent onPress={() => Linking.openURL('https://fit-go-page.vercel.app/es')} iconColor="#3B82F6" />
                <SettingsItem icon={Smartphone} label={t('about.tiktok', 'TikTok')} indent onPress={() => Linking.openURL('https://www.tiktok.com/@fit_go?is_from_webapp=1&sender_device=pc')} iconColor="#FF0050" />
                <SettingsItem icon={Camera} label={t('about.instagram', 'Instagram')} indent onPress={() => Linking.openURL('https://www.instagram.com/fit___go/')} iconColor="#E1306C" />
                <SettingsItem icon={Mail} label={t('about.email', 'Email')} value="fitgoenterprise@gmail.com" indent onPress={() => Linking.openURL('mailto:fitgoenterprise@gmail.com')} iconColor="#EA4335" />
                <SettingsItem icon={MessageSquare} label={t('profile.sendFeedback', 'Enviar Sugerencia')} indent onPress={() => Linking.openURL('mailto:fitgoenterprise@gmail.com')} iconColor="#10B981" />
                <SettingsItem icon={Heart} label={t('about.credits', 'Créditos')} indent onPress={() => showAlert('info', 'Créditos', 'Las animaciones (GIFs) del directorio de ejercicios son propiedad y cortesía de ExerciseDB API.', () => {}, undefined, 'Entendido')} iconColor="#EF4444" />
                <SettingsItem icon={Info} label={t('about.version', 'Versión')} value="v1.0.1" indent iconColor={colors.textMuted} />
              </View>
            )}
          </SettingsSection>

          {/* Sign Out Button at the very bottom */}
          <View style={{ marginHorizontal: Spacing.base, marginTop: Spacing.base }}>
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              >
                <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
                <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '700' }}>
                  {t('profile.signOut', 'Cerrar Sesión')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
