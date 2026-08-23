import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Keyboard } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react-native';
import { Spacing, Radius, Shadow } from '../../constants';
import { useAuthStore, useRecipesStore, Recipe, useSettingsStore } from '../../store';
import { useAdStore } from '../../store/adStore';
import { AdTimerOverlay } from '../../components/AdTimerOverlay';
import { RewardedAdGate } from '../../components/RewardedAdGate';
import { generateRecipes } from '../../services/groq';
import { useTheme } from '../../hooks/useTheme';
import { useIsPro } from '../../hooks/useIsPro';

export default function RecipesModal() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { language } = useSettingsStore();
  const { profile } = useAuthStore();
  const { recipes, pinnedRecipes, setRecipes, togglePin } = useRecipesStore();
  const { hasPremiumAdAccess, grantPremiumAdAccess } = useAdStore();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'pinned'>('search');
  const [showAdGate, setShowAdGate] = useState(false);
  const isPro = useIsPro();
  const featureId = 'recipes';
  const hasAccess = isPro || hasPremiumAdAccess(featureId);

  const loadRecipes = async (foodName?: string) => {
    if (!hasAccess) return;
    setLoading(true);
    // Remove Keyboard.dismiss() to prevent closing the keyboard while user is typing
    try {
      const newRecipes = await generateRecipes(profile?.goal ?? 'maintain', language, 8, foodName);
      setRecipes(newRecipes);
    } catch (err) {
      console.error('Failed to load recipes', err);
    } finally {
      setLoading(false);
    }
  };

  // Track previous language to detect changes
  const prevLang = useRef(language);

  // When language changes, clear cached recipes and reload in new language
  useEffect(() => {
    if (prevLang.current !== language) {
      prevLang.current = language;
      if (hasAccess && activeTab === 'search') {
        setRecipes([]);
        // Small delay so setRecipes settles before we call the API
        setTimeout(() => loadRecipes(), 100);
      }
    }
  }, [language]);

  // Debounce logic for automatic search
  useEffect(() => {
    if (!hasAccess || activeTab !== 'search') return;
    
    // Only auto-search if the query has changed and is long enough, or empty
    const handler = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
         loadRecipes(searchQuery);
      } else if (searchQuery === '' && recipes.length === 0) {
         loadRecipes();
      }
    }, 1200); // 1.2s debounce to avoid spamming the AI

    return () => clearTimeout(handler);
  }, [searchQuery, hasAccess, activeTab]);

  useEffect(() => {
    if (recipes.length === 0 && hasAccess && activeTab === 'search') {
      loadRecipes();
    }
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[`${colors.primary}35`, colors.background]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.8 }}
        />
        <View style={s.paywallContainer}>
          <Text style={s.paywallEmoji}>🍳</Text>
          <Text style={[s.paywallTitle, { color: colors.textPrimary }]}>{t('recipes.proTitle')}</Text>
          <Text style={[s.paywallSub, { color: colors.textSecondary }]}>{t('recipes.proSub')}</Text>

          {/* Ver ad para desbloquear temporalmente */}
          <TouchableOpacity
            style={[s.proBtn, { marginBottom: 12 }]}
            onPress={() => setShowAdGate(true)}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={s.proGrad}>
              <Text style={s.proText}>▶ Ver video · Desbloquear gratis</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.proBtn} onPress={() => router.push('/modals/paywall')}>
            <LinearGradient colors={['#7C5CFC', '#4338CA']} style={s.proGrad}>
              <Text style={s.proText}>{t('recipes.unlockNow')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <RewardedAdGate
          visible={showAdGate}
          onClose={() => setShowAdGate(false)}
          onRewarded={() => {
            setShowAdGate(false);
            grantPremiumAdAccess(featureId);
          }}
          emoji="🍳"
          title="Recetas Premium"
          subtitle="Ve un breve video y accede a recetas de IA personalizadas a tu objetivo"
          watchLabel="▶ Ver video · Desbloquear recetas"
        />
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    if (loading) {
      return (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#7C5CFC" />
          <Text style={[s.loadingText, { color: colors.textSecondary }]}>{t('recipes.loading')}</Text>
        </View>
      );
    }

    const currentData = activeTab === 'search' ? recipes : pinnedRecipes;

    if (activeTab === 'pinned' && pinnedRecipes.length === 0) {
      return (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>📌</Text>
          <Text style={[s.loadingText, { color: colors.textSecondary }]}>{t('recipes.noPinned', 'No tienes recetas fijadas aún.')}</Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg }}>
        <FlashList
          data={currentData}
          renderItem={({ item: recipe, index }) => (
            <RecipeCard
              recipe={recipe}
              isFav={pinnedRecipes.some(r => r.id === recipe.id)}
              onFav={() => togglePin(recipe)}
              index={index}
            />
          )}
          keyExtractor={(item) => item.id}
          // @ts-ignore - The property exists at runtime and is required by FlashList but types are failing
          estimatedItemSize={250}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[`${colors.primary}35`, colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.8 }}
      />
      <View style={s.header}>
        <Text style={[s.title, { color: colors.textPrimary }]}>{t('recipes.title')}</Text>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'search' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]} 
          onPress={() => setActiveTab('search')}
        >
          <Text style={[s.tabText, { color: activeTab === 'search' ? colors.primary : colors.textSecondary }]}>
            {t('recipes.searchTab', 'Buscar')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'pinned' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]} 
          onPress={() => setActiveTab('pinned')}
        >
          <Text style={[s.tabText, { color: activeTab === 'pinned' ? colors.primary : colors.textSecondary }]}>
            {t('recipes.pinnedTab', 'Fijadas')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'search' && (
        <View style={[s.searchContainer, { backgroundColor: colors.surface }]}>
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
          <TouchableOpacity onPress={() => loadRecipes(searchQuery)}>
            <LinearGradient colors={[colors.primary, colors.primary + 'C0']} style={s.searchBtn}>
              <Text style={s.searchBtnText}>{t('recipes.search', 'Buscar')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.scroll}>
        {renderContent()}
      </View>

      <AdTimerOverlay featureId="recipes" />
    </SafeAreaView>
  );
}

function RecipeCard({ recipe, isFav, onFav, index }: { recipe: Recipe; isFav: boolean; onFav: () => void; index: number }) {
  const { t } = useTranslation();
  const colors = useTheme();
  
  // Alternating slight gradients for visual richness with premium color
  const gradientColors = index % 2 === 0 
    ? [colors.surface, `${colors.primary}10`] as const
    : [`${colors.primary}10`, colors.surface] as const;

  return (
    <View style={[
      rc.cardContainer, 
      Shadow.md,
      {
        borderColor: `${colors.primary}30`,
        borderWidth: 1,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5
      }
    ]}>
      <LinearGradient colors={gradientColors} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={rc.card}>
        <View style={rc.info}>
          <View style={rc.headerRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[rc.name, { color: colors.textPrimary }]} numberOfLines={2}>{recipe.name}</Text>
            </View>
            <TouchableOpacity onPress={onFav} style={[rc.favBtn, { backgroundColor: isFav ? `${colors.primary}22` : colors.surface }]}>
              <Text style={rc.favEmoji}>{isFav ? '📌' : '📍'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[rc.desc, { color: colors.textSecondary }]} numberOfLines={3}>{recipe.description}</Text>
          
          <View style={rc.statsContainer}>
            <View style={[rc.statBadge, { backgroundColor: colors.surface }]}>
              <Text style={rc.statEmoji}>⏱️</Text>
              <Text style={[rc.statItem, { color: colors.textPrimary }]}>{recipe.prepTime} {t('recipes.prepTime')}</Text>
            </View>
            <View style={[rc.statBadge, { backgroundColor: colors.surface }]}>
              <Text style={rc.statEmoji}>🔥</Text>
              <Text style={[rc.statItem, { color: colors.textPrimary }]}>{recipe.calories} kcal</Text>
            </View>
          </View>

          <View style={rc.divider} />

          <View style={rc.macros}>
            <View style={[rc.macroPill, { backgroundColor: colors.protein + '15', borderColor: colors.protein + '40', borderWidth: 1 }]}>
              <Text style={[rc.macroLabel, { color: colors.protein }]}>{t('recipes.protein', 'PROTEÍNA')}</Text>
              <Text style={[rc.macroText, { color: colors.protein }]}>{recipe.protein}g</Text>
            </View>
            <View style={[rc.macroPill, { backgroundColor: colors.carbs + '15', borderColor: colors.carbs + '40', borderWidth: 1 }]}>
               <Text style={[rc.macroLabel, { color: colors.carbs }]}>{t('recipes.carbs', 'CARBOS')}</Text>
              <Text style={[rc.macroText, { color: colors.carbs }]}>{recipe.carbs}g</Text>
            </View>
            <View style={[rc.macroPill, { backgroundColor: colors.fat + '15', borderColor: colors.fat + '40', borderWidth: 1 }]}>
               <Text style={[rc.macroLabel, { color: colors.fat }]}>{t('recipes.fat', 'GRASA')}</Text>
              <Text style={[rc.macroText, { color: colors.fat }]}>{recipe.fat}g</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[rc.askCoachBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              const prompt = t('recipes.promptHowToPrepare', {
                defaultValue: `Hola Coach, ¿me puedes dar las instrucciones paso a paso para preparar esta receta: "{{name}}"? Descripción y detalles: {{desc}} (P: {{p}}g, C: {{c}}g, F: {{f}}g, {{kcal}} kcal).`,
                name: recipe.name, desc: recipe.description, p: recipe.protein, c: recipe.carbs, f: recipe.fat, kcal: recipe.calories
              });
              router.push(`/(tabs)/coach?initialTab=nutritionist&prompt=${encodeURIComponent(prompt)}`);
            }}
          >
            <Text style={rc.askCoachEmoji}>👨‍🍳</Text>
            <Text style={rc.askCoachText}>{t('recipes.askCoach', '¿Cómo prepararlo?')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const rc = StyleSheet.create({
  cardContainer: { marginBottom: 20, borderRadius: Radius.xl, overflow: 'hidden' },
  card:      { borderRadius: Radius.xl, overflow: 'hidden' },
  info:      { padding: Spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  name:      { fontSize: 20, fontWeight: '800', lineHeight: 26, letterSpacing: -0.5 },
  favBtn:    { padding: 8, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  favEmoji:  { fontSize: 18 },
  desc:      { fontSize: 15, marginBottom: 16, lineHeight: 22, opacity: 0.9 },
  statsContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, gap: 6 },
  statEmoji: { fontSize: 16 },
  statItem:  { fontSize: 14, fontWeight: '700' },
  divider:   { height: 1, backgroundColor: 'rgba(150,150,150,0.15)', marginBottom: 16, width: '100%' },
  macros:    { flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginBottom: 16 },
  macroPill: { flex: 1, paddingVertical: 8, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  macroLabel: { fontSize: 10, fontWeight: '800', marginBottom: 4, letterSpacing: 0.5, opacity: 0.8 },
  macroText: { fontSize: 15, fontWeight: '800' },
  askCoachBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: Radius.lg, gap: 8 },
  askCoachEmoji: { fontSize: 16 },
  askCoachText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});

const s = StyleSheet.create({
  safe:             { flex: 1 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.base, paddingBottom: Spacing.sm },
  title:            { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  tabs:             { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: Spacing.base },
  tab:              { paddingVertical: 12, marginRight: 24 },
  tabText:          { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  searchContainer:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, paddingLeft: 16, paddingRight: 6, borderRadius: Radius.full, height: 54, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  searchInput:      { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '500', height: '100%' },
  searchBtn:        { paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full },
  searchBtnText:    { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  scroll:           { flex: 1 },
  list:             { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 120 },
  loadingText:      { marginTop: 20, fontSize: 16, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40 },
  paywallContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  paywallEmoji:     { fontSize: 64, marginBottom: 20 },
  paywallTitle:     { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  paywallSub:       { fontSize: 15, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  proBtn:           { width: '100%', borderRadius: Radius.md, overflow: 'hidden' },
  proGrad:          { padding: 16, alignItems: 'center' },
  proText:          { color: '#fff', fontWeight: '700', fontSize: 16 },
});
