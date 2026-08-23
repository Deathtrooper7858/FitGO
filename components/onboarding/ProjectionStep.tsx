import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
  Line as SvgLine,
} from 'react-native-svg';
import { Check, Trophy, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

export function ProjectionStep({ value: data }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const isLbs = data.weightUnit === 'lbs';
  const unitLabel = isLbs ? 'lbs' : 'kg';
  const startWeight = data.weight ?? (isLbs ? 154 : 70);
  const targetWeight = data.targetWeight ?? (isLbs ? 143 : 65);

  const wKg = isLbs ? startWeight / 2.20462 : startWeight;
  const tKg = isLbs ? targetWeight / 2.20462 : targetWeight;

  const diffKg = Math.abs(tKg - wKg);
  const isLosing = tKg < wKg;
  const isMaintaining = Math.abs(tKg - wKg) < 0.3;

  const velocity = data.velocity ?? 'moderate';
  const velocityKgPerWeek = velocity === 'slow' ? 0.25 : velocity === 'moderate' ? 0.5 : 0.85;

  const weeks = isMaintaining ? 4 : Math.max(2, Math.round(diffKg / velocityKgPerWeek));
  const days = weeks * 7;

  const { dateLabels, yLabels, yValues } = useMemo(() => {
    const today = new Date();
    const endD = new Date();
    endD.setDate(today.getDate() + days);

    const q1 = new Date();
    q1.setDate(today.getDate() + Math.round(days * 0.33));

    const q2 = new Date();
    q2.setDate(today.getDate() + Math.round(days * 0.66));

    const formatDate = (d: Date) =>
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const dates = [
      t('common.today', 'Today'),
      formatDate(q1),
      formatDate(q2),
      formatDate(endD),
    ];

    // Compute 4 dynamic Y-axis ticks relative to user's min and max values
    const minW = Math.min(startWeight, targetWeight);
    const maxW = Math.max(startWeight, targetWeight);
    const padding = isMaintaining ? (isLbs ? 4 : 2) : Math.max(isLbs ? 4 : 2, Math.round((maxW - minW) * 0.15));

    const topY = maxW + padding;
    const botY = Math.max(10, minW - padding);
    const stepY = (topY - botY) / 3;

    const yVals = [
      Math.round(topY),
      Math.round(topY - stepY),
      Math.round(topY - stepY * 2),
      Math.round(botY),
    ];

    return {
      dateLabels: dates,
      yLabels: yVals.map((v) => `${v} ${unitLabel}`),
      yValues: yVals,
    };
  }, [days, startWeight, targetWeight, isMaintaining, isLbs, unitLabel, t]);

  // Chart Dimensions & Bezier Curve
  const cW = 280;
  const cH = 160;
  const paddingX = 20;

  const startY = isMaintaining ? cH * 0.45 : isLosing ? cH * 0.22 : cH * 0.78;
  const endY = isMaintaining ? cH * 0.45 : isLosing ? cH * 0.78 : cH * 0.22;

  const cp1X = cW * 0.35;
  const cp1Y = startY + (endY - startY) * 0.2;
  const cp2X = cW * 0.65;
  const cp2Y = startY + (endY - startY) * 0.8;

  const wavyPath = `M ${paddingX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${cW - paddingX} ${endY}`;
  const fillPath = `M ${paddingX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${cW - paddingX} ${endY} L ${cW - paddingX} ${cH} L ${paddingX} ${cH} Z`;

  const accentColor = '#8B5CF6';
  const targetGold = '#F59E0B';

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Check size={44} color="#10B981" strokeWidth={3.5} />}
          color="#10B981"
          glowColor="#059669"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.projectionTitle', "Here's how your progress will look!")}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t('onboarding.projectionSub', 'This is a preview of your journey based on your goal.')}
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        {/* Main Progress Chart Card */}
        <Animated.View entering={FadeInUp.delay(80).springify().damping(18)}>
          <View style={[styles.mainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Header: Start vs Target */}
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.headerSmallLabel}>{t('onboarding.currentGoal', 'CURRENT WEIGHT')}</Text>
                <Text style={[styles.headerBigWeight, { color: colors.textPrimary }]}>
                  {startWeight}{' '}
                  <Text style={{ fontSize: 16, color: colors.textSecondary, fontWeight: '700' }}>{unitLabel}</Text>
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Trophy size={18} color={targetGold} />
                  <Text style={[styles.headerSmallLabel, { color: targetGold }]}>
                    {t('onboarding.nextGoal', 'TARGET WEIGHT')}
                  </Text>
                </View>
                <Text style={[styles.headerBigWeight, { color: targetGold }]}>
                  {targetWeight}{' '}
                  <Text style={{ fontSize: 16, color: targetGold + 'CC', fontWeight: '700' }}>{unitLabel}</Text>
                </Text>
              </View>
            </View>

            {/* SVG Chart with Y Grid and Bezier Curve */}
            <View style={styles.chartWrapper}>
              {/* Y-Axis Labels on the Right */}
              <View style={styles.yAxisLabels}>
                {yLabels.map((lbl, idx) => (
                  <Text key={idx} style={[styles.yLabelText, { color: colors.textMuted }]}>
                    {lbl}
                  </Text>
                ))}
              </View>

              <Svg width="100%" height={cH} viewBox={`0 0 ${cW} ${cH}`}>
                <Defs>
                  <SvgLinearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={accentColor} stopOpacity="0.35" />
                    <Stop offset="0.7" stopColor={accentColor} stopOpacity="0.08" />
                    <Stop offset="1" stopColor={accentColor} stopOpacity="0" />
                  </SvgLinearGradient>
                </Defs>

                {/* Horizontal Grid lines */}
                <SvgLine x1={paddingX} y1={cH * 0.15} x2={cW - paddingX} y2={cH * 0.15} stroke={colors.border + '60'} strokeWidth="1" strokeDasharray="4,4" />
                <SvgLine x1={paddingX} y1={cH * 0.45} x2={cW - paddingX} y2={cH * 0.45} stroke={colors.border + '60'} strokeWidth="1" strokeDasharray="4,4" />
                <SvgLine x1={paddingX} y1={cH * 0.75} x2={cW - paddingX} y2={cH * 0.75} stroke={colors.border + '60'} strokeWidth="1" strokeDasharray="4,4" />

                {/* Vertical Grid boundary lines */}
                <SvgLine x1={paddingX} y1="0" x2={paddingX} y2={cH} stroke={colors.border + '40'} strokeWidth="1" strokeDasharray="4,4" />
                <SvgLine x1={cW - paddingX} y1="0" x2={cW - paddingX} y2={cH} stroke={colors.border + '40'} strokeWidth="1" strokeDasharray="4,4" />

                {/* Gradient Fill under the curve */}
                <Path d={fillPath} fill="url(#projGrad)" />

                {/* Progress Curve Line */}
                <Path
                  d={wavyPath}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Start Point Node */}
                <Circle cx={paddingX} cy={startY} r="8" fill={colors.surface} stroke={accentColor} strokeWidth="3.5" />

                {/* Target Point Node (Gold) */}
                <Circle cx={cW - paddingX} cy={endY} r="8" fill={colors.surface} stroke={targetGold} strokeWidth="3.5" />
              </Svg>
            </View>

            {/* X-Axis Date Labels */}
            <View style={styles.xAxisRow}>
              {dateLabels.map((lbl, idx) => (
                <Text key={idx} style={[styles.xDateText, { color: colors.textMuted }]}>
                  {lbl}
                </Text>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Motivational Card */}
        <Animated.View entering={FadeInUp.delay(140).springify().damping(18)}>
          <View style={[styles.motivationCard, { backgroundColor: '#10B98112', borderColor: '#10B98135' }]}>
            <View style={[styles.sparkleIconWrap, { backgroundColor: '#10B98125' }]}>
              <Sparkles size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.motivationTitle, { color: '#10B981' }]}>
                {t('onboarding.greatJob', 'Great job!')}
              </Text>
              <Text style={[styles.motivationSub, { color: colors.textPrimary }]}>
                {t('onboarding.onTrackReachGoal', "You're on track to reach your goal in approximately {{weeks}} weeks.", { weeks })}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerSmallLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  headerBigWeight: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  chartWrapper: {
    position: 'relative',
    height: 160,
    marginVertical: 4,
  },
  yAxisLabels: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 14,
    zIndex: 2,
  },
  yLabelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 6,
  },
  xDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  motivationCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sparkleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  motivationSub: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
