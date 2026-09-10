import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RefreshCw, CheckCircle, Coffee, Utensils, Pizza, Apple, BookOpen, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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

function MealCard({
  name,
  meal,
  cal,
  protein,
  carbs,
  fat,
  onSwap,
  onConsume,
  onRecipe,
  isSwapping: externalSwapping,
}: MealCardProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const [localSwapping, setLocalSwapping] = useState(false);
  const isSwapping = externalSwapping || localSwapping;

  const handleSwap = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalSwapping(true);
    try {
      await onSwap();
    } finally {
      setLocalSwapping(false);
    }
  };

  const handleConsume = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConsume();
  };

  const handleRecipe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRecipe();
  };

  const getMealConfig = () => {
    const normalizedMeal = (meal || '').toLowerCase();
    if (normalizedMeal.includes('desayuno') || normalizedMeal.includes('breakfast')) {
      return {
        label: t('tracker.breakfast', 'Desayuno'),
        icon: <Coffee size={18} color="#F59E0B" />,
        accent: '#F59E0B',
      };
    }
    if (normalizedMeal.includes('almuerzo') || normalizedMeal.includes('lunch') || normalizedMeal.includes('comida')) {
      return {
        label: t('tracker.lunch', 'Almuerzo'),
        icon: <Utensils size={18} color="#10B981" />,
        accent: '#10B981',
      };
    }
    if (normalizedMeal.includes('cena') || normalizedMeal.includes('dinner')) {
      return {
        label: t('tracker.dinner', 'Cena'),
        icon: <Pizza size={18} color="#8B5CF6" />,
        accent: '#8B5CF6',
      };
    }
    return {
      label: t('tracker.snack', 'Snack'),
      icon: <Apple size={18} color="#EC4899" />,
      accent: '#EC4899',
    };
  };

  const config = getMealConfig();

  return (
    <View style={[mc.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header Row: Meal Category + Calories Badge */}
      <View style={mc.headerRow}>
        <View style={[mc.categoryPill, { backgroundColor: config.accent + '15', borderColor: config.accent + '33' }]}>
          {config.icon}
          <Text style={[mc.categoryLabel, { color: config.accent }]}>{config.label}</Text>
        </View>

        <View style={[mc.calBadge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Flame size={14} color="#F97316" />
          <Text style={[mc.calValue, { color: colors.textPrimary }]}>{cal}</Text>
          <Text style={[mc.calUnit, { color: colors.textMuted }]}>kcal</Text>
        </View>
      </View>

      {/* Dish Name */}
      <Text style={[mc.name, { color: colors.textPrimary }]} numberOfLines={2}>
        {name}
      </Text>

      {/* Macro Pills */}
      {protein !== undefined && (
        <View style={mc.macroRow}>
          <View style={[mc.macroPill, { backgroundColor: colors.protein + '15', borderColor: colors.protein + '30' }]}>
            <Text style={[mc.macroLetter, { color: colors.protein }]}>P</Text>
            <Text style={[mc.macroValue, { color: colors.textPrimary }]}>{protein}g</Text>
          </View>
          <View style={[mc.macroPill, { backgroundColor: colors.carbs + '15', borderColor: colors.carbs + '30' }]}>
            <Text style={[mc.macroLetter, { color: colors.carbs }]}>C</Text>
            <Text style={[mc.macroValue, { color: colors.textPrimary }]}>{carbs}g</Text>
          </View>
          <View style={[mc.macroPill, { backgroundColor: colors.fat + '15', borderColor: colors.fat + '30' }]}>
            <Text style={[mc.macroLetter, { color: colors.fat }]}>F</Text>
            <Text style={[mc.macroValue, { color: colors.textPrimary }]}>{fat}g</Text>
          </View>
        </View>
      )}

      {/* Actions Toolbar */}
      <View style={[mc.actionRow, { borderTopColor: colors.border + '50' }]}>
        <TouchableOpacity
          style={[mc.actionBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
          onPress={handleRecipe}
          activeOpacity={0.7}
        >
          <BookOpen size={14} color={colors.primary} />
          <Text style={[mc.actionText, { color: colors.primary }]}>{t('planner.recipe', 'Receta')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[mc.actionBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
          onPress={handleSwap}
          activeOpacity={0.7}
          disabled={isSwapping}
        >
          {isSwapping ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <RefreshCw size={14} color={colors.textSecondary} />
              <Text style={[mc.actionText, { color: colors.textSecondary }]}>{t('planner.swap', 'Cambiar')}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[mc.actionBtnPrimary, { backgroundColor: colors.primary }]}
          onPress={handleConsume}
          activeOpacity={0.8}
        >
          <CheckCircle size={14} color="#fff" />
          <Text style={mc.actionTextPrimary}>{t('planner.consume', 'Consumir')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default React.memo(MealCard);

const mc = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  calBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  calValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  calUnit: {
    fontSize: 11,
    fontWeight: '700',
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  macroLetter: {
    fontSize: 11,
    fontWeight: '900',
  },
  macroValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
  },
  actionTextPrimary: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});

