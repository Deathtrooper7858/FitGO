import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft,
  CheckCircle,
  Circle,
  Copy,
  Share2,
  RotateCcw,
  Sparkles,
  CheckCheck,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { usePlannerStore } from '../../store/plannerStore';
import { generateShoppingListJSON } from '../../services/groq';
import { useTheme } from '../../hooks/useTheme';
import { useToastStore } from '../../store/toastStore';

export default function ShoppingListModal() {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const showToast = useToastStore((s) => s.showToast);

  const mealPlans = usePlannerStore((s) => s.mealPlans);
  const shoppingList = usePlannerStore((s) => s.shoppingList);
  const setShoppingList = usePlannerStore((s) => s.setShoppingList);

  const hasMealPlan = mealPlans && Object.keys(mealPlans).length > 0;

  const [loading, setLoading] = useState(shoppingList === null && hasMealPlan);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    AsyncStorage.getItem('ff_shopping_checked').then((v) => {
      if (v) {
        try {
          setChecked(JSON.parse(v));
        } catch {}
      }
    });
  }, []);

  const loadList = useCallback(async (force = false) => {
    if (!force && shoppingList && shoppingList.length > 0) return;

    if (!hasMealPlan) {
      setShoppingList([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await generateShoppingListJSON(mealPlans, i18n.language);
      setShoppingList(res || []);
    } catch (e: any) {
      console.warn('Failed to load shopping list:', e);
      setError(e.message || t('planner.shoppingError', 'Error al generar la lista de compras'));
    } finally {
      setLoading(false);
    }
  }, [shoppingList, hasMealPlan, mealPlans, setShoppingList, t, i18n.language]);

  const mealPlansKey = JSON.stringify(mealPlans);
  useEffect(() => {
    if (shoppingList && shoppingList.length > 0) return;
    loadList();
  }, [mealPlansKey, shoppingList, loadList]);

  const toggleCheck = (itemKey: string) => {
    Haptics.selectionAsync();
    setChecked((prev) => {
      const next = { ...prev, [itemKey]: !prev[itemKey] };
      AsyncStorage.setItem('ff_shopping_checked', JSON.stringify(next));
      return next;
    });
  };

  const handleResetChecks = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChecked({});
    AsyncStorage.removeItem('ff_shopping_checked');
    showToast({ text: t('planner.checksReset', 'Marcas desmarcadas'), type: 'info' });
  };

  const { totalItems, checkedCount, formattedText } = useMemo(() => {
    if (!shoppingList || shoppingList.length === 0) {
      return { totalItems: 0, checkedCount: 0, formattedText: '' };
    }

    let total = 0;
    let count = 0;
    let text = `🛒 ${t('planner.shoppingListTitle', 'Lista de Compras')} - FitGO\n\n`;

    shoppingList.forEach((group) => {
      text += `📍 ${group.category.toUpperCase()}\n`;
      group.items.forEach((item) => {
        total++;
        const isC = !!checked[item.name.toLowerCase()];
        if (isC) count++;
        text += `  ${isC ? '✓' : '•'} ${item.name} (${item.quantity}${item.price ? ` - $${item.price.toFixed(2)}` : ''})\n`;
      });
      text += '\n';
    });

    return { totalItems: total, checkedCount: count, formattedText: text.trim() };
  }, [shoppingList, checked, t]);

  const handleCopy = async () => {
    if (!formattedText) return;
    await Clipboard.setStringAsync(formattedText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast({ text: t('planner.copiedToClipboard', 'Lista copiada al portapapeles'), type: 'success' });
  };

  const handleShare = async () => {
    if (!formattedText) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: formattedText,
        title: t('planner.shoppingListTitle', 'Lista de Compras'),
      });
    } catch {}
  };

  const progressPercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.textPrimary }]}>
            {t('planner.shoppingListTitle', 'Lista de Compras')} 🛒
          </Text>
          {totalItems > 0 && (
            <Text style={[s.subtitle, { color: colors.textMuted }]}>
              {checkedCount} / {totalItems} {t('planner.itemsChecked', 'completados')} ({progressPercent}%)
            </Text>
          )}
        </View>

        <View style={s.headerActions}>
          {totalItems > 0 && (
            <>
              <TouchableOpacity onPress={handleCopy} style={s.iconBtn} activeOpacity={0.7}>
                <Copy size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={s.iconBtn} activeOpacity={0.7}>
                <Share2 size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      {totalItems > 0 && (
        <View style={[s.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
          <View
            style={[
              s.progressFill,
              {
                backgroundColor: progressPercent === 100 ? '#10B981' : colors.primary,
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>
      )}

      {loading ? (
        <View style={s.center}>
          <View style={[s.loaderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Sparkles size={28} color={colors.primary} style={{ marginTop: 12 }} />
            <Text style={[s.loadingText, { color: colors.textPrimary }]}>
              {t('planner.generatingList', 'Generando lista inteligente...')}
            </Text>
            <Text style={[s.loadingSubText, { color: colors.textSecondary }]}>
              {t('planner.aggregatingWeekly', 'Consolidando ingredientes de tus planes de comidas.')}
            </Text>
          </View>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
          <Text style={[s.errorText, { color: colors.textPrimary }]}>{error}</Text>
          <TouchableOpacity
            style={[s.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => loadList(true)}
            activeOpacity={0.8}
          >
            <Text style={s.retryBtnText}>{t('common.retry', 'Reintentar')}</Text>
          </TouchableOpacity>
        </View>
      ) : !hasMealPlan ? (
        <View style={s.center}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🛒</Text>
          <Text style={[s.emptyText, { color: colors.textPrimary }]}>
            {t('planner.noMealPlanForShopping', 'No tienes un plan de comidas generado todavía')}
          </Text>
          <Text style={[s.emptySubText, { color: colors.textMuted }]}>
            {t('planner.generateFirstToShop', 'Ve al Planificador y genera un plan semanal para crear automáticamente tu lista inteligente.')}
          </Text>
          <TouchableOpacity
            style={[s.retryBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
            onPress={() => router.back()}
          >
            <Text style={s.retryBtnText}>{t('planner.goToPlanner', 'Ir al Planificador')}</Text>
          </TouchableOpacity>
        </View>
      ) : shoppingList && shoppingList.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📝</Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            {t('planner.emptyShoppingList', 'Tu lista de compras está vacía.')}
          </Text>
          <TouchableOpacity
            style={[s.retryBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
            onPress={() => loadList(true)}
          >
            <Text style={s.retryBtnText}>{t('common.generate', 'Generar de nuevo')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Quick Action Bar */}
          <View style={s.topBar}>
            <TouchableOpacity
              style={[s.chipBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => loadList(true)}
            >
              <RotateCcw size={14} color={colors.textSecondary} />
              <Text style={[s.chipText, { color: colors.textSecondary }]}>{t('common.regenerate', 'Regenerar')}</Text>
            </TouchableOpacity>

            {checkedCount > 0 && (
              <TouchableOpacity
                style={[s.chipBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleResetChecks}
              >
                <CheckCheck size={14} color={colors.textMuted} />
                <Text style={[s.chipText, { color: colors.textMuted }]}>{t('planner.uncheckAll', 'Desmarcar todo')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {shoppingList?.map((group, i) => (
            <View
              key={i}
              style={[s.group, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={s.groupHeader}>
                <Text style={[s.groupTitle, { color: colors.primary }]}>{group.category}</Text>
                <Text style={[s.groupBadge, { backgroundColor: colors.primary + '15', color: colors.primary }]}>
                  {group.items.length} {t('planner.items', 'artículos')}
                </Text>
              </View>

              {group.items.map((item, j) => {
                const itemKey = item.name.toLowerCase();
                const isChecked = !!checked[itemKey];
                return (
                  <TouchableOpacity
                    key={j}
                    style={[
                      s.itemRow,
                      { borderBottomColor: j === group.items.length - 1 ? 'transparent' : colors.border + '60' },
                      isChecked && { opacity: 0.6 },
                    ]}
                    onPress={() => toggleCheck(itemKey)}
                    activeOpacity={0.7}
                  >
                    {isChecked ? (
                      <CheckCircle size={22} color="#10B981" />
                    ) : (
                      <Circle size={22} color={colors.textMuted} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          s.itemText,
                          {
                            color: isChecked ? colors.textMuted : colors.textPrimary,
                            textDecorationLine: isChecked ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                        {item.quantity}
                        {item.price ? ` • $${item.price.toFixed(2)}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center', borderRadius: 19 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  progressTrack: { height: 4, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  chipBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  loaderCard: { padding: 28, borderRadius: 24, borderWidth: 1, alignItems: 'center', width: '100%', maxWidth: 320 },
  loadingText: { marginTop: 14, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  loadingSubText: { marginTop: 6, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  errorText: { fontSize: 15, textAlign: 'center', marginBottom: 20, fontWeight: '600', lineHeight: 22 },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, elevation: 2 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  emptySubText: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  group: { borderRadius: 20, padding: 16, borderWidth: 1 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  groupTitle: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  groupBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, gap: 12 },
  itemText: { fontSize: 15, fontWeight: '600' },
});
