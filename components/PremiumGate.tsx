import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Play, X, Clock } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { router } from 'expo-router';
import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../constants/adConfig';
import { useAdStore } from '../store/adStore';

interface PremiumGateProps {
  visible: boolean;
  featureId: string;
  featureName: string;
  featureIcon: string;
  onClose: () => void;
  /** Called after watching an ad successfully — navigate to the feature here */
  onAdAccessGranted: () => void;
}

export function PremiumGate({
  visible,
  featureId,
  featureName,
  featureIcon,
  onClose,
  onAdAccessGranted,
}: PremiumGateProps) {
  const colors = useTheme();
  const { grantPremiumAdAccess } = useAdStore();
  const [loadingAd, setLoadingAd] = useState(false);

  const handleWatchAd = () => {
    setLoadingAd(true);
    const rewarded = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoadingAd(false);
      rewarded.show();
    });

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        unsubscribeLoaded();
        unsubscribeEarned();
        // Persist 10-minute access in global store (survives navigation & remounts)
        grantPremiumAdAccess(featureId);
        onClose();
        onAdAccessGranted();
      }
    );

    rewarded.load();
  };

  const handleGoPremium = () => {
    onClose();
    setTimeout(() => router.push('/modals/paywall' as any), 200);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Lock icon with gradient */}
          <LinearGradient
            colors={['#7C5CFC', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Text style={styles.featureEmoji}>{featureIcon}</Text>
            <View style={styles.lockBadge}>
              <Text style={styles.lockBadgeText}>🔒</Text>
            </View>
          </LinearGradient>

          {/* Premium badge */}
          <LinearGradient
            colors={['#F59E0B', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.premiumBadge}
          >
            <Crown size={12} color="#FFF" />
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </LinearGradient>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Función Premium
          </Text>

          <Text style={[styles.featureName, { color: colors.primary }]}>
            {featureName}
          </Text>

          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            Esta función es exclusiva para usuarios Premium. Hazte Premium para acceso
            ilimitado, o mira un anuncio corto para usarla{' '}
            <Text style={{ color: '#10B981', fontWeight: '800' }}>10 minutos</Text>.
          </Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Go Premium button */}
          <TouchableOpacity
            style={styles.premiumBtn}
            onPress={handleGoPremium}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#7C5CFC', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumBtnInner}
            >
              <Crown size={20} color="#FFF" />
              <Text style={styles.premiumBtnText}>Hacerse Premium</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Watch Ad button */}
          <TouchableOpacity
            style={styles.adBtn}
            onPress={handleWatchAd}
            disabled={loadingAd}
            activeOpacity={0.85}
          >
            <View style={[styles.adBtnInner, { borderColor: colors.border, backgroundColor: colors.surfaceAlt || colors.surface }]}>
              {loadingAd ? (
                <ActivityIndicator color={colors.textSecondary} size="small" />
              ) : (
                <>
                  <Play size={16} color={colors.textSecondary} />
                  <Text style={[styles.adBtnText, { color: colors.textPrimary }]}>
                    Ver anuncio · 10 min gratis
                  </Text>
                  <View style={styles.clockBadge}>
                    <Clock size={12} color="#10B981" />
                    <Text style={styles.clockBadgeText}>10 min</Text>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ marginTop: 8 }}>
            <Text style={[styles.cancelTxt, { color: colors.textMuted }]}>
              Ahora no
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    elevation: 12,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  featureEmoji: {
    fontSize: 34,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadgeText: {
    fontSize: 13,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  premiumBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 20,
  },
  premiumBtn: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  premiumBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  premiumBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  adBtn: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  adBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  adBtnText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  clockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  clockBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  cancelTxt: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
