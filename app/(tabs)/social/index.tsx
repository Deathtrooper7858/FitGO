import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Users, Trophy } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';
import { GlobalBackground } from '../../../components/GlobalBackground';
import FitGOSocial from '../../../components/social/FitGOSocial';
import FitGOCompetitive from '../../../components/social/FitGOCompetitive';

export default function SocialTabScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'social' | 'competitive'>('social');
  const [socialInitialTab, setSocialInitialTab] = useState<'you' | 'feed' | 'friends'>('you');
  const [socialInitialFriendsTab, setSocialInitialFriendsTab] = useState<'list' | 'search' | 'requests'>('list');
  const [competitiveInitialSection, setCompetitiveInitialSection] = useState<'ranking' | 'my-squad' | 'challenges'>('ranking');

  // Swipe left/right to switch between Social and Competitive
  const MAIN_TABS: ('social' | 'competitive')[] = ['social', 'competitive'];
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .runOnJS(true)
    .onEnd((e) => {
      if (Math.abs(e.velocityX) > 150 || Math.abs(e.translationX) > 35) {
        Haptics.selectionAsync();
        const dir = e.translationX > 0 ? -1 : 1;
        const idx = MAIN_TABS.indexOf(activeTab);
        const next = idx + dir;
        if (next >= 0 && next < MAIN_TABS.length) {
          if (MAIN_TABS[next] === 'social') {
            setSocialInitialTab('friends');
            setSocialInitialFriendsTab('requests');
          } else {
            setCompetitiveInitialSection('ranking');
          }
          setActiveTab(MAIN_TABS[next]);
        }
      }
    });

  return (
    <View style={{ flex: 1 }}>
      <GlobalBackground />
      <LinearGradient
        colors={[colors.primary + '30', colors.primary + '10', 'transparent']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 320 }}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header & Segmented Control wrapped with GestureDetector */}
        <GestureDetector gesture={swipeGesture}>
          <View>
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {activeTab === 'social' ? `FitGO ${t('social.headers.socialTab', 'Social')}` : `FitGO ${t('social.headers.compTab', 'Competitive')}`}
              </Text>
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                {activeTab === 'social'
                  ? t('social.headers.socialSubtitle', 'Connect with your community')
                  : t('social.headers.compSubtitle', 'Compete and climb the ranking')}
              </Text>
            </View>

            <View style={[styles.segmentWrapper, { backgroundColor: colors.surfaceAlt }]}>
              <TouchableOpacity
                style={[styles.segmentBtn, activeTab === 'social' && styles.segmentActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSocialInitialTab('you');
                  setActiveTab('social');
                }}
                activeOpacity={0.8}
              >
                {activeTab === 'social' ? (
                  <LinearGradient
                    colors={[colors.primary, colors.secondary || '#A855F7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
                <Users
                  size={16}
                  color={activeTab === 'social' ? '#fff' : colors.textSecondary}
                  strokeWidth={2.2}
                />
                <Text style={[styles.segmentText, { color: activeTab === 'social' ? '#fff' : colors.textSecondary }]}>
                  {t('social.headers.socialTab', 'Social')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, activeTab === 'competitive' && styles.segmentActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCompetitiveInitialSection('ranking');
                  setActiveTab('competitive');
                }}
                activeOpacity={0.8}
              >
                {activeTab === 'competitive' ? (
                  <LinearGradient
                    colors={['#F59E0B', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
                <Trophy
                  size={16}
                  color={activeTab === 'competitive' ? '#fff' : colors.textSecondary}
                  strokeWidth={2.2}
                />
                <Text style={[styles.segmentText, { color: activeTab === 'competitive' ? '#fff' : colors.textSecondary }]}>
                  {t('social.headers.compTab', 'Competitive')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </GestureDetector>

        {/* Content — both always mounted to avoid re-fetch on every tab switch */}
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  segmentWrapper: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 18,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 14,
    overflow: 'hidden',
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
});
