import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronUp, ChevronRight, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../constants';

interface SettingsItemProps {
  icon: any;
  label: string;
  subtitle?: string;
  value?: string;
  valueStyle?: any;
  badge?: string;
  badgeColor?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  isDestructive?: boolean;
  rightIcon?: string;
  indent?: boolean;
  showGradient?: boolean;
  iconColor?: string;
}

export function SettingsItem({
  icon,
  label,
  subtitle,
  value,
  valueStyle,
  badge,
  badgeColor,
  onPress,
  onLongPress,
  isDestructive,
  rightIcon,
  indent,
  showGradient,
  iconColor,
}: SettingsItemProps) {
  const colors = useTheme();
  const Icon = typeof icon === 'string' ? null : icon;
  const activeIconColor = iconColor || (isDestructive ? colors.error : colors.primary);

  const handlePress = () => {
    if (onPress) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      onPress();
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      onLongPress();
    }
  };

  const content = (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: colors.border + '18',
          paddingLeft: indent ? Spacing.xl + 18 : Spacing.base,
          backgroundColor: indent ? colors.surfaceAlt + '12' : 'transparent',
        },
      ]}
    >
      {/* Modern bounded icon wrapper */}
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: isDestructive ? colors.error + '18' : activeIconColor + '18',
            borderColor: isDestructive ? colors.error + '35' : activeIconColor + '35',
          },
        ]}
      >
        {Icon ? (
          <Icon
            size={17}
            color={isDestructive ? colors.error : activeIconColor}
            strokeWidth={2.4}
          />
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )}
      </View>

      {/* Label and Subtitle - avoids awkward wrap by allowing value to shrink and ellipsize */}
      <View style={styles.labelWrapper}>
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.label,
              { color: isDestructive ? colors.error : colors.textPrimary },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {label}
          </Text>
          {badge && (
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: (badgeColor || activeIconColor) + '22',
                  borderColor: (badgeColor || activeIconColor) + '50',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: badgeColor || activeIconColor },
                ]}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: colors.textMuted }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Value if present - capped at 46% max-width so label always has room */}
      {value && (
        <Text
          style={[
            styles.value,
            { color: colors.textSecondary },
            valueStyle,
          ]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {value}
        </Text>
      )}

      {/* Right chevron or lock indicator */}
      <View style={styles.arrowWrapper}>
        {rightIcon === '▼' ? (
          <ChevronDown size={16} color={colors.textMuted} />
        ) : rightIcon === '▲' ? (
          <ChevronUp size={16} color={colors.textMuted} />
        ) : rightIcon === '🔒' ? (
          <View style={styles.lockBadge}>
            <Lock size={10} color="#F59E0B" strokeWidth={2.6} />
            <Text style={styles.lockBadgeText}>PRO</Text>
          </View>
        ) : onPress ? (
          <ChevronRight size={16} color={colors.textMuted} strokeWidth={2.2} />
        ) : null}
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.72}
      disabled={!onPress && !onLongPress}
      style={{ overflow: 'hidden' }}
    >
      {showGradient ? (
        <LinearGradient
          colors={[activeIconColor + '14', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  icon: {
    fontSize: 15,
  },
  labelWrapper: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 100,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 12.5,
    fontWeight: '600',
    maxWidth: '46%',
    textAlign: 'right',
    marginRight: 2,
  },
  arrowWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  lockBadgeText: {
    color: '#F59E0B',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
