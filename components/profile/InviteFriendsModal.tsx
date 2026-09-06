import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Share,
  Linking,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Share2,
  X,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Clock,
  ArrowRight,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../../hooks/useTheme';
import { Radius } from '../../constants';

export const ANDROID_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.fitgo.app&hl=es';

interface InviteFriendsModalProps {
  visible: boolean;
  onClose: () => void;
  onToast?: (message: string, type: 'success' | 'error') => void;
}

type PlatformType = 'android' | 'ios';

function AndroidIcon({ size = 22, color = '#10B981' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4128 13.8533 8.0772 12 8.0772s-3.5902.3356-5.1367.8725L4.841 5.4467a.4161.4161 0 10-.7197.4155l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"
      />
    </Svg>
  );
}

function AppleIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.15c.66-.83 1.11-1.98.99-3.15-1.02.05-2.22.68-2.92 1.51-.62.72-1.16 1.9-1.01 3.03 1.14.09 2.29-.56 2.94-1.39z"
      />
    </Svg>
  );
}

export function InviteFriendsModal({
  visible,
  onClose,
  onToast,
}: InviteFriendsModalProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('android');
  const [copied, setCopied] = useState(false);

  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      setSelectedPlatform('android');
      setCopied(false);
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacityAnim.setValue(0);
      slideAnim.setValue(40);
    }
  }, [visible, opacityAnim, slideAnim]);

  const handleSelectPlatform = (platform: PlatformType) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedPlatform(platform);
  };

  const handleCopyLink = async () => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      await Clipboard.setStringAsync(ANDROID_PLAY_STORE_URL);
      setCopied(true);
      onToast?.(
        t('profile.inviteLinkCopied', '¡Enlace de Android copiado al portapapeles!'),
        'success'
      );
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onToast?.(t('common.error', 'Error al copiar'), 'error');
    }
  };

  const handleShareAndroid = async () => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      const inviteMsg = t(
        'profile.inviteAndroidMessage',
        '¡Hola! Te invito a unirte a FitGO para alcanzar tus metas fitness y de nutrición. 💪🔥\n\nDescarga la app en Google Play Store:\n{{url}}',
        { url: ANDROID_PLAY_STORE_URL }
      );
      await Share.share({
        message: inviteMsg,
        url: ANDROID_PLAY_STORE_URL,
        title: 'FitGO',
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleOpenPlayStore = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Linking.openURL(ANDROID_PLAY_STORE_URL);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay || 'rgba(0,0,0,0.8)' }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: opacityAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Top subtle drag indicator */}
          <View style={[styles.dragIndicator, { backgroundColor: colors.border + '60' }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.headerIconWrapper}
              >
                <Share2 size={18} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {t('profile.inviteFriends', 'Invitar Amigos')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t('profile.inviteSubtitle', '¿Qué dispositivo tiene tu amigo?')}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Platform Selector Cards */}
          <View style={styles.platformSelectorRow}>
            {/* Android Option Card */}
            <TouchableOpacity
              style={[
                styles.platformCard,
                {
                  backgroundColor:
                    selectedPlatform === 'android'
                      ? colors.surfaceAlt + '90'
                      : colors.surfaceAlt + '30',
                  borderColor:
                    selectedPlatform === 'android' ? '#10B981' : colors.border + '40',
                },
              ]}
              onPress={() => handleSelectPlatform('android')}
              activeOpacity={0.8}
            >
              <View style={styles.platformCardHeader}>
                <View
                  style={[
                    styles.platformIconCircle,
                    {
                      backgroundColor:
                        selectedPlatform === 'android'
                          ? 'rgba(16,185,129,0.2)'
                          : colors.surfaceAlt,
                    },
                  ]}
                >
                  <AndroidIcon size={24} color={selectedPlatform === 'android' ? '#10B981' : colors.textSecondary} />
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)' },
                  ]}
                >
                  <View style={styles.greenDot} />
                  <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>
                    {t('profile.statusAvailable', 'Disponible')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.platformName, { color: colors.textPrimary }]}>
                Android
              </Text>
              <Text style={[styles.platformStore, { color: colors.textMuted }]}>
                Google Play Store
              </Text>
            </TouchableOpacity>

            {/* iOS Option Card */}
            <TouchableOpacity
              style={[
                styles.platformCard,
                {
                  backgroundColor:
                    selectedPlatform === 'ios'
                      ? colors.surfaceAlt + '90'
                      : colors.surfaceAlt + '30',
                  borderColor:
                    selectedPlatform === 'ios' ? '#8B5CF6' : colors.border + '40',
                },
              ]}
              onPress={() => handleSelectPlatform('ios')}
              activeOpacity={0.8}
            >
              <View style={styles.platformCardHeader}>
                <View
                  style={[
                    styles.platformIconCircle,
                    {
                      backgroundColor:
                        selectedPlatform === 'ios'
                          ? 'rgba(139,92,246,0.2)'
                          : colors.surfaceAlt,
                    },
                  ]}
                >
                  <AppleIcon size={22} color={selectedPlatform === 'ios' ? '#A78BFA' : colors.textSecondary} />
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)' },
                  ]}
                >
                  <Clock size={10} color="#F59E0B" style={{ marginRight: 3 }} />
                  <Text style={[styles.statusBadgeText, { color: '#F59E0B' }]}>
                    {t('profile.statusComingSoon', 'Muy pronto')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.platformName, { color: colors.textPrimary }]}>
                iOS (iPhone)
              </Text>
              <Text style={[styles.platformStore, { color: colors.textMuted }]}>
                Apple App Store
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Content Area based on Selection */}
          {selectedPlatform === 'android' ? (
            <View style={styles.detailsContainer}>
              {/* Link Box */}
              <View
                style={[
                  styles.linkBox,
                  {
                    backgroundColor: colors.surfaceAlt + '50',
                    borderColor: colors.border + '50',
                  },
                ]}
              >
                <View style={styles.linkTextWrapper}>
                  <Text style={[styles.linkLabel, { color: colors.textSecondary }]}>
                    {t('profile.playStoreLink', 'Enlace directo de Google Play:')}
                  </Text>
                  <Text
                    style={[styles.linkUrl, { color: colors.textPrimary }]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {ANDROID_PLAY_STORE_URL}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.copyMiniBtn,
                    {
                      backgroundColor: copied ? '#10B981' : colors.surface,
                      borderColor: copied ? '#10B981' : colors.border,
                    },
                  ]}
                  onPress={handleCopyLink}
                  activeOpacity={0.7}
                >
                  {copied ? (
                    <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                  ) : (
                    <Copy size={16} color={colors.textPrimary} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleShareAndroid}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtnGradient}
                >
                  <Share2 size={18} color="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>
                    {t('profile.shareInvite', 'Compartir Invitación')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: colors.surfaceAlt + '60', borderColor: colors.border + '50' },
                ]}
                onPress={handleOpenPlayStore}
                activeOpacity={0.75}
              >
                <ExternalLink size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
                  {t('profile.openInPlayStore', 'Abrir en Google Play')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.detailsContainer}>
              {/* Coming Soon Notice Card */}
              <View
                style={[
                  styles.comingSoonCard,
                  {
                    backgroundColor: colors.surfaceAlt + '40',
                    borderColor: '#8B5CF640',
                  },
                ]}
              >
                <View style={styles.comingSoonBadgeRow}>
                  <LinearGradient
                    colors={['#8B5CF6', '#6D28D9']}
                    style={styles.sparkleIconCircle}
                  >
                    <Sparkles size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.comingSoonTitle, { color: colors.textPrimary }]}>
                      {t('profile.iosComingSoonTitle', '¡FitGO para iOS llegará muy pronto!')}
                    </Text>
                    <Text style={[styles.comingSoonSubtitle, { color: '#A78BFA' }]}>
                      {t('profile.inActiveDevelopment', '🚀 En fase final de desarrollo')}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.comingSoonDesc, { color: colors.textSecondary }]}>
                  {t(
                    'profile.iosComingSoonMessage',
                    'Estamos ultimando los detalles para que la experiencia en iPhone y iPad sea espectacular. Muy pronto estará disponible para descargar directamente en la App Store.'
                  )}
                </Text>

                {/* Friendly alternative CTA */}
                <TouchableOpacity
                  style={[
                    styles.iosFallbackBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => handleSelectPlatform('android')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.iosFallbackText, { color: colors.textSecondary }]}>
                    {t('profile.shareAndroidInstead', '¿Tu amigo tiene Android? Ver enlace')}
                  </Text>
                  <ArrowRight size={14} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bottom Close Button */}
          <TouchableOpacity
            style={[styles.bottomCloseBtn, { backgroundColor: colors.surfaceAlt + '40' }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.bottomCloseText, { color: colors.textSecondary }]}>
              {t('common.close', 'Cerrar')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  dragIndicator: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  platformSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  platformCard: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
  },
  platformCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  platformName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  platformStore: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailsContainer: {
    marginBottom: 14,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 14,
  },
  linkTextWrapper: {
    flex: 1,
    marginRight: 10,
  },
  linkLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  linkUrl: {
    fontSize: 12,
    fontWeight: '600',
  },
  copyMiniBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: 10,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  comingSoonCard: {
    padding: 18,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
  },
  comingSoonBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sparkleIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  comingSoonSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  comingSoonDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    marginBottom: 14,
  },
  iosFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  iosFallbackText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomCloseBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.xl,
  },
  bottomCloseText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
