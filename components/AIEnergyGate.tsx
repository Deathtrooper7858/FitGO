import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator,
  Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import {
  useAdStore,
  MAX_AI_PHOTO_ENERGY,
  MAX_AI_TEXT_ENERGY,
  MAX_ADS_PER_DAY,
} from '../store/adStore';
import { Zap, X, Play, Crown, Camera, FileText, Lock, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { AD_UNIT_IDS } from '../constants/adConfig';
import { router } from 'expo-router';

export type AIEnergyMode = 'photo' | 'text';

interface AIEnergyGateProps {
  visible: boolean;
  onClose: () => void;
  onEnergyGranted: () => void;
  mode?: AIEnergyMode;
}

let rewardedAdInstance: RewardedAd | null = null;
function getOrCreateRewardedAd(): RewardedAd {
  if (!rewardedAdInstance) {
    rewardedAdInstance = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, {
      requestNonPersonalizedAdsOnly: true,
    });
    rewardedAdInstance.load();
  }
  return rewardedAdInstance;
}

export function AIEnergyGate({ visible, onClose, onEnergyGranted, mode = 'photo' }: AIEnergyGateProps) {
  const colors = useTheme();
  const {
    aiPhotoEnergy, aiTextEnergy,
    photoAdsWatchedToday, textAdsWatchedToday,
    watchAdForPhotoCredit, watchAdForTextCredit,
    remainingAdsToday,
  } = useAdStore();

  const [loadingAd, setLoadingAd] = useState(false);
  const [earnedCount, setEarnedCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isPhoto = mode === 'photo';
  const currentEnergy = isPhoto ? aiPhotoEnergy : aiTextEnergy;
  const maxEnergy = isPhoto ? MAX_AI_PHOTO_ENERGY : MAX_AI_TEXT_ENERGY;
  const adsWatched = isPhoto ? photoAdsWatchedToday : textAdsWatchedToday;
  const adsRemaining = MAX_ADS_PER_DAY - adsWatched;
  const canWatchAd = adsRemaining > 0;

  // Pulse animation for the watch button
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    if (canWatchAd && !loadingAd) loop.start();
    return () => loop.stop();
  }, [visible, canWatchAd, loadingAd]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setEarnedCount(0);
      setShowSuccess(false);
      setLoadingAd(false);
    }
  }, [visible]);

  const handleWatchAd = () => {
    if (!canWatchAd || loadingAd) return;
    setLoadingAd(true);

    const ad = getOrCreateRewardedAd();

    const showAd = () => {
      const earnedUnsub = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earnedUnsub();
        closedUnsub();
        rewardedAdInstance = null;

        // Grant exactly 1 credit
        const granted = isPhoto ? watchAdForPhotoCredit() : watchAdForTextCredit();
        setLoadingAd(false);

        if (granted) {
          setEarnedCount(prev => prev + 1);
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            // If user still has 0 energy but can watch more, stay open
            const newEnergy = isPhoto
              ? useAdStore.getState().aiPhotoEnergy
              : useAdStore.getState().aiTextEnergy;
            if (newEnergy > 0) {
              onEnergyGranted();
              onClose();
            }
          }, 1400);
        }

        // Pre-load next ad
        rewardedAdInstance = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, {
          requestNonPersonalizedAdsOnly: true,
        });
        rewardedAdInstance.load();
      });

      const closedUnsub = ad.addAdEventListener(AdEventType.CLOSED, () => {
        earnedUnsub();
        closedUnsub();
        rewardedAdInstance = null;
        setLoadingAd(false);
        // Pre-load next
        rewardedAdInstance = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, {
          requestNonPersonalizedAdsOnly: true,
        });
        rewardedAdInstance.load();
      });

      ad.show();
    };

    if (ad.loaded) {
      showAd();
    } else {
      const loadedUnsub = ad.addAdEventListener(AdEventType.LOADED, () => {
        loadedUnsub();
        showAd();
      });
      const errUnsub = ad.addAdEventListener(AdEventType.ERROR, () => {
        errUnsub();
        setLoadingAd(false);
        rewardedAdInstance = null;
      });
      if (!ad.loaded) ad.load();
    }
  };

  const handleGoPro = () => {
    onClose();
    setTimeout(() => router.push('/modals/paywall' as any), 200);
  };

  // --- Render helpers ---

  const renderEnergyDots = () =>
    Array.from({ length: maxEnergy }).map((_, i) => (
      <View
        key={i}
        style={[styles.energyDot, i < currentEnergy ? styles.energyDotFull : styles.energyDotEmpty]}
      />
    ));

  const renderAdSlots = () =>
    Array.from({ length: MAX_ADS_PER_DAY }).map((_, i) => {
      const watched = i < adsWatched;
      const isNext = i === adsWatched && canWatchAd;
      return (
        <View
          key={i}
          style={[
            styles.adSlot,
            watched && styles.adSlotWatched,
            isNext && styles.adSlotNext,
            !watched && !isNext && styles.adSlotLocked,
          ]}
        >
          {watched ? (
            <CheckCircle size={14} color="#10B981" />
          ) : isNext ? (
            <Play size={14} color="#FFF" fill="#FFF" />
          ) : (
            <Lock size={11} color="rgba(255,255,255,0.3)" />
          )}
        </View>
      );
    });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Header gradient icon */}
          <LinearGradient
            colors={canWatchAd ? ['#F59E0B', '#EF4444'] : ['#64748B', '#475569']}
            style={styles.iconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Zap size={34} color="#FFF" fill="#FFF" />
          </LinearGradient>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {canWatchAd ? '¡Sin Energía IA! 🔋' : 'Límite de anuncios alcanzado'}
          </Text>

          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            {canWatchAd ? (
              <>
                Tienes{' '}
                <Text style={{ color: '#F59E0B', fontWeight: '800' }}>
                  {adsRemaining} anuncio{adsRemaining !== 1 ? 's' : ''}
                </Text>{' '}
                disponibles hoy.{'\n'}Cada video te da{' '}
                <Text style={{ color: '#10B981', fontWeight: '800' }}>+1 crédito ⚡</Text>
              </>
            ) : (
              <>
                Viste los{' '}
                <Text style={{ color: '#F59E0B', fontWeight: '800' }}>
                  {MAX_ADS_PER_DAY} anuncios
                </Text>{' '}
                permitidos hoy para {isPhoto ? 'foto' : 'texto'}.{'\n'}
                Vuelve mañana o hazte Pro.
              </>
            )}
          </Text>

          {/* Energy dots */}
          <View style={styles.dotsRow}>{renderEnergyDots()}</View>
          <Text style={[styles.energyLabel, { color: colors.textMuted }]}>
            {currentEnergy}/{maxEnergy} créditos {isPhoto ? '📸 foto' : '✍️ texto'} restantes
          </Text>

          {/* Ad slots */}
          <View style={styles.adSlotsSection}>
            <Text style={[styles.adSlotsTitle, { color: colors.textMuted }]}>
              Anuncios vistos hoy ({adsWatched}/{MAX_ADS_PER_DAY})
            </Text>
            <View style={styles.adSlotsRow}>{renderAdSlots()}</View>
          </View>

          {/* Mode pills */}
          <View style={styles.modePills}>
            <View style={[
              styles.modePill,
              isPhoto && { backgroundColor: '#F59E0B18', borderColor: '#F59E0B50' }
            ]}>
              <Camera size={12} color={isPhoto ? '#F59E0B' : colors.textMuted} />
              <Text style={{ color: isPhoto ? '#F59E0B' : colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                {aiPhotoEnergy}/{MAX_AI_PHOTO_ENERGY} foto
              </Text>
            </View>
            <View style={[
              styles.modePill,
              !isPhoto && { backgroundColor: '#7C5CFC18', borderColor: '#7C5CFC50' }
            ]}>
              <FileText size={12} color={!isPhoto ? '#7C5CFC' : colors.textMuted} />
              <Text style={{ color: !isPhoto ? '#7C5CFC' : colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                {aiTextEnergy}/{MAX_AI_TEXT_ENERGY} texto
              </Text>
            </View>
          </View>

          {/* Watch Ad button (or disabled state) */}
          {canWatchAd ? (
            <Animated.View style={[styles.watchBtn, { transform: [{ scale: loadingAd ? 1 : pulseAnim }] }]}>
              <TouchableOpacity
                onPress={handleWatchAd}
                disabled={loadingAd}
                activeOpacity={0.85}
                style={{ width: '100%', borderRadius: 18, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={showSuccess ? ['#10B981', '#059669'] : ['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.watchBtnInner}
                >
                  {loadingAd ? (
                    <ActivityIndicator color="#FFF" />
                  ) : showSuccess ? (
                    <>
                      <CheckCircle size={18} color="#FFF" />
                      <Text style={styles.watchBtnText}>¡+1 crédito ganado! ⚡</Text>
                    </>
                  ) : (
                    <>
                      <Play size={18} color="#FFF" fill="#FFF" />
                      <Text style={styles.watchBtnText}>
                        Ver anuncio · +1 ⚡ ({adsRemaining} restante{adsRemaining !== 1 ? 's' : ''})
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={[styles.watchBtnDisabled, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Lock size={16} color={colors.textMuted} />
              <Text style={[styles.watchBtnDisabledText, { color: colors.textMuted }]}>
                Límite de hoy alcanzado · Vuelve mañana
              </Text>
            </View>
          )}

          {/* Go Pro button */}
          <TouchableOpacity
            style={[styles.proBtn, { borderColor: colors.primary + '50', backgroundColor: colors.primary + '10' }]}
            onPress={handleGoPro}
            activeOpacity={0.85}
          >
            <Crown size={16} color={colors.primary} />
            <Text style={[styles.proBtnText, { color: colors.primary }]}>Hacerse Pro · IA Ilimitada</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={[styles.cancelTxt, { color: colors.textMuted }]}>
              {canWatchAd ? 'Cancelar' : 'Cerrar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── useAIEnergy hook ───────────────────────────────────────────────────────
export function useAIEnergy() {
  const {
    aiPhotoEnergy,
    aiTextEnergy,
    consumePhotoEnergy,
    consumeTextEnergy,
    checkAndResetEnergy,
  } = useAdStore();
  const [gateVisible, setGateVisible] = useState(false);
  const [gateMode, setGateMode] = useState<AIEnergyMode>('photo');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    checkAndResetEnergy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestAIAction = (action: () => void, mode: AIEnergyMode = 'photo') => {
    const consume = mode === 'photo' ? consumePhotoEnergy : consumeTextEnergy;
    if (consume()) {
      action();
    } else {
      setGateMode(mode);
      setPendingAction(() => action);
      setGateVisible(true);
    }
  };

  const handleEnergyGranted = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  return {
    aiPhotoEnergy,
    aiTextEnergy,
    aiEnergy: aiPhotoEnergy, // legacy
    gateVisible,
    gateMode,
    setGateVisible,
    setGateMode,
    setPendingAction,
    requestAIAction,
    handleEnergyGranted,
  };
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 44,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  desc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 6,
  },
  energyDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
  },
  energyDotFull: {
    backgroundColor: '#F59E0B',
  },
  energyDotEmpty: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  energyLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  // Ad slots
  adSlotsSection: {
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },
  adSlotsTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  adSlotsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  adSlot: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  adSlotWatched: {
    backgroundColor: '#10B98120',
    borderColor: '#10B98150',
  },
  adSlotNext: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  adSlotLocked: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  // Mode pills
  modePills: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  // Watch Ad button
  watchBtn: {
    width: '100%',
    marginBottom: 12,
  },
  watchBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
  },
  watchBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  watchBtnDisabled: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  watchBtnDisabledText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Pro button
  proBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  proBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  cancelTxt: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
