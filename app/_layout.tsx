import { useEffect, useRef } from 'react';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LayoutAnimationConfig } from 'react-native-reanimated';
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
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  _experiments: {
    profilesSampleRate: __DEV__ ? 1.0 : 0.05,
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

preventAutoHideAsync();

// ─── Navigation Guard ─────────────────────────────────────────────────────────
function NavigationGuard() {
  const session = useAuthStore(s => s.session);
  const profile = useAuthStore(s => s.profile);
  const profileId = profile?.id;
  const isLoading = useAuthStore(s => s.isLoading);
  const segmentsKey = useSegments().join('/');
  // Wait for the root navigator to finish mounting before any navigation.
  // Without this guard, router.replace fires before the Stack registers its
  // screens, causing the "action was not handled by any navigator" warning.
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // ── Navigator not ready yet — skip until it has mounted ─────────────────
    if (!navigationState?.key) return;

    // ── Auth still resolving — never navigate while loading to prevent flashes
    if (isLoading) return;

    // If session exists but profile is still null / fetching, wait until profile is resolved.
    // Making decisions without profile causes false redirects to /onboarding.
    if (session && !profile) return;

    const seg0 = segmentsKey.split('/')[0] || '';
    const inAuthGroup   = seg0 === '(auth)' || seg0 === 'auth';
    const inOnboarding  = seg0 === 'onboarding';
    const isTermsModal  = segmentsKey === 'modals/terms' || segmentsKey === '(auth)/terms';
    const isUpdatePassword = segmentsKey === '(auth)/update-password';

    const isAuthenticated = !!(session || profileId);
    const onboardingDone = Boolean(profile?.onboardingDone || profile?.goal || profile?.weight || profile?.tdee);

    if (!isAuthenticated) {
      if (!inAuthGroup && !isTermsModal) {
        router.replace('/(auth)/welcome');
      }
    } else if (!onboardingDone) {
      if (!inOnboarding && !isTermsModal) {
        if (seg0 === 'auth' && router.canGoBack()) {
          router.back();
        }
        router.replace('/onboarding');
      }
    } else {
      if (isUpdatePassword) return; // Stay on the screen to type new password

      // If user is authenticated with completed onboarding and starts the app (on index, in auth group, or onboarding):
      // Go directly to the main tab!
      if (inAuthGroup || inOnboarding || !segmentsKey || seg0 === 'index') {
        if (seg0 === 'auth' && router.canGoBack()) {
          router.back();
        }
        router.replace('/(tabs)/tracker');
      }
    }
  }, [navigationState?.key, session, profile, profileId, isLoading, segmentsKey]);

  return null;
}

function RootLayout() {
  const { isLoading, session } = useAuthStore();
  const { language, theme } = useSettingsStore();
  const colors = useTheme();
  const lastButtonStyleRef = useRef<string | null>(null);
  const lastColorRef = useRef<string | null>(null);
  const isPro = useIsPro();
  const segments = useSegments();

  useAdMob(); // Initialize AdMob
  // Mostrar anuncios intersticiales periódicamente solo a usuarios Free con sesión activa fuera de auth/onboarding y no en dev
  const allSegs = segments as string[];
  const isAuthOrOnboarding = allSegs[0] === '(auth)' || allSegs[0] === 'auth' || allSegs[0] === 'onboarding' || allSegs.length === 0;
  useInterstitialAd(!__DEV__ && !isPro && !!session && !isAuthOrOnboarding);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        hideAsync().catch(() => {});
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

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

  // ── Android navigation styling: themed solid bar to match the app perfectly ──
  useEffect(() => {
    if (Platform.OS === 'android') {
      const targetButtonStyle = theme === 'dark' ? 'light' : 'dark';
      if (lastButtonStyleRef.current !== targetButtonStyle) {
        NavigationBar.setButtonStyleAsync(targetButtonStyle as any);
        lastButtonStyleRef.current = targetButtonStyle;
      }

      // In Android 15+ (API 35+), edge-to-edge is enforced by the system.
      // Modifying navigation bar background color is deprecated and ignored.
      if (typeof Platform.Version === 'number' && Platform.Version >= 35) {
        return;
      }

      const inTabs = segments[0] === '(tabs)';
      const targetColor = inTabs ? colors.surface : colors.background;
      
      NavigationBar.setPositionAsync('relative');
      if (lastColorRef.current !== targetColor) {
        NavigationBar.setBackgroundColorAsync(targetColor);
        NavigationBar.setBorderColorAsync(targetColor);
        lastColorRef.current = targetColor;
      }
    }
  }, [theme, segments, colors]);

  useEffect(() => {
    // ── Race condition guard ────────────────────────────────────────────────────
    let authCallVersion = 0;
    let previousUserId: string | null = null;

    const handleAuthStateChange = async (newSession: any, event?: string) => {
      const thisCall = ++authCallVersion;
      
      const currentProfile = useAuthStore.getState().profile;
      const userIdChanged = Boolean(newSession?.user?.id && currentProfile?.id !== newSession.user.id);
      // isInitialLoading: must fetch profile from network only if we don't have a profile in memory or user changed
      const isInitialLoading = (!currentProfile?.id || userIdChanged) && !!newSession?.user?.id;
      
      // Always set loading=true upfront only if we don't have a ready profile
      if (isInitialLoading) {
        useAuthStore.getState().setLoading(true);
      }

      try {
        if (newSession?.user) {
          useAuthStore.getState().setSession(newSession);
          const newUserId = newSession.user.id;
          if (previousUserId && previousUserId !== newUserId) {
            useSettingsStore.getState().setPremiumColor(null);
          }
          previousUserId = newUserId;

          // Immediately sync language and premium color from account metadata if available
          const accountLang = newSession.user.user_metadata?.language;
          if (accountLang && ['en', 'es', 'fr', 'pt', 'it', 'de', 'ru'].includes(accountLang)) {
            useSettingsStore.getState().setLanguage(accountLang);
            if (i18n.isInitialized && i18n.language !== accountLang) {
              i18n.changeLanguage(accountLang);
            }
          }
          const accountColor = newSession.user.user_metadata?.premium_color;
          if (accountColor) {
            useSettingsStore.getState().setPremiumColor(accountColor);
          }

          if (isInitialLoading) {
            try {
              await useAuthStore.getState().fetchProfile(newSession.user.id);
            } catch (profileErr) {
              console.warn('[RootLayout] fetchProfile error:', profileErr);
            }
          }

          // Initialize purchases and background refreshes without blocking screen routing
          Promise.all([
            !isInitialLoading ? useAuthStore.getState().fetchProfile(newSession.user.id).catch(() => {}) : Promise.resolve(),
            usePurchaseStore.getState().initialize(newSession.user.id).catch(() => {})
          ]).then(() => {
            usePurchaseStore.getState().syncTrialState(true).then(() => {
              usePurchaseStore.getState().checkAndRevokeExpiredTrial(true).catch(() => {});
            }).catch(() => {});
          }).catch(err => console.error('Background fetch error:', err));

          useAICreditsStore.getState().resetIfNewDay();
        } else if (event === 'SIGNED_OUT') {
          // Explicit sign out
          await useAuthStore.getState().clearAuth();
          useSettingsStore.getState().setPremiumColor(null);
          previousUserId = null;
          useSocialStore.getState().reset();
          useAICreditsStore.getState().setIsProUser(false);
          usePlannerStore.getState().clearPlans();
        } else {
          // Session is null from startup or network glitch.
          // Do NOT clear auth if we already have a cached profile or session!
          const currentStore = useAuthStore.getState();
          if (!currentStore.session && !currentStore.profile) {
            useAuthStore.getState().setSession(null);
          }
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
      } finally {
        // Always release the loading gate for the latest call.
        if (thisCall === authCallVersion) {
          useAuthStore.getState().setLoading(false);
        }
      }
    };

    // Safety timeout: Ensure splash screen never hangs (4.5s max for slow mobile networks)
    const safetyTimer = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        useAuthStore.getState().setLoading(false);
      }
    }, 4500);

    // Initialize auth: First restore cached profile from SecureStorage, then get session
    (async () => {
      try {
        await useAuthStore.getState().loadCachedProfile();
      } catch (e) {
        console.warn('[RootLayout] loadCachedProfile error:', e);
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await handleAuthStateChange(session, 'INITIAL_SESSION');
        } else {
          useAuthStore.getState().setLoading(false);
        }
      } catch {
        useAuthStore.getState().setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore USER_UPDATED to avoid cyclic re-fetching when user metadata is synced.
      if (event === 'USER_UPDATED') return;
      handleAuthStateChange(session, event);
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <NavigationGuard />
        <AppToast />
        <ErrorBoundary>
        {/* ── Reanimated 3.17 WorkletRuntime crash mitigation ──────────────────
             On Android (esp. x86_64 emulators running arm64 via ABI bridge),
             layout animations (entering/exiting) crash with SIGSEGV inside
             WorkletRuntime::runGuarded due to a null-pointer in the worklets
             scheduler. Wrapping with LayoutAnimationConfig + skipEntering/
             skipExiting prevents the worklet from executing entirely in dev,
             replacing animated transitions with instant ones. Production builds
             on real devices are NOT affected — the wrapper is a no-op there. */}
        <LayoutAnimationConfig
          skipEntering={__DEV__ && Platform.OS === 'android'}
          skipExiting={__DEV__ && Platform.OS === 'android'}
        >
        <Stack
          initialRouteName="index"
          screenOptions={{ 
            headerShown: false, 
            animation: 'none',
            contentStyle: { backgroundColor: colors.background }
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/callback" />
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
            name="modals/app-guide"
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
          <Stack.Screen
            name="modals/focus-mode"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="modals/shopping-list"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
        </LayoutAnimationConfig>
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

export default Sentry.wrap(RootLayout);