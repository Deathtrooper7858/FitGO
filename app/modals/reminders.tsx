import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Platform, Animated, LayoutAnimation, UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Bell, ChevronLeft, ChevronDown, ChevronUp, Clock, Utensils, Droplets, Dumbbell,
  Check, AlertCircle, Pill, Footprints, Moon, Coffee,
  Trophy, Users, Zap, Star, Sword, Target, Medal, MessageSquare
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSettingsStore, Reminder } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import { GlassCard } from '../../components/GlassCard';
import { GlobalBackground } from '../../components/GlobalBackground';
import { scheduleReminder, cancelReminder, requestNotificationPermissions } from '../../services/notifications';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Category config ────────────────────────────────────────────────────────
type ReminderCategory = 'meal' | 'water' | 'workout' | 'general' | 'social';

interface CategoryConfig {
  key: ReminderCategory;
  labelKey: string;
  defaultLabel: string;
  gradient: readonly [string, string, ...string[]];
  icon: React.ReactNode;
  textColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'meal',
    labelKey: 'reminders.category.meal',
    defaultLabel: '🍽️  Comidas',
    gradient: ['#FF6B6B', '#FF4757'],
    icon: <Utensils size={16} color="#fff" />,
    textColor: '#FF6B6B',
  },
  {
    key: 'water',
    labelKey: 'reminders.category.water',
    defaultLabel: '💧  Hidratación',
    gradient: ['#3B82F6', '#1D4ED8'],
    icon: <Droplets size={16} color="#fff" />,
    textColor: '#3B82F6',
  },
  {
    key: 'workout',
    labelKey: 'reminders.category.workout',
    defaultLabel: '💪  Entrenamiento',
    gradient: ['#10B981', '#059669'],
    icon: <Dumbbell size={16} color="#fff" />,
    textColor: '#10B981',
  },
  {
    key: 'general',
    labelKey: 'reminders.category.general',
    defaultLabel: '⚡  General',
    gradient: ['#F59E0B', '#D97706'],
    icon: <Zap size={16} color="#fff" />,
    textColor: '#F59E0B',
  },
  {
    key: 'social',
    labelKey: 'reminders.category.social',
    defaultLabel: '🏆  Social & Competitivo',
    gradient: ['#8B5CF6', '#6D28D9'],
    icon: <Trophy size={16} color="#fff" />,
    textColor: '#A78BFA',
  },
];

// ─── Default reminders with categories ──────────────────────────────────────
const DEFAULT_REMINDER_KEYS: Record<string, string> = {
  '1': 'reminders.default.breakfast',
  '2': 'reminders.default.lunch',
  '3': 'reminders.default.dinner',
  '6': 'reminders.default.snack',
  '4': 'reminders.default.water',
  '10': 'reminders.default.waterAfternoon',
  '5': 'reminders.default.workout',
  '8': 'reminders.default.walk',
  '11': 'reminders.default.cardio',
  '7': 'reminders.default.vitamins',
  '9': 'reminders.default.sleep',
  '12': 'reminders.default.log',
  '13': 'reminders.default.league',
  '14': 'reminders.default.dailyChallenge',
  '15': 'reminders.default.friends',
  '16': 'reminders.default.streak',
  '17': 'reminders.default.achievements',
  '18': 'reminders.default.leaderboard',
  '19': 'reminders.default.messages',
};

const DEFAULT_REMINDERS: Reminder[] = [
  // MEAL
  { id: '1',  title: 'Breakfast',   body: 'Time for a healthy breakfast!',               time: '08:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'meal' },
  { id: '2',  title: 'Lunch',       body: "Don't forget your nutritious lunch!",            time: '13:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'meal' },
  { id: '3',  title: 'Dinner',       body: 'Time for dinner. Enjoy!',              time: '20:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'meal' },
  { id: '6',  title: 'Snack',   body: 'Time for a healthy snack!',                  time: '16:30', enabled: false, days: [0,1,2,3,4,5,6], type: 'meal' },
  // WATER
  { id: '4',  title: 'Water',       body: 'Stay hydrated! Drink a glass of water.',   time: '10:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'water' },
  { id: '10', title: 'Afternoon Water', body: "Don't forget to hydrate in the afternoon!",          time: '15:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'water' },
  // WORKOUT
  { id: '5',  title: 'Workout',    body: 'Time to reach your movement goal!',      time: '18:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'workout' },
  { id: '8',  title: 'Walk',   body: 'Check your steps! Time for a walk.',     time: '12:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'workout' },
  { id: '11', title: 'Cardio',     body: 'Activate your cardio for the day!',                   time: '07:00', enabled: false, days: [1,2,3,4,5],     type: 'workout' },
  // GENERAL
  { id: '7',  title: 'Vitamins',  body: 'Remember to take your vitamins and supplements!', time: '09:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'general' },
  { id: '9',  title: 'Sleep',     body: 'Rest well to recover!',             time: '22:30', enabled: false, days: [0,1,2,3,4,5,6], type: 'general' },
  { id: '12', title: 'Log',   body: "Log your meals today in FitGo!",      time: '21:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'general' },
  // SOCIAL & COMPETITIVE
  { id: '13', title: 'League',        body: "The league battle never stops! Check your position.", time: '09:30', enabled: false, days: [1,2,3,4,5], type: 'social' },
  { id: '14', title: 'Daily challenge', body: "Complete the daily challenge before it expires!",      time: '20:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'social' },
  { id: '15', title: 'Friends',      body: "See what your friends are achieving today!",          time: '18:30', enabled: false, days: [0,1,2,3,4,5,6], type: 'social' },
  { id: '16', title: 'Streak',       body: "Don't break your streak! Log your progress.",         time: '20:30', enabled: false, days: [0,1,2,3,4,5,6], type: 'social' },
  { id: '17', title: 'Achievements',      body: 'You have unlocked achievements waiting for you!',          time: '19:00', enabled: false, days: [0,6], type: 'social' },
  { id: '18', title: 'Leaderboard', body: 'The weekly ranking ends soon. Climb the ladder!', time: '10:00', enabled: false, days: [5,6], type: 'social' },
  { id: '19', title: 'Messages',    body: 'You have new messages on FitGO Social!',       time: '14:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'social' },
];

// ─── Icon & color helpers ────────────────────────────────────────────────────
const getIcon = (type: string, title?: string) => {
  const lt = (title || '').toLowerCase();
  if (lt.includes('merienda') || lt.includes('snack'))    return <Coffee    size={20} color="#F59E0B" />;
  if (lt.includes('vitamin') || lt.includes('suplemento')) return <Pill    size={20} color="#A78BFA" />;
  if (lt.includes('caminata') || lt.includes('pasos'))    return <Footprints size={20} color="#10B981" />;
  if (lt.includes('dormir') || lt.includes('sleep'))      return <Moon      size={20} color="#6366F1" />;
  if (lt.includes('cardio'))                              return <Zap       size={20} color="#10B981" />;
  if (lt.includes('registro'))                            return <Check     size={20} color="#F59E0B" />;
  // social
  if (lt.includes('liga'))                                return <Sword     size={20} color="#A78BFA" />;
  if (lt.includes('reto'))                                return <Target    size={20} color="#A78BFA" />;
  if (lt.includes('amigos'))                              return <Users     size={20} color="#A78BFA" />;
  if (lt.includes('racha'))                               return <Star      size={20} color="#F59E0B" />;
  if (lt.includes('logros'))                              return <Medal     size={20} color="#A78BFA" />;
  if (lt.includes('leaderboard') || lt.includes('ranking')) return <Trophy size={20} color="#A78BFA" />;
  if (lt.includes('mensaje'))                             return <MessageSquare size={20} color="#8B5CF6" />;

  switch (type) {
    case 'meal':    return <Utensils  size={20} color="#FF6B6B" />;
    case 'water':   return <Droplets  size={20} color="#3B82F6" />;
    case 'workout': return <Dumbbell  size={20} color="#10B981" />;
    case 'social':  return <Trophy    size={20} color="#A78BFA" />;
    default:        return <Bell      size={20} color="#F59E0B" />;
  }
};

const getAccent = (type: string, title?: string) => {
  const lt = (title || '').toLowerCase();
  if (lt.includes('merienda') || lt.includes('snack'))    return '#F59E0B';
  if (lt.includes('vitamin') || lt.includes('suplemento')) return '#A78BFA';
  if (lt.includes('caminata') || lt.includes('pasos'))    return '#10B981';
  if (lt.includes('dormir') || lt.includes('sleep'))      return '#6366F1';
  if (lt.includes('cardio'))                              return '#10B981';
  if (lt.includes('registro'))                            return '#F59E0B';
  if (type === 'social')                                  return '#8B5CF6';
  switch (type) {
    case 'meal':    return '#FF6B6B';
    case 'water':   return '#3B82F6';
    case 'workout': return '#10B981';
    default:        return '#F59E0B';
  }
};

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function RemindersModal() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { reminders, setReminders } = useSettingsStore();

  const [localReminders, setLocalReminders] = useState<Reminder[]>(() => {
    const merged = [...reminders];
    DEFAULT_REMINDERS.forEach(def => {
      if (!merged.some(r => r.id === def.id)) merged.push(def);
    });
    return merged.sort((a, b) => Number(a.id) - Number(b.id));
  });

  const [showTimePicker, setShowTimePicker] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ReminderCategory | 'all'>('all');
  
  // Accordion state - default all collapsed
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => { requestNotificationPermissions(); }, []);

  // Sync to global store instantly and schedule/cancel notification
  const saveAndSchedule = async (updatedReminders: Reminder[], modifiedId: string) => {
    setLocalReminders(updatedReminders);
    
    const r = updatedReminders.find(rem => rem.id === modifiedId);
    if (!r) return;

    const final = [...updatedReminders];
    const index = final.findIndex(rem => rem.id === modifiedId);

    // Cancel existing
    const oldNotifId = reminders.find(o => o.id === modifiedId)?.notificationId;
    if (oldNotifId) await cancelReminder(oldNotifId);

    // Schedule new if enabled
    if (r.enabled) {
      const notifId = await scheduleReminder(r);
      final[index] = { ...r, notificationId: notifId };
    } else {
      final[index] = { ...r, notificationId: undefined };
    }

    setReminders(final);
  };

  const handleToggle = (id: string) => {
    const updated = localReminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    saveAndSchedule(updated, id);
  };

  const handleDaysChange = (id: string, dayIndex: number) => {
    const updated = localReminders.map(r => {
      if (r.id === id) {
        const days = r.days.includes(dayIndex)
          ? r.days.filter(d => d !== dayIndex)
          : [...r.days, dayIndex].sort((a, b) => a - b);
        return { ...r, days };
      }
      return r;
    });
    saveAndSchedule(updated, id);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate && showTimePicker) {
      const hh = selectedDate.getHours().toString().padStart(2, '0');
      const mm = selectedDate.getMinutes().toString().padStart(2, '0');
      
      const updated = localReminders.map(r => 
        r.id === showTimePicker ? { ...r, time: `${hh}:${mm}` } : r
      );
      saveAndSchedule(updated, showTimePicker);
    }
    setShowTimePicker(null);
  };

  const toggleGroup = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filtered = activeCategory === 'all'
    ? localReminders
    : localReminders.filter(r => r.type === activeCategory);

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: localReminders.filter(r => r.type === cat.key),
  })).filter(g => g.items.length > 0);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <GlobalBackground />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { backgroundColor: colors.surface }]}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>
          {t('profile.reminders', 'Recordatorios')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero */}
      <View style={s.hero}>
        <LinearGradient colors={['#7C3AED40', '#3B82F620']} style={s.heroGlow}>
          <LinearGradient colors={['#7C3AED', '#4338CA']} style={s.heroBell}>
            <Bell size={28} color="#fff" />
          </LinearGradient>
        </LinearGradient>
        <Text style={[s.heroTitle, { color: colors.textPrimary }]}>
          {t('reminders.stayOnTrack', 'Mantente en el Camino')}
        </Text>
        <Text style={[s.heroSub, { color: colors.textSecondary }]}>
          {t('reminders.subtitle', 'Tus alertas se guardan y programan automáticamente al activarlas.')}
        </Text>
      </View>

      {/* Category filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabsRow}
        style={s.tabsContainer}
      >
        <TouchableOpacity
          onPress={() => setActiveCategory('all')}
          style={[
            s.tab,
            activeCategory === 'all' && s.tabActive,
            activeCategory === 'all' && { borderColor: '#7C3AED' },
          ]}
        >
          {activeCategory === 'all' && (
            <LinearGradient colors={['#7C3AED', '#4338CA']} style={StyleSheet.absoluteFill} />
          )}
          <Bell size={14} color={activeCategory === 'all' ? '#fff' : colors.textSecondary} />
          <Text style={[s.tabText, { color: activeCategory === 'all' ? '#fff' : colors.textSecondary }]}>
            {t('reminders.category.all')}
          </Text>
        </TouchableOpacity>

        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              onPress={() => {
                setActiveCategory(cat.key);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpandedGroups(prev => ({ ...prev, [cat.key]: true }));
              }}
              style={[s.tab, isActive && s.tabActive, isActive && { borderColor: cat.gradient[0] }]}
            >
              {isActive && (
                <LinearGradient colors={cat.gradient} style={StyleSheet.absoluteFill} />
              )}
              {isActive
                ? cat.icon
                : React.cloneElement(cat.icon as React.ReactElement<any>, { color: colors.textSecondary })}
              <Text style={[s.tabText, { color: isActive ? '#fff' : colors.textSecondary }]}>
                {t(cat.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Reminders list */}
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {activeCategory === 'all' ? (
          // Grouped Accordion view
          grouped.map(group => {
            const isExpanded = expandedGroups[group.key];
            return (
              <View key={group.key} style={s.group}>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => toggleGroup(group.key)}
                >
                  <LinearGradient colors={group.gradient} style={s.groupHeader}>
                    <View style={s.groupHeaderInner}>
                      {group.icon}
                      <Text style={s.groupHeaderText}>{t(group.labelKey)}</Text>
                    </View>
                    <View style={s.groupHeaderRight}>
                      <View style={s.groupBadge}>
                        <Text style={s.groupBadgeText}>
                          {group.items.filter(r => r.enabled).length}/{group.items.length}
                        </Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={20} color="#fff" />
                      ) : (
                        <ChevronDown size={20} color="#fff" />
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={s.accordionContent}>
                    {group.items.map(reminder => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        colors={colors}
                        accent={getAccent(reminder.type, reminder.title)}
                        icon={getIcon(reminder.type, reminder.title)}
                        onToggle={handleToggle}
                        onTimePress={setShowTimePicker}
                        onDaysChange={handleDaysChange}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          // Filtered view (just show the selected category naturally)
          <View>
            {grouped.filter(g => g.key === activeCategory).map(group => (
              <View key={group.key} style={s.group}>
                <LinearGradient colors={group.gradient} style={s.groupHeader}>
                  <View style={s.groupHeaderInner}>
                    {group.icon}
                    <Text style={s.groupHeaderText}>{group.defaultLabel}</Text>
                  </View>
                  <View style={s.groupBadge}>
                    <Text style={s.groupBadgeText}>
                      {group.items.filter(r => r.enabled).length}/{group.items.length}
                    </Text>
                  </View>
                </LinearGradient>
                {group.items.map(reminder => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    colors={colors}
                    accent={getAccent(reminder.type, reminder.title)}
                    icon={getIcon(reminder.type, reminder.title)}
                    onToggle={handleToggle}
                    onTimePress={setShowTimePicker}
                    onDaysChange={handleDaysChange}
                  />
                ))}
              </View>
            ))}
            {filtered.length === 0 && (
              <View style={s.emptyState}>
                <Bell size={40} color={colors.textMuted} />
                <Text style={[s.emptyText, { color: colors.textMuted }]}>
                  No hay recordatorios en esta categoría
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Permission notice */}
        <View style={s.infoBox}>
          <AlertCircle size={14} color={colors.textMuted} />
          <Text style={[s.infoText, { color: colors.textMuted }]}>
            {t('reminders.permissionInfo', 'Permite las notificaciones en los ajustes de tu sistema para recibir alertas.')}
          </Text>
        </View>
      </ScrollView>

      {/* Time picker */}
      {showTimePicker && (
        <DateTimePicker
          value={(() => {
            const [h, m] = localReminders.find(r => r.id === showTimePicker)!.time.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
          })()}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Reminder Card component ─────────────────────────────────────────────────
interface ReminderCardProps {
  reminder: Reminder;
  colors: any;
  accent: string;
  icon: React.ReactNode;
  onToggle: (id: string) => void;
  onTimePress: (id: string) => void;
  onDaysChange: (id: string, dayIndex: number) => void;
}

function ReminderCard({ reminder, colors, accent, icon, onToggle, onTimePress, onDaysChange }: ReminderCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { t } = useTranslation();

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 25 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 25 }).start();

  const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const titleKey = DEFAULT_REMINDER_KEYS[reminder.id];
  const displayTitle = titleKey ? t(titleKey, reminder.title) : reminder.title;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 10, opacity: reminder.enabled ? 1 : 0.6 }}>
      <GlassCard
        style={s.card}
        noPadding
        accentColor={accent}
        showStripe
      >
        <View style={s.cardRow}>
          {/* Icon */}
          <View style={[s.iconBox, { backgroundColor: accent + '20' }]}>
            {icon}
          </View>

          {/* Content */}
          <View style={s.cardContent}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{displayTitle}</Text>
            <TouchableOpacity
              onPress={() => onTimePress(reminder.id)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={[s.timeChip, { backgroundColor: accent + '18', borderColor: accent + '40' }]}
            >
              <Clock size={11} color={accent} />
              <Text style={[s.timeText, { color: accent }]}>{reminder.time}</Text>
            </TouchableOpacity>
          </View>

          {/* Switch */}
          <Switch
            value={reminder.enabled}
            onValueChange={() => onToggle(reminder.id)}
            trackColor={{ false: '#3F3F46', true: accent }}
            thumbColor={Platform.OS === 'ios' ? '#fff' : (reminder.enabled ? '#fff' : '#A1A1AA')}
          />
        </View>

        {/* Days selector */}
        {reminder.enabled && (
          <View style={s.daysRow}>
            {dayLabels.map((label, idx) => {
              const isSelected = reminder.days.includes(idx);
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => onDaysChange(reminder.id, idx)}
                  style={[
                    s.dayButton,
                    isSelected && { backgroundColor: accent, borderColor: accent }
                  ]}
                >
                  <Text style={[
                    s.dayText,
                    { color: isSelected ? '#fff' : colors.textSecondary }
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Active glow line */}
        {reminder.enabled && (
          <LinearGradient
            colors={[accent + '00', accent + '30', accent + '00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.activeGlow}
          />
        )}
      </GlassCard>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },

  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  heroGlow: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBell: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '900', marginBottom: 6, textAlign: 'center' },
  heroSub: { fontSize: 13, textAlign: 'center', opacity: 0.7, lineHeight: 19 },

  tabsContainer: { flexGrow: 0, marginBottom: 4 },
  tabsRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabActive: { borderWidth: 1.5 },
  tabText: { fontSize: 12, fontWeight: '700' },

  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  group: { marginBottom: 16 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  groupHeaderInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupHeaderText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  groupHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  groupBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  
  accordionContent: {
    paddingTop: 4,
  },

  card: { marginBottom: 0 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeText: { fontSize: 12, fontWeight: '700' },
  activeGlow: {
    height: 2,
    borderRadius: 1,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: { fontSize: 14, fontWeight: '600' },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 17 },

  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 6,
  },
  dayButton: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
