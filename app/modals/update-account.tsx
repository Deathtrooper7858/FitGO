import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  Key,
  Copy,
  Check,
  Fingerprint,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { supabase } from '../../services/supabase';
import { useAuthStore, useSettingsStore } from '../../store';
import { useTheme } from '../../hooks/useTheme';
import { CustomAlert, AlertType } from '../../components/CustomAlert';
import { GlobalBackground } from '../../components/GlobalBackground';
import { Radius, Spacing } from '../../constants';
import { getSafeColor, isValidPremiumColor, hexToRgba } from '../../utils/styles';

export default function UpdateAccountScreen() {
  const { profile } = useAuthStore();
  const premiumColor = useSettingsStore((state) => state.premiumColor);
  const { t } = useTranslation();
  const colors = useTheme();

  const safeColor = getSafeColor(premiumColor, colors.primary);
  const isPremiumCustom = isValidPremiumColor(premiumColor);
  const accentGradient: [string, string] = premiumColor === 'admin_glow'
    ? ['#00F0FF', '#7C5CFC']
    : isPremiumCustom
    ? [safeColor, hexToRgba(safeColor, 0.8)]
    : (colors.gradientPrimary as [string, string]);

  const [email, setEmail] = useState(profile?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
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
        setAlert((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  const handleCopyId = async () => {
    if (!profile?.id) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    await Clipboard.setStringAsync(profile.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleTogglePassword = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setShowPassword((prev) => !prev);
  };

  const handleUpdate = async () => {
    const isEmailChanged = email.trim() !== '' && email.trim() !== (profile?.email || '').trim();
    const isPasswordChanged = password.trim() !== '';

    if (!isEmailChanged && !isPasswordChanged) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
      showAlert(
        'info',
        t('common.info', 'Sin cambios'),
        t('profile.noChanges', 'No has realizado ningún cambio en tu correo o contraseña.')
      );
      return;
    }

    if (isEmailChanged) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        showAlert(
          'error',
          t('common.error', 'Error'),
          t('auth.invalidEmail', 'Por favor ingresa un correo electrónico válido.')
        );
        return;
      }
    }

    if (isPasswordChanged && password.length < 6) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      showAlert(
        'error',
        t('common.error', 'Error'),
        t('auth.passwordTooShort', 'La nueva contraseña debe tener al menos 6 caracteres.')
      );
      return;
    }

    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    try {
      const updates: { email?: string; password?: string } = {};
      if (isEmailChanged) updates.email = email.trim();
      if (isPasswordChanged) updates.password = password;

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      let successMsg = '';
      if (isEmailChanged && isPasswordChanged) {
        successMsg = t(
          'profile.emailAndPasswordUpdated',
          'Contraseña actualizada. Por favor revisa la bandeja de entrada del nuevo correo para confirmar el cambio.'
        );
      } else if (isEmailChanged) {
        successMsg = t(
          'profile.emailUpdated',
          'Revisa la bandeja de entrada de tu nuevo correo para confirmar el cambio de dirección.'
        );
      } else {
        successMsg = t('profile.passwordUpdated', 'Contraseña actualizada correctamente.');
      }

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      showAlert('success', t('common.success', 'Éxito'), successMsg, () => {
        router.back();
      });
    } catch (err: any) {
      console.error('Update account error:', err);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      let errorMessage = err.message || t('profile.updateFailed', 'Error al actualizar tu cuenta.');
      if (errorMessage.includes('different from the old password')) {
        errorMessage = t(
          'profile.samePasswordError',
          'La nueva contraseña debe ser diferente a la contraseña actual.'
        );
      }
      showAlert('error', t('common.error', 'Error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
        <TouchableOpacity
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.back();
          }}
          style={[styles.backButton, { backgroundColor: colors.surfaceAlt }]}
          activeOpacity={0.7}
        >
          <ChevronLeft color={colors.textPrimary} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('profile.updateEmailPassword', 'Actualizar correo o contraseña')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {t('profile.securitySubtitle', 'Seguridad y credenciales de acceso')}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Account Overview Card */}
          <View
            style={[
              styles.overviewCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border + '60',
              },
            ]}
          >
            <View style={styles.overviewRow}>
              <View
                style={[
                  styles.overviewIconWrap,
                  { backgroundColor: colors.primary + '18' },
                ]}
              >
                <Fingerprint size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>
                  {t('profile.userId', 'ID de Cuenta')}
                </Text>
                <Text
                  style={[styles.overviewVal, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {profile?.id || '--'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCopyId}
                style={[styles.copyBtn, { backgroundColor: colors.surfaceAlt }]}
                activeOpacity={0.7}
              >
                {copiedId ? (
                  <Check size={14} color="#10B981" strokeWidth={3} />
                ) : (
                  <Copy size={14} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t(
              'profile.updateAccountDesc',
              'Ingresa tu nuevo correo electrónico o una nueva contraseña. Solo se actualizarán los campos que modifiques.'
            )}
          </Text>

          {/* Email Input Group */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t('auth.email', 'Correo Electrónico')}
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: isEmailFocused
                    ? safeColor || colors.primary
                    : colors.border + '60',
                  borderWidth: isEmailFocused ? 1.5 : 1,
                },
              ]}
            >
              <Mail
                color={
                  isEmailFocused
                    ? safeColor || colors.primary
                    : colors.textMuted
                }
                size={20}
                style={styles.inputIcon}
              />
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

          {/* Password Input Group */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('auth.newPassword', 'Nueva Contraseña')}
              </Text>
              <Text style={[styles.passwordHint, { color: colors.textMuted }]}>
                {t('auth.minChars', 'Mínimo 6 caracteres')}
              </Text>
            </View>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: isPasswordFocused
                    ? safeColor || colors.primary
                    : colors.border + '60',
                  borderWidth: isPasswordFocused ? 1.5 : 1,
                },
              ]}
            >
              <Lock
                color={
                  isPasswordFocused
                    ? safeColor || colors.primary
                    : colors.textMuted
                }
                size={20}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={password}
                onChangeText={setPassword}
                placeholder={t(
                  'auth.newPasswordPlaceholder',
                  'Deja en blanco para no cambiar'
                )}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                editable={!loading}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={handleTogglePassword}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff
                    color={
                      isPasswordFocused
                        ? safeColor || colors.primary
                        : colors.textMuted
                    }
                    size={20}
                  />
                ) : (
                  <Eye
                    color={
                      isPasswordFocused
                        ? safeColor || colors.primary
                        : colors.textMuted
                    }
                    size={20}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            onPress={handleUpdate}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={accentGradient}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.saveBtnContent}>
                  <Key size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.saveButtonText}>
                    {t('common.saveChanges', 'Guardar Cambios')}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  content: {
    padding: Spacing.base,
    gap: 16,
  },
  overviewCard: {
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 4,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overviewIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overviewVal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 2,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordHint: {
    fontSize: 11,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeButton: {
    padding: 8,
  },
  saveButton: {
    marginTop: 12,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
