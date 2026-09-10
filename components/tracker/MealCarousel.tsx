import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Plus, Trash2, Edit3, X, Check } from 'lucide-react-native';
import { convertEnergy } from '../../utils/units';
import { Radius } from '../../constants';
import { AnimatedCard } from '../AnimatedCard';
import { GlassCard } from '../GlassCard';
import type { FoodLog } from '../../store/types';

interface MealCarouselProps {
  meals: Record<string, FoodLog[]>;
  allMeals: string[];
  selectedLogIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onDeselectAll: () => void;
  onFoodPress: (log: FoodLog) => void;
  onFoodLongPress: (log: FoodLog) => void;
  onDeleteSelected: (ids: string[]) => void;
  onEditSelected: () => void;
  onAddMeal: (meal: string) => void;
  onAddMissingFood: (meal: string) => void;
  onRemoveExtraSnack: () => void;
  onAddExtraSnack: () => void;
  extraSnacksCount: number;
  colors: any;
  t: any;
  language: string;
  energyUnit: string;
}

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍎',
};

export function MealCarousel({
  meals,
  allMeals,
  selectedLogIds,
  onToggleSelect,
  onDeselectAll,
  onFoodPress,
  onFoodLongPress,
  onDeleteSelected,
  onEditSelected,
  onAddMeal,
  onAddMissingFood,
  onRemoveExtraSnack,
  onAddExtraSnack,
  extraSnacksCount,
  colors,
  t,
  language,
  energyUnit,
}: MealCarouselProps) {
  return (
    <>
      {allMeals.map((m, idx) => {
        const mealLogs = meals[m] || [];
        const isExtraSnack = m.startsWith('snack') && m !== 'snack';
        const snackNumber = isExtraSnack ? m.replace('snack', '') : '';
        const mealIcon = MEAL_ICONS[m] || '🥪';

        // Calculate totals
        const mealCals = Math.round(mealLogs.reduce((s, l) => s + (l.calories || 0), 0));
        const mealProtein = Math.round(mealLogs.reduce((s, l) => s + (l.protein || 0), 0));
        const mealCarbs = Math.round(mealLogs.reduce((s, l) => s + (l.carbs || 0), 0));
        const mealFat = Math.round(mealLogs.reduce((s, l) => s + (l.fat || 0), 0));

        const mealSelectedIds = mealLogs.map(l => l.id).filter(id => selectedLogIds.has(id));
        const selCount = mealSelectedIds.length;
        const isSelecting = selCount > 0;

        const mealTitle = isExtraSnack
          ? `Snack ${snackNumber}`
          : t(`tracker.${m}`, m);

        return (
          <AnimatedCard key={m} index={idx + 2}>
            <GlassCard
              noPadding
              showStripe
              accentColor={isSelecting ? colors.primary : mealCals > 0 ? colors.primary : colors.border}
            >
              <View style={s.mealCard}>
                {/* Header Row */}
                <View style={s.cardHeader}>
                  <View style={s.headerLeft}>
                    <View style={[s.iconBox, { backgroundColor: colors.surfaceAlt + '60', borderColor: colors.border + '35' }]}>
                      <Text style={s.iconEmoji}>{mealIcon}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={s.titleRow}>
                        <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
                          {mealTitle}
                        </Text>
                        <View style={[s.calBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}>
                          <Text style={[s.calBadgeText, { color: colors.primary }]}>
                            {mealCals} {energyUnit.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Meal Macro Breakdown */}
                      {mealLogs.length > 0 && (
                        <View style={s.macroRow}>
                          <Text style={[s.macroTag, { color: colors.protein || '#8B5CF6' }]}>
                            P: {mealProtein}g
                          </Text>
                          <Text style={s.macroDot}>·</Text>
                          <Text style={[s.macroTag, { color: colors.carbs || '#06B6D4' }]}>
                            C: {mealCarbs}g
                          </Text>
                          <Text style={s.macroDot}>·</Text>
                          <Text style={[s.macroTag, { color: colors.fat || '#F59E0B' }]}>
                            G: {mealFat}g
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Header Actions */}
                  <View style={s.headerActions}>
                    {isSelecting ? (
                      <View style={s.selectionToolbar}>
                        {selCount === 1 && (
                          <TouchableOpacity
                            onPress={onEditSelected}
                            style={[s.toolbarBtn, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}
                          >
                            <Edit3 size={13} color={colors.primary} />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => onDeleteSelected(mealSelectedIds)}
                          style={[s.toolbarBtn, { backgroundColor: (colors.error || '#EF4444') + '20', borderColor: (colors.error || '#EF4444') + '50' }]}
                        >
                          <Trash2 size={13} color={colors.error || '#EF4444'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={onDeselectAll}
                          style={[s.toolbarBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '50' }]}
                        >
                          <X size={13} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onAddMeal(m);
                        }}
                        style={[s.addMiniBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
                        activeOpacity={0.75}
                      >
                        <Plus size={14} color={colors.primary} strokeWidth={2.5} />
                      </TouchableOpacity>
                    )}

                    {!isSelecting && isExtraSnack && m === `snack${extraSnacksCount + 1}` && (
                      <TouchableOpacity
                        onPress={onRemoveExtraSnack}
                        style={{ marginLeft: 4 }}
                      >
                        <Text style={{ color: colors.error || '#EF4444', fontSize: 11, fontWeight: '700' }}>
                          {t('common.remove', 'Eliminar')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Logged Food Items */}
                {mealLogs.length > 0 ? (
                  <View style={s.logsList}>
                    {mealLogs.map((log) => {
                      const isSelected = selectedLogIds.has(log.id);
                      const grams = log.grams ? `${log.grams}g` : '';
                      const prot = log.protein ? `P: ${Math.round(log.protein)}g` : '';
                      const carbs = log.carbs ? `C: ${Math.round(log.carbs)}g` : '';
                      const fat = log.fat ? `G: ${Math.round(log.fat)}g` : '';
                      const macroStr = [grams, prot, carbs, fat].filter(Boolean).join(' · ');

                      return (
                        <TouchableOpacity
                          key={log.id}
                          style={[
                            s.logItem,
                            {
                              backgroundColor: isSelected
                                ? colors.primary + '18'
                                : colors.surfaceAlt + '25',
                              borderColor: isSelected
                                ? colors.primary + '55'
                                : colors.border + '20',
                            },
                          ]}
                          onPress={() => (isSelecting ? onToggleSelect(log.id) : onFoodPress(log))}
                          onLongPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onFoodLongPress(log);
                          }}
                          delayLongPress={300}
                          activeOpacity={0.7}
                        >
                          <View style={s.logMain}>
                            {isSelecting && (
                              <View
                                style={[
                                  s.checkCircle,
                                  isSelected
                                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                    : { backgroundColor: 'transparent', borderColor: colors.textMuted },
                                ]}
                              >
                                {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                              </View>
                            )}

                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text
                                style={[s.logName, { color: colors.textPrimary }]}
                                numberOfLines={1}
                              >
                                {log.foodItem?.name || t('tracker.food', 'Alimento')}
                              </Text>
                              {macroStr ? (
                                <Text style={[s.logMacros, { color: colors.textSecondary }]}>
                                  {macroStr}
                                </Text>
                              ) : null}
                            </View>
                          </View>

                          <View style={[s.itemCalPill, { backgroundColor: colors.surfaceAlt + '60' }]}>
                            <Text style={[s.logCal, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                              {Math.round(convertEnergy(log.calories, 'kcal', energyUnit as any))}
                            </Text>
                            <Text style={[s.logCalUnit, { color: colors.textMuted }]}>
                              {energyUnit}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Quick Add Missing Food Banner */}
                    <TouchableOpacity
                      style={s.addMissingBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onAddMissingFood(m);
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[colors.primary + '18', colors.secondary + '18' || '#06B6D418']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[s.addMissingGradient, { borderColor: colors.primary + '35' }]}
                      >
                        <Plus size={14} color={colors.primary} strokeWidth={2.5} />
                        <Text style={[s.addMissingText, { color: colors.primary }]}>
                          {String(t('tracker.addMoreFood', 'Añadir más alimentos'))}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Empty State with Quick Actions */
                  <View style={[s.emptyBox, { borderColor: colors.border + '30', backgroundColor: colors.surfaceAlt + '15' }]}>
                    <Text style={[s.emptyLabel, { color: colors.textMuted }]}>
                      {String(t('tracker.noEntriesMeal', 'Sin registros en esta comida'))}
                    </Text>

                    <TouchableOpacity
                      style={[s.emptyChip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40', paddingHorizontal: 16 }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onAddMeal(m);
                      }}
                      activeOpacity={0.75}
                    >
                      <Plus size={14} color={colors.primary} strokeWidth={2.5} />
                      <Text style={[s.emptyChipText, { color: colors.primary, fontWeight: '800' }]}>
                        {String(t('tracker.logFoodBtn', 'Registrar'))}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </GlassCard>
          </AnimatedCard>
        );
      })}

      {/* Add Extra Snack Button */}
      <TouchableOpacity
        style={[
          s.addSnackCard,
          {
            backgroundColor: colors.surfaceAlt + '25',
            borderColor: colors.border + '45',
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAddExtraSnack();
        }}
        activeOpacity={0.75}
      >
        <View style={[s.plusCircle, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
          <Plus size={16} color={colors.primary} strokeWidth={2.5} />
        </View>
        <Text style={[s.addSnackText, { color: colors.textPrimary }]}>
          {t('tracker.addSnack', 'Añadir Merienda Extra')}
        </Text>
      </TouchableOpacity>
    </>
  );
}

const s = StyleSheet.create({
  mealCard: {
    borderRadius: Radius.xl,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconEmoji: {
    fontSize: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  calBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  calBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  macroTag: {
    fontSize: 11,
    fontWeight: '700',
  },
  macroDot: {
    fontSize: 10,
    color: '#64748B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addMiniBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbarBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logsList: {
    marginTop: 12,
    gap: 8,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  logMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  logName: {
    fontSize: 14,
    fontWeight: '700',
  },
  logMacros: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  itemCalPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logCal: {
    fontSize: 13,
    fontWeight: '800',
  },
  logCalUnit: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMissingBtn: {
    marginTop: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addMissingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  addMissingText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyBox: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addSnackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  plusCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSnackText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
