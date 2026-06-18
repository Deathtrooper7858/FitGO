import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Animated, Linking,
  LayoutAnimation, useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { decode } from 'base64-arraybuffer';
import { useTranslation } from 'react-i18next';
import {
  Mail, Info, FileText, Share2, ShieldCheck, Globe, Smartphone, Camera,
  MessageSquare, Heart, Lock, Target, Bell, Activity, Briefcase,
  Coffee, PersonStanding, Building2, Sparkles, Utensils, Leaf, Clock, Trophy,
  Check, Bike, Mars, Venus, Plus, Minus, Hammer, Droplets, Thermometer,
  Key, Fingerprint, RefreshCw, Database,   Trash2, Zap, Ruler, Scale, Palette,
  Calendar, User, LogOut, ChevronRight, ChevronDown, ChevronUp, X,
} from 'lucide-react-native';
import { cacheDirectory, EncodingType, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Spacing } from '../../../constants';
import {
  useAuthStore, useBodyStore, useSettingsStore, useNutritionStore,
  useCoachStore, useRecipesStore, useProgressStore, useSocialStore,
  usePlannerStore, usePurchaseStore,
} from '../../../store';
import { supabase } from '../../../services/supabase';
import { calculateTDEE, calculateMacros, resolveActivityLevel } from '../../../services/foodDatabase';
import { useTheme } from '../../../hooks/useTheme';
import { useAchievements, ALL_BADGES } from '../../../hooks/useAchievements';
import LanguageModal from '../../../components/LanguageModal';
import { convertMass, convertLength } from '../../../utils/units';
import { getNameStyle, getSafeColor } from '../../../utils/styles';
import { CustomAlert, AlertType } from '../../../components/CustomAlert';
import { GlassCard } from '../../../components/GlassCard';
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
import { SubscriptionSection } from '../../../components/profile/SubscriptionSection';
import { EditModal } from '../../../components/profile/EditModal';
import { BadgeSelectionModal } from '../../../components/profile/BadgeSelectionModal';
import { VitrinaTrofeos } from '../../../components/profile/VitrinaTrofeos';
import { CustomToast } from '../../../components/profile/CustomToast';
import { StatCard } from '../../../components/profile/StatCard';

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
    } catch (err) { console.error('Update profile error:', err); showAlert('error', t('common.error'), t('profile.updateFailed')); }
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
    } catch (err) { showAlert('error', t('common.error'), t('profile.updateFailed')); }
  };

  const handleEditSex = () => Alert.alert(t('profile.sex'), t('profile.bmrQuest'), [
    { text: t('profile.male', 'Hombre'), onPress: () => updateProfileField('sex', 'male') },
    { text: t('profile.female', 'Mujer'), onPress: () => updateProfileField('sex', 'female') },
    { text: t('profile.other', 'Otro'), onPress: () => updateProfileField('sex', 'other') },
    { text: t('common.cancel'), style: 'cancel' },
  ]);

  const handleEditActivity = () => Alert.alert(t('profile.activity'), t('profile.activityQuest'), [
    { text: t('profile.sedentary'), onPress: () => updateProfileField('activityLevel', 'sedentary') },
    { text: t('profile.lightlyActive'), onPress: () => updateProfileField('activityLevel', 'light') },
    { text: t('profile.moderatelyActive'), onPress: () => updateProfileField('activityLevel', 'moderate') },
    { text: t('profile.veryActive'), onPress: () => updateProfileField('activityLevel', 'active') },
    { text: t('profile.very_active'), onPress: () => updateProfileField('activityLevel', 'very_active') },
    { text: t('common.cancel'), style: 'cancel' },
  ]);

  const makeUnitHandler = (title: string, options: any[], sel: string, onSelect: any) => () => setUnitModal({ visible: true, title, options, selectedValue: sel, onSelect });
  const unitHandlers = {
    mass: makeUnitHandler(t('profile.massUnit', 'Unidad de masa'), [{ value: 'g', label: 'Gramos (g)' }, { value: 'kg', label: 'Kilogramos (kg)' }, { value: 'lb', label: 'Libras (lb)' }], massUnit, setMassUnit),
    volume: makeUnitHandler(t('profile.volumeUnit', 'Unidad de volumen'), [{ value: 'ml', label: 'Mililitros (ml)' }, { value: 'l', label: 'Litros (l)' }, { value: 'oz', label: 'Onzas (oz)' }], volumeUnit, setVolumeUnit),
    length: makeUnitHandler(t('profile.lengthUnit', 'Unidad de longitud'), [{ value: 'cm', label: 'Centímetros (cm)' }, { value: 'm', label: 'Metros (m)' }, { value: 'in', label: 'Pulgadas (in)' }, { value: 'ft', label: 'Pies (ft)' }], lengthUnit, setLengthUnit),
    energy: makeUnitHandler(t('profile.energyUnit', 'Unidad de energía'), [{ value: 'kcal', label: 'Kilocalorías (kcal)' }, { value: 'kj', label: 'Kilojulios (kJ)' }], energyUnit, setEnergyUnit),
    temp: makeUnitHandler(t('profile.tempUnit', 'Unidad de temperatura'), [{ value: 'c', label: 'Celsius (°C)' }, { value: 'f', label: 'Fahrenheit (°F)' }], tempUnit, setTempUnit),
  };

  const handleExportData = async () => {
    try {
      const XLSX = await import('xlsx');
      setToastMsg({ text: t('profile.exporting', 'Exportando datos...'), type: 'success' });
      const profileData = [
        { [t('profile.field', 'Campo')]: t('profile.editName', 'Nombre'), [t('profile.value', 'Valor')]: profile?.name },
        { [t('profile.field', 'Campo')]: t('auth.email', 'Email'), [t('profile.value', 'Valor')]: profile?.email },
        { [t('profile.field', 'Campo')]: 'ID', [t('profile.value', 'Valor')]: profile?.id },
        { [t('profile.field', 'Campo')]: t('onboarding.goal', 'Meta'), [t('profile.value', 'Valor')]: profile?.goal },
        { [t('profile.field', 'Campo')]: t('profile.weight', 'Peso Actual'), [t('profile.value', 'Valor')]: profile?.weight },
        { [t('profile.field', 'Campo')]: t('profile.height', 'Altura'), [t('profile.value', 'Valor')]: profile?.height },
        { [t('profile.field', 'Campo')]: t('profile.age', 'Edad'), [t('profile.value', 'Valor')]: profile?.age },
        { [t('profile.field', 'Campo')]: t('profile.sex', 'Sexo'), [t('profile.value', 'Valor')]: profile?.sex },
        { [t('profile.field', 'Campo')]: 'TDEE', [t('profile.value', 'Valor')]: profile?.tdee },
        { [t('profile.field', 'Campo')]: t('tracker.target', 'Objetivo Calorías'), [t('profile.value', 'Valor')]: profile?.targetCalories },
      ];
      const ws1 = XLSX.utils.json_to_sheet(profileData);
      const ws2 = XLSX.utils.json_to_sheet(measurements.map((m: any) => ({
        [t('common.date', 'Fecha')]: m.date, [t('profile.weight', 'Peso')]: m.weight,
        [t('profile.bodyFat', 'Grasa %')]: m.bodyFat, [t('profile.waist', 'Cintura')]: m.waist,
        [t('profile.hips', 'Cadera')]: m.hips, [t('profile.chest', 'Pecho')]: m.chest,
        [t('profile.arms', 'Brazos')]: m.arms, [t('profile.legs', 'Piernas')]: m.legs,
        [t('profile.neck', 'Cuello')]: m.neck, [t('common.notes', 'Notas')]: m.notes,
      })));
      const ns = useNutritionStore.getState();
      const ws3 = XLSX.utils.json_to_sheet(ns.todayLogs.map((l: any) => ({
        [t('common.date', 'Fecha')]: l.loggedAt, [t('tracker.meal', 'Comida')]: l.meal,
        [t('tracker.food', 'Alimento')]: l.foodItem.name, [t('tracker.grams', 'Gramos')]: l.grams,
        [t('tracker.calories', 'Calorías')]: l.calories, [t('tracker.protein', 'Proteínas')]: l.protein,
        [t('tracker.carbs', 'Carbohidratos')]: l.carbs, [t('tracker.fat', 'Grasas')]: l.fat,
      })));
      const dates = Array.from(new Set([...Object.keys(ns.dailyWater), ...Object.keys(ns.dailySteps), ...Object.keys(ns.dailySleep)])).sort().reverse();
      const ws4 = XLSX.utils.json_to_sheet(dates.map((d: string) => ({
        [t('common.date', 'Fecha')]: d, [t('tracker.steps', 'Pasos')]: ns.dailySteps[d] || 0,
        [t('tracker.water', 'Agua (ml)')]: ns.dailyWater[d] || 0, [t('tracker.sleep', 'Sueño (h)')]: ns.dailySleep[d] || 0,
        NEAT: ns.dailyNeat[d] || '', [t('profile.activity', 'Ejercicio')]: ns.dailyExercise[d] || '',
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws1, t('profile.sheetProfile', 'Perfil'));
      XLSX.utils.book_append_sheet(wb, ws2, t('profile.sheetWeight', 'Peso'));
      XLSX.utils.book_append_sheet(wb, ws3, t('profile.sheetNutrition', 'Nutrición'));
      XLSX.utils.book_append_sheet(wb, ws4, t('profile.sheetMetrics', 'Métricas'));
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = cacheDirectory + `FitGO_Data_${getLocalDateString()}.xlsx`;
      await writeAsStringAsync(uri, wbout, { encoding: EncodingType.Base64 });
      await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: t('profile.exportData', 'Exportar Data (Excel)'), UTI: 'com.microsoft.excel.xlsx' });
    } catch (err) { console.error('Export error:', err); setToastMsg({ text: t('profile.exportFailed', 'Error al exportar datos'), type: 'error' }); }
  };

  const handleManageSubscription = async () => router.push('/modals/paywall');
  const handleCancelSubscription = () => showAlert('confirm', t('profile.cancelSubscription', 'Cancelar Suscripción'), t('profile.cancelSubscriptionConfirm', '¿Estás seguro de que deseas cancelar tu suscripción Pro?'), async () => { await usePurchaseStore.getState().cancelPro(); setToastMsg({ text: t('profile.subscriptionCancelled', 'Suscripción cancelada correctamente'), type: 'success' }); }, () => {}, t('profile.cancelSubscription', 'Cancelar Suscripción'), t('common.cancel'));
  const handleVerifySubscription = async () => { const p = await usePurchaseStore.getState().verifyProStatus(); if (p) setToastMsg({ text: t('profile.verifySuccess', 'Suscripción verificada correctamente'), type: 'success' }); else showAlert('info', t('profile.notPremiumTitle', 'Sin Suscripción Activa'), t('profile.notPremiumDesc', 'No hemos encontrado una suscripción Pro asociada a tu cuenta.'), () => router.push('/modals/paywall'), () => {}, t('profile.upgradeNow', 'Mejorar ahora'), t('common.cancel')); };
  const handleCopyID = async () => { if (!profile?.id) return; try { const Clipboard = require('expo-clipboard'); await Clipboard.setStringAsync(profile.id); setToastMsg({ text: t('profile.idCopied'), type: 'success' }); } catch (e) { const { Share } = require('react-native'); await Share.share({ message: profile.id }); } };
  const handleDeleteAccount = () => showAlert('confirm', t('profile.deleteAccount', 'Eliminar Cuenta'), t('profile.deleteAccountConfirm', '¿Estás seguro?'), async () => { try { const { error } = await supabase.rpc('delete_user'); if (error) throw error; useNutritionStore.getState().reset(); useCoachStore.getState().resetAll(); useBodyStore.getState().reset(); useRecipesStore.getState().reset(); useProgressStore.getState().reset(); useSocialStore.getState().reset(); usePlannerStore.getState().clearPlans(); usePurchaseStore.setState({ isPro: false, customerInfo: null }); await supabase.auth.signOut(); } catch (e) { setTimeout(() => showAlert('error', t('common.error'), t('profile.deleteAccountError', 'No se pudo eliminar la cuenta.'), () => {}, undefined, t('common.ok'))); } }, () => {}, t('common.delete'), t('common.cancel'));
  const handleInviteFriends = async () => { try { const { Share } = require('react-native'); await Share.share({ message: t('profile.inviteMessage', '¡Únete a FitGO!'), title: 'FitGO' }); } catch (error) {} };
  const handleLogout = () => showAlert('confirm', t('profile.signOut'), t('profile.signOutConfirm'), async () => { useNutritionStore.getState().reset(); useCoachStore.getState().resetAll(); useBodyStore.getState().reset(); useRecipesStore.getState().reset(); useProgressStore.getState().reset(); useSocialStore.getState().reset(); await supabase.auth.signOut(); }, () => {}, t('profile.signOut'), t('common.cancel'));
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
            <AccountSection profile={profile} massUnit={massUnit} lengthUnit={lengthUnit} isPro={!!isPro} expanded={showAccount} onToggle={() => toggleSection(setShowAccount, showAccount)} onEditName={() => openEdit('name', t('profile.editName'), t('profile.enterName'))} onEditWeight={() => openEdit('weight', t('profile.weight'), t('profile.enterWeight'), 'numeric')} onEditHeight={() => openEdit('height', t('profile.height'), t('profile.enterHeight'), 'numeric')} onEditAge={() => openEdit('age', t('profile.age'), t('profile.enterAge'), 'numeric')} onEditSex={handleEditSex} onExportData={handleExportData} onManageSubscription={handleManageSubscription} onCancelSubscription={handleCancelSubscription} onVerifySubscription={handleVerifySubscription} onCopyID={handleCopyID} onUpdateEmail={() => router.push('/modals/update-account')} onDeleteAccount={handleDeleteAccount} onSignOut={handleLogout} />
          </SettingsSection>

          <SubscriptionSection isPro={!!isPro || !!profile?.isPro} onManage={handleManageSubscription} onCancel={handleCancelSubscription} onVerify={handleVerifySubscription} />

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

          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
