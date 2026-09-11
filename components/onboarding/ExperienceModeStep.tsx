import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Zap, Check, Compass } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

export function ExperienceModeStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const selectedMode = data.appMode || 'simple';

  const MODES = [
    {
      id: 'simple' as const,
      badge: t('onboarding.simpleBadge', '🌱 Recomendada para empezar'),
      badgeColor: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeBorder: 'rgba(16, 185, 129, 0.35)',
      title: t('onboarding.simpleTitle', 'Versión Simplificada'),
      quote: t(
        'onboarding.simpleQuote',
        'Perfecta para un público novato que se quiere adentrar en este increíble mundo.'
      ),
      accent: '#10B981',
      secondaryAccent: '#06B6D4',
      bullets: [
        t('onboarding.simpleBullet1', 'Interfaz limpia, ágil y sin abrumarte con números.'),
        t('onboarding.simpleBullet2', 'Acceso a todas las funciones y pestañas de la aplicación.'),
        t('onboarding.simpleBullet3', 'Foco principal en calorías, tus 3 macros, agua y pasos.'),
        t('onboarding.simpleBullet4', 'Herramientas avanzadas organizadas para no saturar tu pantalla.'),
      ],
      icon: <Sparkles size={26} color="#10B981" />,
    },
    {
      id: 'advanced' as const,
      badge: t('onboarding.advancedBadge', '⚡ Experiencia Completa'),
      badgeColor: '#8B5CF6',
      badgeBg: 'rgba(139, 92, 246, 0.15)',
      badgeBorder: 'rgba(139, 92, 246, 0.35)',
      title: t('onboarding.advancedTitle', 'Versión Avanzada'),
      quote: t(
        'onboarding.advancedQuote',
        'La opción con todo lo que necesitas si ya tienes un poco de experiencia en este mundo y con la aplicación.'
      ),
      accent: '#8B5CF6',
      secondaryAccent: '#EC4899',
      bullets: [
        t('onboarding.advancedBullet1', 'Todas las herramientas de FitGO al 100% de potencia.'),
        t('onboarding.advancedBullet2', 'Todas las pestañas y widgets siempre desplegados.'),
        t('onboarding.advancedBullet3', 'Micronutrientes, ayuno intermitente y radar de balance.'),
        t('onboarding.advancedBullet4', 'Simetría muscular, mapas de calor y personalización total.'),
      ],
      icon: <Zap size={26} color="#8B5CF6" />,
    },
  ];

  const handleSelect = (mode: 'simple' | 'advanced') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange({ appMode: mode });
  };

  return (
    <View style={step.container}>
      {/* Header Section */}
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Compass size={44} color="#8B5CF6" />}
          color="#8B5CF6"
          glowColor="#7C3AED"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.experienceModeTitle', '¿Cómo deseas tu experiencia?')}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t(
            'onboarding.experienceModeSub',
            'Personaliza la app según tu nivel. Puedes cambiar entre ambas opciones en cualquier momento desde tu Perfil.'
          )}
        </Text>
      </View>

      {/* Cards List */}
      <View style={styles.cardsList}>
        {MODES.map((item, index) => {
          const isActive = selectedMode === item.id;
          return (
            <Animated.View
              key={item.id}
              entering={FadeInUp.delay(120 + index * 100).springify().damping(18)}
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isActive ? item.accent : colors.border + '80',
                  },
                  isActive && {
                    shadowColor: item.accent,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 8,
                  },
                ]}
                onPress={() => handleSelect(item.id)}
                activeOpacity={0.85}
              >
                {isActive && (
                  <LinearGradient
                    colors={[item.accent + '1C', item.secondaryAccent + '08']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}

                {/* Top Badge & Selector Header */}
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.badgePill,
                      {
                        backgroundColor: item.badgeBg,
                        borderColor: item.badgeBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: item.badgeColor }]}>
                      {item.badge}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isActive ? item.accent : colors.border,
                        backgroundColor: isActive ? item.accent : 'transparent',
                      },
                    ]}
                  >
                    {isActive && <Check size={14} color="#FFF" strokeWidth={3} />}
                  </View>
                </View>

                {/* Title & Icon */}
                <View style={styles.titleRow}>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: colors.background,
                        borderColor: isActive ? item.accent + '70' : colors.border + '60',
                      },
                    ]}
                  >
                    {item.icon}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: colors.textPrimary },
                        isActive && { color: item.accent },
                      ]}
                    >
                      {item.title}
                    </Text>
                  </View>
                </View>

                {/* Quote Box */}
                <View
                  style={[
                    styles.quoteBox,
                    {
                      backgroundColor: colors.background + '80',
                      borderColor: isActive ? item.accent + '35' : colors.border + '35',
                    },
                  ]}
                >
                  <Text style={[styles.quoteText, { color: colors.textPrimary }]}>
                    “{item.quote}”
                  </Text>
                </View>

                {/* Feature Bullets */}
                <View style={styles.bulletsList}>
                  {item.bullets.map((bullet, bIdx) => (
                    <View key={bIdx} style={styles.bulletRow}>
                      <View
                        style={[
                          styles.bulletDot,
                          { backgroundColor: isActive ? item.accent : colors.textMuted },
                        ]}
                      />
                      <Text
                        style={[
                          styles.bulletText,
                          { color: colors.textSecondary },
                          isActive && { color: colors.textPrimary },
                        ]}
                      >
                        {bullet}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Bottom helper tip */}
      <View style={[styles.tipBanner, { backgroundColor: colors.surfaceAlt + '40', borderColor: colors.border + '30' }]}>
        <Text style={[styles.tipText, { color: colors.textMuted }]}>
          {t(
            'onboarding.switchAnytimeNotice',
            '💡 Podrás alternar libremente entre la versión Simplificada y la Avanzada cuando desees desde tu Perfil.'
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardsList: {
    gap: 16,
    paddingBottom: 8,
  },
  card: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  quoteBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 18,
  },
  bulletsList: {
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
  },
  bulletText: {
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
  },
  tipBanner: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  tipText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
