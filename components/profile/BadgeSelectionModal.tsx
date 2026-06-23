import React from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslatedBadges } from '../../hooks/useAchievements';

interface BadgeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  availableBadges: string[];
  selectedBadge?: string;
}

export function BadgeSelectionModal({
  visible, onClose, onSelect, availableBadges, selectedBadge
}: BadgeSelectionModalProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const allBadges = useTranslatedBadges();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {t('profile.selectBadge', 'Selecciona tu Badge')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {t('profile.selectBadgeSubtitle', 'Elige el distintivo que quieres destacar en tu perfil público.')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {availableBadges.map(badgeId => {
              const badge = allBadges[badgeId];
              if (!badge) return null;
              const isSelected = selectedBadge === badgeId;
              return (
                <TouchableOpacity
                  key={badgeId}
                  style={[
                    styles.badgeItem,
                    {
                      backgroundColor: isSelected ? badge.colors[0] + '12' : colors.surfaceAlt,
                      borderColor: isSelected ? badge.colors[0] : colors.border,
                      shadowColor: isSelected ? badge.colors[0] : 'transparent',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isSelected ? 0.15 : 0,
                      shadowRadius: 8,
                      elevation: 0,
                    }
                  ]}
                  onPress={() => { onSelect(badgeId); onClose(); }}
                >
                  <LinearGradient
                    colors={badge.colors as [string, string, ...string[]]}
                    style={[styles.badgeIcon, { shadowColor: badge.colors[0] }]}
                  >
                    <Text style={styles.badgeIconText}>{badge.icon}</Text>
                  </LinearGradient>

                  <View style={styles.badgeContent}>
                    <Text style={[
                      styles.badgeLabel,
                      {
                        color: isSelected ? badge.colors[0] : colors.textPrimary,
                        fontWeight: isSelected ? '800' : '700'
                      }
                    ]}>
                      {t(`badges.${badgeId}.label`, badge.label)}
                    </Text>
                    <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>
                      {t(`badges.${badgeId}.description`, badge.description)}
                    </Text>
                  </View>

                  {isSelected && (
                    <LinearGradient
                      colors={badge.colors as [string, string, ...string[]]}
                      style={styles.selectCheck}
                    >
                      <Check size={10} color="#fff" strokeWidth={4} />
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  content: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingTop: 12, maxHeight: '80%', borderWidth: 1, borderBottomWidth: 0 },
  handle: { width: 48, height: 5, borderRadius: 2.5, alignSelf: 'center', marginBottom: 20, opacity: 0.6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerTextContainer: { flex: 1, paddingRight: 16 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  list: { gap: 12, paddingBottom: 40 },
  badgeItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, gap: 16 },
  badgeIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
  badgeIconText: { fontSize: 22 },
  badgeContent: { flex: 1, gap: 2 },
  badgeLabel: { fontSize: 16 },
  badgeDescription: { fontSize: 12, lineHeight: 16, opacity: 0.8 },
  selectCheck: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
});
