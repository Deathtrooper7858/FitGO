import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RefreshCw, CheckCircle, Coffee, Utensils, Pizza, Apple } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { Radius } from '../../constants';

interface MealCardProps {
  name: string;
  meal: string;
  cal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  onSwap: () => Promise<void>;
  onConsume: () => void;
  onRecipe: () => void;
  isSwapping?: boolean;
}

function MealCard({ name, meal, cal, protein, carbs, fat, onSwap, onConsume, onRecipe, isSwapping: externalSwapping }: MealCardProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [localSwapping, setLocalSwapping] = useState(false);
  const isSwapping = externalSwapping || localSwapping;

  const handleSwap = async () => {
    setLocalSwapping(true);
    try { await onSwap(); } finally { setLocalSwapping(false); }
  };

  const getMealIcon = () => {
    switch(meal) {
      case 'breakfast': return <Coffee size={18} color={colors.primary} />;
      case 'lunch': return <Utensils size={18} color={colors.primary} />;
      case 'dinner': return <Pizza size={18} color={colors.primary} />;
      default: return <Apple size={18} color={colors.primary} />;
    }
  };

  return (
    <View style={[mc.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[mc.iconWrap, {backgroundColor: colors.primary + '15'}]}>
        {getMealIcon()}
      </View>
      <View style={mc.info}>
        {(() => {
          const normalizedMeal = meal.toLowerCase();
          let key = 'snack';
          if (normalizedMeal.includes('desayuno') || normalizedMeal.includes('breakfast')) key = 'breakfast';
          else if (normalizedMeal.includes('almuerzo') || normalizedMeal.includes('lunch')) key = 'lunch';
          else if (normalizedMeal.includes('cena') || normalizedMeal.includes('dinner')) key = 'dinner';
          else if (normalizedMeal.includes('merienda') || normalizedMeal.includes('snack')) key = 'snack';
          return <Text style={[mc.mealLabel, { color: colors.textMuted }]}>{t(`tracker.${key}`)}</Text>;
        })()}
        <Text style={[mc.name, { color: colors.textPrimary }]} numberOfLines={2}>{name}</Text>
        {(protein !== undefined) && (
          <View style={mc.macroRow}>
            <View style={[mc.macroPill, {backgroundColor: colors.protein + '15'}]}><Text style={[mc.macro, { color: colors.protein }]}>P {protein}g</Text></View>
            <View style={[mc.macroPill, {backgroundColor: colors.carbs + '15'}]}><Text style={[mc.macro, { color: colors.carbs }]}>C {carbs}g</Text></View>
            <View style={[mc.macroPill, {backgroundColor: colors.fat + '15'}]}><Text style={[mc.macro, { color: colors.fat }]}>F {fat}g</Text></View>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap', marginLeft: -4 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 4 }}
            onPress={onRecipe}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>{t('planner.askRecipe', 'Receta ›')} ›</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSwap} style={{ padding: 6, opacity: isSwapping ? 0.5 : 1 }} disabled={isSwapping}>
            {isSwapping ? <ActivityIndicator size="small" color={colors.primary} /> : <RefreshCw size={14} color={colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={onConsume} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full }}>
            <CheckCircle size={12} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>{t('planner.consume', 'Consumir')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[mc.calWrap, {backgroundColor: colors.primary + '08'}]}>
        <Text style={[mc.cal, { color: colors.primary }]}>{cal}</Text>
        <Text style={[mc.calUnit, { color: colors.primary, opacity: 0.7 }]}>kcal</Text>
      </View>
    </View>
  );
}

export default React.memo(MealCard);

const mc = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 28, padding: 18, marginBottom: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  iconWrap:  { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  info:      { flex: 1 },
  mealLabel: { fontSize: 12, fontWeight: '900', marginBottom: 2, letterSpacing: 0.5, textTransform: 'uppercase' },
  name:      { fontSize: 16, fontWeight: '700', marginBottom: 8, lineHeight: 22 },
  macroRow:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  macroPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  macro:     { fontSize: 11, fontWeight: '900' },
  calWrap:   { alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20 },
  cal:       { fontSize: 18, fontWeight: '900' },
  calUnit:   { fontSize: 11, fontWeight: '800', marginTop: -2, textTransform: 'uppercase' },
});
