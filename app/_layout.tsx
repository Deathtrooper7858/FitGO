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
  const { session, profile, isLoading } = useAuthStore();
  const segments = useSegments();
  // Wait for the root navigator to finish mounting before any navigation.
  // Without this guard, router.replace fires before the Stack registers its
  // screens, causing the "action was not handled by any navigator" warning.
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // ── Navigator not ready yet — skip until it has mounted ─────────────────
    if (!navigationState?.key) return;

    // ── Auth still resolving — never navigate while loading to prevent flashes
    if (isLoading) return;

    const inAuthGroup   = segments[0] === '(auth)' || segments[0] === 'auth';
    const inOnboarding  = segments[0] === 'onboarding';
    const isTermsModal  = segments.join('/') === 'modals/terms' || (segments[0] === '(auth)' && segments[1] === 'terms');
    const allSegments   = segments as string[];

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
  }, [navigationState?.key, session, profile, isLoading, segments]);

  return null;
}

function RootLayout() {
  const { isLoading } = useAuthStore();
  const { language, theme } = useSettingsStore();
  const colors = useTheme();
  const lastButtonStyleRef = useRef<string | null>(null);
  const lastColorRef = useRef<string | null>(null);
  const isPro = useIsPro();

  useAdMob(); // Initialize AdMob
  // Mostrar anuncios intersticiales periódicamente solo a usuarios Free
  useInterstitialAd(!isPro);

  useEffect(() => {
    if (!isLoading) {
      hideAsync().catch(() => {});
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

  const segments = useSegments();

  // ── Android navigation styling: themed solid bar to match the app perfectly ──
  useEffect(() => {
    if (Platform.OS === 'android') {
      const targetButtonStyle = theme === 'dark' ? 'light' : 'dark';
      if (lastButtonStyleRef.current !== targetButtonStyle) {
        NavigationBar.setButtonStyleAsync(targetButtonStyle as any);
        lastButtonStyleRef.current = targetButtonStyle;
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

    const handleAuthStateChange = async (newSession: any) => {
      const thisCall = ++authCallVersion;
      
      const currentProfile = useAuthStore.getState().profile;
      const userIdChanged = newSession?.user?.id && currentProfile?.id !== newSession.user.id;
      // isInitialLoading: must fetch profile from network before we can decide where to route.
      // Only skip if: we already have a valid, complete profile for this exact user.
      const isInitialLoading = !currentProfile?.id || !newSession || userIdChanged || !currentProfile.onboardingDone;
      
      // Always set loading=true upfront so NavigationGuard doesn't fire early.
      // It will be set to false in the finally block once everything resolves.
      useAuthStore.getState().setLoading(true);

      try {
        useAuthStore.getState().setSession(newSession);
        if (newSession?.user) {
          const newUserId = newSession.user.id;
          if (previousUserId && previousUserId !== newUserId) {
            useSettingsStore.getState().setPremiumColor(null);
          }
          previousUserId = newUserId;

          if (isInitialLoading) {
            try {
              await useAuthStore.getState().fetchProfile(newSession.user.id);
            } catch (profileErr) {
              console.warn('[RootLayout] fetchProfile error:', profileErr);
            }
            try {
              await usePurchaseStore.getState().initialize(newSession.user.id);
              await usePurchaseStore.getState().syncTrialState(true);
              await usePurchaseStore.getState().checkAndRevokeExpiredTrial(true);
            } catch (purchaseErr) {
              console.warn('[RootLayout] purchaseStore init error:', purchaseErr);
            }
          } else {
            Promise.all([
              useAuthStore.getState().fetchProfile(newSession.user.id).catch(() => {}),
              usePurchaseStore.getState().initialize(newSession.user.id).catch(() => {})
            ]).then(() => {
              usePurchaseStore.getState().syncTrialState(true).then(() => {
                usePurchaseStore.getState().checkAndRevokeExpiredTrial(true).catch(() => {});
              }).catch(() => {});
            }).catch(err => console.error('Background fetch error:', err));
          }
          useAICreditsStore.getState().resetIfNewDay();
        } else {
          useAuthStore.getState().clearAuth();
          useSettingsStore.getState().setPremiumColor(null);
          previousUserId = null;
          useSocialStore.getState().reset();
          useAICreditsStore.getState().setIsProUser(false);
          usePlannerStore.getState().clearPlans();
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
      } finally {
        // Always release the loading gate for the latest call.
        // We unconditionally set loading=true at the top, so we must always
        // reset it here — otherwise the NavigationGuard will block forever.
        if (thisCall === authCallVersion) {
          useAuthStore.getState().setLoading(false);
        }
      }
    };

    // Safety timeout: Ensure splash screen never hangs
    const safetyTimer = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        useAuthStore.getState().setLoading(false);
      }
    }, 2000);

    // Initialize auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(session);
    }).catch(() => {
      useAuthStore.getState().setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(session);
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
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
        <Stack screenOptions={{ 
          headerShown: false, 
          animation: 'none',
          contentStyle: { backgroundColor: colors.background }
        }}>
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