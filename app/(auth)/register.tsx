import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Animated as RNAnimated,
  Easing as RNEasing,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  Award,
  Zap,
} from 'lucide-react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
} from 'react-native-svg';

import { supabase } from '../../services';
import { useAuthStore } from '../../store';
import { CustomAlert, AlertType } from '../../components/CustomAlert';

WebBrowser.maybeCompleteAuthSession();

// ─── Ambient Wavy Background ────────────────────────────────────────────────
function AmbientBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#06020E', '#100720', '#06020E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg
        height="100%"
        width="100%"
        viewBox="0 0 400 850"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgLinearGradient id="regWave1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.4" />
            <Stop offset="50%" stopColor="#A855F7" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#00F0FF" stopOpacity="0.1" />
          </SvgLinearGradient>
          <SvgLinearGradient id="regWave2" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <Stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Ambient dotted wave lines */}
        <Path
          d="M-50 180 C 70 120, 150 260, 260 170 C 340 100, 390 220, 450 160"
          fill="none"
          stroke="url(#regWave1)"
          strokeWidth="1.4"
          strokeDasharray="3, 7"
        />
        <Path
          d="M-40 210 C 80 150, 170 290, 270 200 C 350 130, 390 250, 460 190"
          fill="none"
          stroke="url(#regWave1)"
          strokeWidth="0.9"
          strokeDasharray="2, 5"
          opacity="0.6"
        />
        <Path
          d="M-60 760 C 60 700, 160 830, 260 740 C 340 680, 390 790, 450 730"
          fill="none"
          stroke="url(#regWave2)"
          strokeWidth="1.2"
          strokeDasharray="3, 6"
          opacity="0.5"
        />

        {/* Ambient glowing particles */}
        <Circle cx="30" cy="140" r="1.5" fill="#A78BFA" opacity="0.6" />
        <Circle cx="360" cy="110" r="2" fill="#00F0FF" opacity="0.7" />
        <Circle cx="375" cy="240" r="1.6" fill="#C084FC" opacity="0.5" />
        <Circle cx="20" cy="420" r="1.2" fill="#818CF8" opacity="0.5" />
        <Circle cx="360" cy="700" r="1.8" fill="#00FF9D" opacity="0.6" />
        <Circle cx="40" cy="740" r="1.4" fill="#A78BFA" opacity="0.5" />
      </Svg>
    </View>
  );
}

// ─── Floating Animation Wrapper (Native Driver) ─────────────────────────────
function FloatingView({
  children,
  delay = 0,
  distance = 3.5,
  duration = 2400,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: any;
}) {
  const anim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    let loopAnim: RNAnimated.CompositeAnimation | null = null;
    const timeout = setTimeout(() => {
      loopAnim = RNAnimated.loop(
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
      loopAnim.start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      loopAnim?.stop();
    };
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -distance],
  });

  return (
    <RNAnimated.View style={[style, { transform: [{ translateY }] }]}>
      {children}
    </RNAnimated.View>
  );
}

// ─── Google SVG Icon ────────────────────────────────────────────────────────
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </Svg>
  );
}

// ─── Stylized FitGO Brand Header ────────────────────────────────────────────
function FitGoBrandText() {
  return (
    <View style={s.brandRow}>
      <Text style={s.brandFit}>Fit</Text>
      <Text style={s.brandG}>G</Text>
      <View style={s.brandOBorder}>
        <View style={s.brandOInner}>
          <Zap size={11} color="#00F0FF" fill="#00F0FF" />
        </View>
      </View>
    </View>
  );
}

// ─── Main Register Screen ───────────────────────────────────────────────────
export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setLoading: setGlobalLoading } = useAuthStore();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: AlertType }>({
    title: '',
    message: '',
    type: 'error',
  });

  const rawScheme = Constants.expoConfig?.scheme || 'fitgo';
  const activeScheme = Array.isArray(rawScheme) ? rawScheme[0] : rawScheme;
  const redirectTo = makeRedirectUri({
    scheme: activeScheme,
    path: 'auth/callback',
  });

  useEffect(() => {
    if (__DEV__) console.log('[OAuth] redirectTo:', redirectTo);
  }, [redirectTo]);

  const showAlert = (title: string, message: string, type: AlertType = 'error') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);



  const createSessionFromUrl = async (url: string) => {
    const { params, errorCode } = QueryParams.getQueryParams(url);

    if (errorCode) throw new Error(errorCode);

    if (params.code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (error) throw error;
      return data.session;
    }

    const { access_token, refresh_token } = params;

    if (!access_token) return;

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;

    return data.session;
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showAlert(t('common.error'), t('auth.fillFields'), 'warning');
      return;
    }
    if (password.length < 8) {
      showAlert(t('common.error'), t('auth.passwordShort'), 'warning');
      return;
    }
    if (!termsAccepted) {
      showAlert(t('common.error'), t('auth.mustAcceptTerms'), 'warning');
      return;
    }

    setLoading(true);
    setGlobalLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim(), language: i18n.language },
        emailRedirectTo: Linking.createURL('/(auth)/verify-email'),
      },
    });
    setLoading(false);

    if (error) {
      let errorMessage = error.message;
      if (errorMessage.toLowerCase().includes('already registered')) {
        errorMessage = t('auth.emailAlreadyRegistered');
      }
      setGlobalLoading(false);
      showAlert(t('auth.registerFailed'), errorMessage, 'error');
      return;
    }

    if (data?.user && !data?.session) {
      showAlert(
        t('common.success'),
        t('auth.checkEmailSignup', 'Registration successful. Please check your email to verify your account before logging in.'),
        'success'
      );
    }
  };

  const handleOAuth = async (provider: 'google') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (__DEV__) console.log('[OAuth] WebBrowser result:', res.type, (res as any).url ?? '');

        if (res.type === 'success') {
          const { url } = res as { type: 'success'; url: string };
          try {
            setGlobalLoading(true);
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            if (!existingSession) {
              await createSessionFromUrl(url);
            }
          } catch (sessionError: any) {
            const { data: { session: checkSession } } = await supabase.auth.getSession();
            const errMsg = sessionError?.message || '';
            const isFlowStateError = errMsg.toLowerCase().includes('flow state') || errMsg.toLowerCase().includes('pkce');
            if (!checkSession && !isFlowStateError) {
              showAlert(t('common.error'), errMsg || t('auth.googleLoginFailed'), 'error');
            }
          } finally {
            setGlobalLoading(false);
          }
        }
      } else {
        showAlert(t('common.error'), t('auth.googleAuthFailed'), 'error');
      }
    } catch (error: any) {
      showAlert(t('common.error'), error.message, 'error');
    }
  };

  const titlePrefix = t('auth.createAccountTitlePrefix', 'Create your');
  const titleSuffix = t('auth.createAccountTitleSuffix', 'account');

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AmbientBackground />

      <ScrollView
        contentContainerStyle={[
          s.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom + 24, 40),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back Navigation */}
        <TouchableOpacity
          style={s.backBtnRow}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(auth)/welcome' as any);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={s.backIconBox}>
            <ArrowLeft size={16} color="#C084FC" />
          </View>
          <Text style={s.backText}>{t('common.goBack', 'Go Back')}</Text>
        </TouchableOpacity>

        {/* Title with Floating FitGO Logo */}
        <View style={s.headerWrap}>
          <View style={s.titleRow}>
            {titlePrefix ? <Text style={s.titleText}>{titlePrefix} </Text> : null}
            <FloatingView delay={0} distance={3} duration={2800}>
              <FitGoBrandText />
            </FloatingView>
            {titleSuffix ? <Text style={s.titleText}> {titleSuffix}</Text> : null}
          </View>

          <Text style={s.subtitle}>
            {t('auth.subtitlePrefix', 'Personalize your experience and')}{' '}
            <Text style={s.highlightText}>
              {t('auth.subtitleHighlight', 'start for free.')}
            </Text>
          </Text>
        </View>

        {/* Form Fields */}
        <View style={s.form}>
          {/* Full Name */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>{t('auth.name', 'Full Name')}</Text>
            <View style={s.inputContainer}>
              <FloatingView delay={100} distance={2.5} duration={2600} style={s.inputIconWrap}>
                <User size={19} color="#A78BFA" />
              </FloatingView>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                placeholderTextColor="#64748B"
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
          </View>

          {/* Email Address */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>{t('auth.email', 'Email Address')}</Text>
            <View style={s.inputContainer}>
              <FloatingView delay={300} distance={2.5} duration={2800} style={s.inputIconWrap}>
                <Mail size={19} color="#A78BFA" />
              </FloatingView>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {isEmailValid && (
                <View style={s.validIconWrap}>
                  <CheckCircle2 size={18} color="#10B981" />
                </View>
              )}
            </View>
          </View>

          {/* Password */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>{t('auth.password', 'Password')}</Text>
            <View style={s.inputContainer}>
              <FloatingView delay={500} distance={2.5} duration={2500} style={s.inputIconWrap}>
                <Lock size={19} color="#A78BFA" />
              </FloatingView>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••••"
                placeholderTextColor="#64748B"
                secureTextEntry={!showPassword}
                autoComplete="new-password"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={s.eyeBtn}
                hitSlop={8}
              >
                {showPassword ? (
                  <EyeOff size={19} color="#94A3B8" />
                ) : (
                  <Eye size={19} color="#94A3B8" />
                )}
              </Pressable>
            </View>

          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[s.continueBtn, loading && s.continueBtnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#7C5CFC', '#6366F1', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.btnGradient}
          >
            {loading ? (
              <View style={s.btnInnerRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={s.btnText}>{t('auth.creatingAccount', 'Creating account...')}</Text>
              </View>
            ) : (
              <View style={s.btnInnerRow}>
                <Text style={s.btnText}>{t('auth.continue', 'Continue')}</Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.6} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Terms and Conditions Checkbox */}
        <View style={s.termsContainer}>
          <TouchableOpacity
            style={[s.checkbox, termsAccepted && s.checkboxChecked]}
            onPress={() => setTermsAccepted(!termsAccepted)}
            activeOpacity={0.7}
            hitSlop={8}
          >
            {termsAccepted && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
          </TouchableOpacity>

          <View style={s.termsTextWrapper}>
            <Text style={s.termsText}>
              {t('auth.agreeTermsPrefix', 'I agree to the')}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/terms?tab=terms')}>
              <Text style={s.termsLink}>
                {t('auth.termsOfService', 'Terms of Service')}
              </Text>
            </TouchableOpacity>
            <Text style={s.termsText}> {t('auth.andWord', 'and')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/terms?tab=privacy')}>
              <Text style={s.termsLink}>
                {t('auth.privacyPolicy', 'Privacy Policy')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={s.divider}>
          <View style={s.divLine} />
          <Text style={s.divText}>{t('common.or', 'or')}</Text>
          <View style={s.divLine} />
        </View>

        {/* Google OAuth Button */}
        <TouchableOpacity
          style={s.googleBtn}
          activeOpacity={0.8}
          onPress={() => handleOAuth('google')}
        >
          <GoogleIcon size={20} />
          <Text style={s.googleText}>
            {t('auth.continueGoogle', 'Continue with Google')}
          </Text>
        </TouchableOpacity>

        {/* Footer Link */}
        <View style={s.footer}>
          <View style={s.footerDividerRow}>
            <View style={s.footerDivLine} />
            <Text style={s.footerDivText}>
              {t('auth.alreadyHaveAccount', 'Already have an account?')}
            </Text>
            <View style={s.footerDivLine} />
          </View>
          <TouchableOpacity
            style={s.footerLoginBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.75}
          >
            <Text style={s.footerLoginText}>{t('auth.signIn', 'Sign In')}</Text>
            <ArrowRight size={15} color="#C084FC" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Bottom Trust Badges with Floating Animation */}
        <View style={s.trustRow}>
          {/* Badge 1: 100% Free */}
          <View style={s.trustCol}>
            <FloatingView delay={0} distance={3.5} duration={2400}>
              <View style={s.trustIconCircle}>
                <Zap size={18} color="#C084FC" />
              </View>
            </FloatingView>
            <Text style={s.trustTitle}>{t('auth.trustFree', '100% Free')}</Text>
            <Text style={s.trustSub}>{t('auth.trustNoCard', 'No credit card\nrequired')}</Text>
          </View>

          {/* Badge 2: Your data is safe */}
          <View style={s.trustCol}>
            <FloatingView delay={350} distance={3.5} duration={2600}>
              <View style={s.trustIconCircle}>
                <Lock size={17} color="#C084FC" />
              </View>
            </FloatingView>
            <Text style={s.trustTitle}>{t('auth.trustSafe', 'Your data is safe')}</Text>
            <Text style={s.trustSub}>{t('auth.trustPrivacy', 'We respect your\nprivacy')}</Text>
          </View>

          {/* Badge 3: Trusted by */}
          <View style={s.trustCol}>
            <FloatingView delay={700} distance={3.5} duration={2500}>
              <View style={s.trustIconCircle}>
                <Award size={18} color="#C084FC" />
              </View>
            </FloatingView>
            <Text style={s.trustTitle}>{t('auth.trustTrusted', 'Trusted by')}</Text>
            <Text style={s.trustSub}>{t('auth.trustUsers', 'thousands of\nusers')}</Text>
          </View>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => setAlertVisible(false)}
        confirmText="OK"
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06020E',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
  },
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
    alignSelf: 'flex-start',
    gap: 10,
  },
  backIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C084FC',
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  titleText: {
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  brandFit: {
    fontSize: 27,
    fontWeight: '900',
    color: '#A855F7',
    letterSpacing: -0.5,
  },
  brandG: {
    fontSize: 27,
    fontWeight: '900',
    color: '#06B6D4',
    letterSpacing: -0.5,
  },
  brandOBorder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  brandOInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  highlightText: {
    color: '#00FF9D',
    fontWeight: '700',
  },
  form: {
    gap: 18,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F091F',
    borderWidth: 1.2,
    borderColor: 'rgba(139, 92, 246, 0.28)',
    borderRadius: 14,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  inputIconWrap: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    minHeight: 52,
  },
  eyeBtn: {
    padding: 6,
    marginRight: -4,
  },
  validIconWrap: {
    padding: 4,
    marginRight: -2,
  },
  strengthContainer: {
    marginTop: 8,
    gap: 6,
  },
  strengthStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  strengthStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reqText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  reqTextMet: {
    color: '#10B981',
    fontWeight: '600',
  },
  continueBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 22,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  continueBtnDisabled: {
    opacity: 0.65,
  },
  btnGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 18,
    paddingHorizontal: 4,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(192, 132, 252, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1.5,
  },
  checkboxChecked: {
    backgroundColor: '#7C5CFC',
    borderColor: '#7C5CFC',
  },
  termsTextWrapper: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
  },
  termsLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#C084FC',
    lineHeight: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 20,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  divText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F091F',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 10,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 24,
    marginBottom: 30,
    alignItems: 'center',
    gap: 14,
  },
  footerDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  footerDivLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  footerDivText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  footerLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.25)',
  },
  footerLoginText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C084FC',
    letterSpacing: 0.3,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  trustCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  trustIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(124, 92, 252, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  trustTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 3,
  },
  trustSub: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 14,
  },
});

