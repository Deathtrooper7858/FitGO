import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronUp, ChevronRight, Lock } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../constants';

interface SettingsItemProps {
  icon: any;
  label: string;
  value?: string;
  valueStyle?: any;
  onPress?: () => void;
  onLongPress?: () => void;
  isDestructive?: boolean;
  rightIcon?: string;
  indent?: boolean;
  showGradient?: boolean;
  iconColor?: string;
}

export function SettingsItem({
  icon, label, value, valueStyle, onPress, onLongPress, isDestructive,
  rightIcon, indent, showGradient, iconColor,
}: SettingsItemProps) {
  const colors = useTheme();
  const Icon = typeof icon === 'string' ? null : icon;
  const activeIconColor = iconColor || (isDestructive ? colors.error : colors.primary);

  const content = (
    <View style={[styles.row, { borderBottomColor: colors.border + '15', paddingLeft: indent ? Spacing.xl + 16 : Spacing.base }]}>
      <View style={[styles.iconWrapper, { backgroundColor: activeIconColor + '15' }]}>
        {Icon ? (
          <Icon size={16} color={activeIconColor} strokeWidth={2.5} />
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )}
      </View>
      <Text style={[styles.label, { color: isDestructive ? colors.error : colors.textPrimary }]}>{label}</Text>
      {value && <Text style={[styles.value, { color: colors.textSecondary }, valueStyle]} numberOfLines={1}>{value}</Text>}
      <View style={styles.arrowWrapper}>
        {rightIcon === '▼' ? (
          <ChevronDown size={16} color={colors.textMuted} />
        ) : rightIcon === '▲' ? (
          <ChevronUp size={16} color={colors.textMuted} />
        ) : rightIcon === '🔒' ? (
          <Lock size={12} color="#FBBF24" />
        ) : onPress ? (
          <ChevronRight size={16} color={colors.textMuted} />
        ) : null}
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={{ overflow: 'hidden' }}
    >
      {showGradient ? (
        <LinearGradient colors={[activeIconColor + '10', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}}>
          {content}
        </LinearGradient>
      ) : content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: Spacing.base, borderBottomWidth: 1 },
  iconWrapper: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 14 },
  label: { flex: 1, fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  value: { fontSize: 12, fontWeight: '500', flex: 2, textAlign: 'right', opacity: 0.8 },
  arrowWrapper: { width: 20, alignItems: 'center', justifyContent: 'center' },
});
