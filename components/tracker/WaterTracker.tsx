import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard } from '../GlassCard';
import { Radius } from '../../constants';

interface WaterTrackerProps {
  waterMl: number;
  onAddWater: (ml: number) => void;
  onCustomWaterPress: () => void;
  colors: any;
  t: any;
  volumeUnit: string;
}

export function WaterTracker({ waterMl, onAddWater, onCustomWaterPress, colors, t, volumeUnit }: WaterTrackerProps) {
  const displayWater = volumeUnit === 'ml' ? waterMl : waterMl / 1000;

  return (
    <GlassCard noPadding showStripe accentColor="#06B6D4">
      <View style={[s.card, { borderWidth: 0 }]}>
        <View style={s.cardHeader}>
          <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{t('tracker.water')}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }}>
          <TouchableOpacity onPress={onCustomWaterPress}>
            <Text style={[s.waterVal, { color: colors.textPrimary }]}>
              💧 {volumeUnit === 'ml' ? (waterMl / 1000).toFixed(1) : displayWater.toFixed(1)} <Text style={{ fontSize: 16, color: colors.textSecondary }}>/ 3.5 L</Text>
            </Text>
          </TouchableOpacity>
          <Text style={[s.waterSub, { color: colors.textSecondary }]}>{Math.floor(waterMl / 250)} {t('tracker.of')} 14 {t('tracker.glasses')}</Text>
        </View>
        <View style={s.waterControls}>
          <TouchableOpacity style={[s.waterBtn, { backgroundColor: colors.surfaceAlt + '88' }]} onPress={() => onAddWater(-250)}>
            <Text style={[s.waterBtnText, { color: colors.textPrimary }]}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.waterBtn, { backgroundColor: '#06B6D4' }]} onPress={() => onAddWater(250)}>
            <Text style={[s.waterBtnText, { color: '#fff' }]}>+</Text>
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
  waterVal: { fontSize: 24, fontWeight: 'bold' },
  waterSub: { fontSize: 14 },
  waterControls: { flexDirection: 'row', gap: 12, marginTop: 16 },
  waterBtn: { flex: 1, borderRadius: Radius.full, paddingVertical: 12, alignItems: 'center' },
  waterBtnText: { fontSize: 24, lineHeight: 28 },
});
