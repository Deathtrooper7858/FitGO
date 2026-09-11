import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, X, Sparkles, Zap, Layers } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { AppExperienceMode } from '../../store/types';

interface AppModeModalProps {
  visible: boolean;
  currentMode: AppExperienceMode;
  onSelect?: (mode: AppExperienceMode) => void;
  onSelectMode?: (mode: AppExperienceMode) => void;
  onClose: () => void;
}

export function AppModeModal({
  visible,
  currentMode,
  onSelect,
  onSelectMode,
  onClose,
}: AppModeModalProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const handleSelectMode = (mode: AppExperienceMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onSelect) onSelect(mode);
    if (onSelectMode) onSelectMode(mode);
    onClose();
  };

  const OPTIONS = [
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
      icon: <Sparkles size={22} color="#10B981" />,
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
      icon: <Zap size={22} color="#8B5CF6" />,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable
          style={[
            s.box,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border + '60',
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Ambient Glow */}
          <LinearGradient
            colors={['#8B5CF620', 'transparent']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={s.iconWrap}>
                <Layers size={18} color="#FFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.title, { color: colors.textPrimary }]}>
                  {t('profile.appModeTitle', 'Versión de la Aplicación')}
                </Text>
                <Text style={[s.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {t('profile.appModeSubtitle', 'Cambia entre modo simplificado y avanzado')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[s.closeBtn, { backgroundColor: colors.surfaceAlt }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Mode Options List */}
          <ScrollView
            style={s.scrollView}
            contentContainerStyle={s.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {OPTIONS.map((item) => {
              const isSelected = currentMode === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.82}
                  style={[
                    s.card,
                    {
                      backgroundColor: isSelected ? colors.surfaceAlt : colors.surfaceAlt + '45',
                      borderColor: isSelected ? item.accent : colors.border + '50',
                      borderWidth: isSelected ? 2 : 1,
                    },
                    isSelected && {
                      shadowColor: item.accent,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 10,
                      elevation: 4,
                    },
                  ]}
                  onPress={() => handleSelectMode(item.id)}
                >
                  {isSelected && (
                    <LinearGradient
                      colors={[item.accent + '15', 'transparent']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}

                  {/* Header within card */}
                  <View style={s.cardTopRow}>
                    <View
                      style={[
                        s.badgePill,
                        {
                          backgroundColor: item.badgeBg,
                          borderColor: item.badgeBorder,
                        },
                      ]}
                    >
                      <Text style={[s.badgeText, { color: item.badgeColor }]}>
                        {item.badge}
                      </Text>
                    </View>

                    {isSelected ? (
                      <View style={[s.checkCircle, { backgroundColor: item.accent }]}>
                        <Check size={13} color="#FFF" strokeWidth={3} />
                      </View>
                    ) : (
                      <View style={[s.uncheckCircle, { borderColor: colors.border + '80' }]} />
                    )}
                  </View>

                  {/* Title & Icon */}
                  <View style={s.titleRow}>
                    <View
                      style={[
                        s.cardIconWrap,
                        {
                          backgroundColor: colors.background,
                          borderColor: isSelected ? item.accent + '70' : colors.border + '50',
                        },
                      ]}
                    >
                      {item.icon}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          s.cardTitle,
                          { color: colors.textPrimary },
                          isSelected && { color: item.accent },
                        ]}
                      >
                        {item.title}
                      </Text>
                    </View>
                  </View>

                  {/* Quote Box */}
                  <View
                    style={[
                      s.quoteBox,
                      {
                        backgroundColor: colors.background + '80',
                        borderColor: isSelected ? item.accent + '35' : colors.border + '30',
                      },
                    ]}
                  >
                    <Text style={[s.quoteText, { color: colors.textPrimary }]}>
                      “{item.quote}”
                    </Text>
                  </View>

                  {/* Bullets */}
                  <View style={s.bulletsList}>
                    {item.bullets.map((bullet, bIdx) => (
                      <View key={bIdx} style={s.bulletRow}>
                        <View
                          style={[
                            s.bulletDot,
                            { backgroundColor: isSelected ? item.accent : colors.textMuted },
                          ]}
                        />
                        <Text
                          style={[
                            s.bulletText,
                            { color: colors.textSecondary },
                            isSelected && { color: colors.textPrimary },
                          ]}
                        >
                          {bullet}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  box: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    maxHeight: 460,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 4,
  },
  card: {
    borderRadius: 20,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  quoteBox: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 16,
  },
  bulletsList: {
    gap: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  bulletText: {
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },
});

