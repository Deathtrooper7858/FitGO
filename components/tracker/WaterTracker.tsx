import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Droplets, Plus, Minus, Edit2 } from 'lucide-react-native';
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

const WATER_TARGET_ML = 3500;

export function WaterTracker({
  waterMl,
  onAddWater,
  onCustomWaterPress,
  colors,
  t,
  volumeUnit,
}: WaterTrackerProps) {
  const safeWater = Math.max(0, waterMl || 0);
  const targetL = 3.5;
  const currentL = (safeWater / 1000).toFixed(1);
  const glasses = Math.floor(safeWater / 250);
  const targetGlasses = Math.round(WATER_TARGET_ML / 250);
  const pct = Math.min(Math.max(safeWater / WATER_TARGET_ML, 0), 1);

  const handleAdd = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddWater(amount);
  };

  return (
    <GlassCard noPadding showStripe accentColor="#06B6D4">
      <View style={s.card}>
        {/* Header */}
        <View style={s.cardHeader}>
          <View style={s.titleGroup}>
            <View style={[s.iconWrap, { backgroundColor: '#06B6D418' }]}>
              <Droplets size={16} color="#06B6D4" />
            </View>
            <View>
              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
                {t('tracker.water', 'Agua')}
              </Text>
              <Text style={[s.cardSubtitle, { color: colors.textMuted }]}>
                {glasses} {t('tracker.of', 'de')} {targetGlasses} {t('tracker.glasses', 'vasos')} (250ml)
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.editBtn, { backgroundColor: colors.surfaceAlt + '60', borderColor: colors.border + '35' }]}
            onPress={() => {
              Haptics.selectionAsync();
              onCustomWaterPress();
            }}
            activeOpacity={0.7}
          >
            <Edit2 size={12} color={colors.textSecondary} />
            <Text style={[s.editBtnText, { color: colors.textSecondary }]}>
              {t('common.edit', 'Ajustar')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Big number & progress bar */}
        <View style={s.amountRow}>
          <Text style={[s.waterVal, { color: colors.textPrimary }]}>
            {currentL} <Text style={{ fontSize: 16, color: colors.textSecondary, fontWeight: '500' }}>/ {targetL} L</Text>
          </Text>
          <View style={[s.percentPill, { backgroundColor: '#06B6D418' }]}>
            <Text style={s.percentText}>{Math.round(pct * 100)}%</Text>
          </View>
        </View>

        {/* Progress Bar with Gradient */}
        <View style={[s.progressTrack, { backgroundColor: colors.border + '35' }]}>
          <LinearGradient
            colors={['#06B6D4', '#38BDF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.progressFill, { width: `${pct * 100}%` }]}
          />
        </View>

        {/* Fast Action Buttons */}
        <View style={s.waterControls}>
          <TouchableOpacity
            style={[s.waterBtn, { backgroundColor: colors.surfaceAlt + '60', borderColor: colors.border + '30' }]}
            onPress={() => handleAdd(-250)}
            activeOpacity={0.75}
          >
            <Minus size={14} color={colors.textSecondary} />
            <Text style={[s.waterBtnLabel, { color: colors.textSecondary }]}>-250 ml</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.waterBtn, { backgroundColor: '#06B6D420', borderColor: '#06B6D450' }]}
            onPress={() => handleAdd(250)}
            activeOpacity={0.75}
          >
            <Plus size={14} color="#06B6D4" strokeWidth={2.5} />
            <Text style={[s.waterBtnLabel, { color: '#06B6D4', fontWeight: '800' }]}>+250 ml</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.waterBtn, { backgroundColor: '#06B6D4', borderColor: '#06B6D4' }]}
            onPress={() => handleAdd(500)}
            activeOpacity={0.75}
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={[s.waterBtnLabel, { color: '#FFFFFF', fontWeight: '800' }]}>+500 ml</Text>
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
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  waterVal: {
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
    color: '#06B6D4',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  waterControls: {
    flexDirection: 'row',
    gap: 8,
  },
  waterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  waterBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});
