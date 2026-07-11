import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle, Line as SvgLine } from 'react-native-svg';
import { Check, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps } from './constants';

export function ProjectionStep({ value: data }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const isLbs = data.weightUnit === 'lbs';
  const unitLabel = isLbs ? 'lbs' : 'kg';
  const wKg = isLbs ? (data.weight ?? 154) / 2.20462 : (data.weight ?? 70);
  const tKg = isLbs ? (data.targetWeight ?? 143) / 2.20462 : (data.targetWeight ?? 65);

  const diffKg = Math.abs(tKg - wKg);
  const velocityMap = { slow: 0.25, moderate: 0.5, fast: 1.0 };
  const vKg = velocityMap[data.velocity ?? 'moderate'];

  const weeks = diffKg / vKg;
  const days = Math.max(1, Math.round(weeks * 7));

  const today = new Date();
  const endD = new Date();
  endD.setDate(today.getDate() + days);

  const q1 = new Date(); q1.setDate(today.getDate() + Math.round(days * 0.33));
  const q2 = new Date(); q2.setDate(today.getDate() + Math.round(days * 0.66));

  const formatDate = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const labels = [t('common.today', 'Hoy'), formatDate(q1), formatDate(q2), formatDate(endD)];

  const isLosing = tKg < wKg;
  const isMaintaining = Math.abs(tKg - wKg) < 0.5;

  const cW = 320;
  const cH = 120;
  const startY = isMaintaining ? cH / 2 : isLosing ? 20 : cH - 20;
  const endY = isMaintaining ? cH / 2 : isLosing ? cH - 20 : 20;

  const mY = (startY + endY) / 2;
  const wavyPath = isMaintaining
    ? `M 20 ${startY} L ${cW - 20} ${endY}`
    : `M 20 ${startY} C ${cW * 0.3} ${startY}, ${cW * 0.3} ${mY}, ${cW * 0.5} ${mY} S ${cW * 0.7} ${endY}, ${cW - 20} ${endY}`;

  const accentLine = colors.primary;

  return (
    <View style={step.container}>
      <View style={{ alignItems: 'center', marginBottom: 28, marginTop: 10 }}>
        <View style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: '#10B981',
          justifyContent: 'center', alignItems: 'center',
          marginBottom: 20,
          shadowColor: '#10B981',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 10
        }}>
          <Check size={38} color="#FFF" strokeWidth={3} />
        </View>
        <Text style={[step.title, { color: colors.textPrimary, fontSize: 24 }]}>{t('onboarding.projectionTitle', '...y así será tu progreso')}</Text>
      </View>

      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: colors.border,
        padding: 20,
        paddingTop: 24,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4
      }}>
        <LinearGradient
          colors={[accentLine + '08', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{t('onboarding.currentGoal', 'Inicio')}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '900' }}>{data.weight} {unitLabel}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Trophy size={18} color="#F59E0B" />
            <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{t('onboarding.nextGoal', 'Meta')}</Text>
            <Text style={{ color: '#F59E0B', fontSize: 16, fontWeight: '900' }}>{data.targetWeight} {unitLabel}</Text>
          </View>
        </View>

        <View style={{ height: cH + 10, marginVertical: 8 }}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${cW} ${cH}`}>
            <Defs>
              <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={accentLine} stopOpacity="0.25" />
                <Stop offset="1" stopColor={accentLine} stopOpacity="0" />
              </SvgLinearGradient>
            </Defs>
            <SvgLine x1="20" y1="0" x2="20" y2={cH} stroke={colors.border} strokeWidth="1" strokeDasharray="5,5" />
            <SvgLine x1={cW - 20} y1="0" x2={cW - 20} y2={cH} stroke={colors.border} strokeWidth="1" strokeDasharray="5,5" />
            <Path d={`${wavyPath} L ${cW - 20} ${cH} L 20 ${cH} Z`} fill="url(#grad)" />
            <Path d={wavyPath} fill="none" stroke={accentLine} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="20" cy={startY} r="7" fill={colors.surface} stroke={accentLine} strokeWidth="3" />
            <Circle cx={cW - 20} cy={endY} r="7" fill={colors.surface} stroke="#F59E0B" strokeWidth="3" />
          </Svg>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 2 }}>
          {labels.map((lbl, idx) => (
            <Text key={idx} style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>{lbl}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}
