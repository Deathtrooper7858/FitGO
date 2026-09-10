import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'react-native-gifted-charts';
import { Plus, ChevronRight, History, TrendingUp } from 'lucide-react-native';
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

  const accentColor = isPremiumCustom && safePremiumColor ? safePremiumColor : colors.primary;

  const lastMeasure = useMemo(() => {
    if (!measurements || measurements.length === 0) return null;
    return measurements[0];
  }, [measurements]);

  const weightData = useMemo(() => {
    if (!measurements || measurements.length === 0) {
      const w = profile?.weight || 0;
      const displayW = Number(convertMass(w, 'kg', massUnit as any).toFixed(1));
      return [{ value: displayW, label: t('tracker.today', 'Hoy'), dataPointText: `${displayW}${massUnit}` }];
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
      accentColor={accentColor}
      style={{ marginHorizontal: Spacing.base, marginBottom: Spacing.base }}
    >
      {isPremiumCustom && (
        <LinearGradient
          colors={[safePremiumColor + '20', safePremiumColor + '08', 'transparent'] as [string, string, string]}
          style={[StyleSheet.absoluteFill, { borderRadius: Radius.lg }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />
      )}
      <View style={{ padding: Spacing.base }}>
        {/* Header of Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} color={accentColor} />
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
                {t('profile.weightPath', 'Ruta de Progreso')}
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
              {t('profile.weightGoalSubtitle', 'Tu camino hacia la meta')}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onHistoryPress}
            style={[styles.historyPill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '50' }]}
            activeOpacity={0.7}
          >
            <History size={12} color={accentColor} />
            <Text style={[styles.historyText, { color: accentColor }]}>
              {t('common.viewAll', 'Historial')}
            </Text>
            <ChevronRight size={12} color={accentColor} />
          </TouchableOpacity>
        </View>

        {/* SVG Bezier Path */}
        <WeightProgressPath
          startingWeight={startingWeight}
          currentWeight={currentWeight}
          targetWeight={targetWeight}
          width={SCREEN_WIDTH - 72}
        />

        {/* Recent History Line Chart if >= 2 points */}
        {weightData.length >= 2 && (
          <View style={{ marginLeft: -20, marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border + '30', paddingTop: 16 }}>
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 20, marginBottom: 8 }}>
              {t('profile.recentHistory', 'Historial reciente')}
            </Text>
            <LineChart
              data={weightData}
              height={140}
              width={SCREEN_WIDTH - 64}
              spacing={chartSpacing}
              initialSpacing={25}
              endSpacing={25}
              nestedScrollEnabled={true}
              disableScroll={false}
              color={accentColor}
              thickness={3}
              hideRules
              hideYAxisText
              yAxisThickness={0}
              xAxisThickness={0}
              areaChart
              startFillColor={accentColor}
              startOpacity={0.35}
              endFillColor={accentColor}
              endOpacity={0.03}
              curved
              dataPointsColor={accentColor}
              dataPointsRadius={5}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
              scrollToEnd={weightData.length > 5}
              pointerConfig={{
                pointerStripUptoDataPoint: true,
                pointerStripColor: accentColor,
                pointerStripWidth: 1.5,
                strokeDashArray: [4, 4],
                pointerColor: colors.accent || accentColor,
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

        {/* Quick Add Measurement Action Bar */}
        <View style={{ marginTop: 14 }}>
          <TouchableOpacity
            onPress={onAddMeasurement}
            activeOpacity={0.8}
            style={{ borderRadius: 16, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={[accentColor, accentColor + 'DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addBtn}
            >
              <Plus size={16} color="#FFF" strokeWidth={3} />
              <Text style={styles.addBtnText}>{t('profile.addMeasurement', 'Añadir Medición')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  historyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  historyText: {
    fontSize: 11,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13.5,
    letterSpacing: 0.2,
  },
});
