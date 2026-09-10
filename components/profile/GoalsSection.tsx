import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Flame, Sparkles } from 'lucide-react-native';
import { SettingsItem } from './SettingsItem';

interface GoalsSectionProps {
  onEditPress: () => void;
  onEditSecondaryPress?: () => void;
}

export function GoalsSection({ onEditPress, onEditSecondaryPress }: GoalsSectionProps) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 8 }}>
      <SettingsItem
        icon={Flame}
        label={t('profile.updateGoals', 'Actualizar Objetivos')}
        subtitle={t('profile.updateGoalsSubtitle', 'Recalcula tus calorías, macros y meta de peso')}
        onPress={onEditPress}
        showGradient
        iconColor="#FF4D4D"
      />
      {onEditSecondaryPress && (
        <SettingsItem
          icon={Sparkles}
          label={t('onboarding.secondaryGoalsProfileLabel', 'Motivaciones y Metas Secundarias')}
          subtitle={t('onboarding.secondaryGoalsProfileSub', 'Ajusta lo que quieres lograr con tu transformación')}
          onPress={onEditSecondaryPress}
          showGradient
          iconColor="#F59E0B"
        />
      )}
    </View>
  );
}
