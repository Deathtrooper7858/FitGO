import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Star, Zap, ListChecks, HeartPulse, BrainCircuit, ShieldCheck, Sparkles } from 'lucide-react-native';
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

        <View style={s.comparisonTable}>
          <View style={s.tableHeaderRow}>
            <View style={s.featureCol} />
            <View style={s.freeCol}>
              <Text style={s.colTitleFree}>Free</Text>
            </View>
            <View style={s.proCol}>
              <Text style={s.colTitlePro}>PRO</Text>
            </View>
          </View>

          {[
            { name: t('paywall.cmpNutrition', 'Planes de Nutrición'), free: t('paywall.cmpFreeNut', 'Básicos'), pro: t('paywall.cmpProNut', 'IA Personalizada') },
            { name: t('paywall.cmpAILimits', 'Uso de la IA'), free: t('paywall.cmpFreeAI', 'Limitado (5/día)'), pro: t('paywall.cmpProAI', 'Ilimitado') },
            { name: t('paywall.cmpAds', 'Publicidad'), free: t('paywall.cmpFreeAds', 'Anuncios y Videos'), pro: t('paywall.cmpProAds', 'Cero Anuncios') },
            { name: t('paywall.cmpPhysique', 'Análisis Físico'), free: t('paywall.cmpFreePhysique', 'Bloqueado'), pro: t('paywall.cmpProPhysique', 'Análisis de Fotos') },
            { name: t('paywall.cmpDirectory', 'Directorio Muscular'), free: t('paywall.cmpFreeDir', 'Limitado'), pro: t('paywall.cmpProDir', 'Acceso Total') },
          ].map((row, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 0 && { backgroundColor: colors.surfaceAlt + '40' }]}>
              <View style={s.featureCol}>
                <Text style={[s.rowFeatureText, { color: colors.textPrimary }]}>{row.name}</Text>
              </View>
              <View style={s.freeCol}>
                <Text style={[s.rowFreeText, { color: colors.textSecondary }]}>{row.free}</Text>
              </View>
              <View style={s.proCol}>
                <Text style={[s.rowProText, { color: colors.primary }]}>{row.pro}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[s.planWrapper, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.primary + '10', 'transparent']}
            style={s.planGradient}
          />
          <View style={s.bestSellerBadge}>
            <Text style={s.bestSellerText}>{t('paywall.bestSeller', '🌟 EL MÁS VENDIDO 🌟')}</Text>
          </View>

          <View style={s.planHeader}>
            <Text style={[s.planName, { color: colors.textPrimary }]}>{t('paywall.fullAccess', 'Acceso Total Mensual')}</Text>
            <LinearGradient colors={colors.gradientPrimary} style={s.badge} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Text style={s.badgeText}>{t('paywall.specialOffer', 'OFERTA')}</Text>
            </LinearGradient>
          </View>
          
          <View style={s.priceContainer}>
            <Text style={[s.oldPrice, { color: colors.textMuted }]}>$25.000 COP</Text>
            <View style={s.currentPriceRow}>
              <Text style={[s.planPrice, { color: colors.primary }]}>$11.800</Text>
              <Text style={[s.planPeriod, { color: colors.textSecondary }]}> COP{t('paywall.perMonth', ' / mes')}</Text>
            </View>
          </View>
          
          <Text style={[s.planDesc, { color: colors.textSecondary }]}>
            {t('paywall.cancelAnytime', 'Cancela en cualquier momento. Sin compromisos.')}
          </Text>
        </View>

      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={s.purchaseBtn} onPress={handlePurchase} activeOpacity={0.8}>
          <LinearGradient colors={colors.gradientPrimary} style={s.purchaseGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Text style={s.purchaseText}>{t('paywall.unlockNow', 'Desbloquear Ahora')}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDismiss} style={{ marginTop: 16 }}>
          <Text style={[s.footerLink, { color: colors.textMuted }]}>{t('paywall.restorePurchases', 'Restaurar compras')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingTop: 40, paddingBottom: 150 },
  header: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 16 },
  closeBtn: { padding: 4, marginLeft: -4 },
  heroSection: { alignItems: 'center', marginBottom: 32 },
  sparklesIcon: { marginBottom: 16, padding: 16, borderRadius: 100 },
  title: { fontSize: 34, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 16, lineHeight: 24, textAlign: 'center', paddingHorizontal: 10 },
  
  comparisonTable: {
    marginBottom: 36,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.3)',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    backgroundColor: 'rgba(124, 92, 252, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 92, 252, 0.2)',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 92, 252, 0.1)',
  },
  featureCol: { flex: 2, paddingLeft: 12, justifyContent: 'center' },
  freeCol: { flex: 1.2, alignItems: 'center', justifyContent: 'center' },
  proCol: { flex: 1.2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124, 92, 252, 0.05)' },
  
  colTitleFree: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  colTitlePro: { fontSize: 16, fontWeight: '900', color: '#7C5CFC' },
  rowFeatureText: { fontSize: 12, fontWeight: '600' },
  rowFreeText: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  rowProText: { fontSize: 13, fontWeight: '800', textAlign: 'center' },

  planWrapper: {
    borderWidth: 2,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    paddingTop: 36,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 20
  },
  bestSellerBadge: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  bestSellerText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  planGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.xl,
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  planName: { fontSize: 18, fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  priceContainer: { marginBottom: 12 },
  oldPrice: { fontSize: 18, fontWeight: '700', textDecorationLine: 'line-through', marginBottom: -2 },
  currentPriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { fontSize: 44, fontWeight: '900', letterSpacing: -1.5, lineHeight: 48 },
  planPeriod: { fontSize: 16, fontWeight: '600' },
  planDesc: { fontSize: 14, fontWeight: '500' },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.xl, borderTopWidth: 1, paddingBottom: 32 },
  purchaseBtn: { borderRadius: Radius.full, overflow: 'hidden', elevation: 6, shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10 },
  purchaseGrad: { paddingVertical: 20, alignItems: 'center' },
  purchaseText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  footerLink: { textAlign: 'center', fontSize: 15, fontWeight: '700' }
});
