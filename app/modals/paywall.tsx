import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  X, Crown, Star,
  BrainCircuit, Camera, Trophy, History,
  ShieldOff, ChefHat, Mic, Activity, Infinity,
  Zap, Clock, Gift, Sparkles, TrendingDown, Flame, CheckCircle2, Quote, Users, Lock
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useLocalPrice } from '../../hooks/useLocalPrice';
import { usePurchaseStore } from '../../store';
import { Spacing, Radius } from '../../constants';
import { useToastStore } from '../../store/toastStore';
import { PurchaseConfirmModal } from '../../components/PurchaseConfirmModal';
import { TrialConfirmModal } from '../../components/TrialConfirmModal';
import { PaywallManager } from '../../utils/paywallManager';

export default function PaywallModal() {
  const { mode } = useLocalSearchParams<{ source?: string; mode?: string }>();
  const isMinimalMode = mode === 'minimal';
  const showSocialProof = !isMinimalMode;
  const [activeSectionTab, setActiveSectionTab] = useState<'benefits' | 'compare'>('benefits');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [trialConfirmVisible, setTrialConfirmVisible] = useState(false);
  const [activeModelTab, setActiveModelTab] = useState<'male' | 'female'>('male');
  const colors = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { 
    offering, 
    fetchOfferings, 
    purchasePackage, 
    restorePurchases, 
    isLoading,
    startTrial,
    hasUsedTrial,
    isTrialActive,
    trialExpiresAt,
    trialUsedAt,
  } = usePurchaseStore();

  useEffect(() => {
    fetchOfferings();
    PaywallManager.recordPaywallShown().catch(() => {});
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
          tier: 'warning',
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
    { icon: BrainCircuit, title: t('paywall.features.coachTitle', 'Coach IA Ilimitado'), desc: t('paywall.features.coachDesc', 'Nutriólogo, Entrenador y Médico IA sin límites — 24/7'), badge: t('paywall.features.coachBadge', '∞ ILIMITADO'), badgeColor: '#7C5CFC' },
    { icon: ChefHat, title: t('paywall.features.plannerTitle', 'Planificador Nutricional IA'), desc: t('paywall.features.plannerDesc', 'Genera menús semanales personalizados basados en tus macros'), badge: t('paywall.features.plannerBadge', 'IA'), badgeColor: '#10B981' },
    { icon: Camera, title: t('paywall.features.scannerTitle', 'Buscador y Escáner de Alimentos'), desc: t('paywall.features.scannerDesc', 'Desbloquea la base de datos y escaneo de códigos de barra'), badge: t('paywall.features.scannerBadge', 'FÁCIL'), badgeColor: '#F59E0B' },
    { icon: Mic, title: t('paywall.features.voiceTitle', 'Dictado por Voz e IA'), desc: t('paywall.features.voiceDesc', 'Registra comidas y entrenamientos hablando o describiendo libremente'), badge: t('paywall.features.voiceBadge', 'RÁPIDO'), badgeColor: '#3B82F6' },
    { icon: Activity, title: t('paywall.features.directoryTitle', 'Directorio Muscular Completo'), desc: t('paywall.features.directoryDesc', '500+ ejercicios con guías técnicas y animaciones GIFs sin anuncios'), badge: t('paywall.features.directoryBadge', '500+ EJS'), badgeColor: '#EF4444' },
    { icon: Star, title: t('paywall.features.colorsTitle', 'Colores de Acento Premium'), desc: t('paywall.features.colorsDesc', 'Personaliza tu perfil y toda la app con 11 colores de diseño exclusivos'), badge: t('paywall.features.colorsBadge', 'ESTILO'), badgeColor: '#EC4899' },
    { icon: Trophy, title: t('paywall.features.leaguesTitle', 'Ligas Élite y Squads'), desc: t('paywall.features.leaguesDesc', 'Sube de rango en clasificaciones globales y compite en equipo sin límites'), badge: t('paywall.features.leaguesBadge', 'COMPITE'), badgeColor: '#8B5CF6' },
    { icon: History, title: t('paywall.features.historyTitle', 'Historial y Exportación'), desc: t('paywall.features.historyDesc', 'Historial completo de tu progreso desde el primer día y exportación'), badge: t('paywall.features.historyBadge', 'DATOS'), badgeColor: '#06B6D4' },
    { icon: ShieldOff, title: t('paywall.features.adsTitle', 'Experiencia Sin Anuncios'), desc: t('paywall.features.adsDesc', 'Disfruta de FitGO al 100% libre de publicidad molesta o interrupciones'), badge: t('paywall.features.adsBadge', 'VIP'), badgeColor: '#10B981' },
  ];

  const COMPARISON_ROWS = [
    { icon: BrainCircuit, color: '#7C5CFC', feature: t('paywall.rows.coach', 'Coach IA'), free: t('paywall.rows.coachFree', '3-5 consultas / día'), isBlocked: false, pro: t('paywall.rows.coachPro', 'Ilimitado 24/7') },
    { icon: Camera, color: '#F59E0B', feature: t('paywall.rows.scanner', 'Escáner y Buscador'), free: t('paywall.rows.scannerFree', 'Bloqueado'), isBlocked: true, pro: t('paywall.rows.scannerPro', 'Ilimitado') },
    { icon: ChefHat, color: '#10B981', feature: t('paywall.rows.planner', 'Plan Nutricional IA'), free: t('paywall.rows.plannerFree', 'Bloqueado'), isBlocked: true, pro: t('paywall.rows.plannerPro', 'Incluido') },
    { icon: Mic, color: '#3B82F6', feature: t('paywall.rows.voice', 'Dictado por Voz'), free: t('paywall.rows.voiceFree', 'Bloqueado'), isBlocked: true, pro: t('paywall.rows.voicePro', 'Desbloqueado') },
    { icon: Activity, color: '#EF4444', feature: t('paywall.rows.directory', 'Directorio Muscular'), free: t('paywall.rows.directoryFree', 'Con anuncios'), isBlocked: false, pro: t('paywall.rows.directoryPro', 'Acceso Total') },
    { icon: History, color: '#06B6D4', feature: t('paywall.rows.history', 'Historial de Progreso'), free: t('paywall.rows.historyFree', '30 días'), isBlocked: false, pro: t('paywall.rows.historyPro', 'Ilimitado') },
    { icon: Star, color: '#EC4899', feature: t('paywall.rows.colors', 'Colores de Diseño'), free: t('paywall.rows.colorsFree', 'Por defecto'), isBlocked: false, pro: t('paywall.rows.colorsPro', '11 temas VIP') },
    { icon: ShieldOff, color: '#10B981', feature: t('paywall.rows.ads', 'Publicidad'), free: t('paywall.rows.adsFree', 'Anuncios & Videos'), isBlocked: false, pro: t('paywall.rows.adsPro', 'Cero anuncios') },
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
  
  // Always use live-converted local prices for display — RevenueCat pricing is
  // unreliable for display across currencies (sandbox mismatches, stale COP/ARS rates, etc.).
  // RevenueCat is still used to process the actual purchase transaction.
  const displayPrice = localPrice.formatPrice(2.99, lang);
  const displayOldPrice = localPrice.formatPrice(7.49, lang);

  const MODEL_CASES = [
    {
      id: 'male' as const,
      tag: t('paywall.transformations.case1.tag', 'Caso 1 · Mateo'),
      name: t('paywall.transformations.case1.name', 'Mateo C., 24 años'),
      duration: t('paywall.transformations.case1.duration', '6 meses con FitGO Pro'),
      beforeImg: require('../../assets/model/obese.png'),
      afterImg: require('../../assets/model/selfie.png'),
      stats: [
        { label: t('paywall.transformations.case1.statWeight', '-26 kg'), icon: TrendingDown, color: '#10B981' },
        { label: t('paywall.transformations.case1.statFat', '-23% grasa corporal'), icon: Flame, color: '#F59E0B' },
        { label: '6 meses', icon: Clock, color: '#3B82F6' },
      ],
      quote: t('paywall.transformations.case1.quote', 'Con el Coach IA y los menús adaptados a mis macros diarios, dejé de improvisar. El cambio físico y de confianza fue increíble.')
    },
    {
      id: 'female' as const,
      tag: t('paywall.transformations.case2.tag', 'Caso 2 · Valeria'),
      name: t('paywall.transformations.case2.name', 'Valeria M., 23 años'),
      duration: t('paywall.transformations.case2.duration', '5 meses con FitGO Pro'),
      beforeImg: require('../../assets/model/obese2.png'),
      afterImg: require('../../assets/model/selfie2.png'),
      stats: [
        { label: t('paywall.transformations.case2.statWeight', '-27 kg'), icon: TrendingDown, color: '#10B981' },
        { label: t('paywall.transformations.case2.statWaist', '-22 cm cintura'), icon: Sparkles, color: '#EC4899' },
        { label: '5 meses', icon: Clock, color: '#3B82F6' },
      ],
      quote: t('paywall.transformations.case2.quote', 'Probé dietas extremas por años. FitGO me enseñó a comer balanceado sin pasar hambre y el escáner me simplificó todo.')
    }
  ];

  const currentCase = MODEL_CASES.find(c => c.id === activeModelTab) || MODEL_CASES[0];

  const REVIEWS = [
    {
      name: t('paywall.reviews.item1.name', 'Andrés G.'),
      time: t('paywall.reviews.item1.time', 'Miembro Pro hace 7 meses'),
      comment: t('paywall.reviews.item1.comment', 'La mejor inversión para mi salud. El coach nutricional IA me ahorra cientos de dólares y los planes se adaptan a mi rutina.'),
      color: '#7C5CFC',
    },
    {
      name: t('paywall.reviews.item2.name', 'Camila D.'),
      time: t('paywall.reviews.item2.time', 'Miembro Pro hace 4 meses'),
      comment: t('paywall.reviews.item2.comment', 'El escáner de alimentos y el registro por voz son mágicos. Registro mis comidas en segundos y mi constancia se disparó.'),
      color: '#EC4899',
    },
    {
      name: t('paywall.reviews.item3.name', 'Diego L.'),
      time: t('paywall.reviews.item3.time', 'Miembro Pro hace 9 meses'),
      comment: t('paywall.reviews.item3.comment', 'Pasé de no saber qué comer a ganar masa muscular magra. Las ligas y rachas motivan a no saltarse un solo día.'),
      color: '#10B981',
    },
    {
      name: t('paywall.reviews.item4.name', 'Laura S.'),
      time: t('paywall.reviews.item4.time', 'Miembro Pro hace 3 meses'),
      comment: t('paywall.reviews.item4.comment', 'Sin anuncios y con la guía completa de ejercicios en video. Vale cada centavo, la mejor app fitness de lejos.'),
      color: '#F59E0B',
    },
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

        {/* ================================================================= */}
        {/* BENEFICIOS & COMPARATIVA PRO (REFACTORIZADO Y ELEVADO)            */}
        {/* ================================================================= */}
        <View style={s.sectionWrap}>
          {/* Section Header */}
          <View style={s.sectionHeader}>
            <View style={[s.sectionHeaderBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}>
              <Sparkles size={12} color={colors.primary} />
              <Text style={[s.sectionHeaderBadgeText, { color: colors.primary }]}>
                {t('paywall.featuresBadge', 'VENTAJAS & BENEFICIOS PRO')}
              </Text>
            </View>
            <Text style={[s.sectionHeading, { color: colors.textPrimary }]}>
              {t('paywall.sectionHeading', 'Todo lo que obtienes con Pro')}
            </Text>
            <Text style={[s.sectionSubheading, { color: colors.textSecondary }]}>
              {t('paywall.sectionSubheading', 'Herramientas inteligentes diseñadas para transformar tus resultados')}
            </Text>
          </View>

          {/* Segmented View Switcher */}
          <View style={[s.viewTabsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                s.viewTab,
                activeSectionTab === 'benefits'
                  ? [s.viewTabActive, { backgroundColor: colors.primary }]
                  : { backgroundColor: 'transparent' }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveSectionTab('benefits');
              }}
              activeOpacity={0.8}
            >
              <Sparkles size={14} color={activeSectionTab === 'benefits' ? '#fff' : colors.textSecondary} />
              <Text
                style={[
                  s.viewTabText,
                  { color: activeSectionTab === 'benefits' ? '#fff' : colors.textSecondary, fontWeight: activeSectionTab === 'benefits' ? '800' : '600' }
                ]}
              >
                {t('paywall.tabBenefits', 'Beneficios Pro')}
              </Text>
              <View style={[
                s.viewTabCountBadge,
                { backgroundColor: activeSectionTab === 'benefits' ? 'rgba(255,255,255,0.22)' : colors.border }
              ]}>
                <Text style={[s.viewTabCountText, { color: activeSectionTab === 'benefits' ? '#fff' : colors.textMuted }]}>
                  {PRO_FEATURES.length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.viewTab,
                activeSectionTab === 'compare'
                  ? [s.viewTabActive, { backgroundColor: colors.primary }]
                  : { backgroundColor: 'transparent' }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveSectionTab('compare');
              }}
              activeOpacity={0.8}
            >
              <Crown size={14} color={activeSectionTab === 'compare' ? '#fff' : colors.textSecondary} />
              <Text
                style={[
                  s.viewTabText,
                  { color: activeSectionTab === 'compare' ? '#fff' : colors.textSecondary, fontWeight: activeSectionTab === 'compare' ? '800' : '600' }
                ]}
              >
                {t('paywall.tabCompare', 'Free vs Pro')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* VISTA 1: BENEFICIOS PRO */}
          {activeSectionTab === 'benefits' && (
            <View style={s.benefitsList}>
              {PRO_FEATURES.map((feat, i) => {
                const Icon = feat.icon;
                const color = feat.badgeColor || colors.primary;
                return (
                  <View
                    key={i}
                    style={[
                      s.benefitCard,
                      { backgroundColor: colors.surface, borderColor: colors.border }
                    ]}
                  >
                    {/* Accent stripe on left */}
                    <LinearGradient
                      colors={[color, color + '40']}
                      style={s.benefitAccentStripe}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />

                    {/* Numbered icon box */}
                    <View style={s.benefitIconArea}>
                      <View style={[s.benefitIconBox, { backgroundColor: color + '12', borderColor: color + '25' }]}>
                        <Icon size={22} color={color} />
                      </View>
                      <View style={[s.benefitNumBadge, { backgroundColor: color }]}>
                        <Text style={s.benefitNumText}>{i + 1}</Text>
                      </View>
                    </View>

                    <View style={s.benefitBody}>
                      <View style={s.benefitTopLine}>
                        <Text style={[s.benefitCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                          {feat.title}
                        </Text>
                        {feat.badge && (
                          <View style={[s.benefitPill, { backgroundColor: color + '15', borderColor: color + '30' }]}>
                            <Text style={[s.benefitPillText, { color }]}>
                              {feat.badge}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[s.benefitCardDesc, { color: colors.textSecondary }]}>
                        {feat.desc}
                      </Text>
                    </View>

                    <View style={[s.benefitCheckBadge, { backgroundColor: color + '12' }]}>
                      <CheckCircle2 size={16} color={color} />
                    </View>
                  </View>
                );
              })}

              {/* Banner inferior para saltar a comparativa */}
              <TouchableOpacity
                style={[s.switchCalloutCard, { backgroundColor: colors.surface, borderColor: colors.primary + '35' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveSectionTab('compare');
                }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[colors.primary + '10', 'transparent']} style={StyleSheet.absoluteFillObject} />
                <View style={[s.switchCalloutIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Crown size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.switchCalloutTitle, { color: colors.textPrimary }]}>
                    {t('paywall.compareCalloutTitle', '¿Quieres ver la diferencia exacta?')}
                  </Text>
                  <Text style={[s.switchCalloutSub, { color: colors.textSecondary }]}>
                    {t('paywall.compareCalloutSub', 'Revisa la comparativa completa Gratis vs Pro')}
                  </Text>
                </View>
                <View style={[s.switchCalloutBtn, { backgroundColor: colors.primary }]}>
                  <Text style={s.switchCalloutBtnText}>{t('paywall.viewCompareBtn', 'Comparar →')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* VISTA 2: COMPARATIVA FREE VS PRO */}
          {activeSectionTab === 'compare' && (
            <View style={[s.compWrap, { borderColor: colors.border, backgroundColor: colors.surface + '40' }]}>
              {/* Header de columnas */}
              <View style={s.compHeaderRow}>
                <View style={s.compHeaderColFeature}>
                  <Text style={[s.compHeaderFeatureLabel, { color: colors.textMuted }]}>
                    {t('paywall.featureLabel', 'Función')}
                  </Text>
                </View>
                <View style={[s.compHeaderFree, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[s.compHeaderFreeText, { color: colors.textMuted }]}>{t('paywall.free', 'Gratis')}</Text>
                  <Text style={[s.compHeaderFreeSub, { color: colors.textMuted }]}>Básico</Text>
                </View>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={s.compHeaderPro}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={s.compHeaderProRow}>
                    <Crown size={12} color="#FFB800" />
                    <Text style={s.compHeaderProText}>{t('paywall.pro', 'PRO')}</Text>
                  </View>
                  <Text style={s.compHeaderProSub}>Acceso Total</Text>
                </LinearGradient>
              </View>

              {/* Filas comparativas */}
              <View style={{ gap: 6 }}>
                {COMPARISON_ROWS.map((row, i) => {
                  const RowIcon = row.icon;
                  return (
                    <View
                      key={i}
                      style={[s.compRowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      {/* Accent dot */}
                      <View style={[s.compRowDot, { backgroundColor: row.color }]} />
                      <View style={s.compRowFeatureCol}>
                        <View style={[s.compMiniIcon, { backgroundColor: row.color + '15' }]}>
                          <RowIcon size={15} color={row.color} />
                        </View>
                        <Text style={[s.compFeatureTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {row.feature}
                        </Text>
                      </View>

                      <View style={s.compValFreeCol}>
                        {row.isBlocked ? (
                          <View style={[s.compBlockedPill, { backgroundColor: '#EF444412', borderColor: '#EF444425' }]}>
                            <Lock size={10} color="#EF4444" />
                            <Text style={s.compBlockedText}>{row.free}</Text>
                          </View>
                        ) : (
                          <Text style={[s.compLimitedText, { color: colors.textMuted }]}>
                            {row.free}
                          </Text>
                        )}
                      </View>

                      <View style={[s.compValProCol, { backgroundColor: colors.primary + '08' }]}>
                        <View style={[s.compProBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                          <CheckCircle2 size={11} color={colors.primary} />
                          <Text style={[s.compProText, { color: colors.primary }]}>{row.pro}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Summary pill */}
              <View style={[s.compSummary, { backgroundColor: colors.primary + '0a', borderColor: colors.primary + '20' }]}>
                <Crown size={14} color={colors.primary} />
                <Text style={[s.compSummaryText, { color: colors.primary }]}>
                  {t('paywall.compareSummary', '8 funciones premium desbloqueadas con Pro')}
                </Text>
              </View>

              {/* Banner para volver a los beneficios */}
              <TouchableOpacity
                style={[s.switchCalloutCard, { backgroundColor: colors.surface, borderColor: colors.primary + '35', marginTop: 8 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveSectionTab('benefits');
                }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[colors.primary + '10', 'transparent']} style={StyleSheet.absoluteFillObject} />
                <View style={[s.switchCalloutIcon, { backgroundColor: '#10B98120' }]}>
                  <Sparkles size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.switchCalloutTitle, { color: colors.textPrimary }]}>
                    {t('paywall.benefitsCalloutTitle', 'Ver tarjetas detalladas de beneficios')}
                  </Text>
                  <Text style={[s.switchCalloutSub, { color: colors.textSecondary }]}>
                    {t('paywall.benefitsCalloutSub', 'Conoce a fondo las 9 funciones exclusivas Pro')}
                  </Text>
                </View>
                <View style={[s.switchCalloutBtn, { backgroundColor: colors.primary }]}>
                  <Text style={s.switchCalloutBtnText}>{t('paywall.viewBenefitsBtn', 'Beneficios →')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Transformations Section: Antes y Después */}
        {showSocialProof && (
          <View style={[s.modelSection, { borderColor: colors.border, backgroundColor: colors.surface + '30' }]}>
            <View style={s.modelSectionHeader}>
              <View style={[s.sectionIconBadge, { backgroundColor: '#10B98120' }]}>
                <Sparkles size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.modelSectionTitle, { color: colors.textPrimary }]}>
                  {t('paywall.transformations.sectionTitle', 'Casos de Éxito Reales')}
                </Text>
                <Text style={[s.modelSectionSub, { color: colors.textSecondary }]}>
                  {t('paywall.transformations.sectionSub', 'Resultados verificados de usuarios que transformaron su vida con FitGO')}
                </Text>
              </View>
            </View>

            {/* Selector de Modelos / Casos */}
            <View style={[s.modelTabRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {MODEL_CASES.map(item => {
                const isSelected = activeModelTab === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.modelTab, isSelected && [s.modelTabActive, { backgroundColor: colors.primary }]]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveModelTab(item.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.modelTabText, { color: isSelected ? '#fff' : colors.textSecondary, fontWeight: isSelected ? '800' : '600' }]}>
                      {item.tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tarjeta del caso activo */}
            <View style={[s.modelCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={s.modelHeader}>
                <View>
                  <Text style={[s.modelName, { color: colors.textPrimary }]}>{currentCase.name}</Text>
                  <Text style={[s.modelDuration, { color: colors.textSecondary }]}>{currentCase.duration}</Text>
                </View>
                <View style={[s.verifiedTag, { backgroundColor: '#10B98118', borderColor: '#10B98135' }]}>
                  <CheckCircle2 size={12} color="#10B981" />
                  <Text style={[s.verifiedTagText, { color: '#10B981' }]}>Verificado</Text>
                </View>
              </View>

              {/* Comparación lado a lado de imágenes */}
              <View style={s.comparisonImagesRow}>
                {/* Imagen ANTES */}
                <View style={[s.comparisonImageCol, { borderColor: colors.border }]}>
                  <Image
                    source={currentCase.beforeImg}
                    style={s.comparisonImage}
                    contentFit="cover"
                    transition={250}
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.65)', 'transparent']}
                    style={s.imageOverlayTop}
                  />
                  <View style={[s.beforePill, { backgroundColor: 'rgba(239, 68, 68, 0.9)' }]}>
                    <Text style={s.beforePillText}>{t('paywall.transformations.before', 'ANTES')}</Text>
                  </View>
                </View>

                {/* Imagen DESPUÉS */}
                <View style={[s.comparisonImageCol, { borderColor: '#10B98160' }]}>
                  <Image
                    source={currentCase.afterImg}
                    style={s.comparisonImage}
                    contentFit="cover"
                    transition={250}
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.65)', 'transparent']}
                    style={s.imageOverlayTop}
                  />
                  <View style={[s.afterPill, { backgroundColor: '#10B981' }]}>
                    <Sparkles size={10} color="#fff" />
                    <Text style={s.afterPillText}>{t('paywall.transformations.after', 'DESPUÉS')}</Text>
                  </View>
                </View>
              </View>

              {/* Píldoras de métricas destacadas */}
              <View style={s.statsRow}>
                {currentCase.stats.map((st, i) => {
                  const Icon = st.icon;
                  return (
                    <View key={i} style={[s.statPill, { backgroundColor: st.color + '15', borderColor: st.color + '30' }]}>
                      <Icon size={12} color={st.color} />
                      <Text style={[s.statPillText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Cita / Testimonio */}
              <View style={[s.quoteBox, { backgroundColor: colors.background, borderColor: colors.border + '60' }]}>
                <Quote size={13} color={colors.primary} style={{ marginTop: 2, marginRight: 6, flexShrink: 0 }} />
                <Text style={[s.quoteText, { color: colors.textSecondary }]}>
                  {`"${currentCase.quote}"`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Community Reviews Section: Reseñas y Testimonios */}
        {showSocialProof && (
          <View style={[s.reviewsSection, { borderColor: colors.border, backgroundColor: colors.surface + '30' }]}>
            <View style={s.reviewsHeader}>
              <View style={[s.sectionIconBadge, { backgroundColor: '#FFB80020' }]}>
                <Star size={18} color="#FFB800" fill="#FFB800" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.modelSectionTitle, { color: colors.textPrimary }]}>
                  {t('paywall.reviews.sectionTitle', 'Lo que dice nuestra comunidad')}
                </Text>
                <Text style={[s.modelSectionSub, { color: colors.textSecondary }]}>
                  {t('paywall.reviews.ratingTotal', 'Más de 12,400 valoraciones de 5 estrellas')}
                </Text>
              </View>
            </View>

            {/* Social Proof Score Banner */}
            <View style={[s.socialScoreBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={s.socialScoreLeft}>
                <Text style={[s.socialScoreNum, { color: colors.textPrimary }]}>4.9</Text>
                <View style={s.starsRow}>
                  {[1, 2, 3, 4, 5].map(st => (
                    <Star key={st} size={13} color="#FFB800" fill="#FFB800" />
                  ))}
                </View>
                <Text style={[s.socialScoreLabel, { color: colors.textMuted }]}>
                  {t('paywall.reviews.ratingScore', '4.9 / 5.0')}
                </Text>
              </View>
              <View style={[s.socialScoreDivider, { backgroundColor: colors.border }]} />
              <View style={s.socialScoreRight}>
                <View style={s.socialStatRow}>
                  <Flame size={14} color="#EF4444" />
                  <Text style={[s.socialStatText, { color: colors.textPrimary }]}>
                    {t('paywall.reviews.successRate', '94% logra su objetivo en 90 días')}
                  </Text>
                </View>
                <View style={s.socialStatRow}>
                  <Users size={14} color={colors.primary} />
                  <Text style={[s.socialStatText, { color: colors.textSecondary }]}>
                    {t('paywall.reviews.verifiedUser', 'Usuario Pro Verificado')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tarjetas de Reseñas */}
            <View style={{ gap: 10 }}>
              {REVIEWS.map((rev, i) => (
                <View key={i} style={[s.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={s.reviewCardTop}>
                    <View style={[s.reviewAvatar, { backgroundColor: rev.color + '25' }]}>
                      <Text style={[s.reviewAvatarText, { color: rev.color }]}>
                        {rev.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={s.reviewNameRow}>
                        <Text style={[s.reviewName, { color: colors.textPrimary }]}>{rev.name}</Text>
                        <View style={[s.verifiedReviewBadge, { backgroundColor: '#10B98115' }]}>
                          <CheckCircle2 size={10} color="#10B981" />
                          <Text style={s.verifiedReviewText}>Pro</Text>
                        </View>
                      </View>
                      <Text style={[s.reviewTime, { color: colors.textMuted }]}>{rev.time}</Text>
                    </View>
                    <View style={s.starsRow}>
                      {[1, 2, 3, 4, 5].map(st => (
                        <Star key={st} size={11} color="#FFB800" fill="#FFB800" />
                      ))}
                    </View>
                  </View>
                  <Text style={[s.reviewComment, { color: colors.textSecondary }]}>
                    {`"${rev.comment}"`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
              <View style={s.priceSuffixCol}>
                <View style={[s.currencyBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}>
                  <Text style={[s.currencyCode, { color: colors.primary }]}>{localPrice.currency}</Text>
                </View>
                <Text style={[s.priceSuffix, { color: colors.textSecondary }]}>{getMonthSuffix(lang)}</Text>
              </View>
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

  // Unified Section: Beneficios & Comparativa Pro
  sectionWrap: {
    marginBottom: 28,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginBottom: 10,
  },
  sectionHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionSubheading: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },

  // View Switcher Tabs
  viewTabsContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginBottom: 16,
    gap: 6,
  },
  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  viewTabActive: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  viewTabText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  viewTabCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  viewTabCountText: {
    fontSize: 10,
    fontWeight: '900',
  },

  // View 1: Beneficios Pro
  benefitsList: {
    gap: 10,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 18,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 14,
    overflow: 'hidden',
    position: 'relative' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  benefitAccentStripe: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: Radius.xl,
    borderBottomLeftRadius: Radius.xl,
  },
  benefitIconArea: {
    position: 'relative' as const,
    flexShrink: 0,
  },
  benefitIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  benefitNumBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitNumText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  benefitBody: {
    flex: 1,
  },
  benefitTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  benefitCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    flex: 1,
  },
  benefitPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  benefitPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  benefitCardDesc: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  benefitCheckBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  // Callout Banner
  switchCalloutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    marginTop: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  switchCalloutIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  switchCalloutTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  switchCalloutSub: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  switchCalloutBtn: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  switchCalloutBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  // View 2: Comparativa Free vs Pro
  compWrap: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  compHeaderRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginBottom: 14,
  },
  compHeaderColFeature: {
    flex: 1.2,
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  compHeaderFeatureLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  compHeaderFree: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  compHeaderFreeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  compHeaderFreeSub: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 1,
  },
  compHeaderPro: {
    flex: 1.2,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.lg,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  compHeaderProRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compHeaderProText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  compHeaderProSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 1,
  },
  compRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 10,
    gap: 6,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  compRowDot: {
    position: 'absolute' as const,
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  compRowFeatureCol: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  compMiniIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  compFeatureTitle: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  compValFreeCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compBlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  compBlockedText: {
    color: '#EF4444',
    fontSize: 9.5,
    fontWeight: '800',
  },
  compLimitedText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  compValProCol: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: Radius.sm,
  },
  compProBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  compProText: {
    fontSize: 10.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  compSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  compSummaryText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

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
  newPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  priceSuffixCol: { flexDirection: 'column', gap: 4, justifyContent: 'center' },
  currencyBadge: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  currencyCode: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  priceSuffix: { fontSize: 13, fontWeight: '600' },
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

  // Transformations Antes y Después
  modelSection: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  modelSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  modelSectionSub: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  modelTabRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 14,
    gap: 6,
  },
  modelTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelTabActive: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modelTabText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  modelCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modelName: {
    fontSize: 15,
    fontWeight: '800',
  },
  modelDuration: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  comparisonImagesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  comparisonImageCol: {
    flex: 1,
    height: 250,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    position: 'relative',
  },
  comparisonImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  beforePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  beforePillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  afterPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  afterPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  quoteText: {
    flex: 1,
    fontSize: 11.5,
    fontStyle: 'italic',
    lineHeight: 16,
    fontWeight: '500',
  },

  // Reviews section
  reviewsSection: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  socialScoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 14,
  },
  socialScoreLeft: {
    alignItems: 'center',
    paddingRight: 14,
  },
  socialScoreNum: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  socialScoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  socialScoreDivider: {
    width: 1,
    height: 48,
    marginRight: 14,
  },
  socialScoreRight: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  socialStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialStatText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  reviewCard: {
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  reviewCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: 13,
    fontWeight: '900',
  },
  reviewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewName: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  verifiedReviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedReviewText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
  },
  reviewTime: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  reviewComment: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },
});
