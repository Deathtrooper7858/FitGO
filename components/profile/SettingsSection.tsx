import React from 'react';
import { View, Text, ViewStyle, StyleSheet } from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import { GlassCard } from '../GlassCard';
import { Spacing } from '../../constants';

interface SettingsSectionProps {
  title?: string;
  subtitle?: string;
  icon?: any;
  children: React.ReactNode;
  accentColor?: string;
  style?: ViewStyle | ViewStyle[];
  opacity?: number;
}

export function SettingsSection({
  title, subtitle, icon: SectionIcon, children, accentColor, style, opacity
}: SettingsSectionProps) {
  const colors = useTheme();
  const activeAccent = accentColor || colors.primary;

  return (
    <GlassCard
      noPadding
      showStripe
      accentColor={activeAccent}
      opacity={opacity}
      style={[{ marginHorizontal: Spacing.base, marginBottom: Spacing.base }, style].flat().filter(Boolean) as ViewStyle[]}
    >
      {title && (
        <View style={styles.header}>
          {SectionIcon && (
            <View style={[styles.iconWrap, { backgroundColor: activeAccent + '18' }]}>
              <SectionIcon size={14} color={activeAccent} strokeWidth={2.5} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      )}
      <View style={styles.body}>
        {children}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xs,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10.5,
    marginTop: 1,
    fontWeight: '500',
  },
  body: {
    overflow: 'hidden',
  },
});
