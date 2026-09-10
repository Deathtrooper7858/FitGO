import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Dumbbell, Heart, Target, TrendingDown, TrendingUp, PlusCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Radius, Spacing, Shadow } from '../../constants';
import { useTheme } from '../../hooks/useTheme';

export interface GoalProgressHeroProps {
  goal?: 'lose' | 'gain' | 'maintain' | string;
  initialWeightKg: number;
  currentWeightKg: number;
  targetWeightKg: number;
  progressPct: number;
  massUnit?: string;
  isCustomTheme?: boolean;
  themeAccentColor?: string;
  onOpenGoalWizard: () => void;
  onQuickLogWeight: () => void;
  t: (key: string, ...args: any[]) => string;
}

export const GoalProgressHero = React.memo(function GoalProgressHero({
  goal = 'maintain',
  initialWeightKg,
  currentWeightKg,
  targetWeightKg,
  progressPct,
  massUnit = 'kg',
  isCustomTheme,
  themeAccentColor,
  onOpenGoalWizard,
  onQuickLogWeight,
  t,
}: GoalProgressHeroProps) {
  const colors = useTheme();
  const isLbs = massUnit === 'lb';
  const unitFactor = isLbs ? 2.20462 : 1;

  const displayInitial = (initialWeightKg * unitFactor).toFixed(1);
  const displayCurrent = (currentWeightKg * unitFactor).toFixed(1);
  const displayTarget = (targetWeightKg * unitFactor).toFixed(1);

  const deltaKg = currentWeightKg - initialWeightKg;
  const displayDelta = Math.abs(deltaKg * unitFactor).toFixed(1);
  const remainingKg = Math.abs(targetWeightKg - currentWeightKg);
  const displayRemaining = (remainingKg * unitFactor).toFixed(1);

  const goalMeta = useMemo(() => {
    switch (goal) {
      case 'lose':
        return {
          title: t('profile.loseWeight', 'Pérdida de Peso'),
          icon: <Flame size={20} color="#FF5252" />,
          color: '#FF5252',
          gradient: ['#FF5252', '#FF7A00'],
          deltaLabel: deltaKg <= 0 ? `-${displayDelta} ${massUnit} ${String(t('dashboard.achieved', 'logrados'))}` : `+${displayDelta} ${massUnit}`,
          isGoodTrend: deltaKg <= 0,
        };
      case 'gain':
        return {
          title: t('profile.gainMuscle', 'Ganancia Muscular'),
          icon: <Dumbbell size={20} color="#3B82F6" />,
          color: '#3B82F6',
          gradient: ['#3B82F6', '#8B5CF6'],
          deltaLabel: deltaKg >= 0 ? `+${displayDelta} ${massUnit} ${String(t('dashboard.achieved', 'logrados'))}` : `-${displayDelta} ${massUnit}`,
          isGoodTrend: deltaKg >= 0,
        };
      default:
        return {
          title: t('profile.maintain', 'Mantenimiento'),
          icon: <Heart size={20} color="#10B981" />,
          color: '#10B981',
          gradient: ['#10B981', '#06B6D4'],
          deltaLabel: `${String(t('dashboard.variation', 'Variación'))}: ${displayDelta} ${massUnit}`,
          isGoodTrend: true,
        };
    }
  }, [goal, deltaKg, displayDelta, massUnit, t]);

  const accent = isCustomTheme && themeAccentColor ? themeAccentColor : goalMeta.color;
  const clampedPct = Math.min(Math.max(Math.round(progressPct), 0), 100);

  return (
    <View style={s.container}>
      <LinearGradient
        colors={[colors.surface, colors.surfaceAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.card, { borderColor: colors.border + '50' }]}
      >
        {/* Glow ambient header accent */}
        <LinearGradient
          colors={[accent + '1C', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 0.8 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Top Header: Badge + Edit Button */}
        <View style={s.topHeader}>
          <View style={s.goalBadge}>
            <View style={[s.iconBox, { backgroundColor: accent + '22', borderColor: accent + '40' }]}>
              {goalMeta.icon}
            </View>
            <View>
              <Text style={[s.activeGoalLabel, { color: colors.textSecondary }]}>
                {t('profile.activeGoal', 'Objetivo Activo')}
              </Text>
              <Text style={[s.goalTitle, { color: colors.textPrimary }]}>
                {goalMeta.title}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              onOpenGoalWizard();
            }}
            style={[s.editBtn, { borderColor: colors.primary + '55', backgroundColor: colors.primary + '14' }]}
            activeOpacity={0.7}
          >
            <Text style={[s.editBtnText, { color: colors.primary }]}>{t('common.edit', 'Ajustar')}</Text>
          </TouchableOpacity>
        </View>

        {/* 3-Point Trajectory Card */}
        <View style={[s.trajectoryBox, { backgroundColor: colors.surface + '88', borderColor: colors.border + '40' }]}>
          {/* Starting Weight */}
          <View style={s.pointItem}>
            <Text style={[s.pointLabel, { color: colors.textMuted }]}>
              {String(t('dashboard.initialWeight', 'Inicio'))}
            </Text>
            <Text style={[s.pointValue, { color: colors.textSecondary }]}>
              {displayInitial} <Text style={s.unitSmall}>{massUnit}</Text>
            </Text>
          </View>

          {/* Current Weight (Hero Focus) */}
          <View style={s.pointItemHero}>
            <View style={[s.currentBadge, { backgroundColor: accent + '1F', borderColor: accent + '44' }]}>
              <Text style={[s.currentBadgeText, { color: accent }]}>
                {String(t('dashboard.currentWeight', 'Actual'))}
              </Text>
            </View>
            <Text style={[s.heroWeightValue, { color: colors.textPrimary }]}>
              {displayCurrent}
              <Text style={[s.heroUnit, { color: accent }]}> {massUnit}</Text>
            </Text>
          </View>

          {/* Target Weight */}
          <View style={[s.pointItem, { alignItems: 'flex-end' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Target size={12} color={accent} />
              <Text style={[s.pointLabel, { color: accent }]}>
                {String(t('dashboard.targetWeight', 'Meta'))}
              </Text>
            </View>
            <Text style={[s.pointValue, { color: accent }]}>
              {displayTarget} <Text style={s.unitSmall}>{massUnit}</Text>
            </Text>
          </View>
        </View>

        {/* Progress Bar & Milestone Status */}
        <View style={s.progressSection}>
          <View style={s.progressInfoRow}>
            <View style={[s.deltaPill, { backgroundColor: (goalMeta.isGoodTrend ? '#10B981' : '#F59E0B') + '1A', borderColor: (goalMeta.isGoodTrend ? '#10B981' : '#F59E0B') + '40' }]}>
              {goalMeta.isGoodTrend ? (
                <TrendingDown size={13} color="#10B981" />
              ) : (
                <TrendingUp size={13} color="#F59E0B" />
              )}
              <Text style={[s.deltaText, { color: goalMeta.isGoodTrend ? '#10B981' : '#F59E0B' }]}>
                {goalMeta.deltaLabel}
              </Text>
            </View>

            <View style={[s.percentPill, { backgroundColor: accent + '1E', borderColor: accent + '40' }]}>
              <Text style={[s.percentText, { color: accent }]}>
                {clampedPct}% {String(t('dashboard.completed', 'completado'))}
              </Text>
            </View>
          </View>

          {/* Bar track */}
          <View style={[s.progressBarTrack, { backgroundColor: colors.border + '60' }]}>
            <LinearGradient
              colors={[accent, '#7C5CFC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.progressBarFill, { width: `${clampedPct}%` }]}
            />
          </View>

          <View style={s.footerInfoRow}>
            <Text style={[s.footerNote, { color: colors.textMuted }]}>
              {clampedPct >= 100
                ? String(t('dashboard.goalReached', '🎉 ¡Felicidades! Has alcanzado tu objetivo.'))
                : String(t('dashboard.remainingForGoal', 'Faltan {{amount}} {{unit}} para la meta', { amount: displayRemaining, unit: massUnit }))}
            </Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={s.logWeightBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onQuickLogWeight();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[accent, accent + 'DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.primaryActionGrad}
            >
              <PlusCircle size={18} color="#FFF" />
              <Text style={s.primaryActionText}>
                {t('dashboard.logWeight', 'Registrar Peso')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.secondaryActionBtn, { borderColor: colors.border + '70', backgroundColor: colors.surface }]}
            onPress={() => {
              Haptics.selectionAsync();
              onOpenGoalWizard();
            }}
            activeOpacity={0.7}
          >
            <Target size={16} color={colors.textPrimary} />
            <Text style={[s.secondaryActionText, { color: colors.textPrimary }]}>
              {t('profile.updateGoals', 'Metas')}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
});

const s = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadow.md,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeGoalLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  trajectoryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  pointItem: {
    justifyContent: 'center',
  },
  pointItemHero: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 2,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pointLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  pointValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  heroWeightValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroUnit: {
    fontSize: 15,
    fontWeight: '800',
  },
  unitSmall: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.7,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '800',
  },
  percentPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  footerInfoRow: {
    marginTop: 6,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  logWeightBtn: {
    flex: 2,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  primaryActionGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 16,
  },
  primaryActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
