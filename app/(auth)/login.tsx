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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  ShieldCheck,
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
          <SvgLinearGradient id="loginWave1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.35" />
            <Stop offset="50%" stopColor="#A855F7" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#00F0FF" stopOpacity="0.08" />
          </SvgLinearGradient>
          <SvgLinearGradient id="loginWave2" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.22" />
            <Stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.16" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Ambient dotted wave lines */}
        <Path
          d="M-50 160 C 80 90, 160 230, 270 140 C 350 70, 390 190, 450 130"
          fill="none"
          stroke="url(#loginWave1)"
          strokeWidth="1.4"
          strokeDasharray="3, 7"
        />
        <Path
          d="M-40 190 C 90 120, 180 260, 280 170 C 360 100, 390 220, 460 160"
          fill="none"
          stroke="url(#loginWave1)"
          strokeWidth="0.9"
          strokeDasharray="2, 5"
          opacity="0.6"
        />
        <Path
          d="M-60 760 C 60 700, 160 830, 260 740 C 340 680, 390 790, 450 730"
          fill="none"
          stroke="url(#loginWave2)"
          strokeWidth="1.2"
          strokeDasharray="3, 6"
          opacity="0.5"
        />

        {/* Ambient glowing particles */}
        <Circle cx="35" cy="120" r="1.6" fill="#A78BFA" opacity="0.65" />
        <Circle cx="365" cy="95" r="2.2" fill="#00F0FF" opacity="0.75" />
        <Circle cx="375" cy="220" r="1.5" fill="#C084FC" opacity="0.5" />
        <Circle cx="25" cy="400" r="1.3" fill="#818CF8" opacity="0.55" />
        <Circle cx="360" cy="690" r="1.8" fill="#00FF9D" opacity="0.65" />
        <Circle cx="40" cy="730" r="1.4" fill="#A78BFA" opacity="0.5" />
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

// ─── Main Login Screen ──────────────────────────────────────────────────────
export default function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setLoading: setGlobalLoading } = useAuthStore();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: AlertType;
  }>({
    title: '',
    message: '',
    type: 'error',
  });

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert(t('common.error'), t('auth.fillFields'), 'warning');
      return;
    }
    setLoading(true);
    setGlobalLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setGlobalLoading(false);
      showAlert(t('auth.loginFailed'), error.message, 'error');
      return;
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
              showAlert(
                t('common.error'),
                errMsg || t('auth.googleLoginFailed'),
                'error'
              );
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

        {/* Top Logo & Welcome Header */}
        <View style={s.headerWrap}>
          <FloatingView delay={0} distance={4} duration={3000}>
            <View style={s.logoContainer}>
              <View style={s.logoGlow} />
              <View style={s.logoCard}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={s.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </FloatingView>

          <Text style={s.title}>{t('auth.login', 'Welcome Back')}</Text>
          <Text style={s.subtitle}>
            {t('auth.loginSub', 'Sign in to continue your journey')}
          </Text>
        </View>

        {/* Form Fields */}
        <View style={s.form}>
          {/* Email Address */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>{t('auth.email', 'Email Address')}</Text>
            <View
              style={[
                s.inputContainer,
                emailFocused && s.inputContainerFocused,
              ]}
            >
              <FloatingView delay={100} distance={2.5} duration={2600} style={s.inputIconWrap}>
                <Mail size={19} color={emailFocused ? '#C084FC' : '#A78BFA'} />
              </FloatingView>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
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
            <View
              style={[
                s.inputContainer,
                passwordFocused && s.inputContainerFocused,
              ]}
            >
              <FloatingView delay={300} distance={2.5} duration={2800} style={s.inputIconWrap}>
                <Lock size={19} color={passwordFocused ? '#C084FC' : '#A78BFA'} />
              </FloatingView>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="••••••••••••"
                placeholderTextColor="#64748B"
                secureTextEntry={!showPassword}
                autoComplete="password"
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

          {/* Remember Me & Forgot Password Row */}
          <View style={s.optionsRow}>
            <TouchableOpacity
              style={s.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
              hitSlop={6}
            >
              <View style={[s.checkbox, rememberMe && s.checkboxChecked]}>
                {rememberMe && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={s.rememberText}>
                {t('auth.rememberMe', 'Remember me')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              activeOpacity={0.75}
              hitSlop={8}
            >
              <Text style={s.forgotText}>{t('auth.forgotPassword', 'Forgot password?')}</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Action Button */}
          <TouchableOpacity
            style={[s.signInBtn, loading && s.signInBtnDisabled]}
            onPress={handleLogin}
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
                  <Text style={s.btnText}>{t('auth.signingIn', 'Signing in...')}</Text>
                </View>
              ) : (
                <View style={s.btnInnerRow}>
                  <Text style={s.btnText}>{t('auth.signIn', 'Sign In')}</Text>
                  <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.6} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

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

          {/* Security & Protection Badge */}
          <View style={s.securityBadge}>
            <View style={s.securityIconBox}>
              <ShieldCheck size={20} color="#00FF9D" />
            </View>
            <View style={s.securityTextWrap}>
              <Text style={s.securityTitle}>
                {t('auth.accountProtected', 'Your account is protected')}
              </Text>
              <Text style={s.securitySub}>
                {t('auth.dataPrivate', 'Your data stays private and secure.')}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer: Create Account Link */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            {t('auth.noAccount', "Don't have an account?")}
          </Text>
          <TouchableOpacity
            style={s.footerBtn}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.75}
            hitSlop={6}
          >
            <Text style={s.footerLink}>
              {t('auth.createFree', 'Create one for free')}
            </Text>
            <ArrowRight size={15} color="#C084FC" strokeWidth={2.5} />
          </TouchableOpacity>
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
    marginBottom: 20,
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
    marginBottom: 26,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#7C5CFC',
    opacity: 0.25,
    shadowColor: '#A855F7',
    shadowOpacity: 0.6,
    shadowRadius: 25,
  },
  logoCard: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: '#120826',
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: 62,
    height: 62,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14.5,
    color: '#94A3B8',
    textAlign: 'center',
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
  inputContainerFocused: {
    borderColor: '#A855F7',
    backgroundColor: '#130B29',
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingHorizontal: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(192, 132, 252, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#7C5CFC',
    borderColor: '#7C5CFC',
  },
  rememberText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C084FC',
  },
  signInBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  signInBtnDisabled: {
    opacity: 0.65,
  },
  btnGradient: {
    paddingVertical: 15,
    paddingHorizontal: 24,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
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
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.16)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  securityIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityTextWrap: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  securitySub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 28,
    paddingBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '800',
    color: '#C084FC',
  },
});
