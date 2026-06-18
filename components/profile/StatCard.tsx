import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, Radius } from '../../constants';

interface StatCardProps {
  label: string;
  value: string | number;
  unit: string;
  color: string;
  onPress?: () => void;
}

export function StatCard({ label, value, unit, color, onPress }: StatCardProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={[styles.unit, { color: colors.textMuted }]}>{unit}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {onPress && <Text style={[styles.editHint, { color: colors.textMuted }]}>{t('common.tapToEdit')}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: Radius.lg, padding: Spacing.base, alignItems: 'center', borderWidth: 1 },
  value: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  unit: { fontSize: 11, marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  editHint: { fontSize: 8, marginTop: 4, textTransform: 'uppercase' },
});
