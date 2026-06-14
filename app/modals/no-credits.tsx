import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Crown, X, PlayCircle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAICredits } from '../../hooks/useAICredits';
import { AD_CONFIG } from '../../constants/adConfig';
import { Spacing, Radius } from '../../constants';
import { MAX_AI_PHOTO_ENERGY, MAX_AI_TEXT_ENERGY } from '../../store/adStore';

export default function NoCreditsModal() {
  const colors = useTheme();
  const { watchAdForCredits, totalAdsWatched } = useAICredits();
  const limitReached = totalAdsWatched >= 3;
  const [loading, setLoading] = useState(false);
  const [earned, setEarned] = useState(false);

  const handleWatchAd = async () => {
    setLoading(true);
    const success = await watchAdForCredits();
    setLoading(false);
    if (success) {
      setEarned(true);
      setTimeout(() => {
        router.back();
      }, 1500);
    }
  };

  const handleGoPro = () => {
    router.back();
    setTimeout(() => router.push('/modals/paywall' as any), 100);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} hitSlop={12}>
        <X size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Hero */}
      <View style={s.hero}>
        <View style={[s.iconCircle, { backgroundColor: colors.primary + '15' }]}>
          <Zap size={48} color={colors.primary} fill={colors.primary + '80'} />
        </View>

        {earned ? (
          <>
            <Text style={[s.title, { color: colors.textPrimary }]}>
              ⚡ +{AD_CONFIG.rewardedAdCredits} créditos ganados
            </Text>
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>
              ¡Gracias! Ya puedes seguir usando la IA.
            </Text>
          </>
        ) : (
          <>
            <Text style={[s.title, { color: colors.textPrimary }]}>
              Sin energía IA por hoy
            </Text>
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>
              Usaste tus créditos diarios. Elige cómo continuar:
            </Text>
            {/* Credit summary */}
            <View style={s.creditSummary}>
              <View style={[s.creditPill, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B40' }]}>
                <Text style={{ fontSize: 16 }}>📸</Text>
                <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 13 }}>
                  {MAX_AI_PHOTO_ENERGY} foto/día
                </Text>
              </View>
              <View style={[s.creditPill, { backgroundColor: '#7C5CFC15', borderColor: '#7C5CFC40' }]}>
                <Text style={{ fontSize: 16 }}>✍️</Text>
                <Text style={{ color: '#7C5CFC', fontWeight: '800', fontSize: 13 }}>
                  {MAX_AI_TEXT_ENERGY} texto/día
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {!earned && (
        <View style={s.options}>
          {/* Option A: Watch ad */}
          <TouchableOpacity
            style={[
              s.optionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              limitReached && { opacity: 0.5 }
            ]}
            onPress={handleWatchAd}
            disabled={loading || limitReached}
            activeOpacity={0.85}
          >
            <View style={[s.optionIcon, { backgroundColor: limitReached ? colors.border : '#10B981' + '20' }]}>
              <PlayCircle size={28} color={limitReached ? colors.textMuted : "#10B981"} />
            </View>
            <View style={s.optionText}>
              <Text style={[s.optionTitle, { color: limitReached ? colors.textMuted : colors.textPrimary }]}>
                {limitReached ? 'Límite de videos alcanzado' : 'Ver video corto'}
              </Text>
              <Text style={[s.optionDesc, { color: limitReached ? colors.textMuted : colors.textSecondary }]}>
                {limitReached ? 'Vuelve mañana para más créditos' : 'Gana +1 crédito IA ⚡ gratis'}
              </Text>
            </View>
            {loading ? (
              <ActivityIndicator color="#10B981" />
            ) : !limitReached && (
              <View style={[s.freeTag, { backgroundColor: '#10B981' + '20' }]}>
                <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800' }}>GRATIS</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Separator */}
          <View style={s.separator}>
            <View style={[s.separatorLine, { backgroundColor: colors.border }]} />
            <Text style={[s.separatorText, { color: colors.textMuted }]}>o</Text>
            <View style={[s.separatorLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Option B: Go Pro */}
          <TouchableOpacity
            style={s.proBtnWrapper}
            onPress={handleGoPro}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              style={s.proBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown size={20} color="#fff" />
              <Text style={s.proBtnText}>Hacerse Pro · IA Ilimitada</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[s.proPrice, { color: colors.textMuted }]}>
            Solo $11.800 COP/mes · Cancela cuando quieras
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, paddingTop: 60 },
  closeBtn: { position: 'absolute', top: 16, right: 20, padding: 8, zIndex: 10 },

  hero: { alignItems: 'center', marginBottom: 32, paddingTop: 20 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, marginBottom: 16 },
  creditSummary: { flexDirection: 'row', gap: 10, marginTop: 4 },
  creditPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },

  options: { gap: 0 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: 16,
  },
  optionIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  optionDesc: { fontSize: 13, fontWeight: '500' },
  freeTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },

  separator: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  separatorLine: { flex: 1, height: 1 },
  separatorText: { fontSize: 14, fontWeight: '600' },

  proBtnWrapper: { borderRadius: Radius.full, overflow: 'hidden', marginTop: 8 },
  proBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 },
  proBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  proPrice: { textAlign: 'center', fontSize: 13, marginTop: 12 },
});
