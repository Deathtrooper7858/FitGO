import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Check, Dumbbell, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Radius, Spacing } from '../../constants';
import { useTheme } from '../../hooks/useTheme';
import { getLocalDateString, addDays } from '../../utils/date';
import { useWorkoutHistoryStore } from '../../store/workoutHistoryStore';
import { useNutritionStore } from '../../store/nutritionStore';

export interface WeeklyConsistencyCardProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  streakDays: number;
  language?: string;
  t: (key: string, ...args: any[]) => string;
}

export const WeeklyConsistencyCard = React.memo(function WeeklyConsistencyCard({
  selectedDate,
  onSelectDate,
  streakDays,
  language = 'es',
  t,
}: WeeklyConsistencyCardProps) {
  const colors = useTheme();
  const workouts = useWorkoutHistoryStore(s => s.workouts);
  const activeDays = useNutritionStore(s => s.activeDays);
  const todayStr = getLocalDateString();

  // Generate the 7 days of the current week (starting Monday)
  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const mondayStr = getLocalDateString(monday);

    return Array.from({ length: 7 }, (_, i) => {
      const dStr = addDays(mondayStr, i);
      const dObj = new Date(dStr + 'T12:00:00');
      const dayShort = dObj.toLocaleDateString(language, { weekday: 'narrow' }).toUpperCase();
      const dayNum = dObj.getDate();
      const isToday = dStr === todayStr;
      const isSelected = dStr === selectedDate;
      const isPastOrToday = dStr <= todayStr;

      const hasWorkout = workouts.some(w => w.date === dStr);
      const hasFood = !!activeDays[dStr];
      const isCompleted = hasWorkout || hasFood;

      return {
        dateStr: dStr,
        dayShort,
        dayNum,
        isToday,
        isSelected,
        isPastOrToday,
        hasWorkout,
        hasFood,
        isCompleted,
      };
    });
  }, [language, todayStr, selectedDate, workouts, activeDays]);

  const completedCount = useMemo(() => {
    return weekDays.filter(d => d.isCompleted && d.isPastOrToday).length;
  }, [weekDays]);

  return (
    <View style={s.container}>
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border + '45' }]}>
        <LinearGradient
          colors={['rgba(245, 158, 11, 0.07)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Header Row */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={[s.iconBox, { backgroundColor: '#F59E0B1F', borderColor: '#F59E0B40' }]}>
              <Flame size={18} color="#F59E0B" />
            </View>
            <View>
              <Text style={[s.title, { color: colors.textPrimary }]}>
                {t('dashboard.weeklyConsistency', 'Consistencia Semanal')}
              </Text>
              <Text style={[s.subtitle, { color: colors.textSecondary }]}>
                {completedCount} {t('dashboard.ofSevenDays', 'de 7 días activos')}
              </Text>
            </View>
          </View>

          {/* Streak pill */}
          <View style={[s.streakPill, { backgroundColor: '#F59E0B1A', borderColor: '#F59E0B44' }]}>
            <Flame size={14} color="#F59E0B" />
            <Text style={s.streakText}>
              {streakDays} {streakDays === 1 ? t('dashboard.day', 'día') : t('dashboard.days', 'días')}
            </Text>
          </View>
        </View>

        {/* 7 Days Row */}
        <View style={s.daysRow}>
          {weekDays.map((item) => {
            return (
              <TouchableOpacity
                key={item.dateStr}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelectDate(item.dateStr);
                }}
                activeOpacity={0.7}
                style={[
                  s.dayItem,
                  { backgroundColor: colors.surfaceAlt + '60', borderColor: colors.border + '30' },
                  item.isSelected && {
                    borderColor: colors.primary,
                    borderWidth: 1.5,
                    backgroundColor: colors.primary + '18',
                  },
                  item.isToday && !item.isSelected && {
                    borderColor: colors.primary + '80',
                    borderWidth: 1,
                  }
                ]}
              >
                <Text style={[
                  s.dayShortText,
                  { color: item.isSelected ? colors.primary : colors.textMuted },
                  item.isToday && { fontWeight: '900', color: colors.primary }
                ]}>
                  {item.dayShort}
                </Text>

                <Text style={[
                  s.dayNumText,
                  { color: item.isSelected ? colors.textPrimary : colors.textSecondary },
                  item.isToday && { color: colors.primary, fontWeight: '900' }
                ]}>
                  {item.dayNum}
                </Text>

                {/* Status indicator dot or badge */}
                <View style={s.indicatorSlot}>
                  {item.hasWorkout ? (
                    <View style={[s.statusDot, { backgroundColor: '#3B82F6' }]}>
                      <Dumbbell size={8} color="#FFF" />
                    </View>
                  ) : item.hasFood ? (
                    <View style={[s.statusDot, { backgroundColor: '#10B981' }]}>
                      <Check size={8} color="#FFF" />
                    </View>
                  ) : item.isPastOrToday ? (
                    <View style={[s.inactiveDot, { backgroundColor: colors.border + '60' }]} />
                  ) : (
                    <View style={[s.futureDot, { borderColor: colors.border + '40' }]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer info tip */}
        <View style={s.footer}>
          <Sparkles size={13} color="#F59E0B" />
          <Text style={[s.footerText, { color: colors.textMuted }]}>
            {completedCount >= 5
              ? t('dashboard.consistencyHigh', '¡Imparable! Tu constancia está acelerando tus resultados.')
              : t('dashboard.consistencyTip', 'Registra tus comidas y entrenamientos para mantener el hábito.')}
          </Text>
        </View>
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.md + 2,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F59E0B',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  dayShortText: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  dayNumText: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  indicatorSlot: {
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  futureDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
});
