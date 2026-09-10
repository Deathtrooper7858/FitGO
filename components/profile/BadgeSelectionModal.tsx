import React from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { X, Check, Award, Sparkles, ChevronRight, Ban } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useTranslatedBadges } from '../../hooks/useAchievements';
import { Radius, Spacing } from '../../constants';

interface BadgeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  availableBadges: string[];
  selectedBadge?: string;
}

export function BadgeSelectionModal({
  visible,
  onClose,
  onSelect,
  availableBadges,
  selectedBadge,
}: BadgeSelectionModalProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const allBadges = useTranslatedBadges();

  const handleSelect = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelect(id);
    onClose();
  };

  const handleClose = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onClose();
  };

  const handleGoToAchievements = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onClose();
    router.push('/modals/achievements');
  };

  const hasBadges = availableBadges && availableBadges.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View
          style={[
            styles.content,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={styles.headerIconGradient}
              >
                <Award size={20} color="#FFF" strokeWidth={2.5} />
              </LinearGradient>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {t('profile.selectBadge', 'Insignia de Perfil')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {t('profile.selectBadgeSubtitle', 'Elige el distintivo que quieres destacar en tu perfil público.')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {hasBadges ? (
            <ScrollView
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {/* Option to unequip if user has badge selected */}
              {selectedBadge ? (
                <TouchableOpacity
                  style={[
                    styles.unequipItem,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: colors.border + '60',
                    },
                  ]}
                  onPress={() => handleSelect('')}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.unequipIconWrapper,
                      { backgroundColor: colors.border + '40' },
                    ]}
                  >
                    <Ban size={18} color={colors.textMuted} />
                  </View>
                  <View style={styles.badgeContent}>
                    <Text
                      style={[
                        styles.badgeLabel,
                        { color: colors.textSecondary, fontWeight: '700' },
                      ]}
                    >
                      {t('profile.noBadgeEquipped', 'Sin insignia')}
                    </Text>
                    <Text
                      style={[
                        styles.badgeDescription,
                        { color: colors.textMuted },
                      ]}
                    >
                      {t('profile.noBadgeEquippedDesc', 'Desequipar y no mostrar insignia en el perfil')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              {availableBadges.map((badgeId) => {
                const badge = allBadges[badgeId];
                if (!badge) return null;
                const isSelected = selectedBadge === badgeId;
                const primaryColor = badge.colors?.[0] || colors.primary;

                return (
                  <TouchableOpacity
                    key={badgeId}
                    style={[
                      styles.badgeItem,
                      {
                        backgroundColor: colors.surfaceAlt,
                        borderColor: isSelected ? primaryColor : colors.border + '60',
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleSelect(badgeId)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={(badge.colors as [string, string, ...string[]]) || [primaryColor, primaryColor]}
                      style={styles.badgeIcon}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.badgeIconText}>{badge.icon}</Text>
                    </LinearGradient>

                    <View style={styles.badgeContent}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.badgeLabel,
                            {
                              color: isSelected ? primaryColor : colors.textPrimary,
                              fontWeight: isSelected ? '800' : '700',
                            },
                          ]}
                        >
                          {badge.label}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.badgeDescription,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {badge.description}
                      </Text>
                    </View>

                    {isSelected ? (
                      <LinearGradient
                        colors={(badge.colors as [string, string, ...string[]]) || [primaryColor, primaryColor]}
                        style={styles.selectCheck}
                      >
                        <Check size={13} color="#FFF" strokeWidth={3.5} />
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.unselectedIndicator,
                          { borderColor: colors.border },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            /* Empty State */
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.05)']}
                style={styles.emptyIconCircle}
              >
                <Sparkles size={36} color="#F59E0B" />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {t('profile.noBadgesUnlocked', 'Aún no tienes insignias')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {t(
                  'profile.noBadgesUnlockedDesc',
                  'Completa retos y logros en FitGO para ganar insignias exclusivas y lucirlas con orgullo en tu perfil.'
                )}
              </Text>

              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={handleGoToAchievements}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  style={styles.exploreBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.exploreBtnText}>
                    {t('achievements.exploreTitle', 'Explorar Logros')}
                  </Text>
                  <ChevronRight size={16} color="#FFF" strokeWidth={2.5} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing.base,
    paddingTop: 12,
    maxHeight: '82%',
    borderWidth: 1,
    borderBottomWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerIconGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    gap: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  unequipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  unequipIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    gap: 14,
  },
  badgeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIconText: {
    fontSize: 22,
  },
  badgeContent: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeLabel: {
    fontSize: 15,
  },
  badgeDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  selectCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    opacity: 0.4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    maxWidth: 280,
  },
  exploreBtn: {
    width: '100%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  exploreBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  exploreBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
