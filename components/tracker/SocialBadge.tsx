import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';

interface SocialBadgeProps {
  badgeCount: number;
  onPress: () => void;
  colors: any;
}

export function SocialBadge({ badgeCount, onPress, colors }: SocialBadgeProps) {
  return (
    <TouchableOpacity
      style={[s.socialBtn, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {badgeCount > 0 ? (
        <LinearGradient
          colors={[colors.primary, colors.secondary || '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.socialGradient}
        >
          <Users size={20} color="#fff" />
          <View style={[s.badge, { borderColor: colors.background }]}>
            <Text style={s.badgeText}>
              {badgeCount > 9 ? '+9' : `+${badgeCount}`}
            </Text>
          </View>
        </LinearGradient>
      ) : (
        <View style={s.socialIconWrap}>
          <Users size={22} color={colors.textPrimary} />
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
