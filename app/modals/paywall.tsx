import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X, Crown, Star,
  BrainCircuit, Camera, Trophy, History,
  ShieldOff, ChefHat, Mic, Activity, Infinity,
  Zap, Clock, Gift
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useLocalPrice } from '../../hooks/useLocalPrice';
import { usePurchaseStore } from '../../store';
import { Spacing, Radius } from '../../constants';
import { useToastStore } from '../../store/toastStore';
import { PurchaseConfirmModal } from '../../components/PurchaseConfirmModal';
import { TrialConfirmModal } from '../../components/TrialConfirmModal';

export default function PaywallModal() {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [trialConfirmVisible, setTrialConfirmVisible] = useState(false);
  const colors = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { 
    offering, 
    fetchOfferings, 
    purchasePackage, 
    restorePurchases, 
    isLoading,
    grantPro,
    startTrial,
    hasUsedTrial,
    isTrialActive,
    trialExpiresAt,
    trialUsedAt,
  } = usePurchaseStore();

  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  const handleDismiss = () => router.back();

  // Find monthly package if available
  const monthlyPackage = offering?.monthly;

  const handlePurchase = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfirmVisible(true);
  };

  const handleConfirmedPurchase = async () => {
    setConfirmVisible(false);
    try {
      if (monthlyPackage) {
        await purchasePackage(monthlyPackage);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        useToastStore.getState().addNotification({
          title: t('paywall.successTitle', '¡Suscripción Activa!'),
          description: t('paywall.successDesc', '¡Bienvenido a FitGO Pro! Ya tienes acceso ilimitado.'),
          iconType: 'emoji',
          icon: '👑',
          tier: 'success',
        });
        router.back();
      } else {
        useToastStore.getState().addNotification({
          title: t('common.error', 'Error'),
          description: t('paywall.noPackagesError', 'No se pudieron cargar los paquetes de suscripción.'),
          tier: 'danger',
          iconType: 'emoji',
          icon: '⚠️'
        });
      }
    } catch (err) {
      console.warn('Purchase failed or was cancelled', err);
    }
  };

  const handleTrial = () => {
    if (hasUsedTrial()) return; // Guard: already used
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTrialConfirmVisible(true);
  };

  const handleConfirmedTrial = async () => {
    setTrialConfirmVisible(false);
    try {
      await startTrial();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      useToastStore.getState().addNotification({
        title: t('paywall.trial.active', 'Trial active'),
        description: t('paywall.trial.activeDesc', 'Your free trial is active. Enjoy all Pro features until it expires!'),
        iconType: 'emoji',
        icon: '🎁',
        tier: 'success',
      });
      router.back();
    } catch (err: any) {
      if (err?.message === 'TRIAL_ALREADY_USED') {
        useToastStore.getState().addNotification({
          title: t('paywall.trial.alreadyUsed', 'Trial already used'),
          description: t('paywall.trial.alreadyUsedDesc', "You've already used the free trial."),
          iconType: 'emoji',
          icon: '⚠️',
          tier: 'warning',
        });
      } else {
        console.warn('Trial start failed', err);
      }
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      useToastStore.getState().addNotification({
        title: t('paywall.restoreTitle', 'Compras Restauradas'),
        description: t('paywall.restoreDesc', 'Tu estado de FitGO Pro ha sido verificado con éxito.'),
        iconType: 'emoji',
        icon: '✅',
        tier: 'success',
      });
      router.back();
    } catch (err) {
      console.warn("Restore failed", err);
    }
  };

  const PRO_FEATURES: { icon: any; title: string; desc: string; badge?: string; badgeColor?: string }[] = [
    { icon: BrainCircuit, title: t('paywall.features.coachTitle'), desc: t('paywall.features.coachDesc'), badge: t('paywall.features.coachBadge'), badgeColor: '#7C5CFC' },
    { icon: ChefHat, title: t('paywall.features.plannerTitle'), desc: t('paywall.features.plannerDesc'), badge: t('paywall.features.plannerBadge'), badgeColor: '#10B981' },
    { icon: Camera, title: t('paywall.features.scannerTitle'), desc: t('paywall.features.scannerDesc'), badge: t('paywall.features.scannerBadge'), badgeColor: '#F59E0B' },
    { icon: Mic, title: t('paywall.features.voiceTitle'), desc: t('paywall.features.voiceDesc'), badge: t('paywall.features.voiceBadge'), badgeColor: '#3B82F6' },
    { icon: Activity, title: t('paywall.features.directoryTitle'), desc: t('paywall.features.directoryDesc'), badge: t('paywall.features.directoryBadge'), badgeColor: '#EF4444' },
    { icon: Star, title: t('paywall.features.colorsTitle'), desc: t('paywall.features.colorsDesc'), badge: t('paywall.features.colorsBadge'), badgeColor: '#F59E0B' },
    { icon: Trophy, title: t('paywall.features.leaguesTitle'), desc: t('paywall.features.leaguesDesc'), badge: t('paywall.features.leaguesBadge'), badgeColor: '#8B5CF6' },
    { icon: History, title: t('paywall.features.historyTitle'), desc: t('paywall.features.historyDesc'), badge: t('paywall.features.historyBadge'), badgeColor: '#10B981' },
    { icon: ShieldOff, title: t('paywall.features.adsTitle'), desc: t('paywall.features.adsDesc'), badge: t('paywall.features.adsBadge'), badgeColor: '#7C5CFC' },
  ];

  const COMPARISON_ROWS = [
    { feature: t('paywall.rows.coach'), free: t('paywall.rows.coachFree'), pro: t('paywall.rows.coachPro') },
    { feature: t('paywall.rows.scanner'), free: t('paywall.rows.scannerFree'), pro: t('paywall.rows.scannerPro') },
    { feature: t('paywall.rows.planner'), free: t('paywall.rows.plannerFree'), pro: t('paywall.rows.plannerPro') },
    { feature: t('paywall.rows.voice'), free: t('paywall.rows.voiceFree'), pro: t('paywall.rows.voicePro') },
    { feature: t('paywall.rows.directory'), free: t('paywall.rows.directoryFree'), pro: t('paywall.rows.directoryPro') },
    { feature: t('paywall.rows.history'), free: t('paywall.rows.historyFree'), pro: t('paywall.rows.historyPro') },
    { feature: t('paywall.rows.colors'), free: t('paywall.rows.colorsFree'), pro: t('paywall.rows.colorsPro') },
    { feature: t('paywall.rows.ads'), free: t('paywall.rows.adsFree'), pro: t('paywall.rows.adsPro') },
  ];

  const localPrice = useLocalPrice();

  const getMonthSuffix = (lang: string) => {
    const baseLang = lang.toLowerCase().split('-')[0];
    switch (baseLang) {
      case 'es': return ' / mes';
      case 'pt': return ' / mês';
      case 'ru': return ' / мес';
      case 'de': return ' / Monat';
      case 'fr': return ' / mois';
      case 'it': return ' / mese';
      default: return ' / month';
    }
  };

  const lang = i18n.language || 'en';
  
  // By default, if we don't have RevenueCat (dev/sandbox) we use our live converted local prices!
  let displayPrice = localPrice.formatPrice(4.99, lang);
  let displayOldPrice = localPrice.formatPrice(9.99, lang);

  // If RevenueCat returns a valid localized package, we can still use it.
  // However, if the user's IP-detected currency differs from RevenueCat's currency (often happens in dev),
  // we might want to prioritize our live conversion for display if we are forcing it, but usually RC is correct.
  if (monthlyPackage) {
    const rcPrice = monthlyPackage.product.price;
    const currencyCode = monthlyPackage.product.currencyCode;
    
    // Check if RevenueCat is giving us USD but the user's real currency is something else
    // This happens frequently in sandbox testing. If so, we can let our local converter handle it.
    if (currencyCode === 'USD' && localPrice.currency !== 'USD') {
      displayPrice = localPrice.formatPrice(4.99, lang);
      displayOldPrice = localPrice.formatPrice(9.99, lang);
    } else {
      try {
        const formatter = new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
        if (rcPrice > 7) {
          displayOldPrice = formatter.format(localPrice.roundNice(rcPrice));
          displayPrice = formatter.format(localPrice.roundNice(rcPrice * (4.99 / 9.99)));
        } else {
          displayPrice = formatter.format(localPrice.roundNice(rcPrice));
          displayOldPrice = formatter.format(localPrice.roundNice(rcPrice * (9.99 / 4.99)));
        }
      } catch {
        displayPrice = localPrice.formatPrice(4.99, lang);
        displayOldPrice = localPrice.formatPrice(9.99, lang);
      }
    }
  }


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
            {t('paywall.title').split('FitGO Pro')[0]}<Text style={{ color: colors.primary }}>FitGO Pro</Text>{t('paywall.title').split('FitGO Pro')[1] || ''}
          </Text>
          <Text style={[s.heroSub, { color: colors.textSecondary }]}>
            {t('paywall.subtitle')}
          </Text>

          {/* Tags */}
          <View style={s.tagRow}>
            {[
              { icon: Infinity, label: t('paywall.features.coachBadge') },
              { icon: ShieldOff, label: t('paywall.features.adsBadge') },
              { icon: Crown, label: t('paywall.pro') },
              { icon: Star, label: t('paywall.features.colorsBadge') },
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
          <Text style={[s.sectionLabel, { color: colors.textPrimary }]}>{t('paywall.featuresTitle')}</Text>
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
          <Text style={[s.sectionLabel, { color: colors.textPrimary }]}>{t('paywall.vsTitle')}</Text>
          <View style={[s.tableHeaderRow, { backgroundColor: colors.primary + '10' }]}>
            <View style={s.tableFeatureCol} />
            <View style={s.tableValueCol}><Text style={[s.colLabelFree, { color: colors.textMuted }]}>{t('paywall.free')}</Text></View>
            <View style={[s.tableValueCol, { backgroundColor: colors.primary + '10' }]}><Text style={s.colLabelPro}>{t('paywall.pro')}</Text></View>
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

        {/* Trial Card */}
        {!isTrialActive && !trialUsedAt && (
          <TouchableOpacity
            style={[s.trialCard, { borderColor: '#10B981', backgroundColor: colors.surface }]}
            onPress={handleTrial}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#10B98112', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <View style={s.trialBadgeRow}>
              <View style={[s.trialBadge, { backgroundColor: '#10B98120', borderColor: '#10B98140' }]}>
                <Gift size={11} color="#10B981" />
                <Text style={[s.trialBadgeText, { color: '#10B981' }]}>{t('paywall.trial.badge')}</Text>
              </View>
            </View>
            <View style={s.trialContent}>
              <View style={[s.trialIconWrap, { backgroundColor: '#10B98120' }]}>
                <Zap size={22} color="#10B981" fill="#10B981" />
              </View>
              <View style={s.trialTexts}>
                <Text style={[s.trialTitle, { color: colors.textPrimary }]}>{t('paywall.trial.title')}</Text>
                <Text style={[s.trialSub, { color: colors.textSecondary }]}>{t('paywall.trial.subtitle')}</Text>
                <View style={s.trialExpireRow}>
                  <Clock size={11} color={colors.textMuted} />
                  <Text style={[s.trialExpire, { color: colors.textMuted }]}>{t('paywall.trial.expires')}</Text>
                </View>
              </View>
            </View>
            <LinearGradient colors={['#10B981', '#059669']} style={s.trialCta} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={s.trialCtaText}>{t('paywall.trial.cta')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Trial already used notice */}
        {!!trialUsedAt && !isTrialActive && (
          <View style={[s.trialUsedCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Clock size={16} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={[s.trialUsedTitle, { color: colors.textPrimary }]}>{t('paywall.trial.alreadyUsed')}</Text>
              <Text style={[s.trialUsedDesc, { color: colors.textSecondary }]}>{t('paywall.trial.alreadyUsedDesc')}</Text>
            </View>
          </View>
        )}

        {/* Trial active notice */}
        {isTrialActive && (
          <View style={[s.trialActiveCard, { borderColor: '#10B981', backgroundColor: '#10B98110' }]}>
            <Zap size={16} color="#10B981" fill="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={[s.trialUsedTitle, { color: '#10B981' }]}>{t('paywall.trial.active')}</Text>
              <Text style={[s.trialUsedDesc, { color: colors.textSecondary }]}>
                {trialExpiresAt ? `${t('paywall.trial.activeDesc')} (${new Date(trialExpiresAt).toLocaleDateString()})` : t('paywall.trial.activeDesc')}
              </Text>
            </View>
          </View>
        )}

        {/* Price Card */}
        <View style={[s.priceCard, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
          <LinearGradient colors={[colors.primary + '12', 'transparent']} style={StyleSheet.absoluteFillObject} />
          <View style={s.bestSellerPill}>
            <Star size={11} color="#000" fill="#000" />
            <Text style={s.bestSellerText}>{t('paywall.mostPopular')}</Text>
          </View>
          <View style={s.priceCardTop}>
            <Text style={[s.planName, { color: colors.textPrimary }]}>{t('paywall.accessTotal')}</Text>
            <LinearGradient colors={colors.gradientPrimary} style={s.ofertaBadge} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={s.ofertaText}>{t('paywall.launchOffer')}</Text>
            </LinearGradient>
          </View>
          <View style={s.priceRow}>
            <Text style={[s.oldPrice, { color: colors.textMuted }]}>{displayOldPrice}</Text>
            <View style={s.newPriceRow}>
              <Text style={[s.price, { color: colors.primary }]}>{displayPrice}</Text>
              <Text style={[s.priceSuffix, { color: colors.textSecondary }]}>{getMonthSuffix(lang)}</Text>
            </View>
          </View>
          <Text style={[s.cancelText, { color: colors.textMuted }]}>{t('paywall.cancelAnytime')}</Text>
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Sticky CTA Footer */}
      <View style={[
        s.footer, 
        { 
          backgroundColor: colors.background, 
          borderTopColor: colors.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : (Platform.OS === 'ios' ? 44 : 36)
        }
      ]}>
        <TouchableOpacity 
          style={[s.ctaBtn, isLoading && { opacity: 0.7 }]} 
          onPress={handlePurchase} 
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={colors.gradientPrimary} style={s.ctaGrad} start={{x:0,y:0}} end={{x:1,y:0.5}}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Crown size={18} color="#fff" />
                <Text style={s.ctaText}>{t('paywall.unlockNow')} · {displayPrice}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
          <TouchableOpacity onPress={handleRestore} disabled={isLoading}>
            <Text style={[s.skipText, { color: colors.textMuted }]}>{t('paywall.restore')}</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.textMuted }}>·</Text>
          <TouchableOpacity onPress={handleDismiss} disabled={isLoading}>
            <Text style={[s.skipText, { color: colors.textMuted }]}>{t('paywall.continueFree')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PurchaseConfirmModal
        visible={confirmVisible}
        price={displayPrice}
        oldPrice={displayOldPrice}
        monthSuffix={getMonthSuffix(lang)}
        isLoading={isLoading}
        onConfirm={handleConfirmedPurchase}
        onCancel={() => setConfirmVisible(false)}
      />
      <TrialConfirmModal
        visible={trialConfirmVisible}
        isLoading={isLoading}
        onConfirm={handleConfirmedTrial}
        onCancel={() => setTrialConfirmVisible(false)}
      />
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
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.xl, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 44 : 36, alignItems: 'center' },

  ctaBtn: { width: '100%', borderRadius: Radius.full, overflow: 'hidden', elevation: 8, shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  skipText: { fontSize: 13, fontWeight: '600' },

  // Trial card
  trialCard: {
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  trialBadgeRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 4,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  trialBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  trialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  trialIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  trialTexts: { flex: 1 },
  trialTitle: { fontSize: 16, fontWeight: '900', marginBottom: 2 },
  trialSub: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  trialExpireRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trialExpire: { fontSize: 11, fontWeight: '600' },
  trialCta: {
    margin: 12,
    marginTop: 0,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  trialCtaText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },

  // Trial used / active cards
  trialUsedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: 16,
  },
  trialActiveCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: 16,
  },
  trialUsedTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  trialUsedDesc: { fontSize: 12, fontWeight: '500', lineHeight: 18 },
});
