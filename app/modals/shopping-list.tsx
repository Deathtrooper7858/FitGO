import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
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
  
  const [loading, setLoading] = useState(!shoppingList || shoppingList.length === 0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load checked state
    AsyncStorage.getItem('ff_shopping_checked').then(v => {
      if (v) setChecked(JSON.parse(v));
    });
  }, []);

  useEffect(() => {
    async function load() {
      if (shoppingList && shoppingList.length > 0) return;
      try {
        setLoading(true);
        const res = await generateShoppingListJSON(mealPlans, i18n.language);
        setShoppingList(res);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [shoppingList, mealPlans]);

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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  group: { borderRadius: 20, padding: 16, borderWidth: 1 },
  groupTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  itemText: { fontSize: 16, fontWeight: '600', flex: 1 },
});
