import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { Apple, Dumbbell, Activity, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../hooks/useTheme';
import CoachScreen from '../../../components/CoachScreen';
import { GlobalBackground } from '../../../components/GlobalBackground';
import { useSettingsStore, useAuthStore } from '../../../store';
import { AppModeModal } from '../../../components/profile/AppModeModal';

export default function CoachIndex() {
  const params = useLocalSearchParams();
  const [activeCoach, setActiveCoach] = useState<'nutritionist' | 'trainer' | 'doctor'>((params.initialTab as 'nutritionist' | 'trainer' | 'doctor') || 'nutritionist');
  const { appMode, setAppMode } = useSettingsStore();
  const { profile } = useAuthStore();
  const isSimple = appMode === 'simple';
  const [appModeModalVisible, setAppModeModalVisible] = useState(false);

  useEffect(() => {
    if (params.initialTab && (params.initialTab === 'nutritionist' || params.initialTab === 'trainer' || params.initialTab === 'doctor')) {
      setActiveCoach(params.initialTab as 'nutritionist' | 'trainer' | 'doctor');
    }
  }, [params.initialTab]);

  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GlobalBackground />
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <View style={s.toggleWrap}>
          {isSimple && (
            <TouchableOpacity
              style={[s.simpleModeBanner, { backgroundColor: '#10B98115', borderColor: '#10B98140' }]}
              onPress={() => {
                Haptics.selectionAsync();
                setAppModeModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={s.simpleModeBannerLeft}>
                <View style={[s.simpleModeIconWrap, { backgroundColor: '#10B98125' }]}>
                  <Sparkles size={14} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.simpleModeBannerTitle, { color: colors.textPrimary }]}>
                    {t('coach.simpleModeBadge', 'Versión Simplificada')}
                  </Text>
                  <Text style={[s.simpleModeBannerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                    {t('coach.simpleModeSub', 'Asistente guiado • Toca para cambiar a Avanzada')}
                  </Text>
                </View>
              </View>
              <View style={[s.simpleModeBadgeTag, { backgroundColor: '#10B98122' }]}>
                <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800' }}>
                  {t('common.change', 'Cambiar')} ›
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={[s.toggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={[
                s.toggleBtn, 
                activeCoach === 'nutritionist' && { 
                  backgroundColor: colors.primary + '18',
                  borderColor: colors.primary + '50',
                }
              ]}
              onPress={() => setActiveCoach('nutritionist')}
              activeOpacity={0.7}
            >
              <Apple size={16} color={activeCoach === 'nutritionist' ? colors.primary : colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={[
                s.toggleText, 
                activeCoach === 'nutritionist' 
                  ? { color: colors.primary, fontWeight: '800' } 
                  : { color: colors.textSecondary }
              ]}>
                {t('tabs.nutritionist', 'Alimentación')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                s.toggleBtn, 
                activeCoach === 'trainer' && { 
                  backgroundColor: colors.primary + '18',
                  borderColor: colors.primary + '50',
                }
              ]}
              onPress={() => setActiveCoach('trainer')}
              activeOpacity={0.7}
            >
              <Dumbbell size={16} color={activeCoach === 'trainer' ? colors.primary : colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={[
                s.toggleText, 
                activeCoach === 'trainer' 
                  ? { color: colors.primary, fontWeight: '800' } 
                  : { color: colors.textSecondary }
              ]}>
                {t('tabs.trainer', 'Entrenamiento')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                s.toggleBtn, 
                activeCoach === 'doctor' && { 
                  backgroundColor: colors.primary + '18',
                  borderColor: colors.primary + '50',
                }
              ]}
              onPress={() => setActiveCoach('doctor')}
              activeOpacity={0.7}
            >
              <Activity size={16} color={activeCoach === 'doctor' ? colors.primary : colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={[
                s.toggleText, 
                activeCoach === 'doctor' 
                  ? { color: colors.primary, fontWeight: '800' } 
                  : { color: colors.textSecondary }
              ]}>
                {t('tabs.doctor', 'Bienestar')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      <View style={{ flex: 1 }}>
        <CoachScreen key={activeCoach} coachType={activeCoach} />
      </View>

      <AppModeModal
        visible={appModeModalVisible}
        currentMode={appMode}
        onClose={() => setAppModeModalVisible(false)}
        onSelectMode={(mode) => {
          setAppMode(mode);
          if (profile) useAuthStore.getState().setProfile({ ...profile, appMode: mode });
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  toggleWrap: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },
  simpleModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
  },
  simpleModeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  simpleModeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleModeBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  simpleModeBannerSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  simpleModeBadgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toggleContainer: { 
    flexDirection: 'row', 
    borderRadius: 24, 
    padding: 3, 
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  toggleBtn: { 
    flex: 1, 
    paddingVertical: 9, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 20, 
    borderWidth: 1.2,
    borderColor: 'transparent',
  },
  toggleText: { fontSize: 13, fontWeight: '700' }
});
