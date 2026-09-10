import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../constants';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_WIDTH = 68;
const DAY_GAP = 10;
const DAY_PADDING_H = 16;

interface DaySelectorProps {
  active: string;
  onSelect: (d: string) => void;
  isPremiumCustom?: boolean | null;
  premiumColor?: string | null;
  hasPlanMap?: Record<string, boolean>;
  isCompletedMap?: Record<string, boolean>;
}

function DaySelector({
  active,
  onSelect,
  isPremiumCustom,
  premiumColor,
  hasPlanMap,
  isCompletedMap,
}: DaySelectorProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const scrollRef = useRef<any>(null);

  // Compute week dates memoized
  const weekInfo = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    return DAYS.map((d, idx) => {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + mondayOffset + idx);

      const isToday =
        targetDate.getDate() === now.getDate() &&
        targetDate.getMonth() === now.getMonth() &&
        targetDate.getFullYear() === now.getFullYear();

      return {
        day: d,
        dateNum: targetDate.getDate(),
        isToday,
      };
    });
  }, []);

  useEffect(() => {
    const dayIndex = DAYS.indexOf(active);
    if (dayIndex === -1 || !scrollRef.current) return;
    const { width: screenWidth } = Dimensions.get('window');
    const offset = DAY_PADDING_H + dayIndex * (DAY_WIDTH + DAY_GAP) - screenWidth / 2 + DAY_WIDTH / 2;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: true });
    }, 100);
  }, [active]);

  const handleDayPress = (day: string) => {
    Haptics.selectionAsync();
    onSelect(day);
  };

  const activeGradient: readonly [string, string, ...string[]] =
    isPremiumCustom && premiumColor
      ? [
          premiumColor === 'admin_glow' ? '#00F0FF' : premiumColor,
          (premiumColor === 'admin_glow' ? '#00F0FF' : premiumColor) + 'CC',
        ]
      : colors.gradientPrimary || ['#7C5CFC', '#4338CA'];

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={dp.scroll}
      contentContainerStyle={dp.row}
    >
      {weekInfo.map(({ day, dateNum, isToday }) => {
        const isActive = active === day;
        const hasPlan = hasPlanMap ? !!hasPlanMap[day] : false;
        const isCompleted = isCompletedMap ? !!isCompletedMap[day] : false;

        return (
          <TouchableOpacity
            key={day}
            style={[
              dp.day,
              {
                backgroundColor: isActive ? 'transparent' : colors.surfaceAlt,
                borderColor: isActive ? (isPremiumCustom && premiumColor ? premiumColor : colors.primary) : isToday ? colors.primary + '55' : colors.border,
                shadowColor: isActive ? (isPremiumCustom && premiumColor ? premiumColor : colors.primary) : '#000',
              },
            ]}
            onPress={() => handleDayPress(day)}
            activeOpacity={0.8}
          >
            {isActive && (
              <LinearGradient
                colors={activeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
              />
            )}

            {/* Today Badge */}
            {isToday && (
              <View
                style={[
                  dp.todayBadge,
                  {
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.primary + '22',
                  },
                ]}
              >
                <Text
                  style={[
                    dp.todayText,
                    { color: isActive ? '#fff' : colors.primary },
                  ]}
                >
                  {t('planner.today', 'HOY')}
                </Text>
              </View>
            )}

            {/* Day of week (LUN, MAR...) */}
            <Text
              style={[
                dp.dayLabel,
                {
                  color: isActive ? '#ffffff' : colors.textSecondary,
                  marginTop: isToday ? 2 : 6,
                },
              ]}
            >
              {t(`planner.${day.toLowerCase()}`).toUpperCase()}
            </Text>

            {/* Date Number (9, 10...) */}
            <Text
              style={[
                dp.dateNumber,
                {
                  color: isActive ? '#ffffff' : colors.textPrimary,
                },
              ]}
            >
              {dateNum}
            </Text>

            {/* Plan Indicator Dot */}
            <View style={dp.dotContainer}>
              {isCompleted ? (
                <View style={[dp.dot, { backgroundColor: isActive ? '#A7F3D0' : '#10B981' }]} />
              ) : hasPlan ? (
                <View
                  style={[
                    dp.dot,
                    {
                      backgroundColor: isActive ? 'rgba(255,255,255,0.85)' : colors.primary,
                    },
                  ]}
                />
              ) : (
                <View style={[dp.dotEmpty, { borderColor: isActive ? 'rgba(255,255,255,0.3)' : colors.border }]} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default React.memo(DaySelector);

const dp = StyleSheet.create({
  scroll: {
    marginBottom: 18,
  },
  row: {
    gap: DAY_GAP,
    paddingHorizontal: Spacing.base,
    paddingBottom: 6,
    paddingTop: 4,
  },
  day: {
    width: DAY_WIDTH,
    height: 84,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    paddingVertical: 6,
  },
  todayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginBottom: 1,
  },
  todayText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '900',
    marginVertical: 2,
    letterSpacing: -0.5,
  },
  dotContainer: {
    height: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotEmpty: {
    width: 4,
    height: 4,
    borderRadius: 2,
    borderWidth: 1,
  },
});

