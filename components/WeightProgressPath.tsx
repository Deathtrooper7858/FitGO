/**
 * WeightProgressPath — Gamified SVG weight journey component.
 *
 * Shows a curved bezier path from Starting Weight → Current Weight → Goal Weight
 * with milestone nodes, animated glow on the active point, and a "% completed" badge.
 *
 * Polished to prevent label collisions at 0% or 100% progress.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, {
  Defs, LinearGradient as SvgGradient, Stop,
  Path, Circle, Text as SvgText, G,
} from 'react-native-svg';

import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../store';
import { convertMass } from '../utils/units';

interface WeightProgressPathProps {
  startingWeight: number;
  currentWeight: number;
  targetWeight: number;
  width?: number;
}

export function WeightProgressPath({
  startingWeight,
  currentWeight,
  targetWeight,
  width = 320,
}: WeightProgressPathProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const { massUnit } = useSettingsStore();

  const W = width;
  const H = 150;
  const padX = 32;
  const midY = H / 2;

  // Sanitize weight inputs to guarantee finite, valid numbers and avoid NaN crashes
  const startW = Number.isFinite(startingWeight) ? startingWeight : (parseFloat(String(startingWeight)) || 80);
  const currW = Number.isFinite(currentWeight) ? currentWeight : (parseFloat(String(currentWeight)) || 80);
  const targetW = Number.isFinite(targetWeight) ? targetWeight : (parseFloat(String(targetWeight)) || 75);

  // Convert for display
  const displayStart = Number(convertMass(startW, 'kg', massUnit).toFixed(1));
  const displayCurr = Number(convertMass(currW, 'kg', massUnit).toFixed(1));
  const displayTarget = Number(convertMass(targetW, 'kg', massUnit).toFixed(1));

  // Clamp pct between 0 and 1 (handle edge cases where user already past goal)
  const isLoss = targetW < startW;
  const totalRange = Math.abs(startW - targetW) || 1;
  const pct = isLoss
    ? (startW - currW) / totalRange
    : (currW - startW) / totalRange;
  const clampedPct = Number.isFinite(pct) ? Math.min(Math.max(pct, 0), 1) : 0;

  // X positions
  const x0 = padX;                               // start
  const x1 = padX + (W - 2 * padX) * clampedPct; // current
  const x2 = W - padX;                           // goal

  // Y positions — create a gentle arc that peaks slightly at the midpoint
  const y0 = midY + 10;
  const y1 = midY - 14;        // current node slightly elevated
  const y2 = isLoss ? midY - 6 : midY + 6;

  // Control points for cubic bezier
  const cp1x = x0 + (x1 - x0) * 0.5;
  const cp1y = y0 - 24;
  const cp2x = x0 + (x1 - x0) * 0.75;
  const cp2y = y1 + 8;

  // Second segment (current → goal)
  const cp3x = x1 + (x2 - x1) * 0.25;
  const cp3y = y1 - 8;
  const cp4x = x1 + (x2 - x1) * 0.6;
  const cp4y = y2 - 16;

  // Full path
  const completedPath = `M ${x0} ${y0} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1}`;
  const remainingPath = `M ${x1} ${y1} C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${x2} ${y2}`;

  const displayPct = Math.round(clampedPct * 100);
  const diffStart = Math.round((displayCurr - displayStart) * 10) / 10;
  const isGoalReached = isLoss ? displayCurr <= displayTarget : displayCurr >= displayTarget;
  const remainingValue = Math.abs(Math.round((displayTarget - displayCurr) * 10) / 10);

  // Avoid text collision when start & current nodes are close together
  const isCloseToStart = clampedPct < 0.15;
  const isCloseToEnd = clampedPct > 0.85;

  return (
    <View style={styles.container}>
      <Svg width={W} height={H}>
        <Defs>
          <SvgGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.secondary || '#A855F7'} stopOpacity="1" />
          </SvgGradient>
          <SvgGradient id="remainGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={colors.border} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={colors.border} stopOpacity="0.15" />
          </SvgGradient>
        </Defs>

        {/* Remaining path (dashed) */}
        <Path
          d={remainingPath}
          fill="none"
          stroke="url(#remainGrad)"
          strokeWidth={3}
          strokeDasharray="6,5"
        />

        {/* Completed path (gradient glow) */}
        {clampedPct > 0 && (
          <Path
            d={completedPath}
            fill="none"
            stroke="url(#pathGrad)"
            strokeWidth={4}
            strokeLinecap="round"
          />
        )}

        {/* ── Start node ── */}
        <G>
          <Circle
            cx={x0}
            cy={y0}
            r={9}
            fill={colors.surface}
            stroke={isCloseToStart ? colors.primary : colors.border}
            strokeWidth={2}
          />
          <Circle cx={x0} cy={y0} r={4} fill={isCloseToStart ? colors.primary : colors.textMuted} />

          {/* If current node is far enough, show start text */}
          {!isCloseToStart && (
            <>
              <SvgText
                x={x0}
                y={y0 + 20}
                textAnchor="middle"
                fontSize={9}
                fill={colors.textMuted}
                fontWeight="700"
              >
                {t('profile.start', 'Inicio')}
              </SvgText>
              <SvgText
                x={x0}
                y={y0 + 32}
                textAnchor="middle"
                fontSize={10}
                fill={colors.textSecondary}
                fontWeight="800"
              >
                {displayStart}
              </SvgText>
            </>
          )}
        </G>

        {/* ── Goal node ── */}
        <G>
          <Circle
            cx={x2}
            cy={y2}
            r={11}
            fill={colors.surface}
            stroke={isGoalReached ? colors.success : colors.success + '90'}
            strokeWidth={2}
            strokeDasharray={isGoalReached ? undefined : '3,2'}
          />
          <Circle cx={x2} cy={y2} r={5} fill={colors.success} />
          {!isCloseToEnd && (
            <>
              <SvgText
                x={x2}
                y={y2 + 20}
                textAnchor="middle"
                fontSize={9}
                fill={colors.success}
                fontWeight="700"
              >
                {t('profile.goal', 'Meta')}
              </SvgText>
              <SvgText
                x={x2}
                y={y2 + 32}
                textAnchor="middle"
                fontSize={10}
                fill={colors.success}
                fontWeight="800"
              >
                {displayTarget}
              </SvgText>
            </>
          )}
        </G>

        {/* ── Current node (Highlighted & Elevated) ── */}
        <G>
          {/* Halo ring */}
          <Circle cx={x1} cy={y1} r={16} fill={colors.primary} fillOpacity={0.16} />
          <Circle cx={x1} cy={y1} r={9} fill={colors.primary} />
          <Circle cx={x1} cy={y1} r={4} fill="#FFFFFF" />

          {/* Current weight label on top */}
          <SvgText
            x={x1}
            y={y1 - 16}
            textAnchor="middle"
            fontSize={12}
            fill={colors.primary}
            fontWeight="900"
          >
            {displayCurr} {massUnit}
          </SvgText>

          {/* Subtitle below */}
          <SvgText
            x={x1}
            y={y1 + 20}
            textAnchor="middle"
            fontSize={9}
            fill={colors.textPrimary}
            fontWeight="800"
          >
            {isCloseToStart ? `${t('profile.start', 'Inicio')} (${displayStart})` : t('profile.now', 'Ahora')}
          </SvgText>
        </G>
      </Svg>

      {/* Stats bar below the path */}
      <View style={[styles.statsRow, { backgroundColor: colors.surfaceAlt + '40', borderColor: colors.border + '30' }]}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: colors.primary }]}>{displayPct}%</Text>
          <Text style={[styles.statLbl, { color: colors.textMuted }]}>{t('profile.completed', 'Completado')}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border + '50' }]} />

        <View style={styles.stat}>
          <Text
            style={[
              styles.statVal,
              { color: diffStart < 0 ? colors.success : (diffStart > 0 ? (isLoss ? colors.error : colors.success) : colors.textPrimary) }
            ]}
          >
            {diffStart > 0 ? '+' : ''}{diffStart} {massUnit}
          </Text>
          <Text style={[styles.statLbl, { color: colors.textMuted }]}>{t('profile.sinceStart', 'Desde inicio')}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border + '50' }]} />

        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: isGoalReached ? colors.success : colors.warning }]}>
            {isGoalReached ? t('profile.goalReached', '¡Logrado!') : `${remainingValue} ${massUnit}`}
          </Text>
          <Text style={[styles.statLbl, { color: colors.textMuted }]}>
            {isGoalReached ? t('profile.goal', 'Meta') : t('profile.remaining', 'Faltan')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statLbl: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  divider: {
    width: 1,
    height: 26,
  },
});
