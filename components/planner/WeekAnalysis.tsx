import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Activity } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, Radius } from '../../constants';

interface WeekAnalysisProps {
  analysis: string | null;
  analyzing: boolean;
  onAnalyze: () => void;
}

export default function WeekAnalysis({ analysis, analyzing, onAnalyze }: WeekAnalysisProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <View style={[wa.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={wa.header}>
        <View style={wa.titleRow}>
          <Activity size={18} color={colors.primary} />
          <Text style={[wa.title, { color: colors.textPrimary }]}>{t('planner.aiReview')}</Text>
        </View>
        <TouchableOpacity onPress={onAnalyze} disabled={analyzing} style={[wa.btn, {backgroundColor: colors.primary + '15'}]}>
          <Text style={[wa.btnText, { color: colors.primary }]}>{analysis ? t('planner.regenerate') : t('planner.analyze')}</Text>
        </TouchableOpacity>
      </View>
      {analyzing ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
      ) : analysis ? (
        <View style={[wa.content, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[wa.text, { color: colors.textSecondary }]}>{analysis}</Text>
        </View>
      ) : (
        <Text style={[wa.placeholder, { color: colors.textMuted }]}>{t('planner.reviewPlaceholder')}</Text>
      )}
    </View>
  );
}

const wa = StyleSheet.create({
  card:        { borderRadius: 28, padding: Spacing.base, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title:       { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  btn:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  btnText:     { fontSize: 13, fontWeight: '800' },
  content:     { borderRadius: 20, padding: 16 },
  text:        { fontSize: 15, lineHeight: 24 },
  placeholder: { fontSize: 15, fontStyle: 'italic', paddingVertical: 10 },
});
