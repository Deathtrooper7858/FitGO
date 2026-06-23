import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Droplets, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, Radius } from '../../constants';
import type { PlanItem } from '../../store/plannerStore';
import { AnimatedCard } from '../AnimatedCard';
import WeekAnalysis from './WeekAnalysis';
import MealCard from './MealCard';

interface MealPlanViewProps {
  meals: PlanItem[];
  activeDay: string;
  loading: boolean;
  isProActually: boolean;
  isPremiumCustom: boolean;
  safePremiumColor: string;
  isActiveToday: boolean;
  consumedMacros: { p: number; c: number; f: number };
  plannedMacros: { p: number; c: number; f: number };
  waterToday: number;
  totalCal: number;
  targetCalories: number;
  analysis: string | null;
  analyzing: boolean;
  onWeeklyAnalysis: () => void;
  onAddWater: () => void;
  onSwapMeal: (day: string, index: number, meal: PlanItem) => Promise<void>;
  onConsumeMeal: (meal: PlanItem) => void;
}

export default function MealPlanView({
  meals, activeDay, loading, isProActually, isPremiumCustom, safePremiumColor,
  isActiveToday, consumedMacros, plannedMacros, waterToday, totalCal, targetCalories,
  analysis, analyzing, onWeeklyAnalysis, onAddWater, onSwapMeal, onConsumeMeal
}: MealPlanViewProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <>
      <View style={{ marginBottom: 16 }}>
        <WeekAnalysis analysis={analysis} analyzing={analyzing} onAnalyze={onWeeklyAnalysis} />
      </View>

      {meals.length > 0 && (
        <View style={mv.summaryContainer}>
          <View style={[mv.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={mv.summaryLeft}>
              <Text style={[mv.summaryVal, { color: colors.textPrimary }]}>{totalCal}</Text>
              <Text style={[mv.summaryLbl, { color: colors.textMuted }]}>{t('planner.planned')} (kcal)</Text>
            </View>
            <View style={[mv.summaryDivider, { backgroundColor: colors.border + '50' }]} />
            <View style={mv.summaryRight}>
              <Text style={[mv.summaryVal, { color: colors.primary }]}>{Math.max(targetCalories - totalCal, 0)}</Text>
              <Text style={[mv.summaryLbl, { color: colors.textMuted }]}>{t('tracker.remaining')}</Text>
            </View>
          </View>

          {isActiveToday && plannedMacros.p > 0 && (
            <View style={[mv.macroBarsWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
               <Text style={[mv.macroTitle, { color: colors.textPrimary }]}>{t('tracker.macroProgressToday', 'Macro Progress (Today)')}</Text>
               <View style={mv.macroBarRow}>
                 <Text style={[mv.macroLabel, { color: colors.protein }]}>P</Text>
                 <View style={[mv.macroTrack, { backgroundColor: colors.protein + '20' }]}>
                   <View style={[mv.macroFill, { backgroundColor: colors.protein, width: `${Math.min((consumedMacros.p / plannedMacros.p) * 100, 100)}%` }]} />
                 </View>
                 <Text style={[mv.macroVal, { color: colors.textSecondary }]}>{consumedMacros.p}/{plannedMacros.p}g</Text>
               </View>
               <View style={mv.macroBarRow}>
                 <Text style={[mv.macroLabel, { color: colors.carbs }]}>C</Text>
                 <View style={[mv.macroTrack, { backgroundColor: colors.carbs + '20' }]}>
                   <View style={[mv.macroFill, { backgroundColor: colors.carbs, width: `${Math.min((consumedMacros.c / plannedMacros.c) * 100, 100)}%` }]} />
                 </View>
                 <Text style={[mv.macroVal, { color: colors.textSecondary }]}>{consumedMacros.c}/{plannedMacros.c}g</Text>
               </View>
               <View style={mv.macroBarRow}>
                 <Text style={[mv.macroLabel, { color: colors.fat }]}>F</Text>
                 <View style={[mv.macroTrack, { backgroundColor: colors.fat + '20' }]}>
                   <View style={[mv.macroFill, { backgroundColor: colors.fat, width: `${Math.min((consumedMacros.f / plannedMacros.f) * 100, 100)}%` }]} />
                 </View>
                 <Text style={[mv.macroVal, { color: colors.textSecondary }]}>{consumedMacros.f}/{plannedMacros.f}g</Text>
               </View>
            </View>
          )}

          {isActiveToday && (
            <View style={[mv.hydrationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
               <View style={mv.hydroLeft}>
                  <View style={[mv.hydroIcon, { backgroundColor: '#3b82f622' }]}>
                    <Droplets size={24} color="#3b82f6" />
                  </View>
                  <View>
                    <Text style={[mv.hydroTitle, { color: colors.textPrimary }]}>{t('tracker.waterToday', 'Water (Today)')}</Text>
                    <Text style={[mv.hydroVal, { color: '#3b82f6' }]}>{waterToday} ml</Text>
                  </View>
               </View>
               <TouchableOpacity
                 style={[mv.hydroBtn, { backgroundColor: '#3b82f6' }]}
                 onPress={onAddWater}
               >
                  <Plus size={16} color="#fff" />
                   <Text style={mv.hydroBtnText}>{t('tracker.glass250ml', 'Glass (250ml)')}</Text>
               </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={mv.contentList}>
        {meals.length > 0 ? (
          meals.map((m, i) => (
            <AnimatedCard key={`${i}-${m.name}`} index={i} direction="up">
              <MealCard
                name={m.name}
                meal={m.meal}
                cal={m.calories}
                protein={m.protein}
                carbs={m.carbs}
                fat={m.fat}
                onSwap={() => onSwapMeal(activeDay, i, m)}
                onConsume={() => onConsumeMeal(m)}
                onRecipe={() => router.push({ pathname: '/(tabs)/coach', params: { initialTab: 'nutritionist', prompt: `¿Me puedes dar la receta o decirme cómo preparar: ${m.name}?` } })}
              />
            </AnimatedCard>
          ))
        ) : (
          <View style={mv.emptyDay}>
            <View style={[mv.emptyIconWrap, {backgroundColor: colors.surfaceAlt}]}>
              <Text style={{ fontSize: 42, color: colors.textMuted }}>📅</Text>
            </View>
            <Text style={[mv.emptyTitle, { color: colors.textPrimary }]}>
              {loading ? t('common.loading') : t('planner.noMeals')}
            </Text>
            <Text style={[mv.emptySub, { color: colors.textSecondary }]}>
              {loading ? '' : (isProActually ? t('planner.emptySubPro') : t('planner.emptySubFree'))}
            </Text>
            {!isProActually && !loading && (
              <TouchableOpacity style={mv.proBtn} activeOpacity={0.8} onPress={() => router.push('/modals/paywall')}>
                <View style={[mv.proGrad, { backgroundColor: colors.primary }]}>
                  <Text style={mv.proText}>{t('planner.unlockPro')}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {meals.length > 0 && (
          <TouchableOpacity
            style={[mv.addMealBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/(tabs)/coach', params: { initialTab: 'nutritionist', prompt: t('planner.askCustomMeal', 'Suggest another healthy meal for today that fits my remaining macros.') } })}
          >
            <Text style={[mv.addMealIcon, { color: colors.primary }]}>+</Text>
            <Text style={[mv.addMealText, { color: colors.textSecondary }]}>{t('planner.addAnotherMeal', 'Añadir otra comida')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

const mv = StyleSheet.create({
  contentList: { paddingHorizontal: Spacing.base },
  summaryContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  summaryCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 28, padding: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  summaryLeft: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryRight: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryDivider: { width: 1, height: 50 },
  summaryVal:  { fontSize: 28, fontWeight: '900' },
  summaryLbl:  { fontSize: 12, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  macroBarsWrap: { marginTop: 14, borderRadius: 24, padding: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  macroTitle: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  macroBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  macroLabel: { width: 14, fontSize: 13, fontWeight: '900' },
  macroTrack: { flex: 1, height: 10, borderRadius: 5, marginHorizontal: 10, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 5 },
  macroVal: { width: 50, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  hydrationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, borderRadius: 24, padding: 18, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  hydroLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hydroIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  hydroTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  hydroVal: { fontSize: 18, fontWeight: '900' },
  hydroBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full },
  hydroBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  addMealBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 28, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 10, marginBottom: 24, gap: 12 },
  addMealIcon: { fontSize: 26, fontWeight: '400', marginTop: -3 },
  addMealText: { fontSize: 15, fontWeight: '700' },
  emptyDay:    { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 20 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.15, shadowRadius: 16, elevation: 5 },
  emptyTitle:  { fontSize: 24, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  emptySub:    { fontSize: 16, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
  proBtn:      { borderRadius: Radius.full, overflow: 'hidden', elevation: 6, shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  proGrad:     { paddingHorizontal: 28, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  proText:     { color: '#fff', fontWeight: '800', fontSize: 16 },
});
