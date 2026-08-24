/**
 * OAuth Callback Screen — fitgo://auth/callback
 *
 * Expo Router intercepts the deep link from Google OAuth and navigates here.
 * This screen exchanges the PKCE code for a session. After the exchange,
 * we poll until _layout.tsx has populated the session in the store, then
 * navigate explicitly — instead of relying solely on NavigationGuard firing
 * while this screen is in the 'auth' segment (not '(auth)').
 */
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const handle = async () => {
      try {
        // Case 1: OAuth error returned by provider
        if (params.error) {
          console.error('[AuthCallback] Provider error:', params.error, params.error_description);
          router.replace('/(auth)/welcome');
          return;
        }

        // Case 2: PKCE code flow (Google uses this)
        if (params.code) {
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          if (existingSession) {
            // Session already exists (set by login.tsx handleOAuth before deep-link fired)
            router.replace('/(tabs)/tracker');
            return;
          }

          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) {
            console.warn('[AuthCallback] exchangeCodeForSession error:', error.message);
            // Check if session was already established by login/register screen
            const { data: { session: checkSession } } = await supabase.auth.getSession();
            if (checkSession) {
              router.replace('/(tabs)/tracker');
              return;
            }
            router.replace('/(auth)/welcome');
            return;
          }

          // ✅ Code exchanged. _layout.tsx's onAuthStateChange will call fetchProfile.
          // Poll until the store has a valid session, then navigate.
          await waitForAuthAndNavigate();
          return;
        }

        // Case 3: No code, no error — check if session exists already
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          router.replace('/(tabs)/tracker');
          return;
        }
        console.warn('[AuthCallback] No code or error in params, redirecting to welcome');
        router.replace('/(auth)/welcome');
      } catch (e: any) {
        console.error('[AuthCallback] Unexpected error:', e.message);
        router.replace('/(auth)/welcome');
      }
    };

    handle();
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
 * Polls the authStore until isLoading is false and session exists,
 * then navigates to the correct screen.
 * Safety timeout: 8 seconds → redirects to welcome to avoid infinite loop.
 */
async function waitForAuthAndNavigate(): Promise<void> {
  const POLL_INTERVAL_MS = 150;
  const TIMEOUT_MS = 8000;
  const start = Date.now();

  while (Date.now() - start < TIMEOUT_MS) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

    const { session, profile, isLoading } = useAuthStore.getState();

    // Still initializing — keep waiting
    if (isLoading) continue;

    if (session && profile?.id) {
      if (profile.onboardingDone) {
        router.replace('/(tabs)/tracker');
      } else {
        router.replace('/onboarding');
      }
      return;
    }

    // isLoading=false but no session → something went wrong
    if (!session) {
      console.warn('[AuthCallback] No session after code exchange, redirecting to welcome');
      router.replace('/(auth)/welcome');
      return;
    }
  }

  // Timeout — force navigate based on current state
  console.warn('[AuthCallback] Timeout waiting for auth, falling back');
  const { session } = useAuthStore.getState();
  router.replace(session ? '/(tabs)/tracker' : '/(auth)/welcome');
}
