import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../constants';
import { getLucideIcon } from '../../constants/iconMap';

function getTierColorFromTier(tier: string) {
  switch (tier) {
    case 'diamante': return '#38BDF8';
    case 'oro': return '#FBBF24';
    case 'plata': return '#9CA3AF';
    default: return '#D97706';
  }
}

const VitrinaTrofeoItem = React.memo(function VitrinaTrofeoItem({
  id, achievements, colors
}: { id: string; achievements: any[]; colors: any }) {
  const ach = React.useMemo(() => achievements.find((a: any) => a.id === id), [achievements, id]);
  if (!ach) return null;
  const isHolo = ach.tier === 'oro' || ach.tier === 'diamante';
  const tierColor = getTierColorFromTier(ach.tier);
  const gradColors: [string, string] = isHolo
    ? [tierColor, tierColor === '#FBBF24' ? '#EA580C' : '#4F46E5']
    : ['transparent', 'transparent'];

  return (
    <View style={{
      flex: 1, backgroundColor: isHolo ? tierColor + '10' : 'transparent', padding: Spacing.sm, borderRadius: 16, alignItems: 'center',
      borderWidth: 1, borderColor: isHolo ? tierColor + '50' : 'transparent'
    }}>
      <LinearGradient
        colors={gradColors}
        style={{ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: isHolo ? 'transparent' : colors.surfaceAlt, marginBottom: 8 }}
      >
        {ach.iconType === 'lucide' && ach.lucideIcon ? (
          React.createElement(getLucideIcon(ach.lucideIcon), {
            size: 24, color: isHolo ? '#FFF' : tierColor, strokeWidth: 2.5
          })
        ) : (
          <Text style={{ fontSize: 24 }}>{ach.icon}</Text>
        )}
      </LinearGradient>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }} numberOfLines={1}>{ach.title}</Text>
      <Text style={{ fontSize: 9, color: tierColor, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 }}>{ach.tier}</Text>
    </View>
  );
});

interface VitrinaTrofeosProps {
  pinnedAchievements?: string[];
  achievements: any[];
  onEdit: () => void;
  premiumColor?: string;
  isPro?: boolean;
}

export const VitrinaTrofeos = React.memo(function VitrinaTrofeos({
  pinnedAchievements, achievements, onEdit, premiumColor, isPro
}: VitrinaTrofeosProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  if (!pinnedAchievements || pinnedAchievements.length === 0) return null;

  const safeColor = premiumColor === 'admin_glow' ? '#00F0FF' : (premiumColor && premiumColor.startsWith('#') ? premiumColor : null);
  const isPremiumCustom = isPro && safeColor;
  const accentColor = (isPremiumCustom && safeColor) ? safeColor : colors.primary;

  return (
    <View
      style={
        isPremiumCustom
          ? {
              marginHorizontal: Spacing.base,
              marginTop: Spacing.md,
              marginBottom: Spacing.sm,
              borderRadius: 20,
              shadowColor: safeColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 12,
            }
          : { marginHorizontal: Spacing.base, marginTop: Spacing.md, marginBottom: Spacing.sm }
      }
    >
      <View
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: isPremiumCustom ? 1.5 : 1,
          borderColor: isPremiumCustom ? safeColor + '80' : colors.border,
        }}
      >
        {isPremiumCustom ? (
          <LinearGradient
            colors={[safeColor + '25', safeColor + '10', 'transparent'] as [string, string, string]}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface, borderRadius: 20 }]} />
        )}
        {isPremiumCustom && (
          <LinearGradient
            colors={[safeColor + 'DD', safeColor + '00'] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }}
          />
        )}
        <View style={{ padding: Spacing.base }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>🏆 {t('achievements.trophyShowcase', 'Vitrina de Trofeos')}</Text>
            <TouchableOpacity onPress={onEdit}>
              <Text style={{ fontSize: 12, color: accentColor, fontWeight: '700' }}>{t('common.edit', 'Editar')} ›</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {pinnedAchievements.map(id => (
              <VitrinaTrofeoItem key={id} id={id} achievements={achievements} colors={colors} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
});
