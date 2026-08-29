import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, Radius } from '../../constants';
import { GlassCard } from '../GlassCard';
import { WeightProgressPath } from '../WeightProgressPath';
import { convertMass } from '../../utils/units';
import type { UserProfile, BodyMeasurement } from '../../store';

interface WeightChartProps {
  profile: UserProfile | null;
  measurements: BodyMeasurement[];
  massUnit: string;
  language: string;
  isPremiumCustom: boolean;
  safePremiumColor: string | null;
  SCREEN_WIDTH: number;
  onHistoryPress: () => void;
  onAddMeasurement: () => void;
}

export function WeightChart({
  profile, measurements, massUnit, language, isPremiumCustom, safePremiumColor,
  SCREEN_WIDTH, onHistoryPress, onAddMeasurement,
}: WeightChartProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const lastMeasure = useMemo(() => {
    if (!measurements || measurements.length === 0) return null;
    return measurements[0];
  }, [measurements]);

  const weightData = useMemo(() => {
    if (!measurements || measurements.length === 0) {
      const w = profile?.weight || 0;
      const displayW = Number(convertMass(w, 'kg', massUnit as any).toFixed(1));
      return [{ value: displayW, label: t('tracker.today'), dataPointText: `${displayW}${massUnit}` }];
    }
    return measurements
      .filter(m => m && m.weight != null)
      .slice(0, 30)
      .reverse()
      .map(m => {
        const rawW = m?.weight ?? 0;
        const displayW = Number(convertMass(rawW, 'kg', massUnit as any).toFixed(1));
        let dateLabel = '';
        try {
          const parsedDate = new Date(m.date ? (m.date.includes('T') ? m.date : `${m.date}T12:00:00`) : new Date());
          if (!isNaN(parsedDate.getTime())) {
            dateLabel = parsedDate.toLocaleDateString(language, { month: 'short', day: 'numeric' });
          } else {
            dateLabel = String(m.date || '');
          }
        } catch {
          dateLabel = String(m.date || '');
        }
        return {
          value: displayW,
          label: dateLabel,
          dataPointText: `${displayW}${massUnit}`,
        };
      });
  }, [measurements, profile?.weight, language, massUnit, t]);

  const chartSpacing = useMemo(() => {
    const minSpacing = 75;
    const availableWidth = SCREEN_WIDTH - 64;
    if (weightData.length <= 1) return minSpacing;
    return Math.max(minSpacing, availableWidth / (weightData.length - 1));
  }, [weightData.length, SCREEN_WIDTH]);

  const startingWeight = profile?.startingWeight || (measurements.length > 0 ? (measurements[measurements.length - 1].weight || profile?.weight || 80) : (profile?.weight || 80));
  const currentWeight = lastMeasure?.weight || profile?.weight || 80;
  const targetWeight = profile?.targetWeight || (profile?.goal === 'lose' ? (profile?.weight || 80) - 5 : (profile?.weight || 80) + 5);

  return (
    <GlassCard
      noPadding
      showStripe
      accentColor={isPremiumCustom ? (safePremiumColor ?? undefined) : colors.primary}
      style={{ margin: Spacing.base, marginTop: 0 }}
    >
      {isPremiumCustom && (
        <LinearGradient
          colors={[safePremiumColor + '25', safePremiumColor + '10', 'transparent'] as [string, string, string]}
          style={[StyleSheet.absoluteFill, { borderRadius: Radius.lg }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />
      )}
      <View style={{ padding: Spacing.base }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
              {t('profile.weightPath', 'Ruta de Progreso')}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{t('profile.weightGoalSubtitle', 'Tu camino hacia la meta')}</Text>
          </View>
          <TouchableOpacity onPress={onHistoryPress}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>{t('common.viewAll', 'Historial')} ›</Text>
          </TouchableOpacity>
        </View>

        <WeightProgressPath
          startingWeight={startingWeight}
          currentWeight={currentWeight}
          targetWeight={targetWeight}
          width={SCREEN_WIDTH - 72}
        />

        {weightData.length >= 2 && (
          <View style={{ marginLeft: -20, marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border + '40', paddingTop: 16 }}>
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 20, marginBottom: 8 }}>{t('profile.recentHistory', 'Historial reciente')}</Text>
            <LineChart
              data={weightData}
              height={140}
              width={SCREEN_WIDTH - 64}
              spacing={chartSpacing}
              initialSpacing={25}
              endSpacing={25}
              nestedScrollEnabled={true}
              disableScroll={false}
              color={colors.primary}
              thickness={3}
              hideRules
              hideYAxisText
              yAxisThickness={0}
              xAxisThickness={0}
              areaChart
              startFillColor={colors.primary}
              startOpacity={0.35}
              endFillColor={colors.primary}
              endOpacity={0.05}
              curved
              dataPointsColor={colors.primary}
              dataPointsRadius={5}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
              scrollToEnd={weightData.length > 5}
              pointerConfig={{
                pointerStripUptoDataPoint: true,
                pointerStripColor: colors.primary,
                pointerStripWidth: 1.5,
                strokeDashArray: [4, 4],
                pointerColor: colors.accent || colors.primary,
                pointerLabelComponent: (items: any) => {
                  if (!items || !Array.isArray(items) || items.length === 0 || !items[0] || items[0].value === undefined || isNaN(items[0].value)) return null;
                  return (
                    <View
                      pointerEvents="none"
                      style={{
                        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                        backgroundColor: colors.surfaceAlt, borderColor: colors.border,
                        borderWidth: 1, minWidth: 60, alignItems: 'center', justifyContent: 'center',
                        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '800' }}>
                        {items[0].value} {(massUnit || '').toUpperCase()}
                      </Text>
                    </View>
                  );
                },
                pointerVanishDelay: 1000,
                activatePointersOnLongPress: true,
                activatePointersDelay: 250,
              }}
            />
          </View>
        )}
        {weightData.length < 2 && (
          <View style={{ alignItems: 'center', paddingVertical: 16, gap: 8 }}>
            <TouchableOpacity
              onPress={onAddMeasurement}
              style={{ marginTop: 8, backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+ {t('profile.addMeasurement', 'Añadir Medición')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </GlassCard>
  );
}
