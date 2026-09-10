import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { ChevronUp, ChevronDown, Timer, Dumbbell, Sparkles, HelpCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';

interface ExerciseCardProps {
  name: string;
  englishName?: string;
  sets: number;
  reps: string;
  rest: string;
  index: number;
  totalExercises: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onStartRest: () => void;
  onAskCoach: () => void;
  weight: string;
  rpe: string;
  onWeightChange: (text: string) => void;
  onRpeChange: (text: string) => void;
  previousRPE?: number | null;
}

export default function ExerciseCard({
  name,
  englishName,
  sets,
  reps,
  rest,
  index,
  totalExercises,
  onMoveUp,
  onMoveDown,
  onStartRest,
  onAskCoach,
  weight,
  rpe,
  onWeightChange,
  onRpeChange,
  previousRPE,
}: ExerciseCardProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const handleRestPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartRest();
  };

  const handleAskCoachPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAskCoach();
  };

  const formattedIndex = `#${String(index + 1).padStart(2, '0')}`;

  return (
    <View style={[es.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header: Index, Names, Sets Badge & Reorder */}
      <View style={es.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={es.titleRow}>
            <View style={[es.indexPill, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[es.indexText, { color: colors.primary }]}>{formattedIndex}</Text>
            </View>
            <Text style={[es.name, { color: colors.textPrimary }]} numberOfLines={2}>
              {name}
            </Text>
          </View>

          {englishName && englishName.toLowerCase() !== name.toLowerCase() && (
            <Text style={[es.englishName, { color: colors.textMuted }]}>{englishName}</Text>
          )}

          {previousRPE !== null && previousRPE !== undefined && previousRPE < 7 && (
            <View style={[es.levelUpBanner, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B40' }]}>
              <Sparkles size={13} color="#F59E0B" />
              <Text style={es.levelUpText}>
                {t('planner.levelUpNotice', '¡Subiste de nivel! +5% peso o +2 reps')}
              </Text>
            </View>
          )}
        </View>

        <View style={es.controlsWrap}>
          <View style={[es.badge, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[es.badgeText, { color: colors.primary }]}>{sets} SETS</Text>
          </View>

          <View style={es.arrowsCol}>
            {index > 0 && (
              <TouchableOpacity
                onPress={onMoveUp}
                style={[es.arrowBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronUp size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            {index < totalExercises - 1 && (
              <TouchableOpacity
                onPress={onMoveDown}
                style={[es.arrowBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronDown size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Stats Grid: Reps, Rest, Weight, RPE */}
      <View style={[es.grid, { borderTopColor: colors.border + '40' }]}>
        {/* Reps */}
        <View style={[es.gridCell, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={es.cellLabelRow}>
            <Dumbbell size={12} color={colors.textMuted} />
            <Text style={[es.cellLabel, { color: colors.textMuted }]}>{t('planner.reps', 'Reps')}</Text>
          </View>
          <Text style={[es.cellValue, { color: colors.textPrimary }]}>{reps}</Text>
        </View>

        {/* Rest Timer */}
        <TouchableOpacity
          style={[es.gridCell, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={handleRestPress}
        >
          <View style={es.cellLabelRow}>
            <Timer size={12} color={colors.primary} />
            <Text style={[es.cellLabel, { color: colors.primary }]}>{t('planner.rest', 'Descanso')}</Text>
          </View>
          <Text style={[es.cellValue, { color: colors.primary }]}>{rest} ⏱️</Text>
        </TouchableOpacity>

        {/* Weight Input */}
        <View style={[es.gridCell, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[es.cellLabel, { color: colors.textMuted }]}>{t('planner.loadKg', 'CARGA (KG)')}</Text>
          <TextInput
            style={[es.cellInput, { color: colors.textPrimary }]}
            placeholder="--"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={weight}
            onChangeText={onWeightChange}
            returnKeyType="done"
          />
        </View>

        {/* RPE Input */}
        <View style={[es.gridCell, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[es.cellLabel, { color: colors.textMuted }]}>RPE (1-10)</Text>
          <TextInput
            style={[es.cellInput, { color: colors.textPrimary }]}
            placeholder="--"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={rpe}
            onChangeText={onRpeChange}
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Footer: Ask Coach Link */}
      <View style={es.footer}>
        <TouchableOpacity style={es.coachBtn} onPress={handleAskCoachPress} activeOpacity={0.75}>
          <HelpCircle size={15} color={colors.primary} />
          <Text style={[es.coachText, { color: colors.primary }]}>
            {t('planner.askExercise', '¿Cómo hacerlo? Técnica y Consejos')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const es = StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indexPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  indexText: {
    fontSize: 11,
    fontWeight: '900',
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    letterSpacing: -0.2,
  },
  englishName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginLeft: 32,
  },
  levelUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  levelUpText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  controlsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  arrowsCol: {
    flexDirection: 'column',
    gap: 4,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  gridCell: {
    flex: 1,
    minWidth: '47%',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  cellLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  cellInput: {
    fontSize: 15,
    fontWeight: '900',
    padding: 0,
    minHeight: 22,
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  coachText: {
    fontSize: 12,
    fontWeight: '800',
  },
});

