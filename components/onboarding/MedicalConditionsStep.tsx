import React from 'react';
import { Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { HealthProfileStep } from './HealthProfileStep';
import { StepProps } from './constants';

export function MedicalConditionsStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const itemsObj = t('onboarding.medicalItems', { returnObjects: true }) as Record<string, string>;
  return <HealthProfileStep icon={Heart} titleKey="onboarding.medicalConditionsTitle" subKey="onboarding.medicalConditionsSub" itemsObj={itemsObj} fieldKey="medicalConditions" data={data} onChange={onChange} />;
}
