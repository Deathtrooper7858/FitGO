import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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

  const handleAnalyzePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAnalyze();
  };

  return (
    <View style={[wa.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={wa.header}>
        <View style={wa.titleRow}>
          <View style={[wa.iconPill, { backgroundColor: colors.primary + '18' }]}>
            <Sparkles size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={[wa.title, { color: colors.textPrimary }]}>
              {t('planner.aiReview', 'Revisión Semanal IA')}
            </Text>
            <Text style={[wa.subtitle, { color: colors.textSecondary }]}>
              {t('planner.aiReviewSub', 'Resumen y consejos de tu coach inteligente')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleAnalyzePress}
          disabled={analyzing}
          style={[wa.btn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '33' }]}
          activeOpacity={0.8}
        >
          <Text style={[wa.btnText, { color: colors.primary }]}>
            {analysis ? t('planner.regenerate', 'Actualizar') : t('planner.analyze', 'Analizar')}
          </Text>
        </TouchableOpacity>
      </View>

      {analyzing ? (
        <View style={wa.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[wa.loadingText, { color: colors.textMuted }]}>
            {t('planner.analyzingWeek', 'Analizando tus hábitos de la semana...')}
          </Text>
        </View>
      ) : analysis ? (
        <View style={[wa.content, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[wa.text, { color: colors.textPrimary }]}>{analysis}</Text>
        </View>
      ) : null}
    </View>
  );
}

const wa = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    marginHorizontal: Spacing.base,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
});

