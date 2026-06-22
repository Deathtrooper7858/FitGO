import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PieChart } from 'react-native-gifted-charts';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Crypto from 'expo-crypto';
import { useTranslation } from 'react-i18next';
import { Spacing } from '../../constants';
import { FoodItem } from '../../services/foodDatabase';
import { useSettingsStore, useAuthStore, useNutritionStore } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import { convertEnergy } from '../../utils/units';
import { parseVoiceLog } from '../../services/groq';
import { CustomAlert, AlertType } from '../../components/CustomAlert';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
type Meal = typeof MEALS[number];

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch:     '☀️',
  dinner:    '🌙',
  snack:     '🍎',
};

export default function FoodDetailModal() {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const { foodJson, meal: initialMeal, logId, initialGrams, date } = useLocalSearchParams<{
    foodJson: string;
    meal?: Meal;
    logId?: string;
    initialGrams?: string;
    date?: string;
  }>();

  let food: FoodItem = {} as FoodItem;
  try {
    food = JSON.parse(foodJson ?? '{}');
  } catch (err) {
    console.error('Error parsing food JSON:', err);
  }

  const [grams, setGrams]       = useState(initialGrams || '100');
  const [foodName, setFoodName] = useState(food.name || '');
  const [nameEditing, setNameEditing] = useState(false);
  const nameInputRef            = useRef<any>(null);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getAutoMeal = (): Meal => {
    const h = new Date().getHours();
    if (h < 10) return 'breakfast';
    if (h < 14) return 'lunch';
    if (h < 18) return 'snack';
    return 'dinner';
  };

  const [meal, setMeal]         = useState<Meal>(initialMeal || getAutoMeal());
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef             = useRef(false);
  const [logTime, setLogTime]   = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { energyUnit }          = useSettingsStore();
  const energyLabel             = energyUnit.toUpperCase();
  const [isRecalculating, setIsRecalculating] = useState(false);

  const [alert, setAlert] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    visible: false, type: 'info', title: '', message: '', onConfirm: () => {},
  });

  const showAlert = (
    type: AlertType,
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    setAlert({
      visible: true, type, title, message, confirmText, cancelText,
      onConfirm: () => { onConfirm?.(); setAlert(prev => ({ ...prev, visible: false })); },
      onCancel:  () => { onCancel?.();  setAlert(prev => ({ ...prev, visible: false })); },
    });
  };

  const addLog = useNutritionStore(s => s.addLog);
  const updateLog = useNutritionStore(s => s.updateLog);
  const removeLog = useNutritionStore(s => s.removeLog);

  const g      = parseFloat(grams) || 0;
  const factor = g / 100;

  const initialCal  = Math.round(food.calories * factor);
  const initialPro  = Math.round(food.protein  * factor);
  const initialCarb = Math.round(food.carbs    * factor);
  const initialFat  = Math.round(food.fat      * factor);

  const [manualCal,  setManualCal]  = useState<string | null>(null);
  const [manualPro,  setManualPro]  = useState<string | null>(null);
  const [manualCarb, setManualCarb] = useState<string | null>(null);
  const [manualFat,  setManualFat]  = useState<string | null>(null);

  const calToSave  = manualCal  !== null ? (energyUnit === 'kj' ? Math.round(convertEnergy(parseInt(manualCal)  || 0, 'kj', 'kcal')) : parseInt(manualCal)  || 0) : initialCal;
  const proToSave  = manualPro  !== null ? parseInt(manualPro)  || 0 : initialPro;
  const carbToSave = manualCarb !== null ? parseInt(manualCarb) || 0 : initialCarb;
  const fatToSave  = manualFat  !== null ? parseInt(manualFat)  || 0 : initialFat;

  const displayCal  = manualCal  !== null ? manualCal  : String(Math.round(convertEnergy(initialCal, 'kcal', energyUnit)));
  const displayPro  = manualPro  !== null ? manualPro  : String(initialPro);
  const displayCarb = manualCarb !== null ? manualCarb : String(initialCarb);
  const displayFat  = manualFat  !== null ? manualFat  : String(initialFat);

  const handleGramsChange = (val: string) => {
    setGrams(val);
    setManualCal(null); setManualPro(null); setManualCarb(null); setManualFat(null);
  };

  const sugar    = food.sugar        ? Math.round(food.sugar        * factor) : 0;
  const fiber    = food.fiber        ? Math.round(food.fiber        * factor) : 0;
  const sodium   = food.sodium       ? Math.round(food.sodium       * factor) : 0;
  const iron     = food.iron         ? Math.round(food.iron         * factor) : 0;
  const calcium  = food.calcium      ? Math.round(food.calcium      * factor) : 0;
  const satFat   = food.saturatedFat ? Math.round(food.saturatedFat * factor) : 0;
  const transFat = food.transFat     ? Math.round(food.transFat     * factor) : 0;

  const pieData = [
    { value: proToSave,  color: colors.protein, text: 'P' },
    { value: carbToSave, color: colors.carbs,   text: 'C' },
    { value: fatToSave,  color: colors.fat,     text: 'F' },
  ].filter(d => d.value > 0);

  // ── Real-time debounced name recalculation ────────────────────────────────
  const recalcFromName = useCallback(async (name: string) => {
    if (!name.trim() || name === food.name) return;
    try {
      setIsRecalculating(true);
      const parsedItems = await parseVoiceLog(name, i18n.language);
      if (parsedItems && parsedItems.length > 0) {
        const item  = parsedItems[0];
        const ratio = g > 0 && item.grams > 0 ? g / item.grams : 1;
        setManualCal(String(Math.round(item.calories * ratio)));
        setManualPro(String(Math.round(item.protein  * ratio)));
        setManualCarb(String(Math.round(item.carbs   * ratio)));
        setManualFat(String(Math.round(item.fat      * ratio)));
        if (item.name) setFoodName(item.name);
      }
    } catch (err) {
      console.warn('Error recalculating macros:', err);
    } finally {
      setIsRecalculating(false);
    }
  }, [food.name, g, i18n.language]);

  const handleNameChange = (text: string) => {
    setFoodName(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => recalcFromName(text), 1000);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (isSaving || isSavingRef.current || isRecalculating) return;
    if (!g || g <= 0) {
      showAlert('error', t('common.error'), t('foodDetail.invalidAmount'));
      return;
    }
    isSavingRef.current = true;
    setIsSaving(true);
    let saveSucceeded = false;
    try {
      if (logId) {
        await updateLog(logId, {
          grams: g, meal, calories: calToSave, protein: proToSave, carbs: carbToSave,
          fat: fatToSave, sugar, fiber, sodium, iron, calcium, saturatedFat: satFat, transFat,
          foodItem: { ...food, name: foodName },
        });
      } else {
        const localId = Crypto.randomUUID();
        await addLog({
          id: localId, foodItem: { ...food, name: foodName }, grams: g, meal,
          loggedAt: date ? `${date}T${logTime.toISOString().split('T')[1]}` : logTime.toISOString(),
          calories: calToSave, protein: proToSave, carbs: carbToSave, fat: fatToSave,
          sugar, fiber, sodium, iron, calcium, saturatedFat: satFat, transFat,
        });
      }
      saveSucceeded = true;
    } catch (err) {
      console.warn('[FoodDetail] Sync error (local save succeeded):', err);
      saveSucceeded = true;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
    if (saveSucceeded) {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/tracker');
    }
  };

  const totalMacroG = proToSave + carbToSave + fatToSave;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <CustomAlert
        visible={alert.visible} type={alert.type} title={alert.title}
        message={alert.message} confirmText={alert.confirmText}
        cancelText={alert.cancelText} onConfirm={alert.onConfirm} onCancel={alert.onCancel}
      />

      {/* Drag handle */}
      <View style={[s.handle, { backgroundColor: colors.border }]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* ── Header – food name ── */}
        <LinearGradient
          colors={[colors.primary + '18', 'transparent']}
          style={s.headerGradient}
        >
          <View style={[
            s.nameInputWrap,
            { borderColor: nameEditing ? colors.primary : colors.border + '80',
              backgroundColor: nameEditing ? colors.primary + '0A' : 'transparent' }
          ]}>
            <TextInput
              ref={nameInputRef}
              style={[s.name, { color: colors.textPrimary, flex: 1 }]}
              value={foodName}
              onChangeText={handleNameChange}
              onFocus={() => setNameEditing(true)}
              onBlur={() => setNameEditing(false)}
              multiline
              placeholder="Escribe el alimento..."
              placeholderTextColor={colors.textMuted}
            />
            {isRecalculating ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
            ) : (
              <TouchableOpacity
                style={[s.editNameBtn, { backgroundColor: nameEditing ? colors.primary : colors.primary + '20' }]}
                onPress={() => { nameInputRef.current?.focus(); }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14 }}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          {!nameEditing && (
            <Text style={[s.editHint, { color: colors.primary + 'BB' }]}>
              ✏️ Toca el nombre para cambiarlo y actualizar los macros
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {food.brand && (
              <View style={[s.badge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[s.badgeText, { color: colors.textSecondary }]}>🏷️ {food.brand}</Text>
              </View>
            )}
            {food.source && (
              <View style={[s.badge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
                <Text style={[s.badgeText, { color: colors.primary }]}>✦ {food.source}</Text>
              </View>
            )}
            {isRecalculating && (
              <View style={[s.badge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                <Text style={[s.badgeText, { color: colors.primary }]}>⟳ Actualizando...</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* ── Calories + macro donut card ── */}
        <View style={[s.macroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Calorie hero */}
          <LinearGradient
            colors={[colors.primary + '22', colors.primary + '08']}
            style={s.calHero}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[s.perGrams, { color: colors.textMuted }]}>
                {t('foodDetail.per')} {grams || '?'}g
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 }}>
                <TextInput
                  style={[s.caloriesVal, { color: colors.textPrimary }]}
                  value={displayCal}
                  onChangeText={setManualCal}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <Text style={[s.caloriesUnit, { color: colors.primary }]}>{energyLabel}</Text>
              </View>
            </View>
            <View style={s.pieWrap}>
              {pieData.length > 0 ? (
                <PieChart
                  data={pieData}
                  donut
                  radius={44}
                  innerRadius={32}
                  innerCircleColor={colors.surface}
                  centerLabelComponent={() => (
                    <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '800' }}>
                      {totalMacroG > 0 ? `${Math.round((proToSave / totalMacroG) * 100)}%` : '—'}
                    </Text>
                  )}
                />
              ) : (
                <View style={[s.emptyPie, { borderColor: colors.border }]} />
              )}
            </View>
          </LinearGradient>

          {/* Macro breakdown – editable */}
          <View style={s.macroGrid}>
            {[
              { label: t('profile.protein'), val: displayPro,  setVal: setManualPro,  color: colors.protein, icon: '💪', key: 'pro' },
              { label: t('profile.carbs'),   val: displayCarb, setVal: setManualCarb, color: colors.carbs,   icon: '⚡', key: 'carb' },
              { label: t('profile.fat'),     val: displayFat,  setVal: setManualFat,  color: colors.fat,     icon: '🫒', key: 'fat' },
            ].map(({ label, val, setVal, color, icon, key }) => (
              <View key={key} style={[s.macroChip, { backgroundColor: color + '12', borderColor: color + '40' }]}>
                <Text style={[s.macroChipIcon]}>{icon}</Text>
                <Text style={[s.macroChipLabel, { color: color }]}>{label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <TextInput
                    style={[s.macroChipVal, { color: colors.textPrimary }]}
                    value={val}
                    onChangeText={setVal}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  <Text style={[s.macroChipUnit, { color: colors.textMuted }]}>g</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Extra nutrients row */}
          {(sugar > 0 || fiber > 0 || sodium > 0) && (
            <View style={[s.extraNutrients, { borderTopColor: colors.border + '60' }]}>
              {sugar  > 0 && <View style={s.nutriItem}><Text style={[s.nutriLabel, { color: colors.textMuted }]}>Azúcar</Text><Text style={[s.nutriVal, { color: colors.textSecondary }]}>{sugar}g</Text></View>}
              {fiber  > 0 && <View style={s.nutriItem}><Text style={[s.nutriLabel, { color: colors.textMuted }]}>Fibra</Text><Text style={[s.nutriVal, { color: colors.textSecondary }]}>{fiber}g</Text></View>}
              {sodium > 0 && <View style={s.nutriItem}><Text style={[s.nutriLabel, { color: colors.textMuted }]}>Sodio</Text><Text style={[s.nutriVal, { color: colors.textSecondary }]}>{sodium}mg</Text></View>}
            </View>
          )}
        </View>

        {/* ── Grams input ── */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>
            ⚖️  {t('foodDetail.amount')}
          </Text>
          <View style={[s.inputRow, { backgroundColor: colors.surface, borderColor: colors.primary + '80' }]}>
            <TextInput
              style={[s.gramsInput, { color: colors.textPrimary, flex: 1 }]}
              value={grams}
              onChangeText={handleGramsChange}
              keyboardType="numeric"
              selectTextOnFocus
            />
            <View style={[s.gramUnit, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[s.gramUnitText, { color: colors.primary }]}>g</Text>
            </View>
          </View>
        </View>

        {/* ── Meal selector ── */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>
            🍽️  {t('foodDetail.addToMeal')}
          </Text>
          <View style={s.mealRow}>
            {MEALS.map((m) => {
              const active = meal === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    s.mealPill,
                    { backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border },
                  ]}
                  onPress={() => setMeal(m)}
                  activeOpacity={0.75}
                >
                  <Text style={s.mealPillIcon}>{MEAL_ICONS[m]}</Text>
                  <Text style={[s.mealPillText, { color: active ? '#fff' : colors.textSecondary }]}>
                    {t(`tracker.${m}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Time selector ── */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>
            🕐  {t('foodDetail.time', 'Hora')}
          </Text>
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            style={[s.timeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Text style={[s.timeText, { color: colors.textPrimary }]}>
              {logTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={[s.timeEdit, { color: colors.primary }]}>✏️ Editar</Text>
          </TouchableOpacity>
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={logTime}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (selectedDate) setLogTime(selectedDate);
            }}
          />
        )}

        {/* ── Delete option ── */}
        {logId && (
          <TouchableOpacity
            style={[s.deleteRow, { borderColor: colors.error + '40', backgroundColor: colors.error + '0A' }]}
            onPress={() =>
              showAlert(
                'confirm',
                t('tracker.removeEntry'),
                t('tracker.removeConfirm', { name: food.name }),
                async () => {
                  try {
                    await removeLog(logId);
                    router.back();
                  } catch {
                    showAlert('error', t('common.error'), 'Could not delete log. Try again.');
                  }
                },
                () => {},
                t('common.remove'),
                t('common.cancel')
              )
            }
          >
            <Text style={[s.deleteText, { color: colors.error }]}>🗑️ {t('common.remove')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Footer ── */}
      <View style={[s.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[s.cancelBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[s.cancelText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.addBtn} onPress={handleSave} activeOpacity={0.85} disabled={isSaving || isRecalculating}>
          <LinearGradient colors={['#7C5CFC', '#4338CA']} style={s.addGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.addText}>
                {logId ? t('common.save') : t('foodDetail.addBtn', { meal: t(`tracker.${meal}`) })}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1 },
  handle:         { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 10, marginBottom: 8 },

  // Header
  headerGradient: { paddingHorizontal: Spacing.base, paddingTop: 12, paddingBottom: 16 },
  nameInputWrap:  { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, gap: 8 },
  name:           { fontSize: 22, fontWeight: '800', lineHeight: 28, letterSpacing: -0.3 },
  editNameBtn:    { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  editHint:       { fontSize: 11, fontWeight: '600', marginBottom: 10, letterSpacing: 0.2 },
  badge:          { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText:      { fontSize: 11, fontWeight: '600' },

  // Macro card
  macroCard:      { marginHorizontal: Spacing.base, marginBottom: Spacing.base, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  calHero:        { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, paddingBottom: 20 },
  perGrams:       { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  caloriesVal:    { fontSize: 38, fontWeight: '900', letterSpacing: -1, padding: 0, margin: 0 },
  caloriesUnit:   { fontSize: 14, fontWeight: '700', marginLeft: 4, marginBottom: 6 },
  pieWrap:        { width: 88, height: 88, justifyContent: 'center', alignItems: 'center' },
  emptyPie:       { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderStyle: 'dashed' },

  // Macro chips
  macroGrid:      { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  macroChip:      { flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: 'center', gap: 2 },
  macroChipIcon:  { fontSize: 16 },
  macroChipLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  macroChipVal:   { fontSize: 18, fontWeight: '800', padding: 0, margin: 0 },
  macroChipUnit:  { fontSize: 11, fontWeight: '600', marginLeft: 1, marginBottom: 1 },

  // Extra nutrients
  extraNutrients: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, marginTop: 4 },
  nutriItem:      { alignItems: 'center', gap: 2 },
  nutriLabel:     { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  nutriVal:       { fontSize: 13, fontWeight: '700' },

  // Sections
  section:        { paddingHorizontal: Spacing.base, marginBottom: Spacing.base },
  sectionLabel:   { fontSize: 12, fontWeight: '700', marginBottom: 10, letterSpacing: 0.8, textTransform: 'uppercase' },

  // Grams input
  inputRow:       { flexDirection: 'row', borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', alignItems: 'center' },
  gramsInput:     { padding: 16, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  gramUnit:       { paddingHorizontal: 20, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' },
  gramUnitText:   { fontSize: 16, fontWeight: '800' },

  // Meal pills
  mealRow:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  mealPill:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 40, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 10 },
  mealPillIcon:   { fontSize: 14 },
  mealPillText:   { fontSize: 13, fontWeight: '700' },

  // Time
  timeBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 20, paddingVertical: 14 },
  timeText:       { fontSize: 20, fontWeight: '700' },
  timeEdit:       { fontSize: 13, fontWeight: '600' },

  // Delete
  deleteRow:      { marginHorizontal: Spacing.base, marginTop: 8, marginBottom: Spacing.base, padding: 14, alignItems: 'center', borderRadius: 14, borderWidth: 1 },
  deleteText:     { fontSize: 14, fontWeight: '700' },

  // Footer
  footer:         { flexDirection: 'row', gap: 12, padding: Spacing.base, borderTopWidth: 1, paddingBottom: 36 },
  cancelBtn:      { flex: 1, padding: 15, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelText:     { fontWeight: '700', fontSize: 15 },
  addBtn:         { flex: 2, borderRadius: 14, overflow: 'hidden' },
  addGrad:        { padding: 15, alignItems: 'center', justifyContent: 'center' },
  addText:        { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },
});
