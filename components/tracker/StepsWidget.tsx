import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard } from '../GlassCard';
import { Radius } from '../../constants';

interface StepsWidgetProps {
  steps: number;
  onAddSteps: (s: number) => void;
  colors: any;
  t: any;
}

const STEP_GOAL = 6000;

export function StepsWidget({ steps, onAddSteps, colors, t }: StepsWidgetProps) {
  return (
    <GlassCard noPadding showStripe accentColor={colors.success}>
      <View style={[s.card, { borderWidth: 0 }]}>
        <View style={s.cardHeader}>
          <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{t('tracker.steps')}</Text>
          <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>⚡ Automático</Text>
        </View>
        <View style={s.stepsRow}>
          <Text style={{ fontSize: 24 }}>👟</Text>
          <View>
            <Text style={[s.stepsVal, { color: colors.textPrimary }]}>
              {steps} <Text style={{ fontSize: 16, color: colors.textSecondary }}>/ {STEP_GOAL} {t('tracker.steps').toLowerCase()}</Text>
            </Text>
          </View>
        </View>
        <View style={[s.progressBar, { backgroundColor: colors.border + '55', marginBottom: 8 }]}>
          <View style={[s.progressFill, { width: `${Math.min((steps / STEP_GOAL) * 100, 100)}%`, backgroundColor: colors.success }]} />
        </View>
        <View style={s.stepsControls}>
          <TouchableOpacity
            style={[s.stepBtn, { backgroundColor: colors.surfaceAlt + '88' }]}
            onPress={() => onAddSteps(-1000)}
          >
            <Text style={[s.stepBtnText, { color: colors.textPrimary }]}>-1000</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.stepBtn, { backgroundColor: colors.success }]}
            onPress={() => onAddSteps(1000)}
          >
            <Text style={[s.stepBtnText, { color: '#fff' }]}>+1000</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: Radius.xl, padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  stepsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  stepsVal: { fontSize: 24, fontWeight: 'bold' },
  progressBar: { height: 8, borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  stepsControls: { flexDirection: 'row', gap: 12, marginTop: 20 },
  stepBtn: { flex: 1, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 14, fontWeight: '700' },
});
