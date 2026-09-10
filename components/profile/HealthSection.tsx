import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Activity, Heart, ShieldCheck, Stethoscope } from 'lucide-react-native';
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

  const totalRestrictions = profile?.dietaryRestrictions?.filter(r => r !== 'none').length || 0;
  const totalConditions = profile?.medicalConditions?.filter(c => c !== 'none').length || 0;
  const totalMeds = profile?.medicationsSupplements?.filter(m => m !== 'none').length || 0;

  return (
    <>
      <SettingsItem
        icon={Stethoscope}
        label={t('profile.healthProfile', 'Perfil de Salud y Médico')}
        subtitle={t('profile.healthProfileSubtitle', 'Restricciones dietéticas, condiciones y suplementos')}
        badge={totalRestrictions + totalConditions + totalMeds > 0 ? `${totalRestrictions + totalConditions + totalMeds}` : undefined}
        badgeColor="#3B82F6"
        rightIcon={expanded ? '▼' : '›'}
        onPress={onToggle}
        iconColor="#3B82F6"
      />
      {expanded && (
        <View style={{ backgroundColor: colors.surfaceAlt + '10', borderBottomWidth: 1, borderBottomColor: colors.border + '15' }}>
          <SettingsItem
            icon={Heart}
            label={t('profile.dietaryRestrictions', 'Restricciones Dietéticas')}
            subtitle={t('profile.dietaryRestrictionsSubtitle', 'Alergias, veganismo, intolerancias')}
            value={totalRestrictions > 0 ? t('profile.activeRestrictions', '{{count}} activas', { count: totalRestrictions }) : t('profile.none', 'Ninguna')}
            indent
            onPress={onHealthPress}
            iconColor="#EF4444"
          />
          <SettingsItem
            icon={Activity}
            label={t('profile.medicalConditions', 'Condiciones Médicas')}
            subtitle={t('profile.medicalConditionsSubtitle', 'Lesiones, hipertensión, diabetes')}
            value={totalConditions > 0 ? t('profile.registeredConditions', '{{count}} registradas', { count: totalConditions }) : t('profile.none', 'Ninguna')}
            indent
            onPress={onHealthPress}
            iconColor="#3B82F6"
          />
          <SettingsItem
            icon={ShieldCheck}
            label={t('profile.medicationsSupplements', 'Medicamentos y Suplementos')}
            subtitle={t('profile.medicationsSupplementsSubtitle', 'Creatina, proteína, fármacos')}
            value={totalMeds > 0 ? t('profile.addedSupplements', '{{count}} añadidos', { count: totalMeds }) : t('profile.none', 'Ninguno')}
            indent
            onPress={onHealthPress}
            iconColor="#10B981"
          />
        </View>
      )}
    </>
  );
}
