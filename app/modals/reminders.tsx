import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Platform, LayoutAnimation, Modal, TextInput,
  Linking, AppState, AppStateStatus, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Bell, ChevronLeft, ChevronDown, ChevronUp, Clock, Utensils, Droplets, Dumbbell,
  Zap, Trophy, Plus, X, Check, Info, Trash2, Edit3,
  Coffee, Pill, Footprints, Moon, Sword, Target, Users, Star, Medal, MessageSquare,
  LayoutGrid, Sparkles, Send
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSettingsStore, Reminder, useToastStore } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import { GlassCard } from '../../components/GlassCard';
import { GlobalBackground } from '../../components/GlobalBackground';
import {
  scheduleReminder,
  cancelReminder,
  requestNotificationPermissions,
  checkNotificationPermissions,
  testReminderNotification
} from '../../services/notifications';

// ─── Types & Category Configurations ──────────────────────────────────────────
type ReminderCategory = 'meal' | 'water' | 'workout' | 'general' | 'social';

interface CategoryConfig {
  key: ReminderCategory;
  labelKey: string;
  defaultLabel: string;
  descKey: string;
  defaultDesc: string;
  gradient: readonly [string, string, ...string[]];
  icon: (size?: number, color?: string) => React.ReactNode;
  textColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'meal',
    labelKey: 'reminders.category.meal',
    defaultLabel: 'Meals',
    descKey: 'reminders.categoryDesc.meal',
    defaultDesc: 'Stay fueled and energized.',
    gradient: ['#FF4B72', '#B91C4A'],
    icon: (size = 20, color = '#fff') => <Utensils size={size} color={color} />,
    textColor: '#FF4B72',
  },
  {
    key: 'water',
    labelKey: 'reminders.category.water',
    defaultLabel: 'Hydration',
    descKey: 'reminders.categoryDesc.water',
    defaultDesc: 'Keep your body hydrated.',
    gradient: ['#0080FF', '#0052CC'],
    icon: (size = 20, color = '#fff') => <Droplets size={size} color={color} />,
    textColor: '#0080FF',
  },
  {
    key: 'workout',
    labelKey: 'reminders.category.workout',
    defaultLabel: 'Training',
    descKey: 'reminders.categoryDesc.workout',
    defaultDesc: 'Build your goals, one workout at a time.',
    gradient: ['#10B981', '#059669'],
    icon: (size = 20, color = '#fff') => <Dumbbell size={size} color={color} />,
    textColor: '#10B981',
  },
  {
    key: 'general',
    labelKey: 'reminders.category.general',
    defaultLabel: 'General',
    descKey: 'reminders.categoryDesc.general',
    defaultDesc: 'Daily reminders for a better you.',
    gradient: ['#F59E0B', '#D97706'],
    icon: (size = 20, color = '#fff') => <Zap size={size} color={color} />,
    textColor: '#F59E0B',
  },
  {
    key: 'social',
    labelKey: 'reminders.category.social',
    defaultLabel: 'Social & Competitive',
    descKey: 'reminders.categoryDesc.social',
    defaultDesc: 'Stay connected and keep the momentum.',
    gradient: ['#8B5CF6', '#6D28D9'],
    icon: (size = 20, color = '#fff') => <Trophy size={size} color={color} />,
    textColor: '#8B5CF6',
  },
];

// ─── Default Keys Mapping ───────────────────────────────────────────────────
const DEFAULT_REMINDER_KEYS: Record<string, { titleKey: string; bodyKey: string }> = {
  '1': { titleKey: 'reminders.default.breakfast', bodyKey: 'reminders.default.breakfastBody' },
  '2': { titleKey: 'reminders.default.lunch', bodyKey: 'reminders.default.lunchBody' },
  '3': { titleKey: 'reminders.default.dinner', bodyKey: 'reminders.default.dinnerBody' },
  '6': { titleKey: 'reminders.default.snack', bodyKey: 'reminders.default.snackBody' },
  '4': { titleKey: 'reminders.default.water', bodyKey: 'reminders.default.waterBody' },
  '10': { titleKey: 'reminders.default.waterAfternoon', bodyKey: 'reminders.default.waterAfternoonBody' },
  '5': { titleKey: 'reminders.default.workout', bodyKey: 'reminders.default.workoutBody' },
  '8': { titleKey: 'reminders.default.walk', bodyKey: 'reminders.default.walkBody' },
  '11': { titleKey: 'reminders.default.cardio', bodyKey: 'reminders.default.cardioBody' },
  '7': { titleKey: 'reminders.default.vitamins', bodyKey: 'reminders.default.vitaminsBody' },
  '9': { titleKey: 'reminders.default.sleep', bodyKey: 'reminders.default.sleepBody' },
  '12': { titleKey: 'reminders.default.log', bodyKey: 'reminders.default.logBody' },
  '13': { titleKey: 'reminders.default.league', bodyKey: 'reminders.default.leagueBody' },
  '14': { titleKey: 'reminders.default.dailyChallenge', bodyKey: 'reminders.default.dailyChallengeBody' },
  '15': { titleKey: 'reminders.default.friends', bodyKey: 'reminders.default.friendsBody' },
  '16': { titleKey: 'reminders.default.streak', bodyKey: 'reminders.default.streakBody' },
  '17': { titleKey: 'reminders.default.achievements', bodyKey: 'reminders.default.achievementsBody' },
  '18': { titleKey: 'reminders.default.leaderboard', bodyKey: 'reminders.default.leaderboardBody' },
  '19': { titleKey: 'reminders.default.messages', bodyKey: 'reminders.default.messagesBody' },
};

// ─── Quick Suggestion Chips for Add Modal ────────────────────────────────────
const QUICK_SUGGESTIONS: Record<ReminderCategory, { title: string; body: string }[]> = {
  meal: [
    { title: 'Protein Shake', body: 'Time to fuel up with your daily protein shake!' },
    { title: 'Pre-Workout Snack', body: 'Grab some carbs for extra workout energy!' },
    { title: 'Healthy Snack', body: 'Nourish your body with some fruits or nuts.' },
    { title: 'Evening Tea', body: 'Time to wind down with a warm herbal tea.' },
  ],
  water: [
    { title: 'Morning Glass of Water', body: 'Kickstart your metabolism with 500ml of water!' },
    { title: 'Hydration Check', body: 'Drink a glass of water to keep your body optimized.' },
    { title: 'Electrolytes', body: 'Replenish your mineral levels with hydration.' },
  ],
  workout: [
    { title: 'Creatine Intake', body: 'Take 5g of creatine for optimal muscle recovery.' },
    { title: 'Gym Time', body: 'Hit the weights and conquer your fitness goal today!' },
    { title: 'Post-Workout Stretch', body: 'Dedicate 10 minutes to mobility and flexibility.' },
    { title: 'Evening Walk', body: 'Step outside to reach your daily step target.' },
  ],
  general: [
    { title: 'Multivitamins & Omega-3', body: 'Take your vitamins and daily supplements.' },
    { title: 'Mindful Meditation', body: 'Take 5 minutes to breathe, relax and center yourself.' },
    { title: 'Wind Down', body: 'Dim the screens and prepare your mind for deep sleep.' },
    { title: 'Log Daily Food', body: 'Log your meals in FitGO to track your progress.' },
  ],
  social: [
    { title: 'Check League Battle', body: 'See where you stand and defend your tier position!' },
    { title: 'Daily Challenge', body: 'Complete today’s mission before it refreshes!' },
    { title: 'Cheer a Friend', body: 'Send motivation to a friend on FitGO Social!' },
  ],
};

// ─── Icon & Color Helpers ────────────────────────────────────────────────────
const getReminderIcon = (type: string, title?: string) => {
  const lt = (title || '').toLowerCase();
  if (lt.includes('snack') || lt.includes('merienda') || lt.includes('batido') || lt.includes('shake')) {
    return <Coffee size={18} color="#FF6B6B" />;
  }
  if (lt.includes('vitamin') || lt.includes('suplemento') || lt.includes('creatina') || lt.includes('creatine')) {
    return <Pill size={18} color="#A78BFA" />;
  }
  if (lt.includes('walk') || lt.includes('caminata') || lt.includes('pasos') || lt.includes('step')) {
    return <Footprints size={18} color="#10B981" />;
  }
  if (lt.includes('sleep') || lt.includes('dormir') || lt.includes('descanso')) {
    return <Moon size={18} color="#6366F1" />;
  }
  if (lt.includes('cardio')) {
    return <Zap size={18} color="#10B981" />;
  }
  if (lt.includes('liga') || lt.includes('league')) {
    return <Sword size={18} color="#8B5CF6" />;
  }
  if (lt.includes('reto') || lt.includes('challenge')) {
    return <Target size={18} color="#8B5CF6" />;
  }
  if (lt.includes('amigos') || lt.includes('friends')) {
    return <Users size={18} color="#8B5CF6" />;
  }
  if (lt.includes('racha') || lt.includes('streak')) {
    return <Star size={18} color="#F59E0B" />;
  }
  if (lt.includes('logros') || lt.includes('achieve')) {
    return <Medal size={18} color="#8B5CF6" />;
  }
  if (lt.includes('leaderboard') || lt.includes('ranking') || lt.includes('clasificación')) {
    return <Trophy size={18} color="#F59E0B" />;
  }
  if (lt.includes('mensaje') || lt.includes('message')) {
    return <MessageSquare size={18} color="#8B5CF6" />;
  }

  switch (type) {
    case 'meal':    return <Utensils size={18} color="#FF4B72" />;
    case 'water':   return <Droplets size={18} color="#0080FF" />;
    case 'workout': return <Dumbbell size={18} color="#10B981" />;
    case 'social':  return <Trophy size={18} color="#8B5CF6" />;
    default:        return <Zap size={18} color="#F59E0B" />;
  }
};

const getCategoryAccent = (type: string): string => {
  switch (type) {
    case 'meal':    return '#FF4B72';
    case 'water':   return '#0080FF';
    case 'workout': return '#10B981';
    case 'social':  return '#8B5CF6';
    default:        return '#F59E0B';
  }
};

// ─── Main Screen Component ───────────────────────────────────────────────────
export default function RemindersModal() {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<ReminderCategory | 'all'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Time Picker State
  const [showTimePickerForId, setShowTimePickerForId] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [modalCategory, setModalCategory] = useState<ReminderCategory>('meal');
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');
  const [modalTime, setModalTime] = useState('08:00');
  const [modalDays, setModalDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [showModalTimePicker, setShowModalTimePicker] = useState(false);

  // Verify permissions on mount and when app regains focus
  const verifyPermissions = useCallback(async () => {
    const granted = await checkNotificationPermissions();
    setHasPermission(granted);
  }, []);

  useEffect(() => {
    verifyPermissions();
    requestNotificationPermissions().then((res) => {
      if (res !== null) setHasPermission(res);
    });

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        verifyPermissions();
      }
    });

    return () => subscription.remove();
  }, [verifyPermissions]);

  // Expand / Collapse accordions
  const toggleAccordion = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle Reminder Enable / Disable
  const handleToggleReminder = async (id: string) => {
    const target = reminders.find((r) => r.id === id);
    if (!target) return;

    const willEnable = !target.enabled;

    // If enabling, ensure permission is granted
    if (willEnable && hasPermission === false) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          t('reminders.permissionInfo', 'Permite las notificaciones'),
          t('reminders.permissionDenied', 'Activa las notificaciones en los ajustes del sistema para recibir alertas.'),
          [
            { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
            { text: t('common.settings', 'Ajustes'), onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      setHasPermission(true);
    }

    // Cancel previous notification if any
    if (target.notificationId) {
      await cancelReminder(target.notificationId);
    }

    let newNotificationId: string | undefined = undefined;
    if (willEnable) {
      newNotificationId = await scheduleReminder({
        ...target,
        enabled: true,
      });
    }

    updateReminder(id, {
      enabled: willEnable,
      notificationId: newNotificationId,
    });
  };

  // Change Day of Week
  const handleToggleDay = async (id: string, dayIndex: number) => {
    const target = reminders.find((r) => r.id === id);
    if (!target) return;

    const newDays = target.days.includes(dayIndex)
      ? target.days.filter((d) => d !== dayIndex)
      : [...target.days, dayIndex].sort((a, b) => a - b);

    // Cancel old notification
    if (target.notificationId) {
      await cancelReminder(target.notificationId);
    }

    let newNotificationId: string | undefined = undefined;
    if (target.enabled) {
      newNotificationId = await scheduleReminder({
        ...target,
        days: newDays,
      });
    }

    updateReminder(id, {
      days: newDays,
      notificationId: newNotificationId,
    });
  };

  // Change Time for existing reminder
  const handleTimePickerChange = async (event: any, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate && showTimePickerForId) {
      const hh = selectedDate.getHours().toString().padStart(2, '0');
      const mm = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${hh}:${mm}`;

      const target = reminders.find((r) => r.id === showTimePickerForId);
      if (target) {
        if (target.notificationId) {
          await cancelReminder(target.notificationId);
        }

        let newNotificationId: string | undefined = undefined;
        if (target.enabled) {
          newNotificationId = await scheduleReminder({
            ...target,
            time: newTime,
          });
        }

        updateReminder(showTimePickerForId, {
          time: newTime,
          notificationId: newNotificationId,
        });

        useToastStore.getState().showToast({
          title: t('reminders.time', 'Hora actualizada'),
          text: `${target.title} → ${newTime}`,
          type: 'success',
        });
      }
    }
    setShowTimePickerForId(null);
  };

  // Test Reminder Notification
  const handleTestReminder = async (reminder: Reminder) => {
    await testReminderNotification(reminder);
    useToastStore.getState().showToast({
      title: t('reminders.testSent', '¡Notificación de prueba enviada!'),
      text: t('reminders.testSentDesc', 'Revisa tu barra de notificaciones.'),
      type: 'info',
    });
  };

  // Delete Reminder with Confirmation
  const handleDeleteReminder = (reminder: Reminder) => {
    Alert.alert(
      t('reminders.deleteReminder', 'Eliminar Recordatorio'),
      t('reminders.deleteConfirm', '¿Estás seguro de que deseas eliminar este recordatorio?'),
      [
        { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
        {
          text: t('common.delete', 'Eliminar'),
          style: 'destructive',
          onPress: async () => {
            if (reminder.notificationId) {
              await cancelReminder(reminder.notificationId);
            }
            deleteReminder(reminder.id);
            useToastStore.getState().showToast({
              title: t('common.success', 'Eliminado'),
              text: reminder.title,
              type: 'info',
            });
          },
        },
      ]
    );
  };

  // Open Create Modal
  const openCreateModal = (category?: ReminderCategory) => {
    setEditingReminder(null);
    setModalCategory(category || (activeTab === 'all' ? 'meal' : activeTab));
    setModalTitle('');
    setModalBody('');
    setModalTime('08:00');
    setModalDays([0, 1, 2, 3, 4, 5, 6]);
    setIsModalVisible(true);
  };

  // Open Edit Modal
  const openEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setModalCategory((reminder.type as ReminderCategory) || 'meal');
    setModalTitle(reminder.title);
    setModalBody(reminder.body || '');
    setModalTime(reminder.time);
    setModalDays(reminder.days && reminder.days.length > 0 ? reminder.days : [0, 1, 2, 3, 4, 5, 6]);
    setIsModalVisible(true);
  };

  // Save Modal (Create or Edit)
  const handleSaveModal = async () => {
    const trimmedTitle = modalTitle.trim();
    if (!trimmedTitle) {
      Alert.alert(t('common.error', 'Error'), t('reminders.titleRequired', 'Por favor ingresa un título'));
      return;
    }

    if (editingReminder) {
      // Update existing
      if (editingReminder.notificationId) {
        await cancelReminder(editingReminder.notificationId);
      }

      let newNotificationId: string | undefined = undefined;
      if (editingReminder.enabled) {
        newNotificationId = await scheduleReminder({
          ...editingReminder,
          title: trimmedTitle,
          body: modalBody.trim() || trimmedTitle,
          time: modalTime,
          days: modalDays,
          type: modalCategory,
        });
      }

      updateReminder(editingReminder.id, {
        title: trimmedTitle,
        body: modalBody.trim() || trimmedTitle,
        time: modalTime,
        days: modalDays,
        type: modalCategory,
        notificationId: newNotificationId,
      });

      useToastStore.getState().showToast({
        title: t('common.success', 'Guardado'),
        text: trimmedTitle,
        type: 'success',
      });
    } else {
      // Create new custom reminder
      const newReminderItem: Reminder = {
        id: `custom_${Date.now()}`,
        title: trimmedTitle,
        body: modalBody.trim() || trimmedTitle,
        time: modalTime,
        enabled: true,
        days: modalDays,
        type: modalCategory,
      };

      const notifId = await scheduleReminder(newReminderItem);
      newReminderItem.notificationId = notifId;

      addReminder(newReminderItem);

      // Auto-expand the created category
      setExpandedGroups((prev) => ({ ...prev, [modalCategory]: true }));

      useToastStore.getState().showToast({
        title: t('reminders.newReminder', 'Nuevo recordatorio creado'),
        text: `${trimmedTitle} (${modalTime})`,
        type: 'success',
      });
    }

    setIsModalVisible(false);
  };

  // Groups and counts
  const categoryGroups = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const items = reminders.filter((r) => r.type === cat.key);
      const activeCount = items.filter((r) => r.enabled).length;
      return {
        ...cat,
        items,
        activeCount,
        totalCount: items.length,
      };
    });
  }, [reminders]);

  const displayedGroups = useMemo(() => {
    if (activeTab === 'all') return categoryGroups;
    return categoryGroups.filter((g) => g.key === activeTab);
  }, [categoryGroups, activeTab]);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <GlobalBackground />

      {/* ── Top Header ─────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[s.backBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>
          {t('profile.reminders', 'Recordatorios')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <View style={s.hero}>
        <View style={s.heroHalo}>
          <LinearGradient
            colors={['#7C3AED', '#4F46E5']}
            style={s.heroCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Bell size={26} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={[s.heroTitle, { color: colors.textPrimary }]}>
          {t('reminders.stayOnTrack', 'Stay on Track')}
        </Text>
        <Text style={[s.heroSub, { color: colors.textSecondary }]}>
          {t('reminders.subtitle', 'Set reminders for meals, hydration & workouts.')}
        </Text>
      </View>

      {/* ── Filter Tabs Row ───────────────────────────────────────── */}
      <View style={s.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsContent}
        >
          {/* "All" Tab */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab('all');
            }}
            style={[
              s.tabPill,
              activeTab === 'all' && s.tabPillActive,
              { borderColor: activeTab === 'all' ? '#7C3AED' : 'rgba(255,255,255,0.08)' }
            ]}
          >
            {activeTab === 'all' && (
              <LinearGradient
                colors={['#7C3AED', '#6D28D9']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <LayoutGrid size={15} color={activeTab === 'all' ? '#fff' : '#A1A1AA'} />
            <Text style={[s.tabPillText, { color: activeTab === 'all' ? '#fff' : '#A1A1AA' }]}>
              {t('reminders.category.all', 'All')}
            </Text>
          </TouchableOpacity>

          {/* Individual Category Tabs */}
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.8}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setActiveTab(cat.key);
                  setExpandedGroups((prev) => ({ ...prev, [cat.key]: true }));
                }}
                style={[
                  s.tabPill,
                  isActive && s.tabPillActive,
                  { borderColor: isActive ? cat.textColor : 'rgba(255,255,255,0.08)' }
                ]}
              >
                {isActive && (
                  <LinearGradient
                    colors={cat.gradient}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                {cat.icon(15, isActive ? '#fff' : '#A1A1AA')}
                <Text style={[s.tabPillText, { color: isActive ? '#fff' : '#A1A1AA' }]}>
                  {t(cat.labelKey, cat.defaultLabel)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Accordion List ────────────────────────────────────────── */}
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.scrollContainer, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {displayedGroups.map((group) => {
          const isExpanded = activeTab !== 'all' ? true : !!expandedGroups[group.key];

          return (
            <View key={group.key} style={s.accordionGroup}>
              {/* Category Header Card */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => {
                  if (activeTab === 'all') {
                    toggleAccordion(group.key);
                  }
                }}
              >
                <LinearGradient
                  colors={group.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.accordionHeader}
                >
                  <View style={s.accordionLeft}>
                    <View style={s.accordionIconBadge}>
                      {group.icon(22, '#fff')}
                    </View>
                    <View style={s.accordionTitles}>
                      <Text style={s.accordionTitleText}>
                        {t(group.labelKey, group.defaultLabel)}
                      </Text>
                      <Text style={s.accordionSubText} numberOfLines={1}>
                        {t(group.descKey, group.defaultDesc)}
                      </Text>
                    </View>
                  </View>

                  <View style={s.accordionRight}>
                    <View style={s.countBadge}>
                      <Text style={s.countBadgeText}>
                        {`${group.activeCount}/${group.totalCount}`}
                      </Text>
                    </View>
                    {activeTab === 'all' && (
                      isExpanded ? (
                        <ChevronUp size={20} color="#fff" />
                      ) : (
                        <ChevronDown size={20} color="#fff" />
                      )
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Collapsed Items Inside Category */}
              {isExpanded && (
                <View style={s.accordionBody}>
                  {group.items.length === 0 ? (
                    <View style={s.categoryEmptyState}>
                      <Text style={[s.categoryEmptyText, { color: colors.textMuted }]}>
                        {t('reminders.noRemindersYet', 'No reminders in this category yet.')}
                      </Text>
                    </View>
                  ) : (
                    group.items.map((reminder) => {
                      const keys = DEFAULT_REMINDER_KEYS[reminder.id];
                      const displayTitle = keys ? t(keys.titleKey, reminder.title) : reminder.title;
                      const displayBody = keys ? t(keys.bodyKey, reminder.body) : reminder.body;
                      const accent = getCategoryAccent(reminder.type);

                      return (
                        <ReminderItemCard
                          key={reminder.id}
                          reminder={reminder}
                          displayTitle={displayTitle}
                          displayBody={displayBody}
                          accent={accent}
                          colors={colors}
                          onToggle={handleToggleReminder}
                          onDayToggle={handleToggleDay}
                          onTimePress={(id) => setShowTimePickerForId(id)}
                          onTestPress={handleTestReminder}
                          onEditPress={openEditModal}
                          onDeletePress={handleDeleteReminder}
                        />
                      );
                    })
                  )}

                  {/* Inline Add Button within category */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => openCreateModal(group.key)}
                    style={[s.inlineAddBtn, { borderColor: `${group.textColor}40`, backgroundColor: `${group.textColor}10` }]}
                  >
                    <Plus size={16} color={group.textColor} />
                    <Text style={[s.inlineAddBtnText, { color: group.textColor }]}>
                      {t('reminders.addSpecific', `+ Add to ${t(group.labelKey, group.defaultLabel)}`)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {/* ── System Settings Info Link ────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => Linking.openSettings()}
          style={s.settingsInfoContainer}
        >
          {hasPermission ? (
            <View style={s.statusDotActive} />
          ) : (
            <Info size={15} color={colors.textMuted} />
          )}
          <Text style={[s.settingsInfoText, { color: colors.textMuted }]}>
            {hasPermission
              ? t('reminders.permissionGranted', 'Notificaciones activas en los ajustes del sistema.')
              : t('reminders.permissionDenied', 'Allow notifications in system settings.')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Bottom Floating "+ Add reminder" Button ──────────────── */}
      <View style={[s.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => openCreateModal()}
          style={s.addReminderBtn}
        >
          <LinearGradient
            colors={['#7C3AED', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.addReminderBtnGradient}
          >
            <Plus size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.addReminderBtnText}>
              {t('reminders.addReminder', '+ Add reminder')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Native Time Picker (for inline card changes) ─────────── */}
      {showTimePickerForId && (
        <DateTimePicker
          value={(() => {
            const item = reminders.find((r) => r.id === showTimePickerForId);
            const [h, m] = (item?.time || '08:00').split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
          })()}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimePickerChange}
        />
      )}

      {/* ── Modal for Adding & Editing Reminders ───────────────────── */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={s.modalHeader}>
              <Text style={[s.modalHeaderTitle, { color: colors.textPrimary }]}>
                {editingReminder
                  ? t('reminders.editReminder', 'Editar Recordatorio')
                  : t('reminders.newReminder', 'Nuevo Recordatorio')}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={s.modalCloseBtn}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category Selector Chips */}
              <Text style={[s.inputLabel, { color: colors.textSecondary }]}>
                {t('reminders.chooseCategory', 'Categoría')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.modalCategoryRow}>
                {CATEGORIES.map((cat) => {
                  const isSel = modalCategory === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setModalCategory(cat.key)}
                      style={[
                        s.modalCategoryChip,
                        isSel && { borderColor: cat.textColor, backgroundColor: `${cat.textColor}25` }
                      ]}
                    >
                      {cat.icon(14, isSel ? cat.textColor : '#9CA3AF')}
                      <Text style={[s.modalCategoryChipText, { color: isSel ? cat.textColor : '#9CA3AF' }]}>
                        {t(cat.labelKey, cat.defaultLabel)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Title Input */}
              <Text style={[s.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                {t('reminders.title', 'Título')}
              </Text>
              <TextInput
                value={modalTitle}
                onChangeText={setModalTitle}
                placeholder={t('reminders.titlePlaceholder', 'ej., Creatina, Batido de Proteína...')}
                placeholderTextColor={colors.textMuted}
                style={[s.modalInput, { color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.12)' }]}
              />

              {/* Quick Suggestions Chips */}
              <View style={s.suggestionsContainer}>
                <View style={s.suggestionsHeader}>
                  <Sparkles size={12} color="#A78BFA" />
                  <Text style={[s.suggestionsTitle, { color: colors.textMuted }]}>
                    {t('reminders.quickSuggestions', 'Sugerencias rápidas')}
                  </Text>
                </View>
                <View style={s.suggestionsPills}>
                  {QUICK_SUGGESTIONS[modalCategory].map((sug, i) => (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.7}
                      onPress={() => {
                        setModalTitle(sug.title);
                        setModalBody(sug.body);
                      }}
                      style={s.suggestionPill}
                    >
                      <Text style={s.suggestionPillText}>+ {sug.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description Input */}
              <Text style={[s.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                {t('reminders.notes', 'Mensaje / Descripción (opcional)')}
              </Text>
              <TextInput
                value={modalBody}
                onChangeText={setModalBody}
                placeholder={t('reminders.notesPlaceholder', 'Mensaje del recordatorio...')}
                placeholderTextColor={colors.textMuted}
                style={[s.modalInput, { color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.12)' }]}
              />

              {/* Time Picker Trigger */}
              <Text style={[s.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                {t('reminders.time', 'Hora')}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowModalTimePicker(true)}
                style={[s.modalTimePickerBtn, { borderColor: 'rgba(255,255,255,0.12)' }]}
              >
                <Clock size={18} color="#A78BFA" />
                <Text style={s.modalTimePickerText}>{modalTime}</Text>
              </TouchableOpacity>

              {showModalTimePicker && (
                <DateTimePicker
                  value={(() => {
                    const [h, m] = modalTime.split(':').map(Number);
                    const d = new Date();
                    d.setHours(h, m, 0, 0);
                    return d;
                  })()}
                  mode="time"
                  is24Hour
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowModalTimePicker(false);
                    if (event.type === 'set' && date) {
                      const hh = date.getHours().toString().padStart(2, '0');
                      const mm = date.getMinutes().toString().padStart(2, '0');
                      setModalTime(`${hh}:${mm}`);
                    }
                  }}
                />
              )}

              {/* Days Selector */}
              <Text style={[s.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                {t('reminders.repeat', 'Repetir Días')}
              </Text>

              {/* Quick Repeat Presets */}
              <View style={s.quickRepeatRow}>
                <TouchableOpacity
                  onPress={() => setModalDays([0, 1, 2, 3, 4, 5, 6])}
                  style={[s.quickRepeatPill, modalDays.length === 7 && s.quickRepeatPillActive]}
                >
                  <Text style={[s.quickRepeatText, modalDays.length === 7 && s.quickRepeatTextActive]}>
                    {t('reminders.allDays', 'Todos')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalDays([1, 2, 3, 4, 5])}
                  style={[
                    s.quickRepeatPill,
                    modalDays.length === 5 && !modalDays.includes(0) && !modalDays.includes(6) && s.quickRepeatPillActive
                  ]}
                >
                  <Text style={[
                    s.quickRepeatText,
                    modalDays.length === 5 && !modalDays.includes(0) && !modalDays.includes(6) && s.quickRepeatTextActive
                  ]}>
                    {t('reminders.weekdays', 'L-V')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalDays([0, 6])}
                  style={[
                    s.quickRepeatPill,
                    modalDays.length === 2 && modalDays.includes(0) && modalDays.includes(6) && s.quickRepeatPillActive
                  ]}
                >
                  <Text style={[
                    s.quickRepeatText,
                    modalDays.length === 2 && modalDays.includes(0) && modalDays.includes(6) && s.quickRepeatTextActive
                  ]}>
                    {t('reminders.weekends', 'Fines')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Individual Day Buttons */}
              <View style={s.modalDaysRow}>
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((dayLabel, idx) => {
                  const isSelected = modalDays.includes(idx);
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setModalDays((prev) =>
                          prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort((a, b) => a - b)
                        );
                      }}
                      style={[
                        s.modalDayBtn,
                        isSelected && s.modalDayBtnSelected
                      ]}
                    >
                      <Text style={[s.modalDayBtnText, isSelected && s.modalDayBtnTextSelected]}>
                        {dayLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Save & Cancel Buttons */}
              <View style={s.modalActions}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleSaveModal}
                  style={s.modalSaveBtn}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.modalSaveBtnGradient}
                  >
                    <Check size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={s.modalSaveBtnText}>
                      {t('reminders.save', 'Guardar recordatorio')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  style={s.modalCancelBtn}
                >
                  <Text style={[s.modalCancelBtnText, { color: colors.textSecondary }]}>
                    {t('common.cancel', 'Cancelar')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Reminder Item Card ──────────────────────────────────────────────────────
interface ReminderItemCardProps {
  reminder: Reminder;
  displayTitle: string;
  displayBody: string;
  accent: string;
  colors: any;
  onToggle: (id: string) => void;
  onDayToggle: (id: string, dayIndex: number) => void;
  onTimePress: (id: string) => void;
  onTestPress: (reminder: Reminder) => void;
  onEditPress: (reminder: Reminder) => void;
  onDeletePress: (reminder: Reminder) => void;
}

function ReminderItemCard({
  reminder,
  displayTitle,
  displayBody,
  accent,
  colors,
  onToggle,
  onDayToggle,
  onTimePress,
  onTestPress,
  onEditPress,
  onDeletePress,
}: ReminderItemCardProps) {
  const isCustom = reminder.id.startsWith('custom_');
  const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return (
    <View style={[s.itemCard, { opacity: reminder.enabled ? 1 : 0.65 }]}>
      <GlassCard
        noPadding
        accentColor={accent}
        showStripe={reminder.enabled}
        style={s.itemCardInner}
      >
        <View style={s.itemTopRow}>
          {/* Left Icon */}
          <View style={[s.itemIconCircle, { backgroundColor: `${accent}20` }]}>
            {getReminderIcon(reminder.type, reminder.title)}
          </View>

          {/* Title & Body Info */}
          <View style={s.itemTextContainer}>
            <View style={s.itemTitleRow}>
              <Text style={[s.itemTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {displayTitle}
              </Text>
              {isCustom && (
                <View style={s.customTag}>
                  <Text style={s.customTagText}>Custom</Text>
                </View>
              )}
            </View>

            {displayBody ? (
              <Text style={[s.itemBody, { color: colors.textSecondary }]} numberOfLines={1}>
                {displayBody}
              </Text>
            ) : null}

            {/* Time Chip */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onTimePress(reminder.id)}
              style={[s.timeChip, { backgroundColor: `${accent}15`, borderColor: `${accent}35` }]}
            >
              <Clock size={11} color={accent} />
              <Text style={[s.timeChipText, { color: accent }]}>{reminder.time}</Text>
            </TouchableOpacity>
          </View>

          {/* Right Action Icons & Toggle */}
          <View style={s.itemRightActions}>
            <View style={s.actionIconsRow}>
              {/* Test Button */}
              <TouchableOpacity
                onPress={() => onTestPress(reminder)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={s.iconActionBtn}
              >
                <Send size={13} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Edit Button */}
              <TouchableOpacity
                onPress={() => onEditPress(reminder)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={s.iconActionBtn}
              >
                <Edit3 size={13} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Delete Button (if custom) */}
              {isCustom && (
                <TouchableOpacity
                  onPress={() => onDeletePress(reminder)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={s.iconActionBtn}
                >
                  <Trash2 size={13} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            {/* Switch */}
            <Switch
              value={reminder.enabled}
              onValueChange={() => onToggle(reminder.id)}
              trackColor={{ false: '#3F3F46', true: accent }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : reminder.enabled ? '#fff' : '#A1A1AA'}
            />
          </View>
        </View>

        {/* Repetition Days Row */}
        {reminder.enabled && (
          <View style={s.itemDaysRow}>
            {dayLabels.map((dayLabel, dayIdx) => {
              const isSelected = reminder.days.includes(dayIdx);
              return (
                <TouchableOpacity
                  key={dayIdx}
                  activeOpacity={0.7}
                  onPress={() => onDayToggle(reminder.id, dayIdx)}
                  style={[
                    s.dayPillBtn,
                    isSelected && { backgroundColor: accent, borderColor: accent }
                  ]}
                >
                  <Text style={[s.dayPillText, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                    {dayLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </GlassCard>
    </View>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  /* Hero Section */
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 16,
  },
  heroHalo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  heroCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
  },

  /* Filter Tabs Row */
  tabsWrapper: {
    marginBottom: 12,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabPillActive: {
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Accordion List */
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  accordionGroup: {
    marginBottom: 12,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accordionIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accordionTitles: {
    flex: 1,
  },
  accordionTitleText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  accordionSubText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    fontWeight: '500',
  },
  accordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },

  accordionBody: {
    marginTop: 8,
    gap: 8,
  },
  categoryEmptyState: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  categoryEmptyText: {
    fontSize: 13,
    fontWeight: '500',
  },

  /* Item Cards */
  itemCard: {
    borderRadius: 16,
  },
  itemCardInner: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
  },
  itemIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  customTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  customTagText: {
    color: '#A78BFA',
    fontSize: 9,
    fontWeight: '800',
  },
  itemBody: {
    fontSize: 11.5,
    marginBottom: 4,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  timeChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  itemRightActions: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
  },
  actionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    padding: 4,
  },

  itemDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingBottom: 11,
    gap: 5,
  },
  dayPillBtn: {
    flex: 1,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* Inline Add Button inside category */
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 4,
  },
  inlineAddBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* System Settings Notice */
  settingsInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  settingsInfoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  statusDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },

  /* Bottom Floating Action Bar */
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  addReminderBtn: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  addReminderBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 26,
  },
  addReminderBtnText: {
    color: '#fff',
    fontSize: 15.5,
    fontWeight: '800',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalCategoryRow: {
    gap: 8,
  },
  modalCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  modalCategoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },

  /* Suggestions */
  suggestionsContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  suggestionsPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  suggestionPillText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
  },

  /* Modal Time Picker */
  modalTimePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  modalTimePickerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  /* Modal Days */
  quickRepeatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quickRepeatPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  quickRepeatPillActive: {
    borderColor: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
  },
  quickRepeatText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  quickRepeatTextActive: {
    color: '#fff',
  },
  modalDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 16,
  },
  modalDayBtn: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDayBtnSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  modalDayBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalDayBtnTextSelected: {
    color: '#fff',
  },

  /* Modal Actions */
  modalActions: {
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
  },
  modalSaveBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalSaveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  modalSaveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
