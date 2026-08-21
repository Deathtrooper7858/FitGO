import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  User, Scale, Ruler, Calendar, Activity, Database, Zap, RefreshCw,
  Fingerprint, Mail, Key, Trash2
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
    ? `${convertLength(profile.height, 'cm', lengthUnit as any).toFixed(1)} ${lengthUnit}`
    : '--';
  const sexDisplay = profile?.sex
    ? (profile.sex === 'male' ? t('profile.male') : profile.sex === 'female' ? t('profile.female') : t('profile.other', 'Otro'))
    : '--';

  return (
    <>
      <SettingsItem
        icon={User}
        label={t('profile.account', 'Cuenta')}
        rightIcon={expanded ? '▼' : '›'}
        onPress={onToggle}
        iconColor="#6366F1"
      />
      {expanded && (
        <View style={{ backgroundColor: colors.surfaceAlt + '10', borderBottomWidth: 1, borderBottomColor: colors.border + '10' }}>
          <SettingsItem icon={User} label={t('profile.editName', 'Nombre')} value={profile?.name ?? '--'} indent onPress={onEditName} iconColor="#6366F1" />
          <SettingsItem icon={Scale} label={t('profile.weight', 'Peso')} value={weightDisplay} indent onPress={onEditWeight} iconColor="#10B981" />
          <SettingsItem icon={Ruler} label={t('profile.height', 'Altura')} value={heightDisplay} indent onPress={onEditHeight} iconColor="#3B82F6" />
          <SettingsItem icon={Calendar} label={t('profile.age', 'Edad')} value={`${profile?.age ?? '--'}`} indent onPress={onEditAge} iconColor="#F59E0B" />
          <SettingsItem icon={Activity} label={t('profile.sex', 'Sexo')} value={sexDisplay} indent onPress={onEditSex} iconColor="#8B5CF6" />
          <SettingsItem
            icon={Database}
            label={t('profile.exportData', 'Exportar Data (Excel)')}
            rightIcon={!isPro ? '🔒' : undefined}
            indent
            onPress={isPro ? onExportData : onManageSubscription}
            iconColor="#10B981"
          />
          <SettingsItem icon={Zap} label={t('profile.manageSubscription', 'Gestionar Suscripción')} indent onPress={onManageSubscription} iconColor="#F59E0B" />
          {isPro ? (
            <SettingsItem icon={RefreshCw} label={t('profile.cancelSubscription', 'Cancelar Suscripción')} indent onPress={onCancelSubscription} iconColor="#EF4444" />
          ) : (
            <SettingsItem icon={RefreshCw} label={t('profile.verifySubscription', 'Verificar suscripción')} indent onPress={onVerifySubscription} iconColor="#3B82F6" />
          )}
          <SettingsItem icon={Fingerprint} label={t('profile.userId', 'ID Usuario')} value={profile?.id ?? '--'} indent onLongPress={onCopyID} iconColor="#6366F1" />
          <SettingsItem icon={Mail} label={t('auth.email', 'Email')} value={profile?.email ?? '--'} indent iconColor="#8B5CF6" />
          <SettingsItem icon={Key} label={t('profile.updateEmailPassword', 'Actualizar correo o contraseña')} indent onPress={onUpdateEmail} iconColor="#F59E0B" />
          <SettingsItem icon={Trash2} label={t('profile.deleteAccount', 'Eliminar Cuenta')} indent onPress={onDeleteAccount} isDestructive />
        </View>
      )}
    </>
  );
}
