import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Activity, Heart, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import type { UserProfile } from '../../store';
import { SettingsItem } from './SettingsItem';

interface HealthSectionProps {
  profile: UserProfile | null;
  expanded: boolean;
  onToggle: () => void;
  onHealthPress: () => void;
}

export function HealthSection({ profile, expanded, onToggle, onHealthPress }: HealthSectionProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <SettingsItem
        icon={Activity}
        label={t('profile.healthProfile', 'Perfil de Salud')}
        rightIcon={expanded ? '▼' : '›'}
        onPress={onToggle}
        iconColor="#3B82F6"
      />
      {expanded && (
        <View style={{ backgroundColor: colors.surfaceAlt + '10', borderBottomWidth: 1, borderBottomColor: colors.border + '10' }}>
          <SettingsItem
            icon={Heart}
            label={t('profile.dietaryRestrictions', 'Restricciones Dietéticas')}
            value={profile?.dietaryRestrictions?.includes('none') || !profile?.dietaryRestrictions?.length ? t('profile.none') : `${profile.dietaryRestrictions.length} seleccionadas`}
            indent
            onPress={onHealthPress}
            iconColor="#EF4444"
          />
          <SettingsItem
            icon={Activity}
            label={t('profile.medicalConditions', 'Condiciones Médicas')}
            value={profile?.medicalConditions?.includes('none') || !profile?.medicalConditions?.length ? t('profile.none') : `${profile.medicalConditions.length} seleccionadas`}
            indent
            onPress={onHealthPress}
            iconColor="#3B82F6"
          />
          <SettingsItem
            icon={ShieldCheck}
            label={t('profile.medicationsSupplements', 'Medicamentos')}
            value={profile?.medicationsSupplements?.includes('none') || !profile?.medicationsSupplements?.length ? t('profile.none') : `${profile.medicationsSupplements.length} seleccionados`}
            indent
            onPress={onHealthPress}
            iconColor="#10B981"
          />
        </View>
      )}
    </>
  );
}
