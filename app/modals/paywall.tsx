import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, CheckCircle2, XCircle, Sparkles, Star } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { usePurchaseStore } from '../../store';
import { useTranslation } from 'react-i18next';
import { Spacing, Radius } from '../../constants';

const { width } = Dimensions.get('window');

export default function PaywallModal() {
  const colors = useTheme();
  const { t } = useTranslation();
  const { grantPro } = usePurchaseStore();

  const handleDismiss = () => {
    router.back();
  };

  const handlePurchase = async () => {
    await grantPro();
    router.back();
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={handleDismiss} hitSlop={10}>
            <X size={28} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={s.heroSection}>
          <Text style={[s.title, { color: colors.textPrimary }]}>
            Desbloquea <Text style={{ color: colors.primary }}>FitGO Pro</Text>
          </Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>
            Elige el plan ideal para transformar tu cuerpo con Inteligencia Artificial.
          </Text>
        </View>

        {/* PRO CARD */}
        <View style={[s.card, { borderColor: colors.primary, backgroundColor: colors.surface, marginTop: 16 }]}>
          <LinearGradient colors={[colors.primary + '15', 'transparent']} style={StyleSheet.absoluteFillObject} />
          <View style={s.bestSellerBadge}>
            <Star size={12} color="#000" fill="#000" style={{ marginRight: 4 }} />
            <Text style={s.bestSellerText}>Más popular</Text>
          </View>

          <View style={s.cardHeader}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Pro</Text>
            <Text style={[s.cardDesc, { color: colors.textSecondary }]}>Desbloquea todo tu potencial</Text>
          </View>

          <View style={s.priceRow}>
            <Text style={[s.price, { color: colors.primary }]}>$11.800</Text>
            <Text style={[s.period, { color: colors.textMuted }]}> / mes</Text>
          </View>

          <View style={s.tagsContainer}>
            {['🤖 Coach IA', '🍎 Nutrición IA', '📸 Análisis Pro', '🔥 Sin límites'].map((tag, i) => (
              <View key={i} style={[s.tag, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[s.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.purchaseBtn} onPress={handlePurchase} activeOpacity={0.8}>
            <LinearGradient colors={colors.gradientPrimary} style={s.purchaseGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Text style={s.purchaseText}>⚡ OBTENER Pro - Mensual</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.featureList}>
            {[
              'Todo lo del plan gratuito',
              'Coach con IA ilimitado',
              'Análisis avanzado de progreso con fotos',
              'Planificador nutricional con IA',
              'Directorio Muscular completo',
              'Soporte prioritario',
              'Cero publicidad'
            ].map((feat, i) => (
              <View key={i} style={s.featureItem}>
                <CheckCircle2 size={20} color={colors.primary} />
                <Text style={[s.featureText, { color: colors.textPrimary }]}>{feat}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FREE CARD */}
        <View style={[s.card, { borderColor: colors.border, backgroundColor: colors.surfaceAlt, marginTop: 24, opacity: 0.9 }]}>
          <View style={s.cardHeader}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Gratis</Text>
            <Text style={[s.cardDesc, { color: colors.textSecondary }]}>Para empezar tu camino</Text>
          </View>

          <View style={s.priceRow}>
            <Text style={[s.price, { color: colors.textPrimary }]}>$0</Text>
            <Text style={[s.period, { color: colors.textMuted }]}> / siempre</Text>
          </View>

          <View style={s.featureList}>
            {[
              { text: 'Registro de peso corporal', included: true },
              { text: 'Tracking de macros básico', included: true },
              { text: 'Base de datos de alimentos', included: true },
              { text: 'Rutinas de entrenamiento limitadas', included: true },
              { text: 'Coach con IA (Solo 5/día)', included: false },
              { text: 'Planificador nutricional IA', included: false },
              { text: 'Análisis avanzado de progreso', included: false },
              { text: 'Sin publicidad', included: false }
            ].map((feat, i) => (
              <View key={i} style={s.featureItem}>
                {feat.included ? (
                  <CheckCircle2 size={20} color="#10B981" />
                ) : (
                  <XCircle size={20} color={colors.textMuted} />
                )}
                <Text style={[
                  s.featureText, 
                  { color: feat.included ? colors.textPrimary : colors.textMuted },
                  !feat.included && { textDecorationLine: 'line-through' }
                ]}>
                  {feat.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 16 },
  closeBtn: { padding: 4, marginLeft: -4 },
  heroSection: { alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, lineHeight: 24, textAlign: 'center', paddingHorizontal: 10 },
  
  card: {
    borderWidth: 2,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    overflow: 'visible',
    position: 'relative',
  },
  bestSellerBadge: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    backgroundColor: '#FFB800',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  bestSellerText: { color: '#000', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  
  cardHeader: { marginBottom: 16 },
  cardTitle: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  cardDesc: { fontSize: 15, fontWeight: '500' },
  
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 },
  price: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  period: { fontSize: 16, fontWeight: '600' },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
  tagText: { fontSize: 12, fontWeight: '800' },
  
  purchaseBtn: { borderRadius: Radius.lg, overflow: 'hidden', elevation: 4, marginBottom: 24 },
  purchaseGrad: { paddingVertical: 18, alignItems: 'center' },
  purchaseText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  
  featureList: { gap: 14 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 15, fontWeight: '500', flex: 1, lineHeight: 22 },
});
