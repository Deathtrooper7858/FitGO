import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Bot,
  CreditCard,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  STRUCTURED_TERMS,
  STRUCTURED_PRIVACY,
  LegalItem,
} from '../../constants/legalData';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LegalScreen() {
  const { tab } = useLocalSearchParams();
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(
    tab === 'privacy' ? 'privacy' : 'terms'
  );
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const lang = i18n.language?.startsWith('es') ? 'es' : 'en';
  const docData =
    activeTab === 'terms'
      ? STRUCTURED_TERMS[lang] || STRUCTURED_TERMS.en
      : STRUCTURED_PRIVACY[lang] || STRUCTURED_PRIVACY.en;

  const toggleExpand = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleTabChange = (newTab: 'terms' | 'privacy') => {
    if (newTab === activeTab) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    setActiveTab(newTab);
    setExpandedIds({});
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleAccept = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    router.back();
  };

  const renderTextWithLinks = (text?: string) => {
    if (!text) return null;
    const linkRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    const parts = text.split(linkRegex);

    return (
      <Text style={styles.contentText}>
        {parts.map((part, i) => {
          if (part.match(/https?:\/\/[^\s]+/)) {
            return (
              <Text
                key={i}
                style={styles.inlineLink}
                onPress={() => Linking.openURL(part)}
              >
                {part}
              </Text>
            );
          } else if (part.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/)) {
            return (
              <Text
                key={i}
                style={styles.inlineLink}
                onPress={() => Linking.openURL(`mailto:${part}`)}
              >
                {part}
              </Text>
            );
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
  };

  const renderCallout = (item: LegalItem) => {
    let borderColor = 'rgba(6, 182, 212, 0.45)';
    let bgColor = 'rgba(6, 182, 212, 0.08)';
    let iconColor = '#06B6D4';
    let IconComponent = ShieldCheck;

    if (item.calloutType === 'ai') {
      borderColor = 'rgba(139, 92, 246, 0.5)';
      bgColor = 'rgba(139, 92, 246, 0.08)';
      iconColor = '#A855F7';
      IconComponent = Bot;
    } else if (item.calloutType === 'billing') {
      borderColor = 'rgba(245, 158, 11, 0.5)';
      bgColor = 'rgba(245, 158, 11, 0.08)';
      iconColor = '#F59E0B';
      IconComponent = CreditCard;
    } else if (item.calloutType === 'security') {
      borderColor = 'rgba(16, 185, 129, 0.5)';
      bgColor = 'rgba(16, 185, 129, 0.08)';
      iconColor = '#10B981';
      IconComponent = Lock;
    }

    return (
      <View
        key={item.id}
        style={[
          styles.calloutCard,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
          },
        ]}
      >
        <View style={styles.calloutContentRow}>
          <View style={[styles.calloutIconWrap, { borderColor: `${iconColor}33` }]}>
            <IconComponent size={24} color={iconColor} strokeWidth={2.2} />
          </View>
          <View style={styles.calloutTextWrap}>
            <Text style={[styles.calloutTitle, { color: iconColor }]}>
              {item.title}
            </Text>
            <Text style={styles.calloutBody}>{item.fullContent}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderClause = (item: LegalItem) => {
    const isExpanded = !!expandedIds[item.id];

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.75}
        onPress={() => toggleExpand(item.id)}
        style={[
          styles.clauseCard,
          isExpanded && styles.clauseCardExpanded,
        ]}
      >
        <View style={styles.clauseHeader}>
          <View style={styles.clauseNumberBadge}>
            <Text style={styles.clauseNumberText}>{item.number}</Text>
          </View>
          <View style={styles.clauseTitleWrap}>
            <Text style={styles.clauseTitle}>{item.title}</Text>
          </View>
          <View style={styles.clauseChevronWrap}>
            {isExpanded ? (
              <ChevronDown size={20} color="#A855F7" />
            ) : (
              <ChevronRight size={20} color="#7C3AED" />
            )}
          </View>
        </View>

        {item.summary && !isExpanded && (
          <Text style={styles.clauseSummary} numberOfLines={2}>
            {item.summary}
          </Text>
        )}

        {isExpanded && (
          <View style={styles.expandedContentWrap}>
            <View style={styles.expandedDivider} />
            {renderTextWithLinks(item.fullContent || item.summary)}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0B0E17' }]}>
      {/* Background glow ambiance */}
      <LinearGradient
        colors={['#1E103A', '#0B0E17', '#080A11']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />
      <View style={styles.topAmbientGlow} />

      {/* Header Bar */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Math.max(insets.top + 8, 44) },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft color="#C084FC" size={24} />
          <Text style={styles.backBtnText}>
            {lang === 'es' ? 'Volver' : 'Back'}
          </Text>
        </TouchableOpacity>

        <View style={styles.titleSection}>
          <View style={styles.shieldIconContainer}>
            <LinearGradient
              colors={['#2D1B54', '#17112E']}
              style={styles.shieldGradient}
            >
              {activeTab === 'terms' ? (
                <ShieldCheck color="#A855F7" size={32} strokeWidth={2.4} />
              ) : (
                <Lock color="#A855F7" size={30} strokeWidth={2.4} />
              )}
            </LinearGradient>
          </View>

          <View style={styles.titleTexts}>
            <Text style={styles.mainTitleText}>{docData.title}</Text>
            <Text style={styles.companySubText}>{docData.company}</Text>
          </View>
        </View>

        {/* Tab Switcher Segmented Control */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'terms' && styles.activeTabItem,
            ]}
            onPress={() => handleTabChange('terms')}
            activeOpacity={0.85}
          >
            {activeTab === 'terms' && (
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )}
            <Text
              style={[
                styles.tabText,
                activeTab === 'terms' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              {lang === 'es' ? 'Términos' : 'Terms'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'privacy' && styles.activeTabItem,
            ]}
            onPress={() => handleTabChange('privacy')}
            activeOpacity={0.85}
          >
            {activeTab === 'privacy' && (
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )}
            <Text
              style={[
                styles.tabText,
                activeTab === 'privacy' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              {lang === 'es' ? 'Privacidad' : 'Privacy'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Stream */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 140, 160) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Updated Date Card */}
        <View style={styles.metaCard}>
          <View style={styles.calendarBadge}>
            <Calendar color="#A855F7" size={20} strokeWidth={2.2} />
          </View>
          <View style={styles.metaTexts}>
            <Text style={styles.metaLabel}>{docData.lastUpdatedLabel}</Text>
            <Text style={styles.metaDate}>{docData.lastUpdatedDate}</Text>
          </View>
        </View>

        {/* Dynamic Clauses and Callout Banners */}
        {docData.items.map((item) => {
          if (item.type === 'callout') {
            return renderCallout(item);
          }
          return renderClause(item);
        })}

        {/* Completion Celebration Card */}
        <View style={styles.completionCard}>
          <LinearGradient
            colors={['#16132D', '#0F1122']}
            style={styles.completionGradient}
          >
            <View style={styles.completionLeft}>
              <View style={styles.completionIconBadge}>
                <CheckCircle2 color="#A855F7" size={22} strokeWidth={2.2} />
              </View>
              <View style={styles.completionTexts}>
                <Text style={styles.completionTitle}>
                  {lang === 'es' ? 'Has llegado al final' : "You've reached the end"}
                </Text>
                <Text style={styles.completionSub}>
                  {lang === 'es'
                    ? 'Por favor asegúrate de haber revisado los términos antes de continuar.'
                    : "Please make sure you've reviewed the Terms & Conditions before continuing."}
                </Text>
              </View>
            </View>

            {/* Stylized Document Illustration Badge */}
            <View style={styles.docIllustrationWrap}>
              <View style={styles.docMiniPaper}>
                <View style={styles.docMiniShield}>
                  <ShieldCheck size={13} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <View style={styles.docMiniLine1} />
                <View style={styles.docMiniLine2} />
              </View>
              <Sparkles
                size={14}
                color="#C084FC"
                style={styles.sparkleTop}
              />
              <Sparkles
                size={10}
                color="#818CF8"
                style={styles.sparkleBottom}
              />
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Floating Sticky Footer */}
      <LinearGradient
        colors={['rgba(11, 14, 23, 0)', 'rgba(11, 14, 23, 0.95)', '#0B0E17']}
        style={[
          styles.stickyFooter,
          { paddingBottom: Math.max(insets.bottom + 12, 24) },
        ]}
      >
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAccept}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            style={styles.acceptButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.acceptButtonText}>
              {lang === 'es' ? 'He leído y Acepto' : 'I Accept & Understand'}
            </Text>
            <ArrowRight color="#FFFFFF" size={20} strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.subFooterRow}
          activeOpacity={0.7}
          onPress={() => handleTabChange(activeTab === 'terms' ? 'privacy' : 'terms')}
        >
          <Lock size={14} color="#06B6D4" strokeWidth={2.2} />
          <Text style={styles.subFooterText}>
            {lang === 'es' ? (
              <>
                Tu privacidad es importante para nosotros. Lee nuestra{' '}
                <Text style={styles.subFooterHighlight}>
                  {activeTab === 'terms' ? 'Política de Privacidad' : 'Términos de Servicio'}
                </Text>
                .
              </>
            ) : (
              <>
                Your privacy is important to us. Read our{' '}
                <Text style={styles.subFooterHighlight}>
                  {activeTab === 'terms' ? 'Privacy Policy' : 'Terms & Conditions'}
                </Text>{' '}
                to learn more.
              </>
            )}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topAmbientGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#7C3AED',
    opacity: 0.18,
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(11, 14, 23, 0.85)',
    zIndex: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: -4,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C084FC',
    marginLeft: 2,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  shieldIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  shieldGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTexts: {
    flex: 1,
  },
  mainTitleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  companySubText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#13182A',
    borderRadius: 9999,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  activeTabItem: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextInactive: {
    color: '#94A3B8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121727',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 12,
  },
  calendarBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaTexts: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  metaDate: {
    fontSize: 14.5,
    color: '#F8FAFC',
    fontWeight: '700',
    marginTop: 1,
  },
  clauseCard: {
    backgroundColor: '#121727',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    marginBottom: 12,
  },
  clauseCardExpanded: {
    borderColor: 'rgba(168, 85, 247, 0.35)',
    backgroundColor: '#141A2D',
  },
  clauseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clauseNumberBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  clauseNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C084FC',
  },
  clauseTitleWrap: {
    flex: 1,
  },
  clauseTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  clauseChevronWrap: {
    paddingLeft: 4,
  },
  clauseSummary: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#94A3B8',
    marginTop: 10,
  },
  expandedContentWrap: {
    marginTop: 12,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 13.5,
    lineHeight: 21,
    color: '#CBD5E1',
  },
  inlineLink: {
    color: '#C084FC',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  calloutCard: {
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 15,
    marginBottom: 12,
  },
  calloutContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  calloutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 2,
  },
  calloutTextWrap: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  calloutBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#E2E8F0',
    fontWeight: '400',
  },
  completionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    marginTop: 8,
    marginBottom: 16,
  },
  completionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  completionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  completionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionTexts: {
    flex: 1,
  },
  completionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  completionSub: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#94A3B8',
    marginTop: 2,
  },
  docIllustrationWrap: {
    position: 'relative',
    width: 58,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docMiniPaper: {
    width: 44,
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  docMiniShield: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docMiniLine1: {
    width: '100%',
    height: 2.5,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
  },
  docMiniLine2: {
    width: '65%',
    height: 2.5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  sparkleTop: {
    position: 'absolute',
    top: 2,
    right: 0,
  },
  sparkleBottom: {
    position: 'absolute',
    bottom: 4,
    left: 2,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  acceptButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 12,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  subFooterText: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
  },
  subFooterHighlight: {
    color: '#06B6D4',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
