import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        const mealCals = Math.round(mealLogs.reduce((s, l) => s + (l.calories || 0), 0));
        const isExtraSnack = m.startsWith('snack') && m !== 'snack';
        const snackNumber = isExtraSnack ? m.replace('snack', '') : '';
        const mealSelectedIds = mealLogs.map(l => l.id).filter(id => selectedLogIds.has(id));
        const selCount = mealSelectedIds.length;
        const isSelecting = selCount > 0;

        return (
          <AnimatedCard key={m} index={idx + 2}>
            <GlassCard noPadding showStripe accentColor={isSelecting ? colors.primary : mealCals > 0 ? colors.primary : colors.border}>
              <View style={[s.mealCard]}>
                <View style={s.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
                      {isExtraSnack ? `Snack ${snackNumber}` : t(`tracker.${m}`, m)}
                    </Text>
                    <Text style={[s.mealSub, { color: colors.textSecondary, marginBottom: 0 }]}>🔥 {mealCals} {energyUnit === 'kcal' ? 'KCAL' : 'KJ'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {isSelecting && selCount === 1 && (
                      <TouchableOpacity
                        onPress={() => onEditSelected()}
                        style={[s.selActionBtn, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}
                      >
                        <Text style={[s.selActionText, { color: colors.primary }]}>✏️ {t('common.edit', 'Editar')}</Text>
                      </TouchableOpacity>
                    )}
                    {isSelecting && (
                      <TouchableOpacity
                        onPress={() => onDeleteSelected(mealSelectedIds)}
                        style={[s.selActionBtn, { backgroundColor: colors.error + '22', borderColor: colors.error + '55' }]}
                      >
                        <Text style={[s.selActionText, { color: colors.error }]}>🗑️ {selCount > 1 ? `${selCount}` : ''} {t('common.remove', 'Eliminar')}</Text>
                      </TouchableOpacity>
                    )}
                    {isSelecting && (
                      <TouchableOpacity
                        onPress={onDeselectAll}
                        style={[s.selActionBtn, { backgroundColor: colors.border + '55', borderColor: colors.border }]}
                      >
                        <Text style={[s.selActionText, { color: colors.textSecondary }]}>✕</Text>
                      </TouchableOpacity>
                    )}
                    {!isSelecting && isExtraSnack && m === `snack${extraSnacksCount + 1}` && (
                      <TouchableOpacity onPress={onRemoveExtraSnack}>
                        <Text style={{ color: colors.error, fontSize: 13 }}>{t('common.remove', 'Remove')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {mealLogs.map(log => {
                  const isSelected = selectedLogIds.has(log.id);
                  return (
                    <TouchableOpacity
                      key={log.id}
                      style={[
                        s.logItem,
                        isSelected && { backgroundColor: colors.primary + '18', borderRadius: 10, paddingHorizontal: 10, marginHorizontal: -10 }
                      ]}
                      onPress={() => isSelecting ? onToggleSelect(log.id) : onFoodPress(log)}
                      onLongPress={() => onFoodLongPress(log)}
                      delayLongPress={350}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                        {isSelecting && (
                          <View style={[
                            s.checkCircle,
                            isSelected
                              ? { backgroundColor: colors.primary, borderColor: colors.primary }
                              : { backgroundColor: 'transparent', borderColor: colors.textMuted }
                          ]}>
                            {isSelected && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>}
                          </View>
                        )}
                        <Text style={[s.logName, { color: colors.textPrimary, flex: 1 }]}>{log.foodItem.name}</Text>
                      </View>
                      <Text style={[s.logCal, { color: isSelected ? colors.primary : colors.textSecondary }]}>
                        {Math.round(convertEnergy(log.calories, 'kcal', energyUnit as any))} {energyUnit.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[s.addBtn, { flex: 1, overflow: 'hidden', padding: 0, borderWidth: 0 }]}
                    onPress={() => {
                      if (mealLogs.length > 0) {
                        onAddMissingFood(m);
                      } else {
                        onAddMeal(m);
                      }
                    }}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.secondary || '#A855F7']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48 }}
                    >
                      <Text style={[s.addBtnText, { color: '#fff', fontSize: 15, fontWeight: '800' }]}>
                        ➕ {mealLogs.length > 0
                          ? (language === 'es' ? 'Añadir faltante' : 'Add missing')
                          : (language === 'es' ? 'Añadir alimento' : 'Add food')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          </AnimatedCard>
        );
      })}

      <TouchableOpacity
        style={[s.mealCard, { backgroundColor: colors.surface, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border, alignItems: 'center', paddingVertical: 20 }]}
        onPress={onAddExtraSnack}
      >
        <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>+ {t('tracker.addSnack', 'Add Snack')}</Text>
      </TouchableOpacity>
    </>
  );
}

const s = StyleSheet.create({
  mealCard: { borderRadius: Radius.xl, padding: 20 },
  mealSub: { fontSize: 13, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  addBtn: { borderRadius: Radius.full, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  addBtnText: { fontSize: 24, lineHeight: 28 },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingVertical: 4 },
  logName: { fontSize: 15 },
  logCal: { fontSize: 14 },
  selActionBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  selActionText: { fontSize: 12, fontWeight: '700' },
  checkCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
