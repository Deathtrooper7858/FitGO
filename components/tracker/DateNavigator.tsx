import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
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

  const days = useMemo(() => {
    const arr = [];
    const base = new Date(selectedDate + 'T12:00:00');
    for (let i = 3; i >= -3; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      arr.push({
        label: d.toLocaleDateString(language, { weekday: 'narrow' }).toUpperCase(),
        dayNum: d.getDate(),
        full: getLocalDateString(d),
      });
    }
    return arr;
  }, [language, selectedDate]);

  const handleSwipeDateChange = (direction: number) => {
    onDateChange(addDays(selectedDate, direction));
  };

  const gesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-50, 50])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const threshold = 60;
      if (e.translationX > threshold || e.velocityX > 300) {
        // Swipe Right -> Go to previous day
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        translateX.value = withTiming(width, { duration: 180 }, () => {
          runOnJS(handleSwipeDateChange)(-1);
          translateX.value = -width;
          translateX.value = withSpring(0, { damping: 15, stiffness: 120 });
        });
      } else if (e.translationX < -threshold || e.velocityX < -300) {
        // Swipe Left -> Go to next day
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        translateX.value = withTiming(-width, { duration: 180 }, () => {
          runOnJS(handleSwipeDateChange)(1);
          translateX.value = width;
          translateX.value = withSpring(0, { damping: 15, stiffness: 120 });
        });
      } else {
        translateX.value = withSpring(0, { damping: 12 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ overflow: 'hidden', width: '100%', paddingVertical: 4 }}>
        <Animated.View style={[s.datePicker, animatedStyle]}>
          {days.map((d) => (
            <TouchableOpacity
              key={d.full}
              style={s.dateItem}
              onPress={() => onDateChange(d.full)}
            >
              <Text style={[s.dateLabel, { color: colors.textSecondary }]}>{d.label}</Text>
              <View style={[s.dateNumWrap, selectedDate === d.full && { backgroundColor: colors.primary }]}>
                <Text style={[s.dateNum, { color: selectedDate === d.full ? '#fff' : colors.textPrimary }]}>{d.dayNum}</Text>
              </View>
              {selectedDate === d.full && <View style={[s.dateDot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  datePicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  dateItem: { alignItems: 'center', gap: 8 },
  dateLabel: { fontSize: 12, fontWeight: '600' },
  dateNumWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dateNum: { fontSize: 14, fontWeight: '700' },
  dateDot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: -8 },
});
