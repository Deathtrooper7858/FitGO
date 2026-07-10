import { useEffect, useRef } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, Platform, LogBox, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import * as NavigationBar from 'expo-navigation-bar';
import * as Sentry from '@sentry/react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { usePurchaseStore } from '../store/purchaseStore';
import { useSocialStore } from '../store/socialStore';
import { useAICreditsStore } from '../store/aiCreditsStore';
import { usePlannerStore } from '../store/plannerStore';
import { useNetworkStore } from '../store/networkStore';
import { useSyncStore } from '../store/syncStore';

import i18n from '../i18n';
import { useTheme } from '../hooks/useTheme';
import { useAdMob } from '../hooks/useAdMob';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { useIsPro } from '../hooks/useIsPro';
import { AppToast } from '../components/AppToast';
import { ErrorBoundary } from '../components/ErrorBoundary';


Sentry.init({
  dsn: 'https://839443385437a525f24520ae8ed30e60@o4511663065661440.ingest.us.sentry.io/4511663106752512',
  tracesSampleRate: 0.1,
  _experiments: {
    profilesSampleRate: 0.1,
  },
});

if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const msg = args[0];
    if (typeof msg === 'string' && (
      msg.includes('is not supported with edge-to-edge enabled') ||
      msg.includes('setLayoutAnimationEnabledExperimental') ||
      msg.includes('Could not get historical steps') ||
      msg.includes('Reduced motion setting is enabled') ||
      msg.includes('Firebase not configured in this build')
    )) {
      return;
    }
    originalWarn(...args);
  };
}

// Ignore specific warnings in the UI
LogBox.ignoreLogs([
  'setLayoutAnimationEnabledExperimental is currently a no-op',
  'is not supported with edge-to-edge enabled',
  'Prop "resizeMode" is deprecated',
  'AbortError',
  'AbortError: Aborted',
  'DOMException',
  'DOMException: Aborted',
  'AuthRetryableFetchError: Aborted'
]);

// Safely detect if edge-to-edge is enabled
let isEdgeToEdgeActive = false;

preventAutoHideAsync();

// ─── Navigation Guard ─────────────────────────────────────────────────────────
function NavigationGuard() {
  const { session, profile, isLoading } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    const inAuthGroup   = segments[0] === '(auth)';
    const inOnboarding  = segments[0] === 'onboarding';
    const isTermsModal  = segments.join('/') === 'modals/terms' || (segments[0] === '(auth)' && segments[1] === 'terms');
    const allSegments   = segments as string[];

    // ── Fast-path: if we already have a cached profile + session, navigate
    //    immediately WITHOUT waiting for isLoading to resolve. This eliminates
    //    the ~3-second flash of the onboarding screen on app resume.
    if (session && profile?.onboardingDone && profile?.id) {
      const isUpdatePassword = segments.join('/') === '(auth)/update-password';
      if (isUpdatePassword) return; // Stay on the screen to type new password

      if (inAuthGroup || inOnboarding || allSegments.length === 0) {
        router.replace('/(tabs)/tracker');
      }
      return;
    }

    // ── Slow-path: wait for the network fetch to complete before deciding
    if (isLoading) return;

    // ── Guard: if there's a session but no profile yet (and not loading),
    //    this is a transient state during OAuth (e.g. Google login fires
    //    onAuthStateChange multiple times). Wait — do NOT redirect to onboarding
    //    because a profile fetch may still be resolving in the background.
    if (session && !profile) return;

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
    } else if (!profile || !profile.onboardingDone || !profile.id) {
      // Session exists but profile is invalid or incomplete → onboarding
      if (!inOnboarding && !isTermsModal) {
        router.replace('/onboarding');
      }
    } else {
      const isUpdatePassword = segments.join('/') === '(auth)/update-password';
      if (isUpdatePassword) return; // Stay on the screen to type new password
      
      if (inAuthGroup || inOnboarding || allSegments.length === 0) {
        router.replace('/(tabs)/tracker');
      }
    }
  }, [session, profile, isLoading, segments]);

  return null;
}

function RootLayout() {
  const { setSession, setLoading, fetchProfile, clearAuth, isLoading } = useAuthStore();
  const { initialize: initPurchases, syncTrialState, checkAndRevokeExpiredTrial } = usePurchaseStore();
  const { language, theme, setPremiumColor } = useSettingsStore();
  const colors = useTheme();
  const { t } = useTranslation();
  const lastButtonStyleRef = useRef<string | null>(null);
  const lastColorRef = useRef<string | null>(null);
  const isPro = useIsPro();

  useAdMob(); // Initialize AdMob
  // Mostrar anuncios intersticiales periódicamente solo a usuarios Free
  useInterstitialAd(!isPro);

  useEffect(() => {
    if (i18n.isInitialized) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    const unsubscribeNetwork = useNetworkStore.getState().initNetworkListener();
    
    // Suscribirse a cambios en el estado de la red para disparar la cola
    const unsubscribeSync = useNetworkStore.subscribe((state, prevState) => {
      if (state.isInternetReachable && !prevState.isInternetReachable) {
        useSyncStore.getState().processQueue();
      }
    });

    return () => {
      unsubscribeNetwork?.();
      unsubscribeSync();
    };
  }, []);

  const segments = useSegments();

  // ── Android navigation styling: themed solid bar to match the app perfectly ──
  useEffect(() => {
    if (Platform.OS === 'android') {
      const targetButtonStyle = theme === 'dark' ? 'light' : 'dark';
      if (lastButtonStyleRef.current !== targetButtonStyle) {
        NavigationBar.setButtonStyleAsync(targetButtonStyle as any);
        lastButtonStyleRef.current = targetButtonStyle;
      }

      if (!isEdgeToEdgeActive) {
        const inTabs = segments[0] === '(tabs)';
        const targetColor = inTabs ? colors.surface : colors.background;
        
        if (lastColorRef.current !== targetColor) {
          NavigationBar.setPositionAsync('relative');
          NavigationBar.setBackgroundColorAsync(targetColor);
          NavigationBar.setBorderColorAsync(targetColor);
          lastColorRef.current = targetColor;
        }
      }
    }
  }, [theme, segments, colors]);

  useEffect(() => {
    // Hide the native OS splash screen immediately so our custom RN splash takes over
    hideAsync();

    // ── Race condition guard ────────────────────────────────────────────────────
    // onAuthStateChange puede dispararse varias veces seguidas (token refresh +
    // user update). El guard de versión garantiza que solo la llamada más reciente
    // llame a setLoading(false), evitando pantallas de loading infinito.
    let authCallVersion = 0;
    let previousUserId: string | null = null;

    const handleAuthStateChange = async (newSession: any) => {
      const thisCall = ++authCallVersion;
      
      // OPTIMIZACIÓN: Si ya tenemos un perfil en caché y completó el onboarding, evitamos bloquear el render inicial.
      const currentProfile = useAuthStore.getState().profile;
      // isInitialLoading = true cuando no hay caché, no hay sesión, el userId cambió, o el onboarding no está hecho.
      // IMPORTANTE: si el userId cambió (nuevo login / OAuth), siempre bloquear para evitar
      // el flash del onboarding que ocurre cuando onAuthStateChange se dispara múltiples veces
      // (ej. SIGNED_IN + TOKEN_REFRESHED durante Google OAuth).
      const userIdChanged = newSession?.user?.id && currentProfile?.id !== newSession.user.id;
      const isInitialLoading = !currentProfile || !newSession || userIdChanged || !currentProfile.onboardingDone;
      
      if (isInitialLoading) {
        setLoading(true); // Bloquear hasta tener perfil completo
      } else {
        setLoading(false); // Liberar Inmediatamente para entrar a la app sin demoras
      }

      try {
        setSession(newSession);
        if (newSession?.user) {
          const newUserId = newSession.user.id;
          // Si cambió el usuario (cambio de cuenta sin cerrar sesión explícitamente),
          // limpiar el color premium del anterior para que no se herede.
          if (previousUserId && previousUserId !== newUserId) {
            useSettingsStore.getState().setPremiumColor(null);
          }
          previousUserId = newUserId;

          // Si estamos bloqueando (isInitialLoading), esperamos a que se resuelva
          if (isInitialLoading) {
            await Promise.all([
              fetchProfile(newSession.user.id),
              initPurchases(newSession.user.id)
            ]);
            // Sync trial state and check/revoke if expired (using cache)
            await syncTrialState(true);
            await checkAndRevokeExpiredTrial(true);
          } else {
            // If not blocking (have cache), hydrate data in the background
            Promise.all([
              fetchProfile(newSession.user.id),
              initPurchases(newSession.user.id)
            ]).then(() => {
              // Background trial check (using cache)
              syncTrialState(true).then(() => checkAndRevokeExpiredTrial(true));
            }).catch(err => console.error('Background fetch error:', err));
          }
          // Resetear créditos de IA si es un nuevo día (se llama siempre al login)
          useAICreditsStore.getState().resetIfNewDay();
        } else {
          // Sign out: clear both session and profile atomically
          clearAuth();
          // Reset premium color so the next user/onboarding always starts with
          // the classic default. Each account's color is stored in their profile
          // and restored when they log in.
          setPremiumColor(null);
          previousUserId = null;
          // Limpiar canales Realtime del usuario anterior para evitar fugas de
          // memoria y que mensajes de un usuario lleguen a otro tras cambio de sesión.
          useSocialStore.getState().reset();
          // Resetear estado Pro de créditos IA para evitar que se herede entre sesiones
          useAICreditsStore.getState().setIsProUser(false);
          // Limpiar el cache del planificador del usuario anterior
          usePlannerStore.getState().clearPlans();
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
      } finally {
        // Si bloqueamos, liberamos al final de la carga.
        if (thisCall === authCallVersion && isInitialLoading) {
          setLoading(false);
        }
      }
    };

    // Initialize auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(session);
    });

    return () => subscription.unsubscribe();
  }, [clearAuth, fetchProfile, initPurchases, setLoading, setPremiumColor, setSession, syncTrialState, checkAndRevokeExpiredTrial]);

  // ── IMPORTANT: Keep the splash screen or a blank view while loading
  //    to prevent "flashes" of the wrong screens.
  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: '#0D0F14', justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" backgroundColor="#0D0F14" />
        
        <Animated.View entering={FadeIn.duration(800).springify()} style={{ alignItems: 'center' }}>
          <Image cachePolicy="memory-disk" 
            source={require('../assets/icon.png')} 
            style={{ width: 120, height: 120, borderRadius: 24, marginBottom: 24 }} 
            contentFit="contain" 
          />
          <Text style={{ 
            color: '#fff', 
            fontSize: 32, 
            fontWeight: '900', 
            letterSpacing: 1,
            textShadowColor: 'rgba(124, 92, 252, 0.5)',
            textShadowOffset: { width: 0, height: 4 },
            textShadowRadius: 12,
            marginBottom: 8
          }}>FitGO</Text>
          <Text style={{ 
            color: 'rgba(255,255,255,0.6)', 
            fontSize: 16, 
            fontWeight: '600', 
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}>{t('common.slogan', 'Your best version')}</Text>
        </Animated.View>

        <View style={{ position: 'absolute', bottom: 60 }}>
          <ActivityIndicator color="#7C5CFC" size="small" />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
        <NavigationGuard />
        <AppToast />
        <ErrorBoundary>
        <Stack screenOptions={{ 
          headerShown: false, 
          animation: 'none',
          contentStyle: { backgroundColor: colors.background }
        }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen
            name="modals/scan"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/food-detail"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/paywall"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/premium-colors"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/no-credits"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/calendar"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />

          <Stack.Screen
            name="modals/add-activity"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/select-neat"
            options={{ presentation: 'modal', animation: 'slide_from_left' }}
          />
          <Stack.Screen
            name="modals/select-activity-level"
            options={{ presentation: 'modal', animation: 'slide_from_left' }}
          />
          <Stack.Screen
            name="modals/body-measurements"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/sleep"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/food-selection"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/social"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/progress-evaluation"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/achievements"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/reminders"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/terms"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/chat"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/health-profile"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/muscle-directory"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/recipes"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/user-profile"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/update-account"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
        </ErrorBoundary>
    </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

// Notes:
// - The NavigationGuard component ensures users are always on the correct flow based on their auth and onboarding status.
// - The RootLayout initializes auth state from Supabase and listens for changes, updating the global store accordingly.
// - Splash screen is shown until we determine the user's session and profile, preventing any flicker of the wrong screens.

export default RootLayout;