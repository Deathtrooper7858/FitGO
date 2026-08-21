/**
 * OAuth Callback Screen — fitgo://auth/callback
 *
 * Expo Router intercepts the deep link from Google OAuth and navigates here.
 * This screen exchanges the PKCE code for a session and lets
 * NavigationGuard in _layout.tsx handle the redirect to the correct screen.
 */
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../services/supabase';

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
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) {
            console.error('[AuthCallback] exchangeCodeForSession error:', error.message);
            router.replace('/(auth)/welcome');
            return;
          }
          // ✅ Session created — NavigationGuard will redirect to /(tabs)/tracker
          return;
        }

        // Case 3: No code, no error — fallback
        console.warn('[AuthCallback] No code or error in params, redirecting to welcome');
        router.replace('/(auth)/welcome');
      } catch (e: any) {
        console.error('[AuthCallback] Unexpected error:', e.message);
        router.replace('/(auth)/welcome');
      }
    };

    handle();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0F14', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <ActivityIndicator color="#7C5CFC" size="large" />
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' }}>
        Iniciando sesión con Google...
      </Text>
    </View>
  );
}
