import React from 'react';
import { Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { GlassCard } from '../GlassCard';
import { Spacing } from '../../constants';

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
  accentColor?: string;
  style?: ViewStyle | ViewStyle[];
  opacity?: number;
}

export function SettingsSection({ title, children, accentColor, style, opacity }: SettingsSectionProps) {
  const colors = useTheme();

  return (
    <GlassCard
      noPadding
      showStripe
      accentColor={accentColor || colors.primary}
      opacity={opacity}
      style={[{ marginHorizontal: Spacing.base, marginBottom: Spacing.base }, style].flat().filter(Boolean) as ViewStyle[]}
    >
      {title && (
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: Spacing.base, paddingTop: Spacing.base + 4, paddingBottom: 8, color: colors.textMuted }}>
          {title}
        </Text>
      )}
      {children}
    </GlassCard>
  );
}
