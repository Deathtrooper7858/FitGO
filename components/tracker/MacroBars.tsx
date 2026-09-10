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
}: MacroCardProps) {
  const safeCurrent = Math.round(Number(current) || 0);
  const safeTarget = Math.max(Math.round(Number(target) || 100), 1);
  const ratio = safeCurrent / safeTarget;
  const pct = Math.min(Math.max(ratio, 0), 1);
  const pctDisplay = Math.round(ratio * 100);

  return (
    <View style={[macro.card, { backgroundColor: surfaceColor, borderColor }]}>
      {/* Top row: Emoji & Label + Percent badge */}
      <View style={macro.header}>
        <View style={macro.labelGroup}>
          <Text style={macro.emoji}>{emoji}</Text>
          <Text style={[macro.label, { color }]}>{label}</Text>
        </View>
        <View style={[macro.badge, { backgroundColor: color + '18' }]}>
          <Text style={[macro.badgeText, { color }]}>{pctDisplay}%</Text>
        </View>
      </View>

      {/* Values: current / target */}
      <View style={macro.valueRow}>
        <Text style={[macro.currentVal, { color }]}>{safeCurrent}g</Text>
        <Text style={macro.targetVal}> / {safeTarget}g</Text>
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
  const surfaceColor = colors.surfaceAlt + '40';
  const borderColor = colors.border + '30';

  return (
    <View style={s.macrosWrap}>
      <MacroCard
        label={t('profile.protein', 'Proteínas')}
        emoji="🍗"
        current={macros.protein}
        target={targets.protein}
        color={colors.protein || '#8B5CF6'}
        gradient={[colors.protein || '#8B5CF6', '#A78BFA']}
        surfaceColor={surfaceColor}
        borderColor={borderColor}
      />
      <MacroCard
        label={t('profile.carbs', 'Carbos').length > 10 ? 'Carbos' : t('profile.carbs', 'Carbos')}
        emoji="🍞"
        current={macros.carbs}
        target={targets.carbs}
        color={colors.carbs || '#06B6D4'}
        gradient={[colors.carbs || '#06B6D4', '#38BDF8']}
        surfaceColor={surfaceColor}
        borderColor={borderColor}
      />
      <MacroCard
        label={t('profile.fat', 'Grasas')}
        emoji="🥑"
        current={macros.fat}
        target={targets.fat}
        color={colors.fat || '#F59E0B'}
        gradient={[colors.fat || '#F59E0B', '#FBBF24']}
        surfaceColor={surfaceColor}
        borderColor={borderColor}
      />
    </View>
  );
}

const macro = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  emoji: {
    fontSize: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
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
  },
  currentVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  targetVal: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
  },
  track: {
    height: 6,
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
