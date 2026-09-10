import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  User, Scale, Ruler, Calendar, Activity, Database, Zap, RefreshCw,
  Fingerprint, Mail, Key, Trash2, Crown
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { convertMass, convertLength } from '../../utils/units';
import type { UserProfile } from '../../store';
import { SettingsItem } from './SettingsItem';

interface AccountSectionProps {
  profile: UserProfile | null;
  massUnit: string;
  lengthUnit: string;
  isPro: boolean;
  expanded: boolean;
  onToggle: () => void;
  onEditName: () => void;
  onEditWeight: () => void;
  onEditHeight: () => void;
  onEditAge: () => void;
  onEditSex: () => void;
  onExportData: () => void;
  onManageSubscription: () => void;
  onCancelSubscription: () => void;
  onVerifySubscription: () => void;
  onCopyID: () => void;
  onUpdateEmail: () => void;
  onDeleteAccount: () => void;
}

export function AccountSection({
  profile, massUnit, lengthUnit, isPro, expanded, onToggle,
  onEditName, onEditWeight, onEditHeight, onEditAge, onEditSex,
  onExportData, onManageSubscription, onCancelSubscription, onVerifySubscription,
  onCopyID, onUpdateEmail, onDeleteAccount,
}: AccountSectionProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const weightDisplay = profile?.weight
    ? `${convertMass(profile.weight, 'kg', massUnit as any).toFixed(1)} ${massUnit}`
    : '--';
  const heightDisplay = profile?.height
    ? `${convertLength(profile.height, 'cm', lengthUnit as any).toFixed(0)} ${lengthUnit}`
    : '--';
  const sexDisplay = profile?.sex
    ? (profile.sex === 'male' ? t('profile.male', 'Hombre') : profile.sex === 'female' ? t('profile.female', 'Mujer') : t('profile.other', 'Otro'))
    : '--';

  return (
    <>
      <SettingsItem
        icon={User}
        label={t('profile.account', 'Cuenta y Datos')}
        subtitle={t('profile.accountSubtitle', 'Tus medidas físicas, suscripción y seguridad')}
        badge={isPro ? 'PRO' : undefined}
        badgeColor="#F59E0B"
        rightIcon={expanded ? '▼' : '›'}
        onPress={onToggle}
        iconColor="#6366F1"
      />

      {expanded && (
        <View style={{ backgroundColor: colors.surfaceAlt + '10', borderBottomWidth: 1, borderBottomColor: colors.border + '15' }}>
          {/* Subheader: Medidas Físicas */}
          <SettingsItem
            icon={User}
            label={t('profile.editName', 'Nombre')}
            value={profile?.name ?? '--'}
            indent
            onPress={onEditName}
            iconColor="#6366F1"
          />
          <SettingsItem
            icon={Scale}
            label={t('profile.weight', 'Peso Corporal')}
            value={weightDisplay}
            indent
            onPress={onEditWeight}
            iconColor="#10B981"
          />
          <SettingsItem
            icon={Ruler}
            label={t('profile.height', 'Estatura')}
            value={heightDisplay}
            indent
            onPress={onEditHeight}
            iconColor="#3B82F6"
          />
          <SettingsItem
            icon={Calendar}
            label={t('profile.age', 'Edad')}
            value={`${profile?.age ?? '--'} ${t('profile.years', 'años')}`}
            indent
            onPress={onEditAge}
            iconColor="#F59E0B"
          />
          <SettingsItem
            icon={Activity}
            label={t('profile.sex', 'Sexo Biológico')}
            value={sexDisplay}
            indent
            onPress={onEditSex}
            iconColor="#8B5CF6"
          />

          {/* Subheader: Suscripción & Datos */}
          <SettingsItem
            icon={isPro ? Crown : Zap}
            label={t('profile.manageSubscription', 'FitGO Pro')}
            subtitle={isPro ? t('profile.proActive', 'Suscripción Activa') : t('profile.upgradePro', 'Desbloquea todas las funciones')}
            badge={isPro ? 'ACTIVO' : 'FREE'}
            badgeColor={isPro ? '#10B981' : '#F59E0B'}
            indent
            onPress={onManageSubscription}
            iconColor="#F59E0B"
          />

          {isPro ? (
            <SettingsItem
              icon={RefreshCw}
              label={t('profile.cancelSubscription', 'Cancelar Suscripción')}
              subtitle={t('profile.cancelSubSubtitle', 'Gestiona tu plan o cancela la renovación')}
              indent
              onPress={onCancelSubscription}
              iconColor="#EF4444"
            />
          ) : (
            <SettingsItem
              icon={RefreshCw}
              label={t('profile.verifySubscription', 'Restaurar Compras')}
              subtitle={t('profile.verifySubSubtitle', 'Si ya compraste Pro en este dispositivo')}
              indent
              onPress={onVerifySubscription}
              iconColor="#3B82F6"
            />
          )}

          <SettingsItem
            icon={Database}
            label={t('profile.exportData', 'Exportar Informe Completo')}
            subtitle={t('profile.exportSubtitle', 'PDF para nutricionista, Excel (.xlsx) o CSV')}
            rightIcon={!isPro ? '🔒' : undefined}
            indent
            onPress={isPro ? onExportData : onManageSubscription}
            iconColor="#10B981"
          />

          {/* Subheader: Seguridad */}
          <SettingsItem
            icon={Fingerprint}
            label={t('profile.userId', 'ID de Usuario')}
            value={profile?.id ? `${profile.id.substring(0, 10)}...` : '--'}
            subtitle={t('profile.copyIdPrompt', 'Toca para copiar ID al portapapeles')}
            indent
            onPress={onCopyID}
            onLongPress={onCopyID}
            iconColor="#6366F1"
          />

          <SettingsItem
            icon={Mail}
            label={t('auth.email', 'Correo Electrónico')}
            value={profile?.email ?? '--'}
            indent
            onPress={onUpdateEmail}
            iconColor="#8B5CF6"
          />

          <SettingsItem
            icon={Key}
            label={t('profile.updateEmailPassword', 'Actualizar Seguridad')}
            subtitle={t('profile.updateSecuritySubtitle', 'Cambiar correo o contraseña')}
            indent
            onPress={onUpdateEmail}
            iconColor="#F59E0B"
          />

          <SettingsItem
            icon={Trash2}
            label={t('profile.deleteAccount', 'Eliminar Cuenta')}
            subtitle={t('profile.deleteAccountWarn', 'Acción irreversible')}
            indent
            onPress={onDeleteAccount}
            isDestructive
          />
        </View>
      )}
    </>
  );
}
