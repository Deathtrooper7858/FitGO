import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X, CheckCircle2, XCircle, Crown, Star, Zap,
  BrainCircuit, Camera, FileText, Trophy, History,
  ShieldOff, ChefHat, Mic, Activity, Infinity
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { usePurchaseStore } from '../../store';
import { useTranslation } from 'react-i18next';
import { Spacing, Radius } from '../../constants';

export default function PaywallModal() {
  const colors = useTheme();
  const { t } = useTranslation();
  const { grantPro } = usePurchaseStore();

  const handleDismiss = () => router.back();

  const handlePurchase = async () => {
    await grantPro();
    router.back();
  };

  const PRO_FEATURES: { icon: any; title: string; desc: string; badge?: string; badgeColor?: string }[] = [
    { icon: BrainCircuit, title: 'Coach IA Ilimitado', desc: 'Nutriólogo, Entrenador y Médico IA sin restricciones — 24/7', badge: '∞ ILIMITADO', badgeColor: '#7C5CFC' },
    { icon: ChefHat, title: 'Recetas IA Personalizadas', desc: '200+ recetas adaptadas a tu dieta y metas, nuevas cada semana', badge: '200+', badgeColor: '#10B981' },
    { icon: Camera, title: 'Análisis Corporal con Fotos', desc: 'La IA analiza tu grasa, músculo y progreso a través de fotos', badge: 'EXCLUSIVO', badgeColor: '#F59E0B' },
    { icon: BrainCircuit, title: 'Planificador Nutricional IA', desc: 'Tu menú semanal personalizado generado en segundos', badge: 'IA', badgeColor: '#7C5CFC' },
    { icon: Activity, title: 'Directorio Muscular Completo', desc: '500+ ejercicios con animaciones y técnica correcta', badge: '500+', badgeColor: '#EF4444' },
    { icon: FileText, title: 'Lista de Compras en PDF', desc: 'Exporta y comparte tu lista de la semana automáticamente', badge: 'AUTO', badgeColor: '#3B82F6' },
    { icon: Trophy, title: 'Ligas Élite y Retos', desc: 'Compite con la comunidad global y gana badges exclusivos', badge: 'ÉLITE', badgeColor: '#F59E0B' },
    { icon: History, title: 'Historial Ilimitado', desc: 'Revisa todo tu progreso desde el primer día sin límites', badge: 'ILIMITADO', badgeColor: '#10B981' },
    { icon: Mic, title: 'Voz al Coach IA', desc: 'Habla directamente con tu coach, sin teclear nada', badge: 'VIP', badgeColor: '#8B5CF6' },
    { icon: ShieldOff, title: 'Cero Publicidad', desc: 'Experiencia 100% limpia sin interrupciones ni videos', badge: 'PREMIUM', badgeColor: '#7C5CFC' },
    { icon: Activity, title: 'Sync Apple Health / Google Fit', badge: 'INTEGRADO', badgeColor: '#3B82F6', desc: 'Pasos y calorías quemadas sincronizados automáticamente' },
    { icon: Zap, title: 'Macros Personalizables', desc: 'Ajusta tus macros manualmente si eres un experto en nutrición', badge: 'AVANZADO', badgeColor: '#F59E0B' },
  ];

  const COMPARISON_ROWS = [
    { feature: 'Coach IA', free: '5 / día', pro: 'Ilimitado' },
    { feature: 'Recetas IA', free: 'Bloqueado', pro: '200+' },
    { feature: 'Análisis de Fotos', free: 'Bloqueado', pro: 'Incluido' },
    { feature: 'Publicidad', free: 'Anuncios + Videos', pro: 'Sin anuncios' },
    { feature: 'Historial', free: '30 días', pro: 'Ilimitado' },
    { feature: 'Directorio Muscular', free: 'Básico', pro: 'Completo' },
  ];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Close */}
        <TouchableOpacity style={s.closeBtn} onPress={handleDismiss} hitSlop={12}>
          <X size={26} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Hero */}
        <View style={s.hero}>
          <LinearGradient colors={['#7C5CFC20', '#7C5CFC05']} style={s.heroGlow} />
          <View style={[s.crownCircle, { backgroundColor: '#FFB80020' }]}>
            <Crown size={40} color="#FFB800" />
          </View>
          <Text style={[s.heroTitle, { color: colors.textPrimary }]}>
            Desbloquea <Text style={{ color: colors.primary }}>FitGO Pro</Text>
          </Text>
          <Text style={[s.heroSub, { color: colors.textSecondary }]}>
            Tu coach personal de IA. Sin límites. Sin excusas.
          </Text>

          {/* Social proof */}
          <View style={[s.socialProof, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={s.stars}>⭐⭐⭐⭐⭐</Text>
            <Text style={[s.socialText, { color: colors.textSecondary }]}>
              +2,400 usuarios Pro activos
            </Text>
          </View>

          {/* Tags */}
          <View style={s.tagRow}>
            {[
              { icon: Infinity, label: 'IA Ilimitada' },
              { icon: ShieldOff, label: 'Sin Ads' },
              { icon: Crown, label: 'Pro Élite' },
              { icon: Star, label: 'Exclusivo' },
            ].map(({ icon: Icon, label }, i) => (
              <View key={i} style={[s.tag, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
                <Icon size={11} color={colors.primary} />
                <Text style={[s.tagText, { color: colors.primary }]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features List */}
        <View style={[s.featuresSection, { borderColor: colors.border }]}>
          <Text style={[s.sectionLabel, { color: colors.textPrimary }]}>¿Qué incluye Pro?</Text>
          {PRO_FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <View
                key={i}
                style={[s.featureRow, { borderBottomColor: colors.border + '60' }, i === PRO_FEATURES.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={[s.featureIconWrap, { backgroundColor: (feat.badgeColor || colors.primary) + '18' }]}>
                  <Icon size={20} color={feat.badgeColor || colors.primary} />
                </View>
                <View style={s.featureText}>
                  <View style={s.featureTop}>
                    <Text style={[s.featureTitle, { color: colors.textPrimary }]}>{feat.title}</Text>
                    {feat.badge && (
                      <View style={[s.featBadge, { backgroundColor: (feat.badgeColor || colors.primary) + '20' }]}>
                        <Text style={[s.featBadgeText, { color: feat.badgeColor || colors.primary }]}>{feat.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.featureDesc, { color: colors.textSecondary }]}>{feat.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Comparison Table */}
        <View style={[s.tableWrap, { borderColor: colors.border }]}>
          <Text style={[s.sectionLabel, { color: colors.textPrimary }]}>Free vs Pro</Text>
          <View style={[s.tableHeaderRow, { backgroundColor: colors.primary + '10' }]}>
            <View style={s.tableFeatureCol} />
            <View style={s.tableValueCol}><Text style={[s.colLabelFree, { color: colors.textMuted }]}>Gratis</Text></View>
            <View style={[s.tableValueCol, { backgroundColor: colors.primary + '10' }]}><Text style={s.colLabelPro}>PRO</Text></View>
          </View>
          {COMPARISON_ROWS.map((row, i) => (
            <View
              key={i}
              style={[s.tableRow, { borderBottomColor: colors.border + '50' }, i % 2 === 0 && { backgroundColor: colors.surface + '80' }]}
            >
              <View style={s.tableFeatureCol}>
                <Text style={[s.rowFeature, { color: colors.textPrimary }]}>{row.feature}</Text>
              </View>
              <View style={s.tableValueCol}>
                <Text style={[s.rowFree, { color: colors.textMuted }]}>{row.free}</Text>
              </View>
              <View style={[s.tableValueCol, { backgroundColor: colors.primary + '08' }]}>
                <Text style={[s.rowPro, { color: colors.primary }]}>{row.pro}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Price Card */}
        <View style={[s.priceCard, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
          <LinearGradient colors={[colors.primary + '12', 'transparent']} style={StyleSheet.absoluteFillObject} />
          <View style={s.bestSellerPill}>
            <Star size={11} color="#000" fill="#000" />
            <Text style={s.bestSellerText}>MÁS POPULAR</Text>
          </View>
          <View style={s.priceCardTop}>
            <Text style={[s.planName, { color: colors.textPrimary }]}>Acceso Total Pro</Text>
            <LinearGradient colors={colors.gradientPrimary} style={s.ofertaBadge} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={s.ofertaText}>OFERTA LANZAMIENTO</Text>
            </LinearGradient>
          </View>
          <View style={s.priceRow}>
            <Text style={[s.oldPrice, { color: colors.textMuted }]}>$25.000</Text>
            <View style={s.newPriceRow}>
              <Text style={[s.price, { color: colors.primary }]}>$11.800</Text>
              <Text style={[s.priceSuffix, { color: colors.textSecondary }]}> COP / mes</Text>
            </View>
          </View>
          <Text style={[s.cancelText, { color: colors.textMuted }]}>Cancela en cualquier momento · Sin compromisos</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky CTA Footer */}
      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={s.ctaBtn} onPress={handlePurchase} activeOpacity={0.85}>
          <LinearGradient colors={colors.gradientPrimary} style={s.ctaGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Crown size={18} color="#fff" />
            <Text style={s.ctaText}>Desbloquear Ahora · $11.800/mes</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDismiss} style={{ marginTop: 12 }}>
          <Text style={[s.skipText, { color: colors.textMuted }]}>Continuar con el plan gratuito</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingTop: Platform.OS === 'ios' ? 50 : 28, paddingBottom: 40 },
  closeBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, right: 20, padding: 8, zIndex: 10 },

  // Hero
  hero: { alignItems: 'center', marginBottom: 32, paddingTop: 24, position: 'relative' },
  heroGlow: { position: 'absolute', top: 0, left: -20, right: -20, height: 300, borderRadius: 200 },
  crownCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center', marginBottom: 8 },
  heroSub: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 16, paddingHorizontal: 8 },
  socialProof: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  stars: { fontSize: 12 },
  socialText: { fontSize: 13, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '800' },

  // Features
  featuresSection: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  sectionLabel: { fontSize: 18, fontWeight: '900', marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  featureIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  featureText: { flex: 1 },
  featureTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' },
  featureTitle: { fontSize: 14, fontWeight: '800' },
  featBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  featBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  featureDesc: { fontSize: 12, lineHeight: 18, fontWeight: '500' },

  // Comparison table
  tableWrap: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 12 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 12 },
  tableFeatureCol: { flex: 2, paddingLeft: 14, justifyContent: 'center' },
  tableValueCol: { flex: 1.3, alignItems: 'center', justifyContent: 'center' },
  colLabelFree: { fontSize: 13, fontWeight: '700' },
  colLabelPro: { fontSize: 14, fontWeight: '900', color: '#7C5CFC' },
  rowFeature: { fontSize: 12, fontWeight: '700' },
  rowFree: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  rowPro: { fontSize: 12, fontWeight: '800', textAlign: 'center' },

  // Price card
  priceCard: { borderWidth: 2.5, borderRadius: Radius.xl, padding: Spacing.xl, paddingTop: 36, overflow: 'visible', position: 'relative', marginBottom: 8 },
  bestSellerPill: { position: 'absolute', top: -14, alignSelf: 'center', backgroundColor: '#FFB800', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, elevation: 4, zIndex: 5 },
  bestSellerText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  priceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  planName: { fontSize: 17, fontWeight: '800' },
  ofertaBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  ofertaText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  priceRow: { marginBottom: 8 },
  oldPrice: { fontSize: 16, textDecorationLine: 'line-through', fontWeight: '600', marginBottom: -2 },
  newPriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  priceSuffix: { fontSize: 15, fontWeight: '600' },
  cancelText: { fontSize: 13, fontWeight: '500' },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.xl, borderTopWidth: 1, paddingBottom: 32, alignItems: 'center' },
  ctaBtn: { width: '100%', borderRadius: Radius.full, overflow: 'hidden', elevation: 8, shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  skipText: { fontSize: 13, fontWeight: '600' },
});
