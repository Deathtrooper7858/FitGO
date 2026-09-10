import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const RING_SIZE = 210;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CalorieArcProps {
  consumed: number;
  target: number;
  burned?: number;
  energyLabel: string;
  colors: any;
  t: any;
}

export const CalorieArc = React.memo(function CalorieArc({
  consumed,
  target,
  burned = 0,
  energyLabel,
  colors,
  t,
}: CalorieArcProps) {
  const safeConsumed = Math.round(Number(consumed) || 0);
  const safeTarget = Math.max(Math.round(Number(target) || 2000), 1);
  const safeBurned = Math.round(Number(burned) || 0);

  // Remaining calories calculation
  const remaining = safeTarget - safeConsumed;
  const isOver = remaining < 0;
  const isClose = !isOver && remaining <= safeTarget * 0.12;

  const pct = Math.min(Math.max(safeConsumed / safeTarget, 0), 1);
  const strokeDashoffset = CIRCUMFERENCE - pct * CIRCUMFERENCE;

  // Arc gradient colors based on state
  const gradStart = isOver
    ? (colors.error || '#EF4444')
    : isClose
    ? '#F59E0B'
    : (colors.primary || '#8B5CF6');

  const gradEnd = isOver
    ? '#DC2626'
    : isClose
    ? '#D97706'
    : (colors.secondary || '#06B6D4');

  const glowColor = isOver
    ? (colors.error || '#EF4444')
    : isClose
    ? '#F59E0B'
    : (colors.primary || '#8B5CF6');

  return (
    <View style={s.container}>
      <View style={s.arcWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <SvgLinearGradient id="calorieArcGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={gradStart} />
              <Stop offset="1" stopColor={gradEnd} />
            </SvgLinearGradient>
          </Defs>

          <G rotation="-90" originX={RING_SIZE / 2} originY={RING_SIZE / 2}>
            {/* Ghost Track */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={colors.border + '35'}
              strokeWidth={STROKE_WIDTH}
            />

            {/* Subtle Outer Glow */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={glowColor + '20'}
              strokeWidth={STROKE_WIDTH + 8}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            />

            {/* Main Progress Ring */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="url(#calorieArcGrad)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            />
          </G>
        </Svg>

        {/* Center Content */}
        <View style={s.arcTextWrap}>
          <Text
            style={[
              s.heroValue,
              { color: isOver ? (colors.error || '#EF4444') : colors.textPrimary },
            ]}
          >
            {isOver ? `+${Math.abs(remaining)}` : Math.max(0, remaining)}
          </Text>

          <View
            style={[
              s.statusBadge,
              {
                backgroundColor: isOver
                  ? (colors.error || '#EF4444') + '18'
                  : isClose
                  ? '#F59E0B18'
                  : colors.primary + '18',
                borderColor: isOver
                  ? (colors.error || '#EF4444') + '40'
                  : isClose
                  ? '#F59E0B40'
                  : colors.primary + '35',
              },
            ]}
          >
            <Text
              style={[
                s.statusText,
                {
                  color: isOver
                    ? (colors.error || '#EF4444')
                    : isClose
                    ? '#F59E0B'
                    : colors.primary,
                },
              ]}
            >
              {isOver
                ? t('dashboard.overGoal', 'sobre meta')
                : t('tracker.remaining', 'Restantes')}
            </Text>
          </View>

          <Text style={[s.subConsumed, { color: colors.textSecondary }]}>
            {safeConsumed} <Text style={{ color: colors.textMuted }}>/ {safeTarget} {energyLabel}</Text>
          </Text>
        </View>
      </View>

      {/* Net Balance Row */}
      <View style={[s.formulaBar, { backgroundColor: colors.surfaceAlt + '50', borderColor: colors.border + '30' }]}>
        <View style={s.formulaCol}>
          <Text style={[s.formulaLabel, { color: colors.textMuted }]}>{t('tracker.target', 'Meta')}</Text>
          <Text style={[s.formulaVal, { color: colors.textPrimary }]}>{safeTarget}</Text>
        </View>

        <Text style={[s.formulaSign, { color: colors.textMuted }]}>−</Text>

        <View style={s.formulaCol}>
          <Text style={[s.formulaLabel, { color: colors.textMuted }]}>{t('tracker.consumed', 'Comida')}</Text>
          <Text style={[s.formulaVal, { color: gradStart }]}>{safeConsumed}</Text>
        </View>

        {safeBurned > 0 && (
          <>
            <Text style={[s.formulaSign, { color: colors.textMuted }]}>+</Text>
            <View style={s.formulaCol}>
              <Text style={[s.formulaLabel, { color: colors.textMuted }]}>{t('tracker.activity', 'Quema')}</Text>
              <Text style={[s.formulaVal, { color: '#F59E0B' }]}>{safeBurned}</Text>
            </View>
          </>
        )}

        <Text style={[s.formulaSign, { color: colors.textMuted }]}>=</Text>

        <View style={s.formulaCol}>
          <Text style={[s.formulaLabel, { color: colors.textMuted }]}>{t('tracker.remaining', 'Restante')}</Text>
          <Text
            style={[
              s.formulaVal,
              {
                color: isOver
                  ? (colors.error || '#EF4444')
                  : colors.primary,
                fontWeight: '800',
              },
            ]}
          >
            {safeTarget - safeConsumed + safeBurned}
          </Text>
        </View>
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  arcWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: RING_SIZE,
    position: 'relative',
  },
  arcTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: RING_SIZE - 40,
  },
  heroValue: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subConsumed: {
    fontSize: 12,
    fontWeight: '600',
  },
  formulaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
  },
  formulaCol: {
    alignItems: 'center',
    gap: 2,
  },
  formulaLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  formulaVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  formulaSign: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
  },
});
