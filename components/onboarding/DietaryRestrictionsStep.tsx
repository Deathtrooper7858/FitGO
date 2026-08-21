import React from 'react';
import { Apple } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { HealthProfileStep } from './HealthProfileStep';
import { StepProps } from './constants';

export function DietaryRestrictionsStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const itemsObj = t('onboarding.dietaryItems', { returnObjects: true }) as Record<string, string>;
  return <HealthProfileStep icon={Apple} titleKey="onboarding.dietaryRestrictionsTitle" subKey="onboarding.dietaryRestrictionsSub" itemsObj={itemsObj} fieldKey="dietaryRestrictions" data={data} onChange={onChange} />;
}
