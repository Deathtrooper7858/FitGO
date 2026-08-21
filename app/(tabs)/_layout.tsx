import { Tabs, router, usePathname } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FileText, BarChart2, MessageCircle, Calendar, Users } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsPro } from '../../hooks/useIsPro';
import { useAuthStore, useSocialStore } from '../../store';
import { useTheme } from '../../hooks/useTheme';
const TabIcon = React.memo(function TabIcon({ Icon, label, focused, badgeCount }: { Icon: any; label: string; focused: boolean; badgeCount?: number }) {
  const colors = useTheme();
  return (
    <View style={styles.tabItem}>
      <View>
        {focused ? (
          <LinearGradient
            colors={[colors.primary, colors.secondary || '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconPillActive}
          >
            <Icon size={22} color="#fff" strokeWidth={2.5} />
          </LinearGradient>
        ) : (
          <View style={styles.iconPillInactive}>
            <Icon size={22} color={colors.tabInactive} strokeWidth={1.8} />
          </View>
        )}
        {!!badgeCount && badgeCount > 0 && (
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? colors.primary : colors.tabInactive }
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
});

const TAB_ROUTES = [
  '/(tabs)/profile',
  '/(tabs)/tracker',
  '/(tabs)/dashboard',
  '/(tabs)/coach',
  '/(tabs)/planner',
  '/(tabs)/social',
] as const;

export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { profile } = useAuthStore();
  const pathname = usePathname();
  const isProActually = useIsPro();

  // Social notifications badge
  const totalUnreadCount = useSocialStore(s => s.totalUnreadCount);
  const pendingFriendRequests = useSocialStore(s => s.friends.reduce((count, f) => 
    count + (f.status === 'pending' && f.user_id_2 === profile?.id ? 1 : 0), 0
  ));
  const socialBadgeCount = totalUnreadCount + pendingFriendRequests;

  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const baseHeight = isIOS ? 68 : 64;
  const paddingBottom = insets.bottom > 0 ? insets.bottom : (isIOS ? 20 : 8);
  const tabBarHeight = baseHeight + paddingBottom;

  const getCurrentTabIndex = useCallback(() => {
    if (pathname.includes('profile'))   return 0;
    if (pathname.includes('tracker'))   return 1;
    if (pathname.includes('dashboard')) return 2;
    if (pathname.includes('coach'))     return 3;
    if (pathname.includes('planner'))   return 4;
    if (pathname.includes('social'))    return 5;
    return 1;
  }, [pathname]);

  const navigateTab = useCallback((direction: number) => {
    // Vibrar siempre que se detecte el gesto, sin importar si hay cambio
    Haptics.selectionAsync();
    const currentIndex = getCurrentTabIndex();
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= TAB_ROUTES.length) return;
    if (nextIndex === 4 && !isProActually) {
      router.push('/modals/paywall');
      return;
    }
    router.push(TAB_ROUTES[nextIndex] as any);
  }, [getCurrentTabIndex, isProActually]);

  const gestureStartY = React.useRef(0);

  const swipeGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-50, 50])
    .runOnJS(true)
    .onBegin((e) => {
      gestureStartY.current = e.y;
    })
    .onEnd((e) => {
      // Exclude if we are on the social/community tab to avoid interfering with local sub-tab gestures
      if (pathname.includes('social')) return;

      // Exclude horizontal swipes starting in the Day Bar vertical zone (Y between 70 and 180)
      if (gestureStartY.current >= 70 && gestureStartY.current <= 180) return;

      const enoughVelocity = Math.abs(e.velocityX) > 300;
      const enoughDistance = Math.abs(e.translationX) > 60;
      if (!enoughVelocity && !enoughDistance) return;
      const direction = e.translationX > 0 ? -1 : 1;
      navigateTab(direction);
    }), [navigateTab, pathname]);

  const tabScreenOptions = useMemo(() => ({
    headerShown: false,
    tabBarStyle: {
      ...styles.tabBar,
      backgroundColor: colors.surface,
      borderTopColor: colors.border + '80',
      height: tabBarHeight,
      paddingBottom,
    },
    tabBarShowLabel: false,
    tabBarActiveTintColor: colors.tabActive,
    tabBarInactiveTintColor: colors.tabInactive,
    tabBarHideOnKeyboard: true,
    tabBarItemStyle: {
      ...styles.tabBarItem,
      height: baseHeight,
    },
  }), [colors.surface, colors.border, colors.tabActive, colors.tabInactive, tabBarHeight, paddingBottom, baseHeight]);

  const plannerTabPress = useCallback((e: any) => {
    if (!isProActually) {
      e.preventDefault();
      router.push('/modals/paywall');
    }
  }, [isProActually]);

  return (
    <GestureDetector gesture={swipeGesture}>
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Tabs screenOptions={tabScreenOptions}>
        <Tabs.Screen
          name="tracker/index"
          options={{
            title: t('tabs.tracker', 'Tracker'),
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon Icon={FileText} label={t('tabs.tracker', 'Tracker')} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="dashboard/index"
          options={{
            title: t('tabs.dashboard', 'Dashboard'),
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon Icon={BarChart2} label={t('tabs.dashboard', 'Dashboard')} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="coach/index"
          options={{
            title: t('tabs.coach', 'Coach'),
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon Icon={MessageCircle} label={t('tabs.coach', 'Coach')} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="planner/index"
          options={{
            title: t('tabs.planner', 'Planner'),
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon Icon={Calendar} label={t('tabs.planner', 'Planner')} focused={focused} />
            ),
          }}
          listeners={{ tabPress: plannerTabPress }}
        />
        <Tabs.Screen
          name="social/index"
          options={{
            title: t('tabs.social', 'Social'),
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon
                Icon={Users}
                label={t('tabs.social', 'Social')}
                focused={focused}
                badgeCount={socialBadgeCount}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{ href: null }}
        />
      </Tabs>
    </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingTop: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  tabBarItem: {
    paddingTop: 6,
    justifyContent: 'center',
  },
  tabItem: { 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 4,
    minWidth: 64,
  },
  iconPillActive: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillInactive: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { 
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 12,
  },
});

