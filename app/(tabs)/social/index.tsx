import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Users, Trophy } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';
import { GlobalBackground } from '../../../components/GlobalBackground';
import FitGOSocial from '../../../components/social/FitGOSocial';
import FitGOCompetitive from '../../../components/social/FitGOCompetitive';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

export default function SocialTabScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'social' | 'competitive'>('social');

  // Swipe left/right to switch between Social and Competitive
  const MAIN_TABS: Array<'social' | 'competitive'> = ['social', 'competitive'];
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-35, 35])
    .failOffsetY([-12, 12])
    .runOnJS(true)
    .onEnd((e) => {
      if (Math.abs(e.velocityX) > 400 || Math.abs(e.translationX) > 80) {
        const dir = e.translationX > 0 ? -1 : 1;
        const idx = MAIN_TABS.indexOf(activeTab);
        const next = idx + dir;
        if (next >= 0 && next < MAIN_TABS.length) {
          Haptics.selectionAsync();
          setActiveTab(MAIN_TABS[next]);
        }
      }
    });

  return (
    <View style={{ flex: 1 }}>
      {activeTab === 'competitive' ? (
        <LinearGradient
          colors={['rgba(251, 191, 36, 0.20)', 'rgba(236, 72, 153, 0.08)', 'transparent']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 320 }}
          pointerEvents="none"
        />
      ) : (
        <GlobalBackground />
      )}

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
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

        {/* Segmented Control */}
        <View style={[styles.segmentWrapper, { backgroundColor: colors.surfaceAlt }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'social' && styles.segmentActive]}
            onPress={() => {
              Haptics.selectionAsync();
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

        {/* Content — wrapped in swipe gesture for Social ↔ Competitive */}
        <GestureDetector gesture={swipeGesture}>
          <View style={{ flex: 1 }}>
            {activeTab === 'social' ? <FitGOSocial /> : <FitGOCompetitive />}
          </View>
        </GestureDetector>
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
