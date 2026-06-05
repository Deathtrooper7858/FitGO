import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { useToastStore } from '../store/toastStore';
import { Achievement } from '../hooks/useAchievements';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as LucideIcons from 'lucide-react-native';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getTierColor(tier: string) {
  switch (tier) {
    case 'diamante': return '#38BDF8';
    case 'oro': return '#FBBF24';
    case 'plata': return '#9CA3AF';
    default: return '#D97706';
  }
}

export function AchievementToast() {
  const colors = useTheme();
  const { t } = useTranslation();
  const { toastQueue, showNext } = useToastStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const [currentToast, setCurrentToast] = useState<Achievement | undefined>(toastQueue[0]);

  useEffect(() => {
    if (toastQueue.length > 0 && !currentToast) {
      setCurrentToast(toastQueue[0]);
    }
  }, [toastQueue, currentToast]);

  useEffect(() => {
    if (currentToast) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        closeToast();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [currentToast]);

  const closeToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -50, duration: 300, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setCurrentToast(undefined);
      showNext();
    });
  };

  if (!currentToast) return null;

  const tierColor = getTierColor(currentToast.tier);
  const isHolo = currentToast.tier === 'oro' || currentToast.tier === 'diamante';
  const gradColors = isHolo
    ? [tierColor, tierColor === '#FBBF24' ? '#EA580C' : '#4F46E5'] as const
    : ['transparent', 'transparent'] as const;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.surface,
          borderColor: isHolo ? tierColor + '50' : colors.border,
          shadowColor: isHolo ? tierColor : '#000',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={gradColors}
        style={[styles.iconWrapper, { backgroundColor: isHolo ? 'transparent' : colors.surfaceAlt }]}
      >
        {currentToast.iconType === 'lucide' && currentToast.lucideIcon ? (
          // @ts-ignore
          React.createElement(LucideIcons[currentToast.lucideIcon] || LucideIcons.Star, {
            size: 28, color: isHolo ? '#FFF' : tierColor, strokeWidth: 2.5
          })
        ) : (
          <Text style={{ fontSize: 28 }}>{currentToast.icon}</Text>
        )}
      </LinearGradient>
      
      <View style={styles.content}>
        <Text style={[styles.headerText, { color: tierColor }]}>{t('achievements.newAchievement', '¡NUEVO LOGRO DESBLOQUEADO!')}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{currentToast.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>{currentToast.description}</Text>
      </View>

      <TouchableOpacity onPress={closeToast} style={styles.closeBtn} activeOpacity={0.7}>
        <X size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // under the status bar
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.9,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 8,
    marginLeft: 8,
  }
});
