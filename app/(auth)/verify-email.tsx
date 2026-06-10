import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../services';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const colors = useTheme();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const code = params.code || params.access_token;
      
      if (!code) {
        setVerifying(false);
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code as string);
      
      if (error) {
        Alert.alert(t('common.error', 'Error'), error.message);
        router.replace('/(auth)/login');
      }
      // If success, the _layout.tsx NavigationGuard will automatically detect the new session
      // and redirect the user to the appropriate screen (like /onboarding or /(tabs)/tracker)
    };

    verify();
  }, [params.code, params.access_token]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {verifying ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            {t('auth.verifyingEmail', 'Verificando tu correo electrónico...')}
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.text, { color: colors.textPrimary, marginBottom: 20 }]}>
            {t('auth.verifyLinkInvalid', 'Enlace de verificación inválido o expirado.')}
          </Text>
          <Text 
            style={[styles.link, { color: colors.primary }]}
            onPress={() => router.replace('/(auth)/login')}
          >
            {t('auth.backToLogin', 'Volver al inicio de sesión')}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
  }
});
