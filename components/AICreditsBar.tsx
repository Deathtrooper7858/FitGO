import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useAICredits } from '../hooks/useAICredits';

interface AICreditsBarProps {
  /** If true, shows a compact single-line version */
  compact?: boolean;
}

export const AICreditsBar = React.memo(function AICreditsBar({ compact = false }: AICreditsBarProps) {
  const colors = useTheme();
  const { creditsLeft, hasCredits, isPro, maxCredits } = useAICredits();

  // Pro users don't need to see the credits bar
  if (isPro) {
    return (
      <View style={[s.proChip, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
        <Zap size={12} color={colors.primary} fill={colors.primary} />
        <Text style={[s.proText, { color: colors.primary }]}>IA Ilimitada</Text>
      </View>
    );
  }

  const zapIcons = Array.from({ length: maxCredits }, (_, i) => i < creditsLeft);

  if (compact) {
    return (
      <TouchableOpacity
        style={[s.compactContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => !hasCredits && router.push('/modals/no-credits' as any)}
        activeOpacity={hasCredits ? 1 : 0.8}
      >
        <Zap size={14} color={hasCredits ? colors.primary : colors.textMuted} fill={hasCredits ? colors.primary : 'transparent'} />
        <Text style={[s.compactText, { color: hasCredits ? colors.textPrimary : colors.textMuted }]}>
          {creditsLeft}/{maxCredits} IA hoy
        </Text>
        {!hasCredits && (
          <Text style={[s.rechargeText, { color: colors.primary }]}>Recargar ⚡</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={s.row}>
        <Text style={[s.label, { color: colors.textSecondary }]}>Energía IA de hoy</Text>
        <Text style={[s.count, { color: hasCredits ? colors.primary : colors.textMuted }]}>
          {creditsLeft}/{maxCredits}
        </Text>
      </View>

      <View style={s.zapsRow}>
        {zapIcons.map((filled, i) => (
          <View key={i} style={[s.zapWrap, { backgroundColor: filled ? colors.primary + '20' : colors.background }]}>
            <Zap
              size={16}
              color={filled ? colors.primary : colors.border}
              fill={filled ? colors.primary : 'transparent'}
            />
          </View>
        ))}
      </View>

      {!hasCredits && (
        <TouchableOpacity
          style={[s.rechargeBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
          onPress={() => router.push('/modals/no-credits' as any)}
          activeOpacity={0.8}
        >
          <Zap size={14} color={colors.primary} fill={colors.primary} />
          <Text style={[s.rechargeBtnText, { color: colors.primary }]}>Ver video y ganar +2 ⚡</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});
const s = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 13, fontWeight: '600' },
  count: { fontSize: 14, fontWeight: '800' },
  zapsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  zapWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rechargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  rechargeBtnText: { fontSize: 14, fontWeight: '700' },

  // Compact
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  compactText: { fontSize: 12, fontWeight: '700' },
  rechargeText: { fontSize: 12, fontWeight: '800', marginLeft: 4 },

  // Pro chip
  proChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  proText: { fontSize: 11, fontWeight: '800' },
});
