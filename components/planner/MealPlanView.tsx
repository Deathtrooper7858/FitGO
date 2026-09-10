import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Droplets, Plus, ShoppingCart, Sparkles, ChevronRight, Utensils } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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

function MealPlanView({
  meals,
  activeDay,
  loading,
  isProActually,
  safePremiumColor,
  isActiveToday,
  consumedMacros,
  plannedMacros,
  waterToday,
  totalCal,
  targetCalories,
  analysis,
  analyzing,
  onWeeklyAnalysis,
  onAddWater,
  onSwapMeal,
  onConsumeMeal,
}: MealPlanViewProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const safeTarget = Math.max(targetCalories || 2000, 1);
  const caloriePct = Math.min(Math.round((totalCal / safeTarget) * 100), 100);
  const remainingCals = Math.max(safeTarget - totalCal, 0);

  const handleAddWaterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddWater();
  };

  return (
    <>
      <View style={{ marginBottom: 14 }}>
        <WeekAnalysis analysis={analysis} analyzing={analyzing} onAnalyze={onWeeklyAnalysis} />
      </View>

      {meals.length > 0 && (
        <View style={mv.summaryContainer}>
          {/* Main Calorie Dashboard Card */}
          <View style={[mv.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={mv.heroHeader}>
              <View>
                <Text style={[mv.heroOverline, { color: colors.textMuted }]}>
                  {t('planner.dailyBudget', 'RESUMEN NUTRICIONAL')}
                </Text>
                <View style={mv.calRow}>
                  <Text style={[mv.heroTotal, { color: colors.textPrimary }]}>{totalCal}</Text>
                  <Text style={[mv.heroTarget, { color: colors.textSecondary }]}>/ {safeTarget} kcal</Text>
                </View>
              </View>

              <View style={[mv.remainingBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '33' }]}>
                <Text style={[mv.remainingValue, { color: colors.primary }]}>{remainingCals}</Text>
                <Text style={[mv.remainingLabel, { color: colors.primary }]}>{t('tracker.remaining', 'restantes')}</Text>
              </View>
            </View>

            {/* Calorie Progress Bar */}
            <View style={[mv.barTrack, { backgroundColor: colors.surfaceAlt }]}>
              <View
                style={[
                  mv.barFill,
                  {
                    width: `${caloriePct}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>

            {/* Macro Breakdown Row */}
            <View style={mv.macroGrid}>
              {/* Protein */}
              <View style={[mv.macroCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.protein + '25' }]}>
                <View style={mv.macroCardHeader}>
                  <Text style={[mv.macroPillLetter, { color: colors.protein }]}>P</Text>
                  <Text style={[mv.macroCardLabel, { color: colors.textMuted }]}>{t('common.protein', 'Proteína')}</Text>
                </View>
                <Text style={[mv.macroCardValue, { color: colors.textPrimary }]}>
                  {isActiveToday ? `${consumedMacros.p}/` : ''}{plannedMacros.p}g
                </Text>
              </View>

              {/* Carbs */}
              <View style={[mv.macroCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.carbs + '25' }]}>
                <View style={mv.macroCardHeader}>
                  <Text style={[mv.macroPillLetter, { color: colors.carbs }]}>C</Text>
                  <Text style={[mv.macroCardLabel, { color: colors.textMuted }]}>{t('common.carbs', 'Carbos')}</Text>
                </View>
                <Text style={[mv.macroCardValue, { color: colors.textPrimary }]}>
                  {isActiveToday ? `${consumedMacros.c}/` : ''}{plannedMacros.c}g
                </Text>
              </View>

              {/* Fats */}
              <View style={[mv.macroCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.fat + '25' }]}>
                <View style={mv.macroCardHeader}>
                  <Text style={[mv.macroPillLetter, { color: colors.fat }]}>G</Text>
                  <Text style={[mv.macroCardLabel, { color: colors.textMuted }]}>{t('common.fat', 'Grasas')}</Text>
                </View>
                <Text style={[mv.macroCardValue, { color: colors.textPrimary }]}>
                  {isActiveToday ? `${consumedMacros.f}/` : ''}{plannedMacros.f}g
                </Text>
              </View>
            </View>

            {/* Hydration row if today */}
            {isActiveToday && (
              <View style={[mv.hydrationRow, { borderTopColor: colors.border + '40' }]}>
                <View style={mv.hydroLeft}>
                  <View style={[mv.hydroIconWrap, { backgroundColor: '#3B82F620' }]}>
                    <Droplets size={16} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={[mv.hydroTitle, { color: colors.textSecondary }]}>{t('tracker.waterToday', 'Agua Hoy')}</Text>
                    <Text style={[mv.hydroVal, { color: colors.textPrimary }]}>{waterToday} ml</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[mv.hydroAddBtn, { backgroundColor: '#3B82F6' }]}
                  onPress={handleAddWaterPress}
                  activeOpacity={0.8}
                >
                  <Plus size={14} color="#fff" />
                  <Text style={mv.hydroAddText}>+250ml</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Smart Shopping List Card */}
          <TouchableOpacity
            style={[mv.shoppingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modals/shopping-list');
            }}
            activeOpacity={0.8}
          >
            <View style={[mv.shoppingIconWrap, { backgroundColor: '#F59E0B20' }]}>
              <ShoppingCart size={18} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[mv.shoppingTitle, { color: colors.textPrimary }]}>
                {t('planner.shoppingListTitle', 'Lista de Compras Inteligente')}
              </Text>
              <Text style={[mv.shoppingSub, { color: colors.textSecondary }]}>
                {t('planner.shoppingListSubtitle', 'Ingredientes generados para tu semana')}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Meals List */}
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
                onRecipe={() =>
                  router.push({
                    pathname: '/(tabs)/coach',
                    params: {
                      initialTab: 'nutritionist',
                      prompt: `¿Me puedes dar la receta paso a paso y los macros de: ${m.name}?`,
                    },
                  })
                }
              />
            </AnimatedCard>
          ))
        ) : (
          <View style={[mv.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[mv.emptyIconWrap, { backgroundColor: colors.primary + '15' }]}>
              <Utensils size={36} color={colors.primary} />
            </View>
            <Text style={[mv.emptyTitle, { color: colors.textPrimary }]}>
              {loading ? t('common.loading') : t('planner.noMeals', 'Sin comidas planificadas')}
            </Text>
            <Text style={[mv.emptySub, { color: colors.textSecondary }]}>
              {loading
                ? ''
                : isProActually
                ? t('planner.emptySubPro', 'Usa el botón Generar para obtener un menú balanceado para este día.')
                : t('planner.emptySubFree', 'Desbloquea FitGO Pro para planificar tus comidas personalizadas con IA.')}
            </Text>
            {!isProActually && !loading && (
              <TouchableOpacity
                style={[mv.proBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={() => router.push('/modals/paywall')}
              >
                <Sparkles size={16} color="#fff" />
                <Text style={mv.proText}>{t('planner.unlockPro', 'Desbloquear FitGO Pro')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {meals.length > 0 && (
          <TouchableOpacity
            style={[mv.addMealBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/coach',
                params: {
                  initialTab: 'nutritionist',
                  prompt: t(
                    'planner.askCustomMeal',
                    'Sugiéreme otra comida saludable para hoy que encaje con mis calorías y macros restantes.'
                  ),
                },
              })
            }
            activeOpacity={0.75}
          >
            <Plus size={18} color={colors.primary} />
            <Text style={[mv.addMealText, { color: colors.textSecondary }]}>
              {t('planner.addAnotherMeal', 'Consultar o añadir otra comida con IA')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

export default React.memo(MealPlanView);

const mv = StyleSheet.create({
  summaryContainer: {
    paddingHorizontal: Spacing.base,
    marginBottom: 14,
    gap: 12,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  heroOverline: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  calRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroTotal: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroTarget: {
    fontSize: 14,
    fontWeight: '700',
  },
  remainingBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  remainingValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  remainingLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: -1,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  macroCard: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  macroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  macroPillLetter: {
    fontSize: 11,
    fontWeight: '900',
  },
  macroCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  macroCardValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  hydrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  hydroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hydroIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hydroTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  hydroVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  hydroAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  hydroAddText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  shoppingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shoppingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shoppingTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  shoppingSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  contentList: {
    paddingHorizontal: Spacing.base,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginVertical: 10,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  proBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.full,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  proText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 8,
    marginBottom: 24,
    gap: 10,
  },
  addMealText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
