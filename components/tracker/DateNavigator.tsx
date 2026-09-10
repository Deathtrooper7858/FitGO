import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getLocalDateString, addDays } from '../../utils/date';

interface DateNavigatorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  colors: any;
  t: any;
  language: string;
}

export function DateNavigator({ selectedDate, onDateChange, colors, t, language }: DateNavigatorProps) {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const todayStr = useMemo(() => getLocalDateString(new Date()), []);

  const days = useMemo(() => {
    const arr = [];
    const base = new Date(selectedDate + 'T12:00:00');
    for (let i = 3; i >= -3; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const full = getLocalDateString(d);
      arr.push({
        label: d.toLocaleDateString(language, { weekday: 'narrow' }).toUpperCase(),
        dayNum: d.getDate(),
        full,
        isToday: full === todayStr,
      });
    }
    return arr;
  }, [language, selectedDate, todayStr]);

  const handleSwipeDateChange = (direction: number) => {
    onDateChange(addDays(selectedDate, direction));
  };

  const gesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-40, 40])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const threshold = 60;
      if (e.translationX > threshold || e.velocityX > 350) {
        // Swipe Right -> Go to previous day
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        translateX.value = withTiming(width * 0.7, { duration: 160 }, () => {
          runOnJS(handleSwipeDateChange)(-1);
          translateX.value = -width * 0.7;
          translateX.value = withSpring(0, { damping: 16, stiffness: 140 });
        });
      } else if (e.translationX < -threshold || e.velocityX < -350) {
        // Swipe Left -> Go to next day
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        translateX.value = withTiming(-width * 0.7, { duration: 160 }, () => {
          runOnJS(handleSwipeDateChange)(1);
          translateX.value = width * 0.7;
          translateX.value = withSpring(0, { damping: 16, stiffness: 140 });
        });
      } else {
        translateX.value = withSpring(0, { damping: 14 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handlePressDate = (dateStr: string) => {
    Haptics.selectionAsync();
    onDateChange(dateStr);
  };

  return (
    <GestureDetector gesture={gesture}>
      <View style={s.outerContainer}>
        <Animated.View style={[s.datePicker, animatedStyle]}>
          {days.map((d) => {
            const isSelected = selectedDate === d.full;

            return (
              <TouchableOpacity
                key={d.full}
                style={[
                  s.datePill,
                  !isSelected && {
                    backgroundColor: colors.surfaceAlt + '45',
                    borderColor: colors.border + '35',
                  },
                ]}
                onPress={() => handlePressDate(d.full)}
                activeOpacity={0.75}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={[colors.primary || '#8B5CF6', colors.secondary || '#06B6D4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.selectedGradient}
                  >
                    <Text style={s.selectedWeekday}>{d.label}</Text>
                    <Text style={s.selectedDayNum}>{d.dayNum}</Text>
                    {d.isToday ? (
                      <View style={s.todayDotActive} />
                    ) : (
                      <View style={s.dotPlaceholder} />
                    )}
                  </LinearGradient>
                ) : (
                  <View style={s.unselectedContent}>
                    <Text style={[s.unselectedWeekday, { color: colors.textSecondary }]}>
                      {d.label}
                    </Text>
                    <Text style={[s.unselectedDayNum, { color: colors.textPrimary }]}>
                      {d.dayNum}
                    </Text>
                    {d.isToday ? (
                      <View style={[s.todayDotInactive, { backgroundColor: colors.primary }]} />
                    ) : (
                      <View style={s.dotPlaceholder} />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  outerContainer: {
    overflow: 'hidden',
    width: '100%',
    paddingVertical: 4,
  },
  datePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  datePill: {
    flex: 1,
    marginHorizontal: 3,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedGradient: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 15,
  },
  unselectedContent: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  selectedWeekday: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  selectedDayNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  unselectedWeekday: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  unselectedDayNum: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  todayDotActive: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  todayDotInactive: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 4,
  },
});
