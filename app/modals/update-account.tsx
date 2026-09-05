import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';

import { supabase } from '../../services/supabase';
import { useAuthStore, useSettingsStore } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import { CustomAlert, AlertType } from '../../components/CustomAlert';
import { GlobalBackground } from '../../components/GlobalBackground';

export default function UpdateAccountScreen() {
  const { profile } = useAuthStore();
  const premiumColor = useSettingsStore((state) => state.premiumColor);
  const { t } = useTranslation();
  const colors = useTheme();

  const safeColor = premiumColor === 'admin_glow' ? '#00F0FF' : premiumColor;
  const isPremiumCustom = !!safeColor && (safeColor.startsWith('#') || premiumColor === 'admin_glow');
  const accentGradient: [string, string] = premiumColor === 'admin_glow'
    ? ['#00F0FF', '#7C5CFC']
    : (isPremiumCustom
      ? [safeColor!, safeColor + 'AA']
      : colors.gradientPrimary as [string, string]);

  const [email, setEmail] = useState(profile?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [alert, setAlert] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showAlert = (type: AlertType, title: string, message: string, onConfirm = () => {}) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setAlert(prev => ({ ...prev, visible: false }));
      },
    });
  };

  const handleUpdate = async () => {
    const isEmailChanged = email !== profile?.email && email.trim() !== '';
    const isPasswordChanged = password.trim() !== '';

    if (!isEmailChanged && !isPasswordChanged) {
      showAlert('info', t('common.info', 'Info'), t('profile.noChanges', 'No has realizado ningún cambio.'));
      return;
    }

    if (isPasswordChanged && password.length < 6) {
      showAlert('error', t('common.error', 'Error'), t('auth.passwordTooShort', 'La contraseña debe tener al menos 6 caracteres.'));
      return;
    }

    setLoading(true);

    try {
      const updates: { email?: string; password?: string } = {};
      if (isEmailChanged) updates.email = email.trim();
      if (isPasswordChanged) updates.password = password;

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      let successMsg = '';
      if (isEmailChanged && isPasswordChanged) {
        successMsg = t('profile.emailAndPasswordUpdated', 'Contraseña actualizada. Por favor revisa tu bandeja de entrada en el nuevo correo para confirmar el cambio de email.');
      } else if (isEmailChanged) {
        successMsg = t('profile.emailUpdated', 'Revisa la bandeja de entrada de tu nuevo correo para confirmar el cambio.');
      } else {
        successMsg = t('profile.passwordUpdated', 'Contraseña actualizada correctamente.');
      }

      showAlert('success', t('common.success', 'Éxito'), successMsg, () => {
        router.back();
      });

    } catch (err: any) {
      console.error('Update account error:', err);
      let errorMessage = err.message || t('profile.updateFailed', 'Error al actualizar tu cuenta.');
      if (errorMessage.includes('different from the old password')) {
        errorMessage = t('profile.samePasswordError', 'La nueva contraseña debe ser diferente a la contraseña actual.');
      }
      showAlert('error', t('common.error', 'Error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GlobalBackground />
      <CustomAlert 
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border + '30' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('profile.updateEmailPassword', 'Actualizar correo o contraseña')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t('profile.updateAccountDesc', 'Ingresa tu nuevo correo electrónico o una nueva contraseña. Solo se actualizarán los campos que modifiques.')}
        </Text>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t('auth.email', 'Correo Electrónico')}</Text>
          <View style={[
            styles.inputContainer, 
            { 
              backgroundColor: colors.surfaceAlt, 
              borderColor: isEmailFocused ? (safeColor || colors.primary) : colors.border,
              borderWidth: isEmailFocused ? 1.5 : 1,
            }
          ]}>
            <Mail color={isEmailFocused ? (safeColor || colors.primary) : colors.textMuted} size={20} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder', 'tu@email.com')}
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t('auth.newPassword', 'Nueva Contraseña')}</Text>
          <View style={[
            styles.inputContainer, 
            { 
              backgroundColor: colors.surfaceAlt, 
              borderColor: isPasswordFocused ? (safeColor || colors.primary) : colors.border,
              borderWidth: isPasswordFocused ? 1.5 : 1,
            }
          ]}>
            <Lock color={isPasswordFocused ? (safeColor || colors.primary) : colors.textMuted} size={20} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.newPasswordPlaceholder', 'Deja en blanco para no cambiar')}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              editable={!loading}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              {showPassword ? (
                <EyeOff color={isPasswordFocused ? (safeColor || colors.primary) : colors.textMuted} size={20} />
              ) : (
                <Eye color={isPasswordFocused ? (safeColor || colors.primary) : colors.textMuted} size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, loading && { opacity: 0.7 }]} 
          onPress={handleUpdate}
          disabled={loading}
        >
          <LinearGradient colors={accentGradient} style={styles.saveButtonGradient}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('common.save', 'Guardar Cambios')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 24,
    gap: 20,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: 8,
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
