import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Footprints, Plus, Minus, Zap, Flame, MapPin } from 'lucide-react-native';
import { GlassCard } from '../GlassCard';
import { Radius } from '../../constants';

interface StepsWidgetProps {
  steps: number;
  onAddSteps: (s: number) => void;
  colors: any;
  t: any;
}

const STEP_GOAL = 8000;

export function StepsWidget({ steps, onAddSteps, colors, t }: StepsWidgetProps) {
  const safeSteps = Math.max(0, steps || 0);
  const pct = Math.min(Math.max(safeSteps / STEP_GOAL, 0), 1);
  const kmEst = (safeSteps * 0.00076).toFixed(1);
  const calsEst = Math.round(safeSteps * 0.04);
  const successColor = colors.success || '#10B981';

  const handleAdjust = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddSteps(delta);
  };

  return (
    <GlassCard noPadding showStripe accentColor={successColor}>
      <View style={s.card}>
        {/* Header */}
        <View style={s.cardHeader}>
          <View style={s.titleGroup}>
            <View style={[s.iconWrap, { backgroundColor: successColor + '18' }]}>
              <Footprints size={16} color={successColor} />
            </View>
            <View>
              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
                {t('tracker.steps', 'Pasos')}
              </Text>
              <Text style={[s.cardSubtitle, { color: colors.textMuted }]}>
                {t('tracker.today', 'Hoy')} · Meta {STEP_GOAL.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={[s.autoBadge, { backgroundColor: successColor + '18', borderColor: successColor + '35' }]}>
            <Zap size={11} color={successColor} />
            <Text style={[s.autoText, { color: successColor }]}>
              Sensor Activo
            </Text>
          </View>
        </View>

        {/* Steps main counter */}
        <View style={s.stepsRow}>
          <Text style={[s.stepsVal, { color: colors.textPrimary }]}>
            {safeSteps.toLocaleString()}{' '}
            <Text style={{ fontSize: 16, color: colors.textSecondary, fontWeight: '500' }}>
              / {STEP_GOAL.toLocaleString()}
            </Text>
          </Text>
          <View style={[s.percentPill, { backgroundColor: successColor + '18' }]}>
            <Text style={[s.percentText, { color: successColor }]}>
              {Math.round(pct * 100)}%
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[s.progressBar, { backgroundColor: colors.border + '35' }]}>
          <LinearGradient
            colors={[successColor, '#34D399']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.progressFill, { width: `${pct * 100}%` }]}
          />
        </View>

        {/* Estimation Metrics Pill (km + kcal) */}
        <View style={[s.metricsRow, { backgroundColor: colors.surfaceAlt + '40', borderColor: colors.border + '25' }]}>
          <View style={s.metricItem}>
            <MapPin size={12} color={colors.textSecondary} />
            <Text style={[s.metricText, { color: colors.textSecondary }]}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{kmEst}</Text> km estimados
            </Text>
          </View>
          <View style={s.metricDivider} />
          <View style={s.metricItem}>
            <Flame size={12} color="#F59E0B" />
            <Text style={[s.metricText, { color: colors.textSecondary }]}>
              <Text style={{ color: '#F59E0B', fontWeight: '700' }}>~{calsEst}</Text> kcal quemadas
            </Text>
          </View>
        </View>

        {/* Manual Adjustments */}
        <View style={s.stepsControls}>
          <TouchableOpacity
            style={[s.stepBtn, { backgroundColor: colors.surfaceAlt + '60', borderColor: colors.border + '30' }]}
            onPress={() => handleAdjust(-1000)}
            activeOpacity={0.75}
          >
            <Minus size={13} color={colors.textSecondary} />
            <Text style={[s.stepBtnText, { color: colors.textSecondary }]}>-1,000</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.stepBtn, { backgroundColor: successColor + '20', borderColor: successColor + '50' }]}
            onPress={() => handleAdjust(1000)}
            activeOpacity={0.75}
          >
            <Plus size={13} color={successColor} strokeWidth={2.5} />
            <Text style={[s.stepBtnText, { color: successColor, fontWeight: '800' }]}>+1,000</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  autoText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepsVal: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  percentPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 11,
  },
  metricDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#64748B40',
  },
  stepsControls: {
    flexDirection: 'row',
    gap: 10,
  },
  stepBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
