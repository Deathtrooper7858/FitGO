import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getLucideIcon } from '../constants/iconMap';
import { useTheme } from '../hooks/useTheme';
import { useToastStore } from '../store/toastStore';
import { AppNotification } from '../store/types';

interface StyleConfig {
  accent: string;
  gradient: readonly [string, string];
  glowColor: string;
  badgeLabel: string;
}

function resolveToastConfig(toast: AppNotification, t: (key: string, fallback: string) => string): StyleConfig {
  const isAchievement = Boolean(toast.isAchievement);
  const tier = toast.tier || 'info';
  const icon = toast.icon || '';
  const lucideIcon = toast.lucideIcon || '';
  const titleLower = (toast.title || '').toLowerCase();

  // 1. Achievements have dedicated hierarchy
  if (isAchievement) {
    if (tier === 'diamante') {
      return {
        accent: '#38BDF8',
        gradient: ['#0284C7', '#38BDF8'] as const,
        glowColor: 'rgba(56, 189, 248, 0.45)',
        badgeLabel: t('toast.diamondAchievement', '💎 LOGRO DIAMANTE'),
      };
    }
    if (tier === 'oro') {
      return {
        accent: '#FBBF24',
        gradient: ['#D97706', '#FBBF24'] as const,
        glowColor: 'rgba(251, 191, 36, 0.45)',
        badgeLabel: t('toast.goldAchievement', '🏆 LOGRO DE ORO'),
      };
    }
    if (tier === 'plata') {
      return {
        accent: '#CBD5E1',
        gradient: ['#475569', '#94A3B8'] as const,
        glowColor: 'rgba(148, 163, 184, 0.35)',
        badgeLabel: t('toast.silverAchievement', '🥈 LOGRO DE PLATA'),
      };
    }
    if (tier === 'bronce') {
      return {
        accent: '#FB923C',
        gradient: ['#C2410C', '#FB923C'] as const,
        glowColor: 'rgba(251, 146, 60, 0.4)',
        badgeLabel: t('toast.bronzeAchievement', '🥉 LOGRO DE BRONCE'),
      };
    }
    return {
      accent: '#FBBF24',
      gradient: ['#D97706', '#FBBF24'] as const,
      glowColor: 'rgba(251, 191, 36, 0.45)',
      badgeLabel: t('toast.achievementUnlocked', '🏆 LOGRO DESBLOQUEADO'),
    };
  }

  // 2. Tracking: Water / Hydration
  if (lucideIcon === 'GlassWater' || lucideIcon === 'Droplets' || titleLower.includes('agua') || titleLower.includes('water')) {
    return {
      accent: '#06B6D4',
      gradient: ['#0284C7', '#06B6D4'] as const,
      glowColor: 'rgba(6, 182, 212, 0.4)',
      badgeLabel: t('toast.waterLogged', '💧 HIDRATACIÓN'),
    };
  }

  // 3. Tracking: Steps
  if (lucideIcon === 'Footprints' || titleLower.includes('paso') || titleLower.includes('step')) {
    return {
      accent: '#10B981',
      gradient: ['#059669', '#10B981'] as const,
      glowColor: 'rgba(16, 185, 129, 0.4)',
      badgeLabel: t('toast.stepsLogged', '👟 PASOS'),
    };
  }

  // 4. Tracking: Exercise / Workout
  if (
    icon === '🔥' ||
    icon === '🏋️' ||
    lucideIcon === 'Flame' ||
    lucideIcon === 'Dumbbell' ||
    lucideIcon === 'BicepsFlexed' ||
    titleLower.includes('ejercicio') ||
    titleLower.includes('entrenamiento') ||
    titleLower.includes('workout') ||
    titleLower.includes('actividad')
  ) {
    return {
      accent: '#F97316',
      gradient: ['#EA580C', '#F97316'] as const,
      glowColor: 'rgba(249, 115, 22, 0.4)',
      badgeLabel: t('toast.exerciseLogged', '🔥 ENTRENAMIENTO'),
    };
  }

  // 5. Tracking: Sleep / Rest
  if (lucideIcon === 'Moon' || lucideIcon === 'BedDouble' || titleLower.includes('sueño') || titleLower.includes('sleep') || titleLower.includes('descanso')) {
    return {
      accent: '#818CF8',
      gradient: ['#4F46E5', '#818CF8'] as const,
      glowColor: 'rgba(129, 140, 248, 0.4)',
      badgeLabel: t('toast.sleepLogged', '🌙 DESCANSO'),
    };
  }

  // 6. Tracking: Nutrition / Food
  if (icon === '🍽️' || icon === '🥗' || titleLower.includes('comida') || titleLower.includes('meal') || titleLower.includes('desayuno') || titleLower.includes('almuerzo') || titleLower.includes('cena')) {
    return {
      accent: '#10B981',
      gradient: ['#047857', '#10B981'] as const,
      glowColor: 'rgba(16, 185, 129, 0.4)',
      badgeLabel: t('toast.mealLogged', '🥗 NUTRICIÓN'),
    };
  }

  // 7. Tracking: Body measurements
  if (lucideIcon === 'Ruler' || titleLower.includes('medida') || titleLower.includes('measurement')) {
    return {
      accent: '#A855F7',
      gradient: ['#7C3AED', '#A855F7'] as const,
      glowColor: 'rgba(168, 85, 247, 0.4)',
      badgeLabel: t('toast.measurementsLogged', '📐 MEDIDAS'),
    };
  }

  // 8. Tiers fallback
  if (tier === 'warning') {
    return {
      accent: '#F59E0B',
      gradient: ['#D97706', '#F59E0B'] as const,
      glowColor: 'rgba(245, 158, 11, 0.4)',
      badgeLabel: t('toast.attention', '⚠️ ATENCIÓN'),
    };
  }

  if (tier === 'error') {
    return {
      accent: '#EF4444',
      gradient: ['#DC2626', '#EF4444'] as const,
      glowColor: 'rgba(239, 68, 68, 0.4)',
      badgeLabel: t('toast.error', '✕ ERROR'),
    };
  }

  if (tier === 'success') {
    return {
      accent: '#10B981',
      gradient: ['#059669', '#10B981'] as const,
      glowColor: 'rgba(16, 185, 129, 0.4)',
      badgeLabel: t('toast.registrationSuccess', '✓ REGISTRO EXITOSO'),
    };
  }

  return {
    accent: '#38BDF8',
    gradient: ['#0284C7', '#38BDF8'] as const,
    glowColor: 'rgba(56, 189, 248, 0.35)',
    badgeLabel: t('toast.actionCompleted', 'ℹ️ NOTIFICACIÓN'),
  };
}

export function AppToast() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { toastQueue, showNext } = useToastStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const [currentToast, setCurrentToast] = useState<AppNotification | undefined>(toastQueue[0]);

  useEffect(() => {
    if (toastQueue.length > 0 && !currentToast) {
      setCurrentToast(toastQueue[0]);
    }
  }, [toastQueue, currentToast]);

  const closeToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -80, duration: 250, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      panY.setValue(0);
      setCurrentToast(undefined);
      showNext();
    });
  }, [fadeAnim, slideAnim, scaleAnim, panY, showNext]);

  useEffect(() => {
    if (currentToast) {
      const isAchievement = Boolean(currentToast.isAchievement);
      const tier = currentToast.tier || 'info';

      // Tailored haptics
      if (isAchievement) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (tier === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (tier === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Reset values
      panY.setValue(0);
      slideAnim.setValue(-80);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
      progressAnim.setValue(1);

      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 45, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      ]).start();

      const duration = isAchievement ? 5000 : 3600;

      // Progress bar animation
      Animated.timing(progressAnim, {
        toValue: 0,
        duration,
        useNativeDriver: false,
      }).start();

      const timer = setTimeout(() => {
        closeToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [currentToast, closeToast, fadeAnim, slideAnim, scaleAnim, progressAnim, panY]);

  // Swipe up to dismiss gesture responder
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy < -6 || Math.abs(gestureState.dy) > 8;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy < 0) {
            panY.setValue(gestureState.dy);
          } else {
            panY.setValue(gestureState.dy * 0.2);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy < -20 || gestureState.vy < -0.4) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            closeToast();
          } else {
            Animated.spring(panY, {
              toValue: 0,
              friction: 6,
              tension: 50,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [closeToast, panY]
  );

  if (!currentToast) return null;

  const config = resolveToastConfig(currentToast, t);
  const isDark = (colors as any).theme === 'dark';
  const isAchievement = Boolean(currentToast.isAchievement);

  const topInset = Math.max(insets.top + 6, 16);
  const translateY = Animated.add(slideAnim, panY);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: topInset,
          opacity: fadeAnim,
          transform: [{ translateY }, { scale: scaleAnim }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        activeOpacity={0.94}
        onPress={closeToast}
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#141824' : (colors.surface || '#FFFFFF'),
            borderColor: isAchievement ? config.accent + '75' : config.accent + '40',
            shadowColor: config.accent,
          },
        ]}
      >
        {/* Subtle ambient light gradient across the toast */}
        <LinearGradient
          colors={[config.accent + '1C', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.cardInner}>
          {/* Left Icon Squircle */}
          <LinearGradient
            colors={config.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconWrapper}
          >
            {currentToast.iconType === 'lucide' && currentToast.lucideIcon ? (
              // @ts-ignore
              React.createElement(getLucideIcon(currentToast.lucideIcon || 'Star'), {
                size: 24,
                color: '#FFFFFF',
                strokeWidth: 2.3,
              })
            ) : (
              <Text style={styles.emojiText}>{currentToast.icon || '✨'}</Text>
            )}
          </LinearGradient>

          {/* Text Content */}
          <View style={styles.content}>
            <View
              style={[
                styles.pillBadge,
                {
                  backgroundColor: config.accent + '1E',
                  borderColor: config.accent + '45',
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: config.accent }]}>
                {config.badgeLabel}
              </Text>
            </View>

            <Text
              style={[styles.title, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {currentToast.title}
            </Text>

            <Text
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {currentToast.description}
            </Text>
          </View>

          {/* Close button */}
          <TouchableOpacity
            onPress={closeToast}
            style={[
              styles.closeBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <X size={14} color={colors.textMuted || '#94A3B8'} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {/* Animated bottom progress bar indicator */}
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth,
                backgroundColor: config.accent,
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99999,
  },
  container: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 12,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emojiText: {
    fontSize: 22,
    textAlign: 'center',
    includeFontPadding: false,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    marginBottom: 3,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 1,
  },
  description: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 16.5,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  progressBarTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressBarFill: {
    height: '100%',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
});
