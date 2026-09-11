import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MacroBarsProps {
  macros: { protein: number; carbs: number; fat: number };
  targets: { protein: number; carbs: number; fat: number };
  colors: any;
  t: any;
}

interface MacroCardProps {
  label: string;
  emoji: string;
  current: number;
  target: number;
  color: string;
  gradient: [string, string];
  surfaceColor: string;
  borderColor: string;
  targetColor: string;
}

const MacroCard = React.memo(function MacroCard({
  label,
  emoji,
  current,
  target,
  color,
  gradient,
  surfaceColor,
  borderColor,
  targetColor,
}: MacroCardProps) {
  const safeCurrent = Math.round(Number(current) || 0);
  const safeTarget = Math.max(Math.round(Number(target) || 100), 1);
  const ratio = safeCurrent / safeTarget;
  const pct = Math.min(Math.max(ratio, 0), 1);
  const pctDisplay = Math.round(ratio * 100);

  return (
    <View style={[macro.card, { backgroundColor: surfaceColor, borderColor }]}>
      {/* Top row: Emoji avatar + Percent badge */}
      <View style={macro.topRow}>
        <View style={[macro.emojiWrap, { backgroundColor: color + '18' }]}>
          <Text style={macro.emoji}>{emoji}</Text>
        </View>
        <View style={[macro.badge, { backgroundColor: color + '20' }]}>
          <Text style={[macro.badgeText, { color }]}>{pctDisplay}%</Text>
        </View>
      </View>

      {/* Macro Name - Full width, single line, no broken text */}
      <Text
        style={macro.label}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {label}
      </Text>

      {/* Values: current / target */}
      <View style={macro.valueRow}>
        <Text style={[macro.currentVal, { color }]}>{safeCurrent}g</Text>
        <Text style={[macro.targetVal, { color: targetColor }]} numberOfLines={1}>
          <Text style={macro.slash}> / </Text>
          {safeTarget}g
        </Text>
      </View>

      {/* Progress Track with Gradient */}
      <View style={[macro.track, { backgroundColor: color + '22' }]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[macro.fill, { width: `${pct * 100}%` }]}
        />
      </View>
    </View>
  );
});

export function MacroBars({ macros, targets, colors, t }: MacroBarsProps) {
  const surfaceColor = colors.surfaceAlt ? colors.surfaceAlt + '40' : 'rgba(255,255,255,0.05)';
  const borderColor = colors.border ? colors.border + '30' : 'rgba(255,255,255,0.1)';
  const targetColor = colors.textSecondary || '#94A3B8';

  const proteinLabel = t('profile.protein', 'Proteína');
  const carbsLabel = t('profile.carbs', 'Carbos').length > 10 ? 'Carbos' : t('profile.carbs', 'Carbos');
  const fatLabel = t('profile.fat', 'Grasas');

  return (
    <View style={s.macrosWrap}>
      <MacroCard
        label={proteinLabel}
        emoji="🍗"
        current={macros.protein}
        target={targets.protein}
        color={colors.protein || '#8B5CF6'}
        gradient={[colors.protein || '#8B5CF6', '#A78BFA']}
        surfaceColor={surfaceColor}
        borderColor={borderColor}
        targetColor={targetColor}
      />
      <MacroCard
        label={carbsLabel}
        emoji="🍞"
        current={macros.carbs}
        target={targets.carbs}
        color={colors.carbs || '#06B6D4'}
        gradient={[colors.carbs || '#06B6D4', '#38BDF8']}
        surfaceColor={surfaceColor}
        borderColor={borderColor}
        targetColor={targetColor}
      />
      <MacroCard
        label={fatLabel}
        emoji="🥑"
        current={macros.fat}
        target={targets.fat}
        color={colors.fat || '#F59E0B'}
        gradient={[colors.fat || '#F59E0B', '#FBBF24']}
        surfaceColor={surfaceColor}
        borderColor={borderColor}
        targetColor={targetColor}
      />
    </View>
  );
}

const macro = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 9,
    borderRadius: 16,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  emojiWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 13,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
    flexWrap: 'nowrap',
  },
  currentVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  targetVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  slash: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.6,
  },
  track: {
    height: 5,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

const s = StyleSheet.create({
  macrosWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
    width: '100%',
  },
});
