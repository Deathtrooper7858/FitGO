import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { useAdStore, MAX_AI_ENERGY, REWARD_AMOUNT } from '../store/adStore';
import { Zap, X, Play, Crown } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { AD_UNIT_IDS, AD_CONFIG } from '../constants/adConfig';
import { router } from 'expo-router';

interface AIEnergyGateProps {
  visible: boolean;
  onClose: () => void;
  onEnergyGranted: () => void;
}

export function AIEnergyGate({ visible, onClose, onEnergyGranted }: AIEnergyGateProps) {
  const colors = useTheme();
  const { aiEnergy, addEnergy } = useAdStore();
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
        addEnergy(AD_CONFIG.rewardedAdCredits);
        unsubscribeLoaded();
        unsubscribeEarned();
        onEnergyGranted();
        onClose();
      }
    );

    rewarded.load();
  };

  const handleGoPro = () => {
    onClose();
    setTimeout(() => router.push('/modals/paywall' as any), 200);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Icon */}
          <LinearGradient
            colors={['#F59E0B', '#EF4444']}
            style={styles.iconCircle}
          >
            <Zap size={32} color="#FFF" />
          </LinearGradient>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            ¡Sin Energía IA! 🔋
          </Text>

          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            Has usado tus {MAX_AI_ENERGY} usos gratis de hoy.{'\n'}
            Mira un video corto de 30 segundos para recargar{' '}
            <Text style={{ color: '#F59E0B', fontWeight: '800' }}>
              {REWARD_AMOUNT} rayos ⚡
            </Text>{' '}
            y seguir usando la IA.
          </Text>

          {/* Energy bar */}
          <View style={[styles.energyBar, { backgroundColor: colors.border }]}>
            <View style={[styles.energyFill, { width: `${(aiEnergy / AD_CONFIG.freeAICreditsPerDay) * 100}%` }]} />
          </View>
          <Text style={[styles.energyLabel, { color: colors.textMuted }]}>
            {aiEnergy}/{AD_CONFIG.freeAICreditsPerDay} rayos restantes
          </Text>

          {/* Watch Ad button */}
          <TouchableOpacity
            style={styles.watchBtn}
            onPress={handleWatchAd}
            disabled={loadingAd}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.watchBtnInner}
            >
              {loadingAd
                ? <ActivityIndicator color="#FFF" />
                : (
                  <>
                    <Play size={18} color="#FFF" />
                    <Text style={styles.watchBtnText}>Ver Video (+{AD_CONFIG.rewardedAdCredits} ⚡)</Text>
                  </>
                )
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Go Pro button */}
          <TouchableOpacity
            style={[styles.proBtn, { borderColor: colors.primary + '50', backgroundColor: colors.primary + '10' }]}
            onPress={handleGoPro}
            activeOpacity={0.85}
          >
            <Crown size={16} color={colors.primary} />
            <Text style={[styles.proBtnText, { color: colors.primary }]}>Hacerse Pro · IA Ilimitada</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ marginTop: 8 }}>
            <Text style={[styles.cancelTxt, { color: colors.textMuted }]}>
              Volver mañana
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Convenience hook to consume energy before an AI action
export function useAIEnergy() {
  const { aiEnergy, consumeEnergy, checkAndResetEnergy } = useAdStore();
  const [gateVisible, setGateVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Run once on mount (and whenever the day changes) — never during render.
  useEffect(() => {
    checkAndResetEnergy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestAIAction = (action: () => void) => {
    if (consumeEnergy(1)) {
      action();
    } else {
      setPendingAction(() => action);
      setGateVisible(true);
    }
  };

  const handleEnergyGranted = () => {
    if (pendingAction) {
      consumeEnergy(1);
      pendingAction();
      setPendingAction(null);
    }
  };

  return {
    aiEnergy,
    gateVisible,
    setGateVisible,
    requestAIAction,
    handleEnergyGranted,
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  desc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  energyBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  energyFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  energyLabel: {
    fontSize: 12,
    marginBottom: 20,
  },
  watchBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  watchBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  watchBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelTxt: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  proBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 10,
  },
  proBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
