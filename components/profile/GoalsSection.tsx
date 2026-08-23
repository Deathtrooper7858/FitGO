import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react-native';
import { SettingsItem } from './SettingsItem';

interface GoalsSectionProps {
  onEditPress: () => void;
}

export function GoalsSection({ onEditPress }: GoalsSectionProps) {
  const { t } = useTranslation();

  return (
    <SettingsItem
      icon={Flame}
      label={t('profile.updateGoals', 'Actualizar objetivos')}
      onPress={onEditPress}
      showGradient
      iconColor="#FF4D4D"
    />
  );
}
