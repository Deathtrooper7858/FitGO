import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const RING_SIZE = 220;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CalorieArcProps {
  consumed: number;
  target: number;
  energyLabel: string;
  colors: any;
  t: any;
}

export function CalorieArc({ consumed, target, energyLabel, colors }: CalorieArcProps) {
  const safeConsumed = Number(consumed) || 0;
  const safeTarget = Number(target) || 2000;
  const pct = Number.isFinite(safeConsumed / Math.max(safeTarget, 1))
    ? Math.min(Math.max(safeConsumed / Math.max(safeTarget, 1), 0), 1)
    : 0;
  const strokeDashoffset = CIRCUMFERENCE - pct * CIRCUMFERENCE;

  return (
    <View style={s.arcWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <G rotation="-90" originX={RING_SIZE / 2} originY={RING_SIZE / 2}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={colors.border + '55'}
            strokeWidth={STROKE_WIDTH}
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={colors.primary}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={colors.primary + '40'}
            strokeWidth={STROKE_WIDTH + 6}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
          />
        </G>
      </Svg>
      <View style={s.arcTextWrap}>
        <Text style={[s.arcVal, { color: colors.textPrimary }]}>
          {consumed} <Text style={{ fontSize: 18, color: colors.textSecondary, fontWeight: '400' }}>/ {target}</Text>
        </Text>
        <Text style={[s.arcLabel, { color: colors.textMuted }]}>{energyLabel}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  arcWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 10, height: RING_SIZE },
  arcTextWrap: { position: 'absolute', alignItems: 'center' },
  arcVal: { fontSize: 28, fontWeight: '800' },
  arcLabel: { fontSize: 14, marginTop: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});
