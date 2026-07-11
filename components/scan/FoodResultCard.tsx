import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Spacing, Radius } from '../../constants';

interface FoodResultCardProps {
  food: {
    foods: {
      name: string; grams: number; calories: number; protein: number; carbs: number; fat: number;
      sugar?: number; fiber?: number; sodium?: number; iron?: number; calcium?: number;
      saturatedFat?: number; transFat?: number;
    }[];
    totalCalories: number;
    confidence: 'high' | 'medium' | 'low';
    notes: string;
  };
  editedFoods: {
    name: string; grams: number; calories: number; protein: number; carbs: number; fat: number;
    sugar?: number; fiber?: number; sodium?: number; iron?: number; calcium?: number;
    saturatedFat?: number; transFat?: number;
    originalGrams: number; originalCal: number; originalProt: number; originalCarbs: number; originalFat: number;
    originalSugar?: number; originalFiber?: number; originalSodium?: number; originalIron?: number;
    originalCalcium?: number; originalSatFat?: number; originalTransFat?: number;
  }[];
  capturedUri: string | null;
  logTime: Date;
  showTimePicker: boolean;
  loading: boolean;
  colors: any;
  t: any;
  language: string;
  initialMeal?: string;
  date?: string;
  isPremiumCustom: boolean;
  safePremiumColor: string;
  onUpdateName: (index: number, newName: string) => void;
  onUpdateGrams: (index: number, newGrams: string) => void;
  onResetPhoto: () => void;
  onAddAll: () => void;
  onAddMissing: () => void;
  onTimeChange: (date: Date) => void;
  onToggleTimePicker: () => void;
}

export default function FoodResultCard({
  food, editedFoods, capturedUri, logTime, showTimePicker, loading,
  colors, t, language, initialMeal, date, isPremiumCustom, safePremiumColor,
  onUpdateName, onUpdateGrams, onResetPhoto, onAddAll, onAddMissing,
  onTimeChange, onToggleTimePicker,
}: FoodResultCardProps) {
  const confidenceColor = food.confidence === 'high' ? colors.success : food.confidence === 'medium' ? colors.warning : colors.error;
  const insets = useSafeAreaInsets();

  const getAutoMeal = () => {
    const h = new Date().getHours();
    if (h < 10) return 'breakfast';
    if (h < 14) return 'lunch';
    if (h < 18) return 'snack';
    return 'dinner';
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[isPremiumCustom ? safePremiumColor + '25' : colors.primary + '20', colors.background, colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[s.resultHeader, { backgroundColor: 'transparent' }]}>
        <View style={{ width: 40 }} />
        <Text style={[s.title, { color: colors.textPrimary }]}>{t('scan.analysisTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.base, paddingBottom: 160 }}>
        {capturedUri && capturedUri !== 'text' && (
          <Image cachePolicy="memory-disk" source={{ uri: capturedUri }} style={s.capturedImage} contentFit="cover" />
        )}
        <View style={[s.confidenceBadge, { borderColor: confidenceColor }]}>
          <View style={[s.confidenceDot, { backgroundColor: confidenceColor }]} />
          <Text style={[s.confidenceText, { color: confidenceColor }]}>{food.confidence.toUpperCase()} {t('scan.confidence')}</Text>
        </View>
        <Text style={[s.sectionTitle, { color: colors.primary }]}>{t('scan.detectedFoods')}</Text>
        {editedFoods.map((item, i) => (
          <LinearGradient
            key={i}
            colors={[colors.surface, colors.surfaceAlt + 'AA']}
            style={[s.foodCard, { borderColor: colors.border }]}
          >
            <View style={[s.foodNameRow, { borderBottomColor: colors.border + '60' }]}>
              <Text style={s.foodNameIcon}>🍽️</Text>
              <TextInput
                style={[s.foodName, { color: colors.primary, flex: 1, padding: 0, margin: 0 }]}
                value={item.name}
                onChangeText={(v) => onUpdateName(i, v)}
                multiline
                placeholder={t('scan.foodNamePlaceholder', 'Nombre del alimento')}
                placeholderTextColor={colors.textMuted}
              />
              {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />}
            </View>
            <View style={s.foodMetaRow}>
              <View style={[s.gramsBox, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '44' }]}>
                <TextInput
                  style={[s.gramInput, { color: colors.primary, padding: 0, margin: 0, textAlign: 'center', fontSize: 18, fontWeight: '800' }]}
                  value={String(item.grams)}
                  onChangeText={(v) => onUpdateGrams(i, v)}
                  keyboardType="numeric"
                  maxLength={5}
                  selectTextOnFocus
                />
                <Text style={[s.gramLabel, { color: colors.primary, fontWeight: '700' }]}>g</Text>
              </View>
              <View style={[s.calBox, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '44' }]}>
                <Text style={[s.foodCal, { color: colors.accent }]}>{item.calories}</Text>
                <Text style={[s.calUnit, { color: colors.accent + 'AA' }]}>kcal</Text>
              </View>
            </View>
            <View style={s.macroRow}>
              {[
                { label: 'P', val: item.protein, color: colors.protein },
                { label: 'C', val: item.carbs, color: colors.carbs },
                { label: 'G', val: item.fat, color: colors.fat },
              ].map(({ label, val, color }) => (
                <View key={label} style={[s.macroChipScan, { backgroundColor: color + '15', borderColor: color + '40' }]}>
                  <Text style={[s.macroChipLabelScan, { color }]}>{label}</Text>
                  <Text style={[s.macroChipValScan, { color }]}>{val}g</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        ))}
        <LinearGradient
          colors={colors.theme === 'dark' ? ['#7C5CFC15', '#22D3EE11'] : [colors.primary + '10', colors.secondary + '05']}
          style={[s.totalCard, { borderColor: colors.primary + '33' }]}
        >
          <Text style={[s.totalLabel, { color: colors.textSecondary }]}>{t('scan.totalCalories')}</Text>
          <Text style={[s.totalValue, { color: colors.accent }]}>
            {editedFoods.reduce((acc, f) => acc + f.calories, 0)} kcal
          </Text>
        </LinearGradient>
        <View style={[s.disclaimerBox, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '44' }]}>
          <Text style={{ fontSize: 14 }}>⚠️</Text>
          <Text style={[s.disclaimerText, { color: colors.warning }]}>
            {t('scan.photoDisclaimer')}
          </Text>
        </View>
        <View style={[s.timeSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
            {t('scan.logTime')}
          </Text>
          <TouchableOpacity onPress={onToggleTimePicker} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>
              {logTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={{ fontSize: 16 }}>✏️</Text>
          </TouchableOpacity>
        </View>
        {showTimePicker && (
          <DateTimePicker
            value={logTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              if (selectedDate) onTimeChange(selectedDate);
            }}
          />
        )}
        {food.notes && (
          <Text style={[s.notesText, { color: colors.textSecondary }]}>💡 {food.notes}</Text>
        )}
      </ScrollView>
      <View style={[s.resultFooter, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Math.max(32, insets.bottom + 16) }]}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <TouchableOpacity style={[s.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={onResetPhoto}>
            <Text style={{ fontSize: 18 }}>📷</Text>
            <Text style={[s.actionBtnText, { color: colors.textSecondary }]}>{t('scan.retake', 'Repetir')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '12' }]}
            onPress={onAddMissing}
          >
            <Text style={{ fontSize: 18 }}>➕</Text>
            <Text style={[s.actionBtnText, { color: colors.primary }]}>
              {t('scan.missing')}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.addAllBtn} onPress={onAddAll} activeOpacity={0.85}>
          <LinearGradient
            colors={isPremiumCustom ? [safePremiumColor, safePremiumColor + 'CC'] : ['#7C5CFC', '#4338CA']}
            style={s.addAllGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={{ fontSize: 18, color: '#fff' }}>✅</Text>
            <Text style={s.addAllText}>
              {t('scan.addAll', { meal: t(`tracker.${initialMeal || getAutoMeal()}`) })}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: 56, paddingBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  capturedImage: { width: '100%', height: 200, borderRadius: Radius.xl, marginBottom: Spacing.base },
  confidenceBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.full, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 6, marginBottom: Spacing.base },
  confidenceDot: { width: 8, height: 8, borderRadius: 4 },
  confidenceText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.md },
  foodCard: { borderRadius: 18, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  foodNameRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, gap: 8 },
  foodNameIcon: { fontSize: 18, marginTop: 2 },
  foodName: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  foodMetaRow: { flexDirection: 'row', gap: 10, padding: 14, paddingBottom: 10 },
  gramsBox: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  calBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 4, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' },
  foodCal: { fontSize: 20, fontWeight: '900' },
  calUnit: { fontSize: 11, fontWeight: '700' },
  gramInput: { fontSize: 18, fontWeight: '800', minWidth: 40, textAlign: 'center', padding: 0, margin: 0 },
  gramLabel: { fontSize: 14, fontWeight: '700' },
  macroRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  macroChipScan: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 10, borderWidth: 1, paddingVertical: 8 },
  macroChipLabelScan: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  macroChipValScan: { fontSize: 13, fontWeight: '700' },
  totalCard: { padding: 20, borderRadius: Radius.xl, borderWidth: 1.5, alignItems: 'center', marginVertical: 20 },
  totalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  totalValue: { fontSize: 28, fontWeight: '800' },
  notesText: { fontSize: 14, fontStyle: 'italic', paddingHorizontal: 10, lineHeight: 22 },
  resultFooter: { padding: Spacing.base, borderTopWidth: 1, paddingTop: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: Radius.lg, borderWidth: 1, gap: 8 },
  actionBtnText: { fontWeight: '700', fontSize: 15 },
  addAllBtn: { borderRadius: Radius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  addAllGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 10 },
  addAllText: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.5 },
  disclaimerBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginTop: -8, marginBottom: 16 },
  disclaimerText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  timeSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: Radius.lg, borderWidth: 1, marginBottom: 16 },
});
