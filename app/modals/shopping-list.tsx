import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, CheckCircle, Circle } from 'lucide-react-native';
import { usePlannerStore } from '../../store/plannerStore';
import { generateShoppingListJSON } from '../../services/groq';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';

export default function ShoppingListModal() {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  
  const mealPlans = usePlannerStore(s => s.mealPlans);
  const shoppingList = usePlannerStore(s => s.shoppingList);
  const setShoppingList = usePlannerStore(s => s.setShoppingList);
  
  const hasMealPlan = mealPlans && Object.keys(mealPlans).length > 0;
  
  const [loading, setLoading] = useState(shoppingList === null && hasMealPlan);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load checked state
    AsyncStorage.getItem('ff_shopping_checked').then(v => {
      if (v) setChecked(JSON.parse(v));
    });
  }, []);

  const loadList = async (force = false) => {
    // If we already have a populated list, don't load again unless forced
    if (!force && shoppingList && shoppingList.length > 0) return;
    
    // If there's no meal plan, clear list and stop
    if (!hasMealPlan) {
      setShoppingList([]);
      setLoading(false);
      return;
    }

    // Prevent fetch loops if we are already loading or have an error, unless forced
    if (!force && (loading || error)) return;

    try {
      setLoading(true);
      setError(null);
      const res = await generateShoppingListJSON(mealPlans, i18n.language);
      setShoppingList(res || []);
    } catch (e: any) {
      console.warn('Failed to load shopping list:', e);
      setError(e.message || 'Error al generar la lista de compras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, [shoppingList, mealPlans, error, loading]);

  const toggleCheck = (item: string) => {
    setChecked(prev => {
      const next = { ...prev, [item]: !prev[item] };
      AsyncStorage.setItem('ff_shopping_checked', JSON.stringify(next));
      return next;
    });
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>Lista de Compras 🛒</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.textSecondary }]}>Generando lista inteligente...</Text>
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
            <Text style={s.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : !hasMealPlan ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🛒</Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            No tienes un plan de comidas generado todavía.
          </Text>
          <Text style={[s.emptySubText, { color: colors.textMuted }]}>
            Ve al Planificador y genera un plan semanal para crear tu lista.
          </Text>
        </View>
      ) : shoppingList && shoppingList.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📝</Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            Tu lista de compras está vacía.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {shoppingList?.map((group, i) => (
            <View key={i} style={[s.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.groupTitle, { color: colors.primary }]}>{group.category}</Text>
              {group.items.map((item, j) => {
                const isChecked = !!checked[item];
                return (
                  <TouchableOpacity 
                    key={j} 
                    style={[s.itemRow, { borderBottomColor: j === group.items.length - 1 ? 'transparent' : colors.border }]}
                    onPress={() => toggleCheck(item)}
                    activeOpacity={0.7}
                  >
                    {isChecked ? <CheckCircle size={20} color="#10B981" /> : <Circle size={20} color={colors.textMuted} />}
                    <Text style={[s.itemText, { color: isChecked ? colors.textMuted : colors.textPrimary, textDecorationLine: isChecked ? 'line-through' : 'none' }]}>
                      {item}
                    </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 20, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  errorText: { fontSize: 16, textAlign: 'center', marginBottom: 20, fontWeight: '600', lineHeight: 22 },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  retryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptySubText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  group: { borderRadius: 20, padding: 16, borderWidth: 1 },
  groupTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  itemText: { fontSize: 16, fontWeight: '600', flex: 1 },
});
