import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap, Crown, Check } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, Radius } from '../../constants';
import { GlassCard } from '../GlassCard';

interface SubscriptionSectionProps {
  isPro: boolean;
  onManage: () => void;
  onCancel: () => void;
  onVerify: () => void;
}

export function SubscriptionSection({ isPro, onManage, onCancel, onVerify }: SubscriptionSectionProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const PRO_FEATURES = [
    t('subscription.feature1', 'Plan personalizado de comidas'),
    t('subscription.feature2', 'Coach IA ilimitado'),
    t('subscription.feature3', 'Colores premium y personalización'),
    t('subscription.feature4', 'Exportación de datos (Excel)'),
    t('subscription.feature5', 'Seguimiento detallado de métricas'),
  ];

  return (
    <GlassCard
      noPadding
      showStripe
      accentColor={isPro ? '#F59E0B' : colors.primary}
      style={{ marginHorizontal: Spacing.base, marginBottom: Spacing.base }}
    >
      <LinearGradient
        colors={isPro ? ['rgba(245,158,11,0.08)', 'transparent'] : ['rgba(124,92,252,0.08)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: Spacing.base, paddingBottom: Spacing.md }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <LinearGradient
            colors={isPro ? ['#F59E0B', '#D97706'] : ['#7C5CFC', '#4338CA']}
            style={{ width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}
          >
            {isPro ? <Crown size={22} color="#fff" /> : <Sparkles size={22} color="#fff" />}
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
              {isPro ? t('subscription.proActive', 'FitGO Pro Activo') : t('subscription.upgradeToPro', 'Actualiza a FitGO Pro')}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              {isPro ? t('subscription.enjoyAll', 'Disfruta de todas las funciones premium') : t('subscription.unlockAll', 'Desbloquea el máximo potencial')}
            </Text>
          </View>
        </View>

        {/* Feature list */}
        <View style={{ gap: 8, marginBottom: 16 }}>
          {PRO_FEATURES.map((feature, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: isPro ? '#F59E0B' : '#7C5CFC', justifyContent: 'center', alignItems: 'center' }}>
                <Check size={12} color="#fff" strokeWidth={3} />
              </View>
              <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '500' }}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {isPro ? (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{ flex: 1, borderRadius: Radius.lg, overflow: 'hidden' }}
                onPress={onManage}
              >
                <LinearGradient colors={['#F59E0B', '#D97706']} style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Zap size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{t('subscription.manage', 'Gestionar')}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{ flex: 1, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#EF4444', paddingVertical: 12, alignItems: 'center' }}
                onPress={onCancel}
              >
                <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>{t('subscription.cancel', 'Cancelar')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{ flex: 1, borderRadius: Radius.lg, overflow: 'hidden' }}
                onPress={onManage}
              >
                <LinearGradient colors={['#7C5CFC', '#4338CA']} style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{t('subscription.upgrade', 'Mejorar')}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{ flex: 1, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, alignItems: 'center' }}
                onPress={onVerify}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 14 }}>{t('subscription.verify', 'Verificar')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>
    </GlassCard>
  );
}
