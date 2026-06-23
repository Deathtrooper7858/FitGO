import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
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
  name, englishName, sets, reps, rest, index, totalExercises,
  onMoveUp, onMoveDown, onStartRest, onAskCoach,
  weight, rpe, onWeightChange, onRpeChange, previousRPE
}: ExerciseCardProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <View style={[es.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={es.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[es.name, { color: colors.textPrimary }]} numberOfLines={2}>{name}</Text>
          {previousRPE !== null && previousRPE !== undefined && previousRPE < 7 && (
            <View style={{ backgroundColor: '#F59E0B22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706' }}>🚀 ¡Subiste de nivel! +5% peso o +2 reps</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {index > 0 && (
            <TouchableOpacity onPress={onMoveUp} style={{ padding: 4 }}>
              <ChevronUp size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {index < totalExercises - 1 && (
            <TouchableOpacity onPress={onMoveDown} style={{ padding: 4 }}>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <View style={[es.badge, { backgroundColor: colors.primary + '15', marginLeft: 4 }]}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>{sets} SETS</Text>
          </View>
        </View>
      </View>
      <View style={{ gap: 14, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.1)', paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={[es.meta, { backgroundColor: colors.background }]}>
            <Text style={[es.metaLabel, { color: colors.textMuted }]}>{t('planner.reps', 'Reps')}</Text>
            <Text style={[es.metaValue, { color: colors.textPrimary }]}>{reps}</Text>
          </View>
          <TouchableOpacity
            style={[es.meta, { backgroundColor: colors.background }]}
            activeOpacity={0.7}
            onPress={onStartRest}
          >
            <Text style={[es.metaLabel, { color: colors.textMuted }]}>{t('planner.rest', 'Rest')} (Tap)</Text>
            <Text style={[es.metaValue, { color: colors.primary }]}>{rest} ⏱️</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={[es.meta, { backgroundColor: colors.background }]}>
            <Text style={[es.metaLabel, { color: colors.textMuted }]}>{t('planner.loadKg', 'LOAD (KG)')}</Text>
            <TextInput
              style={[es.input, { color: colors.textPrimary }]}
              placeholder="--"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={weight}
              onChangeText={onWeightChange}
              returnKeyType="done"
            />
          </View>
          <View style={[es.meta, { backgroundColor: colors.background }]}>
            <Text style={[es.metaLabel, { color: colors.textMuted }]}>RPE (1-10)</Text>
            <TextInput
              style={[es.input, { color: colors.textPrimary }]}
              placeholder="--"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={rpe}
              onChangeText={onRpeChange}
              returnKeyType="done"
            />
          </View>
        </View>
        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 8, fontStyle: 'italic' }}>
          {t('planner.valuesSavedNotice', '* These values will be saved to your progress when you complete the workout.')}
        </Text>
      </View>
      <TouchableOpacity
        style={{ marginTop: 12, alignSelf: 'flex-start' }}
        onPress={onAskCoach}
      >
        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>{t('planner.askExercise', '¿Cómo hacerlo?')} ›</Text>
      </TouchableOpacity>
    </View>
  );
}

const es = StyleSheet.create({
  card:      { padding: 20, borderRadius: 28, borderWidth: 1, marginBottom: 14, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  name:      { fontSize: 18, fontWeight: '800', flex: 1, marginRight: 8, lineHeight: 24 },
  badge:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  meta:      { flex: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, gap: 4 },
  metaLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 16, fontWeight: '900' },
  input:     { fontSize: 16, fontWeight: '900', padding: 0, minHeight: 24, minWidth: 60, width: '100%' },
});
