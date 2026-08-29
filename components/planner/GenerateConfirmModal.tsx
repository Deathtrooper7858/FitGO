import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Utensils, Activity, AlertTriangle, Info, Dumbbell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { Radius } from '../../constants';

interface GenerateConfirmModalProps {
  visible: boolean;
  onConfirm: (options?: { intensityMode: 'standard' | 'express' | 'heavy' | 'recovery', focusSymmetry: boolean }) => void;
  onChangeFoods: () => void;
  onCancel: () => void;
  mode: 'nutrition' | 'workouts';
  availableFoods?: string[];
  targetCalories?: number;
  isHomeWorkout?: boolean;
  homeEquipment?: string;
  profile?: any;
  premiumColor?: string;
  isPremiumCustom?: boolean;
}

export default function GenerateConfirmModal({ visible, onConfirm, onChangeFoods, onCancel, mode, availableFoods, targetCalories, isHomeWorkout, homeEquipment, profile, premiumColor, isPremiumCustom }: GenerateConfirmModalProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const [intensityMode, setIntensityMode] = useState<'standard' | 'express' | 'heavy' | 'recovery'>('standard');
  const [focusSymmetry, setFocusSymmetry] = useState(false);

  const goalText = profile?.goal === 'gain' ? t('onboarding.gainTitle', 'Ganar Músculo')
                 : profile?.goal === 'lose' ? t('onboarding.loseTitle', 'Perder Grasa')
                 : t('onboarding.stayTitle', 'Mantener Peso');

  const hasMedical = profile?.medicalConditions && profile.medicalConditions.length > 0 && !profile.medicalConditions.includes('none');
  const medicalText = hasMedical ? profile.medicalConditions.join(', ') : '';
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIntensityMode('standard');
      setFocusSymmetry(false);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible, opacityAnim, scaleAnim]);

  const hasFoods = (availableFoods?.length ?? 0) > 0;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[gcm.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[gcm.card, { backgroundColor: colors.surface, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={isPremiumCustom && premiumColor ? [premiumColor + '33', premiumColor + '11'] : ['#7C5CFC22', '#4338CA11']}
            style={gcm.iconHeader}
          >
            <View style={[gcm.iconCircle, { backgroundColor: isPremiumCustom && premiumColor ? premiumColor + '33' : colors.primary + '22' }]}>
              <Sparkles size={32} color={isPremiumCustom && premiumColor ? premiumColor : colors.primary} />
            </View>
          </LinearGradient>

          <Text style={[gcm.title, { color: colors.textPrimary }]}>
            {mode === 'nutrition'
              ? t('planner.confirmGenNutritionTitle', '¿Generar Plan Nutricional?')
              : t('planner.confirmGenWorkoutTitle', '¿Generar Plan de Entrenamiento?')}
          </Text>

          {mode === 'nutrition' && (
            <>
              {targetCalories && (
                <View style={[gcm.infoRow, { backgroundColor: colors.primary + '11', borderColor: colors.primary + '33' }]}>
                  <Info size={16} color={colors.primary} />
                  <Text style={[gcm.infoText, { color: colors.textSecondary }]}>
                    {t('planner.confirmCalorieInfo', 'El plan será calculado para')}{' '}
                    <Text style={{ color: colors.primary, fontWeight: '800' }}>{targetCalories} kcal/día</Text>
                    {' '}{t('planner.confirmCalorieInfo2', 'según tu perfil y objetivos.')}
                  </Text>
                </View>
              )}
              <View style={[gcm.foodsBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <View style={gcm.foodsHeader}>
                  <Utensils size={15} color={hasFoods ? colors.primary : colors.textMuted} />
                  <Text style={[gcm.foodsTitle, { color: colors.textPrimary }]}>
                    {t('planner.confirmFoodsLabel', 'Alimentos disponibles')}
                  </Text>
                </View>
                {hasFoods ? (
                  <Text style={[gcm.foodsList, { color: colors.textSecondary }]} numberOfLines={3}>
                    {availableFoods!.slice(0, 8).join(', ')}{availableFoods!.length > 8 ? ` +${availableFoods!.length - 8} más` : ''}
                  </Text>
                ) : (
                  <Text style={[gcm.foodsEmpty, { color: colors.textMuted }]}>
                    {t('planner.confirmNoFoods', 'No has especificado alimentos. La IA elegirá opciones saludables y variadas.')}
                  </Text>
                )}
              </View>
            </>
          )}

          {mode === 'workouts' && (
            <>
              <View style={[gcm.infoRow, { backgroundColor: colors.primary + '11', borderColor: colors.primary + '33' }]}>
                <Activity size={16} color={colors.primary} />
                <Text style={[gcm.infoText, { color: colors.textSecondary }]}>
                  {t('planner.confirmContextTitle', 'Plan optimizado para')}:
                  <Text style={{ color: colors.primary, fontWeight: '800' }}> {goalText}</Text>
                  {profile?.activityLevel && <Text> ({profile.activityLevel})</Text>}
                </Text>
              </View>
              {hasMedical && (
                <View style={[gcm.infoRow, { backgroundColor: colors.error + '11', borderColor: colors.error + '33' }]}>
                  <AlertTriangle size={16} color={colors.error} />
                  <Text style={[gcm.infoText, { color: colors.textSecondary }]}>
                    {t('planner.confirmMedicalLabel', 'Condiciones a considerar')}:
                    <Text style={{ color: colors.error, fontWeight: '700' }}> {medicalText}</Text>
                  </Text>
                </View>
              )}
              {isHomeWorkout && (
                <View style={[gcm.foodsBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <View style={gcm.foodsHeader}>
                    <Dumbbell size={15} color={colors.primary} />
                    <Text style={[gcm.foodsTitle, { color: colors.textPrimary }]}>
                      {t('planner.confirmEquipmentLabel', 'Implementos disponibles (Casa)')}
                    </Text>
                  </View>
                  {homeEquipment ? (
                    <Text style={[gcm.foodsList, { color: colors.textSecondary }]} numberOfLines={3}>{homeEquipment}</Text>
                  ) : (
                    <Text style={[gcm.foodsEmpty, { color: colors.warning }]}>
                      {t('planner.confirmNoEquipment', 'Verifica que tienes los implementos necesarios.')}
                    </Text>
                  )}
                </View>
              )}
              <View style={[gcm.foodsBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginTop: 12 }]}>
                <Text style={[gcm.foodsTitle, { color: colors.textPrimary, marginBottom: 8 }]}>{t('planner.workoutMode', 'Modo de Entrenamiento')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(['standard', 'express', 'heavy', 'recovery'] as const).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[gcm.modeBtn, intensityMode === m && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setIntensityMode(m)}
                    >
                      <Text style={[gcm.modeBtnText, intensityMode === m ? { color: '#fff' } : { color: colors.textSecondary }]}>
                        {m === 'standard' ? `🏋️ ${t('planner.modeNormal', 'Normal')}` : m === 'express' ? `⚡ ${t('planner.modeExpress', 'Rápido (25m)')}` : m === 'heavy' ? `🚀 ${t('planner.modeHeavy', 'Fuerza/Pesado')}` : `🧘 ${t('planner.modeRecovery', 'Recuperación')}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                style={[gcm.infoRow, { backgroundColor: focusSymmetry ? colors.primary + '22' : colors.surfaceAlt, borderColor: focusSymmetry ? colors.primary : colors.border, marginTop: 8, marginBottom: 16 }]}
                onPress={() => setFocusSymmetry(!focusSymmetry)}
                activeOpacity={0.7}
              >
                <Activity size={16} color={focusSymmetry ? colors.primary : colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={[gcm.infoText, { color: focusSymmetry ? colors.primary : colors.textPrimary, fontWeight: '700' }]}>{t('planner.symmetryFocus', 'Enfoque de Simetría')}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('planner.symmetryFocusDesc', 'La IA priorizará tus músculos más débiles')}</Text>
                </View>
                <Switch value={focusSymmetry} onValueChange={setFocusSymmetry} />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={[gcm.btnPrimary]} activeOpacity={0.85} onPress={() => onConfirm({ intensityMode, focusSymmetry })}>
            <LinearGradient
              colors={isPremiumCustom && premiumColor ? [premiumColor, premiumColor + 'CC'] : ['#7C5CFC', '#4338CA']}
              style={gcm.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Sparkles size={16} color="#fff" />
              <Text style={gcm.btnPrimaryText}>{t('planner.confirmGenerate', 'Generar Plan Ahora')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {mode === 'nutrition' && (
            <TouchableOpacity
              style={[gcm.btnSecondary, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={onChangeFoods}
            >
              <Utensils size={15} color={colors.primary} />
              <Text style={[gcm.btnSecondaryText, { color: colors.primary }]}>
                {t('planner.confirmChangeFoods', 'Cambiar Alimentos Disponibles')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={gcm.btnCancel} activeOpacity={0.7} onPress={onCancel}>
            <Text style={[gcm.btnCancelText, { color: colors.textMuted }]}>{t('common.cancel', 'Cancelar')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const gcm = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:           { width: '100%', maxWidth: 420, borderRadius: 28, overflow: 'hidden', padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 20 },
  iconHeader:     { alignItems: 'center', paddingVertical: 16, marginBottom: 8 },
  iconCircle:     { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  title:          { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 16, letterSpacing: -0.3 },
  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  infoText:       { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  foodsBox:       { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  foodsHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  foodsTitle:     { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  foodsList:      { fontSize: 13, lineHeight: 19 },
  foodsEmpty:     { fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  btnPrimary:     { borderRadius: Radius.full, overflow: 'hidden', marginBottom: 10, elevation: 4, shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnGrad:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnSecondary:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: Radius.full, borderWidth: 1, marginBottom: 10 },
  btnSecondaryText:{ fontSize: 14, fontWeight: '700' },
  btnCancel:      { alignItems: 'center', paddingVertical: 10 },
  btnCancelText:  { fontSize: 14, fontWeight: '600' },
  modeBtn:        { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  modeBtnText:    { fontSize: 13, fontWeight: '800' },
});
