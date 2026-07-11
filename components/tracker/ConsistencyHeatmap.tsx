import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard } from '../GlassCard';
import { Radius } from '../../constants';

interface HeatmapDay {
  dateStr: string;
  hasLogs: boolean;
  dayLabel: number;
  dayNum: number;
  intensity: number;
}

interface ConsistencyHeatmapProps {
  heatmapDays: HeatmapDay[];
  isPro: boolean;
  onUpgrade: () => void;
  colors: any;
  t: any;
}

export function ConsistencyHeatmap({ heatmapDays, isPro, onUpgrade, colors, t }: ConsistencyHeatmapProps) {
  return (
    <GlassCard noPadding showStripe accentColor={colors.secondary}>
      <View style={[s.card, { borderWidth: 0 }]}>
        <View style={s.cardHeader}>
          <View>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>🗓️ {t('tracker.consistency', 'Consistencia')}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{t('tracker.last28', 'Últimos 28 días')}</Text>
          </View>
          {!isPro && (
            <View style={{ backgroundColor: colors.secondary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '700' }}>PRO</Text>
            </View>
          )}
        </View>

        {isPro ? (
          <>
            <View style={s.heatmapGrid}>
              {heatmapDays.map((day, idx) => {
                const opacity = day.intensity === 0 ? '15' : day.intensity === 1 ? '40' : day.intensity === 2 ? '70' : 'FF';
                return (
                  <View
                    key={idx}
                    style={[
                      s.heatCell,
                      {
                        backgroundColor: day.hasLogs ? colors.primary + opacity : colors.border + '40',
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: day.hasLogs ? colors.primary + '30' : 'transparent',
                      }
                    ]}
                  />
                );
              })}
            </View>

            <View style={[s.heatLegend, { justifyContent: 'flex-end', marginTop: 16 }]}>
              <Text style={{ color: colors.textMuted, fontSize: 10, marginRight: 6 }}>{t('common.less', 'Menos')}</Text>
              <View style={[s.heatCell, { width: 12, height: 12, backgroundColor: colors.border + '40', borderRadius: 2 }]} />
              <View style={[s.heatCell, { width: 12, height: 12, backgroundColor: colors.primary + '40', borderRadius: 2, marginLeft: 3 }]} />
              <View style={[s.heatCell, { width: 12, height: 12, backgroundColor: colors.primary + '70', borderRadius: 2, marginLeft: 3 }]} />
              <View style={[s.heatCell, { width: 12, height: 12, backgroundColor: colors.primary, borderRadius: 2, marginLeft: 3 }]} />
              <Text style={{ color: colors.textMuted, fontSize: 10, marginLeft: 6 }}>{t('common.more', 'Más')}</Text>
            </View>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
            <Text style={[s.cardTitle, { color: colors.textPrimary, fontSize: 16, textAlign: 'center' }]}>
              {t('tracker.proFeature', 'Función Exclusiva Pro')}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
              {t('tracker.proHeatmapDesc', 'Desbloquea el análisis detallado de tu constancia y hábitos con FitGO Pro.')}
            </Text>
            <TouchableOpacity
              style={{ marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full }}
              onPress={onUpgrade}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('common.upgrade', 'Mejorar a Pro')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: Radius.xl, padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 12 },
  heatCell: { width: 18, height: 18 },
  heatLegend: { flexDirection: 'row', gap: 20, marginTop: 14, paddingLeft: 2 },
});
