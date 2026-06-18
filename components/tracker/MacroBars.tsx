import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MacroBarsProps {
  macros: { protein: number; carbs: number; fat: number };
  targets: { protein: number; carbs: number; fat: number };
  colors: any;
  t: any;
}

function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const safeCurrent = Number(current) || 0;
  const safeTarget = Number(target) || 100;
  const pct = Number.isFinite(safeCurrent / Math.max(safeTarget, 1))
    ? Math.min(Math.max(safeCurrent / Math.max(safeTarget, 1), 0), 1)
    : 0;
  return (
    <View style={macro.wrap}>
      <Text style={[macro.label, { color: color }]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
      <View style={macro.valueRow}>
        <Text style={[macro.values, { color: color }]}><Text style={{ color, fontWeight: '800' }}>{current}</Text><Text style={{ fontSize: 10, color: color + '99' }}> / {target}g</Text></Text>
      </View>
      <View style={[macro.track, { backgroundColor: color + '33' }]}>
        <LinearGradient
          colors={[color, color + '99']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[macro.fill, { width: `${pct * 100}%` }]}
        />
      </View>
    </View>
  );
}

export function MacroBars({ macros, targets, colors, t }: MacroBarsProps) {
  return (
    <View style={s.macrosWrap}>
      <MacroBar label={t('profile.protein')} current={macros.protein} target={targets.protein} color={colors.protein} />
      <MacroBar label={t('profile.carbs').length > 10 ? 'Carbos' : t('profile.carbs')} current={macros.carbs} target={targets.carbs} color={colors.carbs} />
      <MacroBar label={t('profile.fat')} current={macros.fat} target={targets.fat} color={colors.fat} />
    </View>
  );
}

const macro = StyleSheet.create({
  wrap: { flex: 1, gap: 6 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  values: { fontSize: 13, fontWeight: '600' },
  track: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden', marginTop: 2 },
  fill: { height: '100%', borderRadius: 3 },
});

const s = StyleSheet.create({
  macrosWrap: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 20 },
});
