import { Tabs, router, usePathname } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { FileText, BarChart2, MessageCircle, Calendar, Users } from 'lucide-react-native';
import { useAuthStore, useSocialStore } from '../../store';
import React, { useCallback, useRef } from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabIcon = React.memo(({ Icon, label, focused, badgeCount }: { Icon: any; label: string; focused: boolean; badgeCount?: number }) => {
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

export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { profile } = useAuthStore();
  const pathname = usePathname();
  const isProActually = useIsPro();

  // Social notifications badge
  const { totalUnreadCount, friends } = useSocialStore();
  const pendingFriendRequests = friends.filter(
    f => f.status === 'pending' && f.user_id_2 === profile?.id
  ).length;
  const socialBadgeCount = totalUnreadCount + pendingFriendRequests;

  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const baseHeight = isIOS ? 68 : 64;
  const paddingBottom = insets.bottom > 0 ? insets.bottom : (isIOS ? 20 : 8);
  const tabBarHeight = baseHeight + paddingBottom;

  const TAB_ROUTES = [
    '/(tabs)/tracker',
    '/(tabs)/dashboard',
    '/(tabs)/coach',
    '/(tabs)/planner',
    '/(tabs)/social',
  ];

  const getCurrentTabIndex = useCallback(() => {
    if (pathname.includes('tracker'))  return 0;
    if (pathname.includes('dashboard')) return 1;
    if (pathname.includes('coach'))    return 2;
    if (pathname.includes('planner'))  return 3;
    if (pathname.includes('social'))   return 4;
    return 0;
  }, [pathname]);

  // Track where the gesture started vertically to gate zone-based swipes
  const gestureStartY = useRef(0);
  // Only fire main-tab change if swipe starts in the TOP zone (header/widgets)
  const TOP_ZONE_THRESHOLD = 200;

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-40, 40])
    .failOffsetY([-15, 15])
    .runOnJS(true)
    .onBegin((e) => {
      gestureStartY.current = e.absoluteY;
    })
    .onEnd((e) => {
      // Only allow main-tab navigation when gesture starts in the top zone
      if (gestureStartY.current > TOP_ZONE_THRESHOLD) return;
      if (Math.abs(e.velocityX) > 500 || Math.abs(e.translationX) > 100) {
        const direction = e.translationX > 0 ? -1 : 1;
        const currentIndex = getCurrentTabIndex();
        const nextIndex = currentIndex + direction;
        if (nextIndex < 0 || nextIndex >= TAB_ROUTES.length) return;
        if (nextIndex === 3 && !isProActually) {
          router.push('/modals/paywall');
          return;
        }
        Haptics.selectionAsync();
        router.push(TAB_ROUTES[nextIndex] as any);
      }
    });
  
  return (
    <GestureDetector gesture={swipeGesture}>
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar, 
            { 
              backgroundColor: colors.surface, 
              borderTopColor: colors.border + '80',
              height: tabBarHeight,
              paddingBottom: paddingBottom,
            }
          ],
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarHideOnKeyboard: true,
          tabBarItemStyle: [
            styles.tabBarItem,
            {
              height: baseHeight,
            }
          ],
        }}
      >
        <Tabs.Screen
          name="tracker/index"
          options={{
            title: t('tabs.tracker', 'Main'),
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={FileText} label={t('tabs.tracker', 'Main')} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="dashboard/index"
          options={{
            title: t('tabs.dashboard', 'Progress'),
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={BarChart2} label={t('tabs.dashboard', 'Progress')} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="coach/index"
          options={{
            title: t('tabs.coach', 'Coach'),
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={MessageCircle} label={t('tabs.coach', 'Coach')} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="planner/index"
          options={{
            title: t('tabs.planner', 'Planner'),
            tabBarIcon: ({ focused }) => (
              <TabIcon Icon={Calendar} label={t('tabs.planner', 'Planner')} focused={focused} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              if (!isProActually) {
                e.preventDefault();
                router.push('/modals/paywall');
              }
            },
          }}
        />
        <Tabs.Screen
          name="social/index"
          options={{
            title: t('tabs.social', 'Social'),
            tabBarIcon: ({ focused }) => (
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

