import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Clock, Gift, X, AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';

interface TrialConfirmModalProps {
  visible: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TrialConfirmModal({
  visible,
  isLoading,
  onConfirm,
  onCancel,
}: TrialConfirmModalProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const PERKS = [
    { icon: Gift, label: t('paywall.trial.confirmPerk1', 'Full access to all Pro features'), color: '#10B981' },
    { icon: Clock, label: t('paywall.trial.confirmPerk2', 'Expires automatically after 3 days'), color: '#F59E0B' },
    { icon: AlertTriangle, label: t('paywall.trial.confirmPerk3', 'One-time offer · Not renewable'), color: '#EF4444' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={isLoading ? undefined : onCancel}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {}}
        >
          {/* Top gradient glow */}
          <LinearGradient
            colors={['#10B98130', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
          />

          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Close */}
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={onCancel}
            disabled={isLoading}
          >
            <X size={14} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconWrapper}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.iconCircle}>
              <Zap size={28} color="#fff" fill="#fff" />
            </LinearGradient>
          </View>

          {/* ONE-TIME badge */}
          <View style={[styles.onceBadge, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]}>
            <AlertTriangle size={11} color="#EF4444" />
            <Text style={[styles.onceBadgeText, { color: '#EF4444' }]}>
              {t('paywall.trial.badge', 'ONE-TIME OFFER')}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('paywall.trial.confirmTitle', 'Start 3-Day Free Trial')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('paywall.trial.confirmSubtitle', 'Access everything. No credit card required.')}
          </Text>

          {/* Price block */}
          <View style={[styles.priceBlock, { backgroundColor: '#10B98112', borderColor: '#10B98130' }]}>
            <Text style={[styles.freeBig, { color: '#10B981' }]}>
              {t('common.free', 'FREE')}
            </Text>
            <Text style={[styles.freeSub, { color: colors.textMuted }]}>
              {t('paywall.trial.expires', 'Expires in 3 days · Not renewable')}
            </Text>
          </View>

          {/* Perks */}
          <View style={styles.perks}>
            {PERKS.map(({ icon: Icon, label, color }, i) => (
              <View key={i} style={styles.perk}>
                <View style={[styles.perkIcon, { backgroundColor: color + '20' }]}>
                  <Icon size={14} color={color} />
                </View>
                <Text style={[styles.perkLabel, { color: colors.textSecondary }]}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Warning note */}
          <View style={[styles.noteRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.noteText, { color: colors.textMuted }]}>
              {t('paywall.trial.confirmNote', 'No payment required. Trial revokes automatically.')}
            </Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={onConfirm}
            disabled={isLoading}
            activeOpacity={0.85}
            style={[styles.ctaBtn, isLoading && { opacity: 0.6 }]}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.ctaGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.5 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Zap size={18} color="#fff" fill="#fff" />
                  <Text style={styles.ctaText}>
                    {t('paywall.trial.confirmCta', 'Activate Free Trial')}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} disabled={isLoading} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>
              {t('paywall.trial.confirmCancel', 'No, thanks')}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 12,
    paddingBottom: 44,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.5,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  onceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  onceBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '500',
  },
  priceBlock: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  freeBig: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
  },
  freeSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  perks: {
    gap: 10,
    marginBottom: 16,
  },
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  noteRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  ctaBtn: {
    borderRadius: 50,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    marginBottom: 12,
  },
  ctaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
