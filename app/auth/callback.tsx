/**
 * OAuth Callback Screen — fitgo://auth/callback
 *
 * Expo Router intercepts the deep link from Google OAuth and pushes this screen
 * onto the root stack. Once the session is confirmed or exchanged, this screen
 * dismisses itself (pops off the stack) so the user never has to press Android's
 * back button to reveal the app.
 */
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';

// Complete auth session if open in browser
WebBrowser.maybeCompleteAuthSession();

/**
 * Pops this screen off the stack if pushed on top of another screen,
 * and ensures navigation to the target route.
 */
function dismissAndNavigate(target: string) {
  if (router.canGoBack()) {
    router.back();
    setTimeout(() => {
      router.replace(target as any);
    }, 50);
  } else {
    router.replace(target as any);
  }
}

function getDestination(): string {
  const { session, profile } = useAuthStore.getState();
  if (!session) return '/(auth)/welcome';
  if (!profile || !profile.onboardingDone || !profile.id) {
    return '/onboarding';
  }
  return '/(tabs)/tracker';
}

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const handled = useRef(false);

  useEffect(() => {
    // Also complete auth session inside component lifecycle
    WebBrowser.maybeCompleteAuthSession();

    // Emergency safety timeout: never let this screen hang for more than 3 seconds
    const emergencyTimer = setTimeout(async () => {
      if (handled.current) return;
      handled.current = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          dismissAndNavigate(getDestination());
        } else {
          dismissAndNavigate('/(auth)/welcome');
        }
      } catch {
        dismissAndNavigate('/(auth)/welcome');
      }
    }, 3000);

    const handle = async () => {
      try {
        // Case 1: OAuth error returned by provider
        if (params.error) {
          if (handled.current) return;
          handled.current = true;
          console.error('[AuthCallback] Provider error:', params.error, params.error_description);
          dismissAndNavigate('/(auth)/welcome');
          return;
        }

        // Check if session was already established (e.g. by login.tsx or background exchange)
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          if (handled.current) return;
          handled.current = true;
          await waitForProfileAndNavigate();
          return;
        }

        // Case 2: PKCE code flow (Google uses this)
        if (params.code) {
          if (handled.current) return;
          handled.current = true;

          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) {
            console.warn('[AuthCallback] exchangeCodeForSession error:', error.message);
            // Check if session was established concurrently
            const { data: { session: checkSession } } = await supabase.auth.getSession();
            if (checkSession) {
              await waitForProfileAndNavigate();
              return;
            }
            dismissAndNavigate('/(auth)/welcome');
            return;
          }

          // Code successfully exchanged
          await waitForProfileAndNavigate();
          return;
        }

        // Case 3: No code yet on initial tick — wait briefly for params to settle before giving up
        await new Promise(resolve => setTimeout(resolve, 400));
        const { data: { session: checkSessionAgain } } = await supabase.auth.getSession();
        if (checkSessionAgain) {
          if (handled.current) return;
          handled.current = true;
          await waitForProfileAndNavigate();
          return;
        }
      } catch (e: any) {
        console.error('[AuthCallback] Unexpected error:', e.message);
        if (!handled.current) {
          handled.current = true;
          dismissAndNavigate('/(auth)/welcome');
        }
      }
    };

    handle();

    return () => {
      clearTimeout(emergencyTimer);
    };
  }, [params.code, params.error, params.error_description]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0F14', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <ActivityIndicator color="#7C5CFC" size="large" />
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' }}>
        Iniciando sesión con Google...
      </Text>
    </View>
  );
}

/**
 * Polls the authStore for up to 2 seconds while profile loads,
 * then cleanly dismisses this screen and navigates to the proper destination.
 */
async function waitForProfileAndNavigate(): Promise<void> {
  const POLL_INTERVAL_MS = 100;
  const TIMEOUT_MS = 2000;
  const start = Date.now();

  while (Date.now() - start < TIMEOUT_MS) {
    const { session, profile, isLoading } = useAuthStore.getState();

    // If profile is already populated, navigate immediately
    if (session && profile?.id) {
      dismissAndNavigate(profile.onboardingDone ? '/(tabs)/tracker' : '/onboarding');
      return;
    }

    // If finished loading and session exists (even if profile is null for new user)
    if (session && !isLoading) {
      dismissAndNavigate(getDestination());
      return;
    }

    // If definitely no session
    if (!session && !isLoading) {
      dismissAndNavigate('/(auth)/welcome');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  // Timeout reached — dismiss based on whatever state we have
  dismissAndNavigate(getDestination());
}
