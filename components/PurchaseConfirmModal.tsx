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
import { Crown, Shield, Zap, X, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';

interface PurchaseConfirmModalProps {
  visible: boolean;
  price: string;
  oldPrice: string;
  monthSuffix: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PurchaseConfirmModal({
  visible,
  price,
  oldPrice,
  monthSuffix,
  isLoading,
  onConfirm,
  onCancel,
}: PurchaseConfirmModalProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const PERKS = [
    { icon: Crown, label: t('paywall.confirmModal.perk1', 'Coach IA ilimitado 24/7'), color: '#8B5CF6' },
    { icon: Zap,   label: t('paywall.confirmModal.perk2', 'Acceso a todas las funciones Pro'), color: '#F59E0B' },
    { icon: Shield, label: t('paywall.confirmModal.perk3', 'Cancela cuando quieras'), color: '#10B981' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={isLoading ? undefined : onCancel}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => {}}>
          {/* Gradient glow top */}
          <LinearGradient
            colors={['#8B5CF630', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
          />

          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Close */}
          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]} onPress={onCancel} disabled={isLoading}>
            <X size={14} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Crown icon */}
          <View style={styles.crownWrapper}>
            <LinearGradient colors={['#FFB800', '#FF8C00']} style={styles.crownCircle}>
              <Crown size={28} color="#fff" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('paywall.confirmModal.title', 'Activar')} <Text style={{ color: colors.primary }}>FitGO Pro</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('paywall.confirmModal.subtitle', 'Sin compromisos · Cancela cuando quieras')}
          </Text>

          {/* Price block */}
          <View style={[styles.priceBlock, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <Text style={[styles.oldPrice, { color: colors.textMuted }]}>{oldPrice}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.primary }]}>{price}</Text>
              <Text style={[styles.suffix, { color: colors.textSecondary }]}>{monthSuffix}</Text>
            </View>
            <View style={[styles.launchBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.launchText}>🚀 {t('paywall.launchOffer', 'OFERTA LANZAMIENTO')}</Text>
            </View>
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

          {/* Security note */}
          <View style={styles.secureRow}>
            <Lock size={11} color={colors.textMuted} />
            <Text style={[styles.secureText, { color: colors.textMuted }]}>
              {t('paywall.confirmModal.secureNote', 'Pago seguro procesado por Google Play / App Store')}
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
              colors={colors.gradientPrimary}
              style={styles.ctaGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.5 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Crown size={18} color="#fff" />
                  <Text style={styles.ctaText}>{t('paywall.confirmModal.cta', 'Confirmar Suscripción')} · {price}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} disabled={isLoading} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>{t('paywall.confirmModal.cancel', 'No, continuar gratis')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 12,
    paddingBottom: 40,
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
  crownWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  crownCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  priceBlock: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  oldPrice: {
    fontSize: 15,
    textDecorationLine: 'line-through',
    fontWeight: '600',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  suffix: {
    fontSize: 15,
    fontWeight: '600',
  },
  launchBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  launchText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
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
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  secureText: {
    fontSize: 11,
    fontWeight: '500',
  },
  ctaBtn: {
    borderRadius: 50,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#8B5CF6',
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
