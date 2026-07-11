import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Spacing, Radius } from '../../constants';
import { supabase } from '../../services';
import { useTheme } from '../../hooks/useTheme';

export default function UpdatePasswordScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If the URL has a PKCE code, exchange it for a session so we can update the user.
    const code = params.code || params.access_token; 
    if (code) {
      supabase.auth.exchangeCodeForSession(code as string).then(({ error }) => {
        if (error) {
          Alert.alert(t('common.error', 'Error'), error.message);
        }
      });
    }
  }, [params.code, params.access_token, t]);

  const handleUpdate = async () => {
    if (!password || password.length < 6) {
      Alert.alert(t('common.error', 'Error'), t('auth.passwordShort', 'Password must be at least 6 characters.'));
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert(t('common.error', 'Error'), error.message);
      return;
    }
    
    Alert.alert(t('common.success', 'Success'), t('auth.passwordUpdated', 'Password updated successfully.'));
    router.replace('/(tabs)/tracker');
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={[s.backText, { color: colors.primary }]}>← {t('common.back', 'Back')}</Text>
        </TouchableOpacity>

        <Text style={[s.title, { color: colors.textPrimary }]}>{t('auth.updatePassword', 'Update Password')}</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>{t('auth.updatePasswordSub', 'Please enter your new password.')}</Text>

        <View style={s.field}>
          <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>{t('auth.password', 'Password')}</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleUpdate}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#7C5CFC', '#4338CA']} style={s.btnGrad}>
            <Text style={s.btnText}>{loading ? t('common.loading', 'Loading...') : t('common.save', 'Save')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1 },
  content:    { flex: 1, padding: Spacing.base, paddingTop: 60, justifyContent: 'flex-start' },
  back:       { marginBottom: 32 },
  backText:   { fontSize: 15, fontWeight: '600' },
  title:      { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  sub:        { fontSize: 15, marginBottom: 32, lineHeight: 22 },
  field:      { gap: 6, marginBottom: 24 },
  fieldLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  input:      { borderRadius: Radius.md, borderWidth: 1.5, padding: Spacing.base, fontSize: 15 },
  btn:        { borderRadius: Radius.md, overflow: 'hidden' },
  btnDisabled:{ opacity: 0.6 },
  btnGrad:    { padding: 18, alignItems: 'center' },
  btnText:    { fontSize: 16, fontWeight: '700', color: '#fff' },
});
