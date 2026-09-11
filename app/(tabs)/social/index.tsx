import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Users, Trophy, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';
import { GlobalBackground } from '../../../components/GlobalBackground';
import { Radius, Shadow } from '../../../constants';
import FitGOSocial from '../../../components/social/FitGOSocial';
import FitGOCompetitive from '../../../components/social/FitGOCompetitive';
import { useSettingsStore, useAuthStore } from '../../../store';
import { AppModeModal } from '../../../components/profile/AppModeModal';

export default function SocialTabScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const { appMode, setAppMode } = useSettingsStore();
  const { profile } = useAuthStore();
  const isSimple = appMode === 'simple';
  const [appModeModalVisible, setAppModeModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'social' | 'competitive'>('social');
  const [socialInitialTab, setSocialInitialTab] = useState<'you' | 'feed' | 'friends'>('you');
  const [socialInitialFriendsTab, setSocialInitialFriendsTab] = useState<'list' | 'search' | 'requests'>('list');
  const [competitiveInitialSection, setCompetitiveInitialSection] = useState<'ranking' | 'my-squad' | 'challenges'>('ranking');

  const MAIN_TABS: ('social' | 'competitive')[] = ['social', 'competitive'];
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-25, 25])
    .failOffsetY([-15, 15])
    .runOnJS(true)
    .onEnd((e) => {
      if (Math.abs(e.velocityX) > 200 || Math.abs(e.translationX) > 50) {
        Haptics.selectionAsync();
        const dir = e.translationX > 0 ? -1 : 1;
        const idx = MAIN_TABS.indexOf(activeTab);
        const next = idx + dir;
        if (next >= 0 && next < MAIN_TABS.length) {
          setActiveTab(MAIN_TABS[next]);
        }
      }
    });

  return (
    <View style={{ flex: 1 }}>
      <GlobalBackground />
      <LinearGradient
        colors={[colors.primary + '25', colors.primary + '08', 'transparent']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 320 }}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.topSection}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  {activeTab === 'social' ? 'FitGO Social' : 'FitGO Competitivo'}
                </Text>
                <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                  {activeTab === 'social'
                    ? t('social.headers.socialSubtitle', 'Conéctate con tu comunidad y comparte tu progreso')
                    : t('social.headers.compSubtitle', 'Compite en ligas, supera retos y escala al top')}
                </Text>
              </View>
            </View>

            {/* Píldora de Modo Simplificado */}
            {isSimple && (
              <TouchableOpacity
                style={[styles.simpleModeBanner, { backgroundColor: '#10B98115', borderColor: '#10B98140' }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setAppModeModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.simpleModeBannerLeft}>
                  <View style={[styles.simpleModeIconWrap, { backgroundColor: '#10B98125' }]}>
                    <Sparkles size={14} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.simpleModeBannerTitle, { color: colors.textPrimary }]}>
                      {t('social.simpleModeBadge', 'Versión Simplificada')}
                    </Text>
                    <Text style={[styles.simpleModeBannerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                      {t('social.simpleModeSub', 'Comunidad y amigos • Toca para cambiar a Avanzada')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.simpleModeBadgeTag, { backgroundColor: '#10B98122' }]}>
                  <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800' }}>
                    {t('common.change', 'Cambiar')} ›
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Segmented Control */}
            <View style={[styles.segmentWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '40' }]}>
              <TouchableOpacity
                style={[styles.segmentBtn, activeTab === 'social' && styles.segmentActive]}
                onPress={() => {
                  if (activeTab !== 'social') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab('social');
                  }
                }}
                activeOpacity={0.85}
              >
                {activeTab === 'social' && (
                  <LinearGradient
                    colors={[colors.primary, '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Users
                  size={17}
                  color={activeTab === 'social' ? '#fff' : colors.textSecondary}
                  strokeWidth={2.4}
                />
                <Text style={[styles.segmentText, { color: activeTab === 'social' ? '#fff' : colors.textSecondary }]}>
                  {t('social.headers.socialTab', 'Social')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, activeTab === 'competitive' && styles.segmentActive]}
                onPress={() => {
                  if (activeTab !== 'competitive') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab('competitive');
                  }
                }}
                activeOpacity={0.85}
              >
                {activeTab === 'competitive' && (
                  <LinearGradient
                    colors={['#F59E0B', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Trophy
                  size={17}
                  color={activeTab === 'competitive' ? '#fff' : colors.textSecondary}
                  strokeWidth={2.4}
                />
                <Text style={[styles.segmentText, { color: activeTab === 'competitive' ? '#fff' : colors.textSecondary }]}>
                  {t('social.headers.compTab', 'Competitivo')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </GestureDetector>

        {/* Content — both always mounted to preserve state & prevent layout flickers */}
        <View style={[{ flex: 1 }, activeTab !== 'social' && { display: 'none' }]}>
          <FitGOSocial
            initialTab={socialInitialTab}
            initialFriendsTab={socialInitialFriendsTab}
            onNavigateToCompetitive={() => {
              setCompetitiveInitialSection('ranking');
              setActiveTab('competitive');
            }}
          />
        </View>
        <View style={[{ flex: 1 }, activeTab !== 'competitive' && { display: 'none' }]}>
          <FitGOCompetitive
            initialSection={competitiveInitialSection}
            onNavigateToSocial={() => {
              setSocialInitialTab('friends');
              setSocialInitialFriendsTab('requests');
              setActiveTab('social');
            }}
          />
        </View>

        <AppModeModal
          visible={appModeModalVisible}
          currentMode={appMode}
          onClose={() => setAppModeModalVisible(false)}
          onSelectMode={(m) => {
            setAppMode(m);
            if (profile) useAuthStore.getState().setProfile({ ...profile, appMode: m });
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  simpleModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 18,
    marginTop: 6,
    marginBottom: 6,
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
  topSection: {
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 2,
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 18,
  },
  segmentWrapper: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: Radius.full,
    padding: 4,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  segmentActive: {
    ...Shadow.sm,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

