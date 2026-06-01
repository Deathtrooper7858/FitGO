import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Spacing, Radius, Shadow } from '../../constants';
import { useAuthStore, useRecipesStore, Recipe, useSettingsStore } from '../../store';
import { generateRecipes } from '../../services/groq';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react-native';

export default function RecipesModal() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { language } = useSettingsStore();
  const { profile } = useAuthStore();
  const { recipes, pinnedRecipes, setRecipes, togglePin } = useRecipesStore();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'pinned'>('search');
  const isPro = profile?.isPro ?? false;

  const loadRecipes = async (foodName?: string) => {
    if (!isPro) return;
    setLoading(true);
    Keyboard.dismiss();
    try {
      const newRecipes = await generateRecipes(profile?.goal ?? 'maintain', language, 3, foodName);
      setRecipes(newRecipes);
    } catch (err) {
      console.error('Failed to load recipes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recipes.length === 0 && isPro && activeTab === 'search') {
      loadRecipes();
    }
  }, [isPro]);

  if (!isPro) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <View style={s.paywallContainer}>
          <Text style={s.paywallEmoji}>🔒</Text>
          <Text style={[s.paywallTitle, { color: colors.textPrimary }]}>{t('recipes.proTitle')}</Text>
          <Text style={[s.paywallSub, { color: colors.textSecondary }]}>{t('recipes.proSub')}</Text>
          <TouchableOpacity style={s.proBtn} onPress={() => router.push('/modals/paywall')}>
            <LinearGradient colors={['#7C5CFC', '#4338CA']} style={s.proGrad}>
              <Text style={s.proText}>{t('recipes.unlockNow')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    if (loading) {
      return (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.textSecondary }]}>{t('recipes.loading')}</Text>
        </View>
      );
    }

    if (activeTab === 'search') {
      return (
        <View style={s.list}>
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFav={pinnedRecipes.some(r => r.id === recipe.id)}
              onFav={() => togglePin(recipe)}
            />
          ))}
        </View>
      );
    }

    if (activeTab === 'pinned') {
      if (pinnedRecipes.length === 0) {
        return (
          <View style={s.center}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📌</Text>
            <Text style={[s.loadingText, { color: colors.textSecondary }]}>{t('recipes.noPinned', 'No tienes recetas fijadas aún.')}</Text>
          </View>
        );
      }
      return (
        <View style={s.list}>
          {pinnedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFav={true}
              onFav={() => togglePin(recipe)}
            />
          ))}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.textPrimary }]}>{t('recipes.title')}</Text>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'search' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => setActiveTab('search')}
        >
          <Text style={[s.tabText, { color: activeTab === 'search' ? colors.primary : colors.textSecondary }]}>
            {t('recipes.searchTab', 'Buscar')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'pinned' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => setActiveTab('pinned')}
        >
          <Text style={[s.tabText, { color: activeTab === 'pinned' ? colors.primary : colors.textSecondary }]}>
            {t('recipes.pinnedTab', 'Fijadas')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'search' && (
        <View style={[s.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search color={colors.textSecondary} size={20} />
          <TextInput
            style={[s.searchInput, { color: colors.textPrimary }]}
            placeholder={t('recipes.searchPlaceholder', 'Ej: Pollo, Avena...')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => loadRecipes(searchQuery)}
            returnKeyType="search"
          />
          <TouchableOpacity style={[s.searchBtn, { backgroundColor: colors.primary }]} onPress={() => loadRecipes(searchQuery)}>
            <Text style={s.searchBtnText}>{t('recipes.search', 'Buscar')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

function RecipeCard({ recipe, isFav, onFav }: { recipe: Recipe; isFav: boolean; onFav: () => void }) {
  const { t } = useTranslation();
  const colors = useTheme();
  return (
    <View style={[rc.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={rc.info}>
        <View style={rc.headerRow}>
          <Text style={[rc.name, { color: colors.textPrimary }]} numberOfLines={2}>{recipe.name}</Text>
          <TouchableOpacity onPress={onFav} style={rc.favBtn}>
            <Text style={rc.favEmoji}>{isFav ? '📌' : '📍'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[rc.desc, { color: colors.textSecondary }]}>{recipe.description}</Text>
        
        <View style={rc.stats}>
          <Text style={[rc.statItem, { color: colors.textMuted }]}>🕒 {recipe.prepTime} {t('recipes.prepTime')}</Text>
          <Text style={[rc.statItem, { color: colors.textMuted }]}>🔥 {recipe.calories} kcal</Text>
        </View>

        <View style={rc.macros}>
          <View style={[rc.macroPill, { backgroundColor: colors.protein + '22' }]}>
            <Text style={[rc.macroText, { color: colors.protein }]}>P {recipe.protein}g</Text>
          </View>
          <View style={[rc.macroPill, { backgroundColor: colors.carbs + '22' }]}>
            <Text style={[rc.macroText, { color: colors.carbs }]}>C {recipe.carbs}g</Text>
          </View>
          <View style={[rc.macroPill, { backgroundColor: colors.fat + '22' }]}>
            <Text style={[rc.macroText, { color: colors.fat }]}>F {recipe.fat}g</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const rc = StyleSheet.create({
  card:      { borderRadius: Radius.lg, marginBottom: 16, overflow: 'hidden', borderWidth: 1, ...Shadow.sm },
  info:      { padding: Spacing.base },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  name:      { fontSize: 18, fontWeight: '700', flex: 1, paddingRight: 8 },
  favBtn:    { padding: 4 },
  favEmoji:  { fontSize: 20 },
  desc:      { fontSize: 14, marginBottom: 12 },
  stats:     { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statItem:  { fontSize: 13, fontWeight: '500' },
  macros:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  macroPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  macroText: { fontSize: 12, fontWeight: '700' },
});

const s = StyleSheet.create({
  safe:             { flex: 1 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  title:            { fontSize: 24, fontWeight: '800' },
  tabs:             { flexDirection: 'row', paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  tab:              { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText:          { fontSize: 16, fontWeight: '600' },
  searchContainer:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base, marginBottom: Spacing.base, paddingHorizontal: 12, borderRadius: Radius.md, borderWidth: 1, height: 48 },
  searchInput:      { flex: 1, marginLeft: 8, fontSize: 16, height: '100%' },
  searchBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, marginLeft: 8 },
  searchBtnText:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll:           { flex: 1 },
  list:             { padding: Spacing.base },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  loadingText:      { marginTop: 16, fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
  paywallContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  paywallEmoji:     { fontSize: 64, marginBottom: 20 },
  paywallTitle:     { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  paywallSub:       { fontSize: 15, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  proBtn:           { width: '100%', borderRadius: Radius.md, overflow: 'hidden' },
  proGrad:          { padding: 16, alignItems: 'center' },
  proText:          { color: '#fff', fontWeight: '700', fontSize: 16 },
});
