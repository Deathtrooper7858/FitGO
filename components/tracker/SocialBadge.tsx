import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';

interface SocialBadgeProps {
  badgeCount: number;
  onPress: () => void;
  colors: any;
  size?: number;
}

export function SocialBadge({ badgeCount, onPress, colors, size = 34 }: SocialBadgeProps) {
  const iconSize = size >= 40 ? 20 : 17;
  const radius = size / 2;

  return (
    <TouchableOpacity
      style={[
        s.socialBtn,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.surfaceAlt + '60',
          borderColor: colors.border + '35',
        },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {badgeCount > 0 ? (
        <LinearGradient
          colors={[colors.primary, colors.secondary || '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.socialGradient, { width: size, height: size, borderRadius: radius }]}
        >
          <Users size={iconSize} color="#fff" />
          <View style={[s.badge, { borderColor: colors.background }]}>
            <Text style={s.badgeText}>
              {badgeCount > 9 ? '+9' : `+${badgeCount}`}
            </Text>
          </View>
        </LinearGradient>
      ) : (
        <View style={[s.socialIconWrap, { width: size, height: size, borderRadius: radius }]}>
          <Users size={iconSize} color={colors.textPrimary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  socialBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  socialGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
