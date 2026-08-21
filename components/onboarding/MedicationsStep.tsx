import React from 'react';
import { Activity } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { HealthProfileStep } from './HealthProfileStep';
import { StepProps } from './constants';

export function MedicationsStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const itemsObj = t('onboarding.medicationItems', { returnObjects: true }) as Record<string, string>;
  return <HealthProfileStep icon={Activity} titleKey="onboarding.medicationsTitle" subKey="onboarding.medicationsSub" itemsObj={itemsObj} fieldKey="medicationsSupplements" data={data} onChange={onChange} />;
}
