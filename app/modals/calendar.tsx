import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { X, Flame, Calendar, Star, Trophy, Zap, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useNutritionStore } from '../../store';
import { useTranslation } from 'react-i18next';
import { getLocalDateString } from '../../utils/date';

// Helper: hexToRgb for generating rgba values from a hex color
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function CalendarModal() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { streakDays, activeDays, selectedDate, setDate } = useNutritionStore();

  // Derive plannedDays from the real activeDays count
  const plannedDays = Object.keys(activeDays).length;

  // Best streak: iterate backwards over all active days to find longest consecutive run
  const bestStreak = useMemo(() => {
    const dates = Object.keys(activeDays).sort();
    if (dates.length === 0) return 0;
    let best = 1;
    let current = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        current++;
        if (current > best) best = current;
      } else {
        current = 1;
      }
    }
    return best;
  }, [activeDays]);

  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  const daysHeader = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = viewDate.toLocaleDateString(
      t('common.locale') || 'es-MX',
      { month: 'long', year: 'numeric' }
    );
    return {
      monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      daysInMonth,
      emptyDays,
      year,
      month,
    };
  }, [viewDate]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(calendarData.year, calendarData.month, day);
    const dateString = getLocalDateString(newDate);
    setDate(dateString);
    router.back();
  };

  const today = getLocalDateString();

  // Premium gradient colors derived from the user's selected accent color
  const p = colors.primary;
  const pFaint  = hexToRgba(p, 0.08);
  const pLight  = hexToRgba(p, 0.15);
  const pMedium = hexToRgba(p, 0.25);
  const pGlow   = hexToRgba(p, 0.4);

  return (
    <View style={{ flex: 1 }}>
      {/* Full-screen background gradient driven by premium color */}
      <LinearGradient
        colors={[hexToRgba(p, 0.18), colors.background, colors.background]}
        locations={[0, 0.4, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={s.safe}>
        {/* ─── Header ─── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={[s.closeBtn, { backgroundColor: pLight, borderColor: hexToRgba(p, 0.3) }]}>
            <X size={18} color={p} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={[s.title, { color: colors.textPrimary }]}>
              {t('calendar.myStreaks', 'Mis Rachas')}
            </Text>
            <View style={[s.titleUnderline, { backgroundColor: p }]} />
          </View>

          {/* Decorative zap */}
          <View style={[s.zapBadge, { backgroundColor: pLight, borderColor: hexToRgba(p, 0.3) }]}>
            <Zap size={18} color={p} strokeWidth={2.5} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Streak Cards ─── */}
          <Animated.View entering={FadeInUp.delay(50).duration(400).springify()} style={s.cardsRow}>
            {/* Current Streak */}
            <View style={[s.card, { borderColor: hexToRgba('#FF8C42', 0.3) }]}>
              <LinearGradient
                colors={['#2D1800', '#1A0E00']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {/* Glow orb */}
              <View style={[s.cardOrb, { backgroundColor: hexToRgba('#FF6B00', 0.25) }]} />
              <LinearGradient
                colors={['#FF8C4230', '#FF6B0015']}
                style={s.cardTopBand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />

              <View style={[s.iconWrap, { backgroundColor: '#FF6B0025', borderColor: '#FF8C4240' }]}>
                <Flame size={30} color="#FF8C42" fill="#FF8C4260" strokeWidth={1.5} />
              </View>

              <Text style={[s.cardValue, { color: '#FF8C42' }]}>{streakDays}</Text>
              <Text style={[s.cardLabel, { color: '#ffffff99' }]}>
                {t('calendar.currentStreak', 'Racha actual')}
              </Text>

              <View style={[s.cardDivider, { backgroundColor: '#FF8C4220' }]} />

              <View style={s.bestRow}>
                <Trophy size={13} color="#FFD700" strokeWidth={2} />
                <Text style={[s.bestText, { color: '#ffffff70' }]}>
                  {t('calendar.record', 'Récord:')}{' '}
                  <Text style={{ color: '#FF8C42', fontWeight: '800' }}>{bestStreak}</Text>
                </Text>
              </View>
            </View>

            {/* Active Days — uses the premium color */}
            <View style={[s.card, { borderColor: hexToRgba(p, 0.35) }]}>
              <LinearGradient
                colors={[hexToRgba(p, 0.22), hexToRgba(p, 0.06)]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {/* Glow orb */}
              <View style={[s.cardOrb, { backgroundColor: pGlow }]} />
              <LinearGradient
                colors={[hexToRgba(p, 0.3), hexToRgba(p, 0.05)]}
                style={s.cardTopBand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />

              <View style={[s.iconWrap, { backgroundColor: pLight, borderColor: hexToRgba(p, 0.35) }]}>
                <Calendar size={30} color={p} strokeWidth={1.5} />
              </View>

              <Text style={[s.cardValue, { color: p }]}>{plannedDays}</Text>
              <Text style={[s.cardLabel, { color: '#ffffff99' }]}>
                {t('calendar.activeDays', 'Días activos')}
              </Text>

              <View style={[s.cardDivider, { backgroundColor: hexToRgba(p, 0.2) }]} />

              <View style={s.bestRow}>
                <Star size={13} color="#FFD700" strokeWidth={2} fill="#FFD70060" />
                <Text style={[s.bestText, { color: '#ffffff70' }]}>
                  {t('calendar.totalLogged', 'Total registrado')}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ─── Mini Stats Bar ─── */}
          <Animated.View entering={FadeInUp.delay(120).duration(400).springify()}>
            <LinearGradient
              colors={[hexToRgba(p, 0.12), colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.statsBar, { borderColor: hexToRgba(p, 0.2) }]}
            >
              <View style={s.statItem}>
                <Text style={[s.statNum, { color: '#FF8C42' }]}>{streakDays}</Text>
                <Text style={[s.statLbl, { color: colors.textSecondary }]}>🔥 {t('calendar.streak', 'Racha')}</Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: hexToRgba(p, 0.2) }]} />
              <View style={s.statItem}>
                <Text style={[s.statNum, { color: p }]}>{plannedDays}</Text>
                <Text style={[s.statLbl, { color: colors.textSecondary }]}>📅 {t('calendar.active', 'Activos')}</Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: hexToRgba(p, 0.2) }]} />
              <View style={s.statItem}>
                <Text style={[s.statNum, { color: '#F59E0B' }]}>{bestStreak}</Text>
                <Text style={[s.statLbl, { color: colors.textSecondary }]}>🏆 {t('calendar.recordShort', 'Récord')}</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ─── Calendar Card ─── */}
          <Animated.View entering={FadeInUp.delay(200).duration(400).springify()}>
            <View style={[s.calCard, { backgroundColor: colors.surface, borderColor: hexToRgba(p, 0.18) }]}>
              {/* Premium top accent band */}
              <LinearGradient
                colors={[hexToRgba(p, 0.15), 'transparent']}
                style={s.calTopBand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />

              {/* Month navigation */}
              <View style={s.calHeader}>
                <TouchableOpacity
                  onPress={() => changeMonth(-1)}
                  style={[s.navBtn, { backgroundColor: pLight, borderColor: hexToRgba(p, 0.25) }]}
                >
                  <ChevronLeft size={18} color={p} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={[s.calMonth, { color: colors.textPrimary }]}>
                  {calendarData.monthName}
                </Text>
                <TouchableOpacity
                  onPress={() => changeMonth(1)}
                  style={[s.navBtn, { backgroundColor: pLight, borderColor: hexToRgba(p, 0.25) }]}
                >
                  <ChevronRight size={18} color={p} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Day-of-week headers */}
              <View style={s.weekRow}>
                {daysHeader.map((d, i) => (
                  <Text
                    key={`hdr-${i}`}
                    style={[s.weekDay, { color: i >= 5 ? hexToRgba(p, 0.7) : colors.textSecondary }]}
                  >
                    {d}
                  </Text>
                ))}
              </View>

              {/* Thin separator */}
              <View style={[s.weekSep, { backgroundColor: hexToRgba(p, 0.12) }]} />

              {/* Days grid */}
              <View style={s.daysGrid}>
                {Array.from({ length: calendarData.emptyDays }).map((_, i) => (
                  <View key={`e-${i}`} style={s.dayCell} />
                ))}

                {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayDate = getLocalDateString(new Date(calendarData.year, calendarData.month, day));
                  const isToday = dayDate === today;
                  const isSelected = dayDate === selectedDate;
                  const isActive = !!activeDays[dayDate];

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={s.dayCell}
                      onPress={() => handleSelectDay(day)}
                      activeOpacity={0.7}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={[p, hexToRgba(p, 0.75)]}
                          style={s.dayCircleSelected}
                        >
                          <Text style={[s.dayText, { color: '#fff', fontWeight: '800' }]}>{day}</Text>
                        </LinearGradient>
                      ) : isToday ? (
                        <View style={[s.dayCircleToday, { borderColor: p, backgroundColor: hexToRgba(p, 0.1) }]}>
                          <Text style={[s.dayText, { color: p, fontWeight: '700' }]}>{day}</Text>
                        </View>
                      ) : (
                        <View style={[s.dayCircle, isActive && { backgroundColor: hexToRgba(p, 0.06) }]}>
                          <Text style={[s.dayText, { color: isActive ? colors.textPrimary : colors.textMuted }]}>{day}</Text>
                        </View>
                      )}
                      {/* Activity dot */}
                      {isActive ? (
                        <LinearGradient
                          colors={[p, hexToRgba(p, 0.6)]}
                          style={s.dot}
                        />
                      ) : (
                        <View style={[s.dot, { backgroundColor: 'transparent' }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Legend */}
              <View style={[s.legend, { borderTopColor: hexToRgba(p, 0.12) }]}>
                <View style={s.legendItem}>
                  <LinearGradient colors={[p, hexToRgba(p, 0.6)]} style={s.legendDot} />
                  <Text style={[s.legendText, { color: colors.textSecondary }]}>{t('calendar.activeDay', 'Día activo')}</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendCircle, { borderColor: p, backgroundColor: hexToRgba(p, 0.1) }]} />
                  <Text style={[s.legendText, { color: colors.textSecondary }]}>{t('calendar.today', 'Hoy')}</Text>
                </View>
                <View style={s.legendItem}>
                  <LinearGradient colors={[p, hexToRgba(p, 0.75)]} style={s.legendFill} />
                  <Text style={[s.legendText, { color: colors.textSecondary }]}>{t('calendar.selected', 'Seleccionado')}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Motivational footer */}
          <Animated.View entering={FadeInUp.delay(300).duration(400).springify()}>
            <LinearGradient
              colors={[hexToRgba(p, 0.1), hexToRgba(p, 0.04)]}
              style={[s.motivationCard, { borderColor: hexToRgba(p, 0.2) }]}
            >
              <Flame size={20} color="#FF8C42" fill="#FF8C4240" strokeWidth={1.5} />
              <Text style={[s.motivationText, { color: colors.textSecondary }]}>
                {streakDays >= 7
                  ? `¡Increíble! ${streakDays} días consecutivos 🔥`
                  : streakDays >= 3
                  ? `¡Vas muy bien! Sigue así 💪`
                  : '¡Comienza tu racha hoy! Cada día cuenta ⚡'}
              </Text>
            </LinearGradient>
          </Animated.View>

          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  zapBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  titleUnderline: { height: 2.5, width: 36, borderRadius: 2, marginTop: 3 },

  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },

  // Streak Cards
  cardsRow: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 210,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  cardOrb: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  cardTopBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  cardValue: { fontSize: 46, fontWeight: '900', letterSpacing: -2, lineHeight: 52 },
  cardLabel: { fontSize: 12, fontWeight: '600', marginTop: 4, textAlign: 'center', letterSpacing: 0.2 },
  cardDivider: { width: '100%', height: 1, marginVertical: 14 },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bestText: { fontSize: 12, fontWeight: '500' },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statLbl: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  statDivider: { width: 1, marginVertical: 6 },

  // Calendar Card
  calCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },
  calTopBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  calMonth: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDay: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  weekSep: { height: 1, marginBottom: 8, opacity: 0.6 },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 5,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  dayCircleSelected: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  dayText: { fontSize: 13, fontWeight: '600' },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 3 },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendCircle: { width: 7, height: 7, borderRadius: 3.5, borderWidth: 1.5 },
  legendFill: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 11, fontWeight: '500' },

  // Motivation
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  motivationText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },
});
