import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Pressable,
  Platform,
  Animated as RNAnimated,
  Easing as RNEasing,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Globe,
  ChevronDown,
  Apple,
  Bot,
  Calendar,
  Trophy,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  Circle,
  Rect,
} from 'react-native-svg';
import { useSettingsStore } from '../../store';
import LanguageModal from '../../components/LanguageModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 40 - 12) / 2;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  it: 'Italiano',
  de: 'Deutsch',
  ru: 'Русский',
};

// ─── Dynamic Wavy Mesh Particle Background ──────────────────────────────────
function AmbientWaveBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg
        height="100%"
        width="100%"
        viewBox="0 0 400 850"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgLinearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.45" />
            <Stop offset="50%" stopColor="#A855F7" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#00FF9D" stopOpacity="0.12" />
          </SvgLinearGradient>
          <SvgLinearGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
            <Stop offset="50%" stopColor="#7C3AED" stopOpacity="0.28" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Ambient dotted cosmic wave lines */}
        <Path
          d="M-40 220 C 80 160, 160 300, 260 210 C 340 140, 390 260, 440 200"
          fill="none"
          stroke="url(#waveGrad1)"
          strokeWidth="1.6"
          strokeDasharray="3, 7"
        />
        <Path
          d="M-50 240 C 70 180, 170 320, 270 230 C 350 160, 380 280, 450 220"
          fill="none"
          stroke="url(#waveGrad1)"
          strokeWidth="1"
          strokeDasharray="2, 5"
          opacity="0.7"
        />
        <Path
          d="M-30 260 C 90 200, 180 340, 280 250 C 360 180, 400 300, 460 240"
          fill="none"
          stroke="url(#waveGrad1)"
          strokeWidth="0.8"
          strokeDasharray="1, 6"
          opacity="0.5"
        />
        <Path
          d="M-60 200 C 60 140, 150 280, 250 190 C 330 120, 370 240, 430 180"
          fill="none"
          stroke="url(#waveGrad2)"
          strokeWidth="1.2"
          strokeDasharray="4, 8"
          opacity="0.6"
        />

        {/* Ambient floating light particles */}
        <Circle cx="40" cy="180" r="1.5" fill="#A78BFA" opacity="0.6" />
        <Circle cx="350" cy="150" r="2" fill="#00FF9D" opacity="0.7" />
        <Circle cx="380" cy="280" r="1.8" fill="#C084FC" opacity="0.5" />
        <Circle cx="25" cy="380" r="1.2" fill="#818CF8" opacity="0.6" />
        <Circle cx="370" cy="420" r="1.6" fill="#A78BFA" opacity="0.4" />
      </Svg>
    </View>
  );
}

// ─── FitGO Stylized Brand Logo ──────────────────────────────────────────────
function FitGoLogo() {
  return (
    <View style={styles.brandRow}>
      {/* "Fit" in crisp bold italic white */}
      <Text style={styles.brandFit}>Fit</Text>

      {/* "G" in bold italic violet */}
      <Text style={styles.brandG}>G</Text>

      {/* "O" styled as neon purple ring with neon mint lightning bolt */}
      <View style={styles.brandOContainer}>
        <LinearGradient
          colors={['#8B5CF6', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandOBorder}
        >
          <View style={styles.brandOInner}>
            <Zap size={22} color="#00FF9D" fill="#00FF9D" />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

// ─── Floating Animations (Native Driver) ───────────────────────────────────
function FloatingLogo({ children }: { children: React.ReactNode }) {
  const floatAnim = React.useRef(new RNAnimated.Value(0)).current;
  const pulseAnim = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    const floatLoop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(floatAnim, {
          toValue: 1,
          duration: 2800,
          easing: RNEasing.inOut(RNEasing.sin),
          useNativeDriver: true,
        }),
        RNAnimated.timing(floatAnim, {
          toValue: 0,
          duration: 2800,
          easing: RNEasing.inOut(RNEasing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const pulseLoop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: RNEasing.inOut(RNEasing.sin),
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 0,
          duration: 2200,
          easing: RNEasing.inOut(RNEasing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [floatAnim, pulseAnim]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 6],
  });

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.03],
  });

  return (
    <RNAnimated.View style={{ alignItems: 'center', transform: [{ translateY }, { scale }] }}>
      {children}
    </RNAnimated.View>
  );
}

function FloatingCard({
  children,
  delay = 0,
  offset = 3.5,
  duration = 3200,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  offset?: number;
  duration?: number;
  style?: any;
}) {
  const anim = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    let animation: RNAnimated.CompositeAnimation;
    const timeout = setTimeout(() => {
      animation = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(anim, {
            toValue: 1,
            duration: duration / 2,
            easing: RNEasing.inOut(RNEasing.sin),
            useNativeDriver: true,
          }),
          RNAnimated.timing(anim, {
            toValue: 0,
            duration: duration / 2,
            easing: RNEasing.inOut(RNEasing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      animation?.stop();
    };
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-offset, offset],
  });

  return (
    <RNAnimated.View style={[style, { transform: [{ translateY }] }]}>
      {children}
    </RNAnimated.View>
  );
}

function FloatingBadgeIcon({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}) {
  const anim = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    let animation: RNAnimated.CompositeAnimation;
    const timeout = setTimeout(() => {
      animation = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(anim, {
            toValue: 1,
            duration: 1800,
            easing: RNEasing.inOut(RNEasing.sin),
            useNativeDriver: true,
          }),
          RNAnimated.timing(anim, {
            toValue: 0,
            duration: 1800,
            easing: RNEasing.inOut(RNEasing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      animation?.stop();
    };
  }, [anim, delay]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2.5],
  });

  return (
    <RNAnimated.View style={[style, { transform: [{ scale }, { translateY }] }]}>
      {children}
    </RNAnimated.View>
  );
}

// ─── Main Welcome Screen ────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useSettingsStore();
  const [langModalVisible, setLangModalVisible] = React.useState(false);

  // ── Navigation Handlers ───────────────────────────────────────────────────
  const handleGetStarted = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    router.push('/(auth)/register');
  };

  const handleLogin = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push('/(auth)/login');
  };

  const handleTermsPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push('/modals/terms');
  };

  // ── 4 Feature Cards Data ──────────────────────────────────────────────────
  const features = [
    {
      id: 'nutrition',
      icon: <Apple size={20} color="#00FF9D" strokeWidth={2.2} />,
      title: t('welcome.feature1Title', 'Nutrición inteligente'),
      desc: t('welcome.feature1Desc', 'Escanea, registra y entiende lo que comes.'),
      delay: 150,
    },
    {
      id: 'coach',
      icon: <Bot size={20} color="#00FF9D" strokeWidth={2.2} />,
      title: t('welcome.feature2Title', 'Coach con IA'),
      desc: t('welcome.feature2Desc', 'Recomendaciones personalizadas según tus metas.'),
      delay: 250,
    },
    {
      id: 'plans',
      icon: <Calendar size={20} color="#00FF9D" strokeWidth={2.2} />,
      title: t('welcome.feature3Title', 'Planes personalizados'),
      desc: t('welcome.feature3Desc', 'Comidas y entrenamientos hechos para ti.'),
      delay: 350,
    },
    {
      id: 'progress',
      icon: <Trophy size={20} color="#00FF9D" strokeWidth={2.2} />,
      title: t('welcome.feature4Title', 'Progreso y retos'),
      desc: t('welcome.feature4Desc', 'Sigue tu avance, compite y gana recompensas.'),
      delay: 450,
    },
  ];

  const currentLangLabel = LANGUAGE_NAMES[language] || language.toUpperCase();
  const rawSubtitle = String(
    t(
      'welcome.heroSubtitle',
      'Nutrición inteligente, entrenamiento y un coach de IA que te acompaña.'
    )
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Deep Rich Cosmic Midnight Background */}
      <LinearGradient
        colors={['#060212', '#100624', '#080316']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Wavy Light Particle Mesh */}
      <AmbientWaveBackground />

      {/* Language Selector Pill (Top Left) */}
      <TouchableOpacity
        style={[styles.langBtn, { top: Math.max(insets.top + 8, 44) }]}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          setLangModalVisible(true);
        }}
        activeOpacity={0.75}
      >
        <Globe size={16} color="#E2E8F0" />
        <Text style={styles.langText}>{currentLangLabel}</Text>
        <ChevronDown size={14} color="#94A3B8" />
      </TouchableOpacity>

      <LanguageModal
        visible={langModalVisible}
        currentLang={language}
        onSelect={setLanguage}
        onClose={() => setLangModalVisible(false)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 56, 90),
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ─── Hero Section ──────────────────────────────────────────────── */}
        <View style={styles.heroContainer}>
          <FloatingLogo>
            {/* Ambient Purple Radial Halo Behind FitGO */}
            <View style={styles.haloGlowContainer}>
              <Svg height={160} width={260} viewBox="0 0 260 160">
                <Defs>
                  <SvgRadialGradient
                    id="haloGrad"
                    cx="50%"
                    cy="50%"
                    r="50%"
                    fx="50%"
                    fy="50%"
                  >
                    <Stop offset="0%" stopColor="#7C3AED" stopOpacity="0.75" />
                    <Stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.35" />
                    <Stop offset="100%" stopColor="#060212" stopOpacity="0" />
                  </SvgRadialGradient>
                </Defs>
                <Rect x="0" y="0" width="260" height="160" fill="url(#haloGrad)" />
              </Svg>
            </View>

            {/* FitGO Brand Logo */}
            <View style={styles.logoWrapper}>
              <FitGoLogo />
            </View>
          </FloatingLogo>

          {/* Title & Taglines */}
          <View style={styles.titleBlock}>
            <Text style={styles.mainTitleLine1}>
              {t('welcome.heroTitle1', 'Tu mejor versión empieza')}
            </Text>
            <View style={styles.highlightRow}>
              <Text style={styles.mainTitleHighlight}>
                {t('welcome.heroTitle2', 'aquí.')}
              </Text>
              {/* Neon cyan underline dash */}
              <View style={styles.accentDash} />
            </View>

            <Text style={styles.subTitle}>
              {rawSubtitle.includes('IA') || rawSubtitle.includes('AI') ? (
                rawSubtitle.split(/(IA|AI)/g).map((part, index) => (
                  <React.Fragment key={index}>
                    {part === 'IA' || part === 'AI' ? (
                      <Text style={styles.subTitleIa}>{part}</Text>
                    ) : (
                      part
                    )}
                  </React.Fragment>
                ))
              ) : (
                rawSubtitle
              )}
            </Text>
          </View>
        </View>

        {/* ─── 2x2 Feature Cards Grid (Staggered Floating) ───────────────── */}
        <View style={styles.gridContainer}>
          {features.map((item, index) => (
            <FloatingCard
              key={item.id}
              delay={index * 350}
              offset={index % 2 === 0 ? 3 : 4}
              duration={3000 + (index * 400)}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrapper}>{item.icon}</View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.desc}
              </Text>
            </FloatingCard>
          ))}
        </View>

        {/* ─── Action Buttons & Trust Elements ──────────────────────────── */}
        <View style={styles.actionsSection}>
          {/* Primary CTA Button */}
          <View>
            <Pressable
              onPress={handleGetStarted}
              style={styles.primaryBtn}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
            >
              <LinearGradient
                colors={['#7C5CFC', '#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryBtnText}>
                  {t('welcome.getStarted', 'Crear mi plan gratis')}
                </Text>
                <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.4} style={{ marginLeft: 8 }} />
              </LinearGradient>
            </Pressable>
          </View>

          {/* Secondary Button */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>
              {t('welcome.haveAccount', 'Ya tengo una cuenta')}
            </Text>
          </TouchableOpacity>

          {/* Trust & Security Badges (2 columns) */}
          <View style={styles.trustBadgesRow}>
            {/* Badge 1: Free to start */}
            <View style={styles.trustBadge}>
              <FloatingBadgeIcon delay={0}>
                <View style={styles.trustIconWrapCyan}>
                  <CheckCircle2 size={16} color="#00FF9D" strokeWidth={2.4} />
                </View>
              </FloatingBadgeIcon>
              <View style={styles.trustTexts}>
                <Text style={styles.trustTitle}>
                  {t('welcome.trustFree', 'Gratis para comenzar')}
                </Text>
                <Text style={styles.trustSub}>
                  {t('welcome.trustFreeSub', 'Sin tarjeta de crédito')}
                </Text>
              </View>
            </View>

            {/* Badge 2: Data Protected */}
            <View style={styles.trustBadge}>
              <FloatingBadgeIcon delay={600}>
                <View style={styles.trustIconWrapPurple}>
                  <ShieldCheck size={16} color="#A78BFA" strokeWidth={2.2} />
                </View>
              </FloatingBadgeIcon>
              <View style={styles.trustTexts}>
                <Text style={styles.trustTitle}>
                  {t('welcome.trustSecure', 'Tus datos están protegidos')}
                </Text>
                <Text style={styles.trustSub}>
                  {t('welcome.trustSecureSub', 'Privacidad y seguridad')}
                </Text>
              </View>
            </View>
          </View>

          {/* Legal / Terms of Service */}
          <View style={styles.legalRow}>
            <Text style={styles.legalText}>
              {t('welcome.legalPrefix', 'Al continuar, aceptas nuestros ')}
              <Text style={styles.legalLink} onPress={handleTermsPress}>
                {t('welcome.terms', 'Términos de servicio')}
              </Text>
              {t('welcome.and', ' y ')}
              <Text style={styles.legalLink} onPress={handleTermsPress}>
                {t('welcome.privacy', 'Política de privacidad.')}
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060212',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },

  // ── Language Selector (Pill Top Left) ──
  langBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
    height: 38,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 6,
  },
  langText: {
    color: '#F1F5F9',
    fontSize: 13.5,
    fontWeight: '600',
  },

  // ── Hero Section ──
  heroContainer: {
    alignItems: 'center',
    position: 'relative',
    marginTop: 6,
    marginBottom: 20,
  },
  haloGlowContainer: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    width: 260,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandFit: {
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  brandG: {
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#C084FC',
    letterSpacing: -1.5,
  },
  brandOContainer: {
    marginLeft: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandOBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandOInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#1E1038',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Titles ──
  titleBlock: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  mainTitleLine1: {
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  highlightRow: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  mainTitleHighlight: {
    fontSize: 29,
    fontWeight: '900',
    color: '#00FF9D',
    letterSpacing: -0.4,
  },
  accentDash: {
    width: 38,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#00FF9D',
    marginTop: 4,
  },
  subTitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 320,
  },
  subTitleIa: {
    color: '#00FF9D',
    fontWeight: '800',
  },

  // ── 2x2 Feature Grid ──
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(24, 15, 48, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 92, 252, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardDesc: {
    color: '#94A3B8',
    fontSize: 11.8,
    lineHeight: 16.5,
    fontWeight: '400',
  },

  // ── Actions & Buttons ──
  actionsSection: {
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  primaryGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  shimmerSheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Trust & Security Badges ──
  trustBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  trustBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustIconWrapCyan: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 255, 157, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustIconWrapPurple: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(124, 92, 252, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustTexts: {
    flex: 1,
  },
  trustTitle: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  trustSub: {
    color: '#94A3B8',
    fontSize: 10.2,
    fontWeight: '400',
    marginTop: 1,
  },

  // ── Legal ──
  legalRow: {
    marginTop: 6,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  legalText: {
    color: '#64748B',
    fontSize: 11.2,
    lineHeight: 16,
    textAlign: 'center',
  },
  legalLink: {
    color: '#818CF8',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
