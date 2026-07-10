import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Plus } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, Radius } from '../../constants';
import { getNameStyle } from '../../utils/styles';
import type { UserProfile } from '../../store';
import type { BadgeInfo } from '../../hooks/useAchievements';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  currentBadge: BadgeInfo;
  safePremiumColor: string | null;
  isPremiumCustom: boolean;
  onAvatarPress: () => void;
  onNamePress: () => void;
  onBadgePress: () => void;
}

export function ProfileHeader({
  profile, currentBadge, safePremiumColor, isPremiumCustom,
  onAvatarPress, onNamePress, onBadgePress,
}: ProfileHeaderProps) {
  const colors = useTheme();

  return (
    <LinearGradient
      colors={isPremiumCustom ? [(safePremiumColor ?? colors.primary) + '30', 'transparent'] : colors.gradientCard}
      style={styles.header}
    >
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8} style={styles.avatarContainer}>
        <LinearGradient
          colors={isPremiumCustom ? [safePremiumColor ?? colors.primary, (safePremiumColor ?? colors.primary) + '80'] : ['#7C5CFC', '#4338CA']}
          style={styles.avatar}
        >
          {profile?.avatarUrl ? (
            <Image cachePolicy="memory-disk" source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          )}
        </LinearGradient>
        <View style={[styles.editBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Camera size={12} color={isPremiumCustom ? (safePremiumColor ?? colors.primary) : colors.primary} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
      <View style={{ alignItems: 'center' }}>
        <TouchableOpacity onPress={onNamePress}>
          <Text style={[
            styles.name,
            { color: colors.textPrimary },
            getNameStyle(profile?.nameColor, profile?.id, profile?.id, profile?.nameColor)
          ]}>{profile?.name ?? 'User'} <Text style={{ fontSize: 14, opacity: 0.5 }}>✎</Text></Text>
        </TouchableOpacity>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{profile?.email ?? ''}</Text>
      </View>
      <TouchableOpacity
        onPress={onBadgePress}
        activeOpacity={0.8}
        style={styles.badgeContainer}
      >
        <LinearGradient colors={currentBadge.colors as [string, string, ...string[]]} style={styles.proBadge}>
          <Text style={styles.proBadgeText}>{currentBadge.icon} {currentBadge.label}</Text>
        </LinearGradient>
        <View style={[styles.badgeAddIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Plus size={10} color={isPremiumCustom ? (safePremiumColor ?? colors.primary) : colors.primary} strokeWidth={3} />
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', padding: Spacing['2xl'], paddingTop: Spacing.xl, marginBottom: Spacing.base, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  avatarContainer: { position: 'relative', marginBottom: 14 },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  editBadge: { position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
  avatarText: { fontSize: 38, fontWeight: '800', color: '#fff' },
  name: { fontSize: 24, fontWeight: '900', marginBottom: 2, letterSpacing: -0.5 },
  email: { fontSize: 13, marginBottom: 16, opacity: 0.7 },
  proBadge: { borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4, flexDirection: 'row', alignItems: 'center' },
  proBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  badgeContainer: { position: 'relative' },
  badgeAddIcon: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
});
