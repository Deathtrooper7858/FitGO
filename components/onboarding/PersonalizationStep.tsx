import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Scale, ChevronRight, AlertCircle, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';

export function PersonalizationStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  useEffect(() => {
    const defaultW = data.weightUnit === 'lbs' ? 154 : 70;
    const cur = data.weight ?? defaultW;
    const tar = data.targetWeight ?? cur;

    if (data.goal === 'maintain' && tar !== cur) {
      onChange({ targetWeight: cur });
    } else if (data.goal === 'lose' && tar >= cur) {
      onChange({ targetWeight: data.weightUnit === 'lbs' ? cur - 4 : cur - 2 });
    } else if (data.goal === 'gain' && tar <= cur) {
      onChange({ targetWeight: data.weightUnit === 'lbs' ? cur + 4 : cur + 2 });
    }
  }, [data.goal, data.weightUnit]);

  const heightM = (data.height ?? 170) / 100;
  const defaultW = data.weightUnit === 'lbs' ? 154 : 70;
  const currentVal = data.targetWeight ?? data.weight ?? defaultW;
  const currentValKg = data.weightUnit === 'lbs' ? currentVal / 2.20462 : currentVal;
  const targetBMI = currentValKg / (heightM * heightM);
  const idealMin = Math.round(18.5 * heightM * heightM);
  const idealMax = Math.round(24.9 * heightM * heightM);
  const idealMinDisplay = data.weightUnit === 'lbs' ? Math.round(idealMin * 2.20462) : idealMin;
  const idealMaxDisplay = data.weightUnit === 'lbs' ? Math.round(idealMax * 2.20462) : idealMax;
  const unitLabel = data.weightUnit === 'lbs' ? 'lbs' : 'kg';

  let statusColor = '#10B981';
  let statusIcon = <Sparkles size={16} color={statusColor} />;
  let statusText = '';

  if (data.goal === 'lose') {
    if (targetBMI < 18.5) {
      statusColor = '#EF4444';
      statusIcon = <AlertCircle size={16} color={statusColor} />;
      statusText = t('onboarding.warningUnderweight', { min: idealMinDisplay, max: idealMaxDisplay, unit: unitLabel, defaultValue: `Este objetivo es demasiado bajo. Tu rango ideal es ${idealMinDisplay}-${idealMaxDisplay} ${unitLabel}.` });
    } else if (targetBMI > 24.9) {
      statusColor = '#F59E0B';
      statusIcon = <AlertCircle size={16} color={statusColor} />;
      statusText = t('onboarding.recOverweightStep', { min: idealMinDisplay, max: idealMaxDisplay, unit: unitLabel, defaultValue: `Buen paso inicial. Recuerda que tu peso ideal a largo plazo es ${idealMinDisplay}-${idealMaxDisplay} ${unitLabel}.` });
    } else {
      statusText = t('onboarding.loseHealthy', `¡Excelente meta! Alcanzarás un peso muy saludable para tu estatura.`);
    }
  } else if (data.goal === 'gain') {
    if (targetBMI > 27.5) {
      statusColor = '#F59E0B';
      statusIcon = <AlertCircle size={16} color={statusColor} />;
      statusText = t('onboarding.warningOverweightGain', { min: idealMinDisplay, max: idealMaxDisplay, unit: unitLabel, defaultValue: `Cuidado con subir demasiada grasa. Tu rango saludable base es ${idealMinDisplay}-${idealMaxDisplay} ${unitLabel}.` });
    } else if (targetBMI < 18.5) {
      statusColor = '#EF4444';
      statusIcon = <AlertCircle size={16} color={statusColor} />;
      statusText = t('onboarding.warningUnderweightGain', { min: idealMinDisplay, max: idealMaxDisplay, unit: unitLabel, defaultValue: `Este objetivo sigue siendo bajo. Tu rango ideal es ${idealMinDisplay}-${idealMaxDisplay} ${unitLabel}.` });
    } else {
      statusText = t('onboarding.gainHealthy', `¡Perfecto para ganar masa muscular manteniendo un peso saludable!`);
    }
  } else {
    if (targetBMI < 18.5) {
      statusColor = '#F59E0B';
      statusIcon = <AlertCircle size={16} color={statusColor} />;
      statusText = t('onboarding.warningUnderweightMaintain', `Actualmente tienes bajo peso. Te recomendamos cambiar tu meta a ganar masa muscular.`);
    } else if (targetBMI > 24.9) {
      statusColor = '#F59E0B';
      statusIcon = <AlertCircle size={16} color={statusColor} />;
      statusText = t('onboarding.warningOverweightMaintain', `Tu peso actual es alto. Te sugerimos considerar la meta de pérdida de peso.`);
    } else {
      statusText = t('onboarding.maintainHealthy', `¡Excelente! Estás en un peso ideal para mantenerte en forma y saludable.`);
    }
  }

  const minAllowedWeightKg = Math.max(30, Math.floor(15.0 * heightM * heightM));
  const maxAllowedWeightKg = Math.min(250, Math.ceil(40.0 * heightM * heightM));
  const minAllowedWeight = data.weightUnit === 'lbs' ? Math.round(minAllowedWeightKg * 2.20462) : minAllowedWeightKg;
  const maxAllowedWeight = data.weightUnit === 'lbs' ? Math.round(maxAllowedWeightKg * 2.20462) : maxAllowedWeightKg;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <View style={[step.targetCircle, { backgroundColor: colors.primary + '15', shadowColor: colors.primary }]}>
          <Target size={36} color={colors.primary} />
        </View>
        <Text style={[step.title, { color: colors.textPrimary }]}>{t('onboarding.personalizeTitle')}</Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>{t('onboarding.personalizeSub')}</Text>
      </View>

      <View style={step.optionList}>
        <TouchableOpacity
          style={[step.optionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <View style={[step.iconContainer, { backgroundColor: colors.background }]}>
            <Scale size={22} color={colors.primary} />
          </View>
          <Text style={[step.optionTitle, { color: colors.textPrimary, flex: 1 }]}>{t('onboarding.currentWeight')}</Text>
          <Text style={[step.optionSub, { color: colors.textPrimary, fontWeight: '700' }]}>{data.weight} {unitLabel}</Text>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={{ gap: 8 }}>
          <View style={[step.optionCard, { backgroundColor: colors.surface, borderColor: colors.border, paddingVertical: 8 }]}>
            <View style={[step.iconContainer, { backgroundColor: colors.background }]}>
              <Target size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[step.optionTitle, { color: colors.textPrimary }]}>{t('onboarding.targetWeight')}</Text>
            </View>
            <View style={step.miniNumRow}>
              <TouchableOpacity
                onPress={() => {
                  if (data.goal === 'lose' && currentVal - 1 >= minAllowedWeight) {
                    onChange({ targetWeight: currentVal - 1 });
                  } else if (data.goal === 'gain' && currentVal > (data.weight ?? 0) + 1 && currentVal - 1 >= minAllowedWeight) {
                    onChange({ targetWeight: currentVal - 1 });
                  }
                }}
                style={[
                  step.miniNumBtn,
                  { borderColor: colors.border },
                  (data.goal === 'maintain' || (data.goal === 'gain' && currentVal <= (data.weight ?? 0) + 1) || currentVal <= minAllowedWeight) && { opacity: 0.3 }
                ]}
                disabled={data.goal === 'maintain' || (data.goal === 'gain' && currentVal <= (data.weight ?? 0) + 1) || currentVal <= minAllowedWeight}
              >
                <Text style={{ color: colors.primary }}>-</Text>
              </TouchableOpacity>

              <TextInput
                style={[step.numValueSmall, { color: colors.textPrimary, padding: 0, minWidth: 40, textAlign: 'center' }]}
                keyboardType="numeric"
                value={data.targetWeight !== undefined ? data.targetWeight.toString() : ''}
                placeholder={currentVal.toString()}
                placeholderTextColor={colors.textMuted}
                onChangeText={(text) => {
                  if (text === '') {
                    onChange({ targetWeight: undefined });
                  } else {
                    const parsed = parseFloat(text.replace(/[^0-9]/g, ''));
                    if (!isNaN(parsed)) {
                      onChange({ targetWeight: parsed });
                    }
                  }
                }}
              />
              <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '700', marginLeft: 4 }}>{unitLabel}</Text>

              <TouchableOpacity
                onPress={() => {
                  if (data.goal === 'gain' && currentVal + 1 <= maxAllowedWeight) {
                    onChange({ targetWeight: currentVal + 1 });
                  } else if (data.goal === 'lose' && currentVal < (data.weight ?? 0) - 1 && currentVal + 1 <= maxAllowedWeight) {
                    onChange({ targetWeight: currentVal + 1 });
                  }
                }}
                style={[
                  step.miniNumBtn,
                  { borderColor: colors.border },
                  (data.goal === 'maintain' || (data.goal === 'lose' && currentVal >= (data.weight ?? 0) - 1) || currentVal >= maxAllowedWeight) && { opacity: 0.3 }
                ]}
                disabled={data.goal === 'maintain' || (data.goal === 'lose' && currentVal >= (data.weight ?? 0) - 1) || currentVal >= maxAllowedWeight}
              >
                <Text style={{ color: colors.primary }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: statusColor + '12',
            padding: 14,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: statusColor + '40',
            shadowColor: statusColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
          }}>
            <View style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: statusColor + '20',
              justifyContent: 'center', alignItems: 'center',
              marginRight: 12
            }}>
              {statusIcon}
            </View>
            <Text style={{ color: statusColor, fontSize: 13, flex: 1, fontWeight: '600', lineHeight: 19 }}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={step.field}>
          <Text style={[step.fieldLabel, { color: colors.textSecondary, marginTop: 10 }]}>{t('onboarding.velocity')}</Text>
          <View style={step.sexRow}>
            {(['slow', 'moderate', 'fast'] as const).map((v) => {
              const velocityAccent = v === 'slow' ? '#10B981' : v === 'moderate' ? '#F59E0B' : '#EF4444';
              const active = data.velocity === v;
              return (
                <TouchableOpacity
                  key={v}
                  style={[
                    step.sexBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    active && {
                      borderColor: velocityAccent,
                      shadowColor: velocityAccent,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 3
                    }
                  ]}
                  onPress={() => onChange({ velocity: v as any })}
                  activeOpacity={0.8}
                >
                  {active && (
                    <LinearGradient
                      colors={[velocityAccent + '18', velocityAccent + '04']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />
                  )}
                  <Text
                    style={[step.sexLabel, { color: active ? velocityAccent : colors.textSecondary, fontWeight: active ? '900' : '600' }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {t(`onboarding.velocity${v.charAt(0).toUpperCase() + v.slice(1)}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
