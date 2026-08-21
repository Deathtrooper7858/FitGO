import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../constants';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_WIDTH = 64;
const DAY_GAP = 12;
const DAY_PADDING_H = 16;

interface DaySelectorProps {
  active: string;
  onSelect: (d: string) => void;
  isPremiumCustom?: boolean | null;
  premiumColor?: string | null;
}

function DaySelector({ active, onSelect, isPremiumCustom, premiumColor }: DaySelectorProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    const dayIndex = DAYS.indexOf(active);
    if (dayIndex === -1 || !scrollRef.current) return;
    const { width: screenWidth } = Dimensions.get('window');
    const offset = DAY_PADDING_H + dayIndex * (DAY_WIDTH + DAY_GAP) - screenWidth / 2 + DAY_WIDTH / 2;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: true });
    }, 100);
  }, [active]);

  return (
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} style={dp.scroll} contentContainerStyle={dp.row}>
      {DAYS.map((d) => {
        const isActive = active === d;
        return (
          <TouchableOpacity
            key={d}
            style={[dp.day, { backgroundColor: isActive ? 'transparent' : colors.surfaceAlt, borderColor: isActive ? colors.primary : colors.border }]}
            onPress={() => onSelect(d)}
            activeOpacity={0.8}
          >
            {isActive && (
              <LinearGradient
                colors={isPremiumCustom && premiumColor ? [premiumColor === 'admin_glow' ? '#00F0FF' : premiumColor, (premiumColor === 'admin_glow' ? '#00F0FF' : premiumColor) + 'CC'] : (colors.gradientPrimary || ['#7C5CFC', '#4338CA'])}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
              />
            )}
            <Text style={[dp.dayLabel, { color: isActive ? '#fff' : colors.textSecondary, zIndex: 1 }]}>
              {t(`planner.${d.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  );
}

export default React.memo(DaySelector);

const dp = StyleSheet.create({
  scroll:   { marginBottom: 24 },
  row:      { gap: 12, paddingHorizontal: Spacing.base, paddingBottom: 10, paddingTop: 4 },
  day:      { width: 64, height: 74, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  dayLabel: { fontSize: 15, fontWeight: '800' },
});
