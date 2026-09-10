import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Sparkles,
  X,
  Clock,
  Flame,
  ArrowLeft,
  RotateCw,
  CheckCircle2,
  Bookmark,
  ChefHat,
  Utensils,
  MessageSquare,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Spacing, Radius } from '../../constants';
import { useAuthStore, useRecipesStore, Recipe, useSettingsStore } from '../../store';
import { useAdStore } from '../../store/adStore';
import { AdTimerOverlay } from '../../components/AdTimerOverlay';
import { RewardedAdGate } from '../../components/RewardedAdGate';
import { generateRecipes } from '../../services/groq';
import { useTheme } from '../../hooks/useTheme';
import { useIsPro } from '../../hooks/useIsPro';

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  try {
    Haptics.impactAsync(style);
  } catch {
    // Ignore on unsupported devices
  }
};

// Culinary quick inspiration suggestions
const QUICK_SUGGESTIONS = [
  { id: 'highProtein', label: '🍗 Alto en Proteína', query: 'Alto en proteína' },
  { id: 'oatsBreakfast', label: '🥣 Avena & Desayuno', query: 'Avena desayuno' },
  { id: 'ketoLowCarb', label: '🥑 Keto & Low Carb', query: 'Keto bajo en carbohidratos' },
  { id: 'quick15', label: '⚡ En 15 Minutos', query: 'Receta rápida 15 minutos' },
  { id: 'lightDinners', label: '🥗 Cenas Ligeras', query: 'Cena ligera saludable' },
  { id: 'meatRice', label: '🥩 Carne & Arroz', query: 'Carne y arroz volumen' },
  { id: 'fishSalmon', label: '🐟 Pescado & Salmón', query: 'Salmón o pescado' },
  { id: 'fitDesserts', label: '🥞 Postres Fit', query: 'Postre fit proteico' },
  { id: 'healthySnacks', label: '🌱 Snacks Saludables', query: 'Snack saludable fitness' },
];

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
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<Recipe | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  const isPro = useIsPro();
  const featureId = 'recipes';
  const hasAccess = isPro || hasPremiumAdAccess(featureId);

  const loadRecipes = useCallback(
    async (foodName?: string) => {
      if (!hasAccess) return;
      setLoading(true);
      try {
        const newRecipes = await generateRecipes(profile?.goal ?? 'maintain', language, 8, foodName);
        setRecipes(newRecipes);
      } catch (err) {
        console.error('Failed to load recipes', err);
      } finally {
        setLoading(false);
      }
    },
    [hasAccess, profile?.goal, language, setRecipes]
  );

  // Track previous language to detect changes
  const prevLang = useRef(language);

  useEffect(() => {
    if (prevLang.current !== language) {
      prevLang.current = language;
      if (hasAccess && activeTab === 'search') {
        setRecipes([]);
        setTimeout(() => loadRecipes(), 100);
      }
    }
  }, [language, hasAccess, activeTab, loadRecipes, setRecipes]);

  // Initial load if empty
  useEffect(() => {
    if (recipes.length === 0 && hasAccess && activeTab === 'search') {
      loadRecipes();
    }
  }, [hasAccess, recipes.length, activeTab, loadRecipes]);

  const handleSuggestionPress = (query: string) => {
    triggerHaptic();
    setSearchQuery(query);
    loadRecipes(query);
  };

  const handleTogglePin = (recipe: Recipe) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    togglePin(recipe);
  };

  const handleOpenDetail = (recipe: Recipe) => {
    triggerHaptic();
    setCheckedIngredients({});
    setSelectedRecipeDetail(recipe);
  };

  const toggleIngredientCheck = (ing: string) => {
    triggerHaptic();
    setCheckedIngredients(prev => ({
      ...prev,
      [ing]: !prev[ing],
    }));
  };

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
          <View style={s.paywallEmojiBox}>
            <Text style={s.paywallEmoji}>🍳</Text>
          </View>
          <Text style={[s.paywallTitle, { color: colors.textPrimary }]}>
            {t('recipes.proTitle', 'Chef y Recetas Fit Pro')}
          </Text>
          <Text style={[s.paywallSub, { color: colors.textSecondary }]}>
            {t(
              'recipes.proSub',
              'Desbloquea recetas saludables con cálculo de macros exactos, instrucciones paso a paso e Inteligencia Artificial adaptada a tus objetivos.'
            )}
          </Text>

          <TouchableOpacity
            style={[s.proBtn, { marginBottom: 12 }]}
            onPress={() => setShowAdGate(true)}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={s.proGrad}>
              <Text style={s.proText}>▶ Ver video · Desbloquear gratis</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.proBtn}
            onPress={() => router.push('/modals/paywall')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={s.proGrad}>
              <Text style={s.proText}>{t('recipes.unlockNow', 'Desbloquear con Pro')}</Text>
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

  const currentData = activeTab === 'search' ? recipes : pinnedRecipes;

  const renderContent = () => {
    if (loading) {
      return (
        <View style={s.loadingBox}>
          <View style={[s.loadingIconCircle, { backgroundColor: `${colors.primary}20` }]}>
            <ChefHat size={36} color={colors.primary} />
          </View>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
          <Text style={[s.loadingTitle, { color: colors.textPrimary }]}>
            {t('recipes.creatingTitle', 'El Chef IA está cocinando tus recetas...')}
          </Text>
          <Text style={[s.loadingSub, { color: colors.textSecondary }]}>
            {t('recipes.creatingSub', 'Calculando macros óptimos, ingredientes frescos y técnicas de preparación para tu objetivo.')}
          </Text>
        </View>
      );
    }

    if (activeTab === 'pinned' && pinnedRecipes.length === 0) {
      return (
        <View style={s.emptyBox}>
          <View style={[s.emptyIconCircle, { backgroundColor: colors.surfaceAlt }]}>
            <Bookmark size={34} color={colors.textMuted} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
            {t('recipes.noPinnedTitle', 'Sin recetas fijadas')}
          </Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            {t(
              'recipes.noPinned',
              'Toca el icono 📌 en cualquier receta para guardarla aquí y tenerla disponible siempre.'
            )}
          </Text>
          <TouchableOpacity
            style={[s.exploreBtn, { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('search')}
          >
            <Text style={s.exploreBtnText}>{t('recipes.exploreNow', 'Explorar Recetas')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'search' && recipes.length === 0) {
      return (
        <View style={s.emptyBox}>
          <View style={[s.emptyIconCircle, { backgroundColor: colors.surfaceAlt }]}>
            <Utensils size={34} color={colors.textMuted} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
            {t('recipes.noResultsTitle', '¡Descubre recetas deliciosas!')}
          </Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            {t('recipes.noResultsSub', 'Escribe un ingrediente (ej: pollo, avena, atún) o toca cualquiera de las sugerencias arriba para generar ideas al instante.')}
          </Text>
          <TouchableOpacity
            style={[s.exploreBtn, { backgroundColor: colors.primary }]}
            onPress={() => loadRecipes()}
          >
            <Sparkles size={16} color="#FFF" />
            <Text style={s.exploreBtnText}>
              {t('recipes.generateSurprise', 'Generar Recetas del Día')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlashList
        data={currentData}
        renderItem={({ item: recipe, index }) => (
          <RecipeCard
            recipe={recipe}
            isFav={pinnedRecipes.some(r => r.id === recipe.id)}
            onFav={() => handleTogglePin(recipe)}
            onOpenDetail={() => handleOpenDetail(recipe)}
            index={index}
          />
        )}
        keyExtractor={item => item.id}
        // @ts-ignore
        estimatedItemSize={280}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
      />
    );
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Background Glow */}
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.16)', 'rgba(6, 182, 212, 0.06)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
        pointerEvents="none"
      />

      {/* ── Header ── */}
      <View style={[s.header, { borderBottomColor: colors.border + '30' }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: colors.surfaceAlt + '90' }]}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.textPrimary }]}>
            {t('recipes.title', 'Recetas Fit')}
          </Text>
          <View style={[s.chefBadge, { backgroundColor: `${colors.primary}18` }]}>
            <ChefHat size={12} color={colors.primary} />
            <Text style={[s.chefBadgeText, { color: colors.primary }]}>{t('recipes.chefBadge', 'Chef Nutricional IA')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[s.refreshBtn, { backgroundColor: colors.surfaceAlt + '90' }]}
          onPress={() => {
            triggerHaptic();
            loadRecipes(searchQuery || undefined);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <RotateCw size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Segmented Tabs ── */}
      <View style={s.tabsContainer}>
        <View style={[s.tabsTrack, { backgroundColor: colors.surfaceAlt + '80', borderColor: colors.border + '30' }]}>
          <TouchableOpacity
            style={[s.tabPill, activeTab === 'search' && { backgroundColor: colors.primary }]}
            onPress={() => {
              triggerHaptic();
              setActiveTab('search');
            }}
          >
            <Sparkles size={15} color={activeTab === 'search' ? '#FFF' : colors.textSecondary} />
            <Text style={[s.tabPillText, { color: activeTab === 'search' ? '#FFF' : colors.textSecondary }]}>
              {t('recipes.searchTab', 'Explorar')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.tabPill, activeTab === 'pinned' && { backgroundColor: colors.primary }]}
            onPress={() => {
              triggerHaptic();
              setActiveTab('pinned');
            }}
          >
            <Bookmark size={15} color={activeTab === 'pinned' ? '#FFF' : colors.textSecondary} />
            <Text style={[s.tabPillText, { color: activeTab === 'pinned' ? '#FFF' : colors.textSecondary }]}>
              {t('recipes.pinnedTab', 'Fijadas')} ({pinnedRecipes.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search & Inspiration Chips (when search tab active) ── */}
      {activeTab === 'search' && (
        <View style={s.searchSection}>
          <View
            style={[
              s.searchBox,
              { backgroundColor: colors.surfaceAlt + '90', borderColor: colors.border + '40' },
            ]}
          >
            <Search color={colors.textSecondary} size={18} />
            <TextInput
              style={[s.searchInput, { color: colors.textPrimary }]}
              placeholder={t('recipes.searchPlaceholder', 'Ej: Pollo, Avena, Salmón...')}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => loadRecipes(searchQuery)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ padding: 4 }}
              >
                <X size={15} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                loadRecipes(searchQuery);
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.searchBtn}
              >
                <Text style={s.searchBtnText}>{t('recipes.search', 'Buscar')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Quick Suggestions Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsScroll}
          >
            {QUICK_SUGGESTIONS.map(sugg => (
              <TouchableOpacity
                key={sugg.query}
                style={[
                  s.suggChip,
                  { backgroundColor: colors.surfaceAlt + '80', borderColor: colors.border + '35' },
                  searchQuery.toLowerCase() === sugg.query.toLowerCase() && {
                    borderColor: colors.primary,
                    backgroundColor: `${colors.primary}20`,
                  },
                ]}
                onPress={() => handleSuggestionPress(sugg.query)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    s.suggChipText,
                    {
                      color:
                        searchQuery.toLowerCase() === sugg.query.toLowerCase()
                          ? colors.primary
                          : colors.textPrimary,
                    },
                  ]}
                >
                  {t(`recipes.suggestions.${sugg.id}`, sugg.label)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Main Content (List / Loading / Empty) ── */}
      <View style={s.contentArea}>{renderContent()}</View>

      {/* ── Recipe Full Detail Sheet ── */}
      <Modal
        visible={!!selectedRecipeDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRecipeDetail(null)}
      >
        <View style={s.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setSelectedRecipeDetail(null)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View style={[s.modalCard, { backgroundColor: colors.surface, borderColor: colors.border + '60' }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.border + '80' }]} />

            <TouchableOpacity
              style={[s.modalCloseBtn, { backgroundColor: colors.surfaceAlt }]}
              onPress={() => setSelectedRecipeDetail(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            {selectedRecipeDetail && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.modalScroll}>
                {/* Meta Badges */}
                <View style={s.modalBadgesRow}>
                  <View style={[s.badgeItem, { backgroundColor: colors.surfaceAlt }]}>
                    <Clock size={13} color={colors.textSecondary} />
                    <Text style={[s.badgeText, { color: colors.textSecondary }]}>
                      {selectedRecipeDetail.prepTime} min
                    </Text>
                  </View>
                  <View style={[s.badgeItem, { backgroundColor: `${colors.calories || '#F43F5E'}20` }]}>
                    <Flame size={13} color={colors.calories || '#F43F5E'} />
                    <Text style={[s.badgeText, { color: colors.calories || '#F43F5E' }]}>
                      {selectedRecipeDetail.calories} kcal
                    </Text>
                  </View>
                  <View style={[s.badgeItem, { backgroundColor: `${colors.primary}20` }]}>
                    <Sparkles size={13} color={colors.primary} />
                    <Text style={[s.badgeText, { color: colors.primary }]}>
                      {selectedRecipeDetail.goal === 'lose'
                        ? 'Definición'
                        : selectedRecipeDetail.goal === 'gain'
                        ? 'Volumen'
                        : 'Mantenimiento'}
                    </Text>
                  </View>
                </View>

                {/* Recipe Title & Description */}
                <Text style={[s.modalRecipeTitle, { color: colors.textPrimary }]}>
                  {selectedRecipeDetail.name}
                </Text>
                <Text style={[s.modalRecipeDesc, { color: colors.textSecondary }]}>
                  {selectedRecipeDetail.description}
                </Text>

                {/* Detailed Macros Cards */}
                <View style={s.modalMacrosGrid}>
                  <View style={[s.modalMacroCard, { backgroundColor: `${colors.protein}15`, borderColor: `${colors.protein}35` }]}>
                    <Text style={[s.modalMacroLabel, { color: colors.protein }]}>PROTEÍNA</Text>
                    <Text style={[s.modalMacroVal, { color: colors.protein }]}>{selectedRecipeDetail.protein}g</Text>
                  </View>
                  <View style={[s.modalMacroCard, { backgroundColor: `${colors.carbs}15`, borderColor: `${colors.carbs}35` }]}>
                    <Text style={[s.modalMacroLabel, { color: colors.carbs }]}>CARBOHIDRATOS</Text>
                    <Text style={[s.modalMacroVal, { color: colors.carbs }]}>{selectedRecipeDetail.carbs}g</Text>
                  </View>
                  <View style={[s.modalMacroCard, { backgroundColor: `${colors.fat}15`, borderColor: `${colors.fat}35` }]}>
                    <Text style={[s.modalMacroLabel, { color: colors.fat }]}>GRASAS</Text>
                    <Text style={[s.modalMacroVal, { color: colors.fat }]}>{selectedRecipeDetail.fat}g</Text>
                  </View>
                </View>

                {/* Ingredients Checklist */}
                {selectedRecipeDetail.ingredients && selectedRecipeDetail.ingredients.length > 0 && (
                  <View style={s.modalSection}>
                    <View style={s.modalSectionHeader}>
                      <Utensils size={16} color={colors.primary} />
                      <Text style={[s.modalSectionTitle, { color: colors.textPrimary }]}>
                        Ingredientes ({selectedRecipeDetail.ingredients.length})
                      </Text>
                    </View>
                    <Text style={[s.sectionSub, { color: colors.textMuted }]}>
                      Toca para tachar los que ya tengas listos en tu cocina:
                    </Text>
                    <View style={s.ingredientsList}>
                      {selectedRecipeDetail.ingredients.map((ing, idx) => {
                        const isChecked = !!checkedIngredients[ing];
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              s.ingredientCheckRow,
                              { backgroundColor: colors.surfaceAlt + '60', borderColor: colors.border + '30' },
                              isChecked && { borderColor: `${colors.primary}50` },
                            ]}
                            onPress={() => toggleIngredientCheck(ing)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                s.checkCircle,
                                { borderColor: colors.border },
                                isChecked && { backgroundColor: colors.primary, borderColor: colors.primary },
                              ]}
                            >
                              {isChecked && <CheckCircle2 size={14} color="#FFF" />}
                            </View>
                            <Text
                              style={[
                                s.ingredientText,
                                { color: colors.textPrimary },
                                isChecked && { textDecorationLine: 'line-through', opacity: 0.6 },
                              ]}
                            >
                              {ing}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Step by Step Instructions */}
                {selectedRecipeDetail.instructions && selectedRecipeDetail.instructions.length > 0 && (
                  <View style={s.modalSection}>
                    <View style={s.modalSectionHeader}>
                      <ChefHat size={16} color={colors.primary} />
                      <Text style={[s.modalSectionTitle, { color: colors.textPrimary }]}>
                        Paso a Paso
                      </Text>
                    </View>
                    <View style={s.stepsList}>
                      {selectedRecipeDetail.instructions.map((step, idx) => (
                        <View
                          key={idx}
                          style={[
                            s.stepCard,
                            { backgroundColor: colors.surfaceAlt + '60', borderColor: colors.border + '30' },
                          ]}
                        >
                          <View style={[s.stepBadge, { backgroundColor: `${colors.primary}25` }]}>
                            <Text style={[s.stepBadgeText, { color: colors.primary }]}>{idx + 1}</Text>
                          </View>
                          <Text style={[s.stepText, { color: colors.textSecondary }]}>
                            {step.replace(/^step:\s*\d+\s*/i, '')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Ask Coach / Modifications */}
                <TouchableOpacity
                  style={[s.askCoachBigBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setSelectedRecipeDetail(null);
                    const prompt = t('recipes.promptHowToPrepare', {
                      defaultValue: `Hola Coach, sobre la receta "{{name}}": ¿qué sustituciones de ingredientes me recomiendas o qué técnica puedo usar para que quede aún mejor? Detalles: {{desc}} (P: {{p}}g, C: {{c}}g, F: {{f}}g, {{kcal}} kcal).`,
                      name: selectedRecipeDetail.name,
                      desc: selectedRecipeDetail.description,
                      p: selectedRecipeDetail.protein,
                      c: selectedRecipeDetail.carbs,
                      f: selectedRecipeDetail.fat,
                      kcal: selectedRecipeDetail.calories,
                    });
                    router.push(`/(tabs)/coach?initialTab=nutritionist&prompt=${encodeURIComponent(prompt)}`);
                  }}
                  activeOpacity={0.85}
                >
                  <MessageSquare size={17} color="#FFF" />
                  <Text style={s.askCoachBigText}>Preguntar dudas o sustituciones al Coach</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <AdTimerOverlay featureId="recipes" />
    </SafeAreaView>
  );
}

// ─── Individual Recipe Card ──────────────────────────────────────────────────
function RecipeCard({
  recipe,
  isFav,
  onFav,
  onOpenDetail,
  index,
}: {
  recipe: Recipe;
  isFav: boolean;
  onFav: () => void;
  onOpenDetail: () => void;
  index: number;
}) {
  const { t } = useTranslation();
  const colors = useTheme();

  const gradientColors =
    index % 2 === 0
      ? ([colors.surfaceAlt + '90', colors.surfaceAlt + '40'] as const)
      : ([colors.surfaceAlt + '50', colors.surfaceAlt + '85'] as const);

  return (
    <View
      style={[
        rc.cardContainer,
        {
          borderColor: isFav ? `${colors.primary}60` : `${colors.border}40`,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 3,
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={rc.card}
      >
        <View style={rc.info}>
          {/* Top Badges & Fav */}
          <View style={rc.topRow}>
            <View style={rc.pillBadges}>
              <View style={[rc.pill, { backgroundColor: colors.background + '80' }]}>
                <Clock size={12} color={colors.textSecondary} />
                <Text style={[rc.pillText, { color: colors.textSecondary }]}>
                  {recipe.prepTime} {t('recipes.prepTime', 'min')}
                </Text>
              </View>

              <View style={[rc.pill, { backgroundColor: `${colors.calories || '#F43F5E'}20` }]}>
                <Flame size={12} color={colors.calories || '#F43F5E'} />
                <Text style={[rc.pillText, { color: colors.calories || '#F43F5E' }]}>
                  {recipe.calories} kcal
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onFav}
              style={[
                rc.favBtn,
                {
                  backgroundColor: isFav ? `${colors.primary}25` : colors.background + '80',
                  borderColor: isFav ? colors.primary : colors.border + '40',
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Bookmark
                size={16}
                color={isFav ? colors.primary : colors.textMuted}
                fill={isFav ? colors.primary : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          {/* Title & Description */}
          <TouchableOpacity onPress={onOpenDetail} activeOpacity={0.8}>
            <Text style={[rc.name, { color: colors.textPrimary }]} numberOfLines={2}>
              {recipe.name}
            </Text>
            <Text style={[rc.desc, { color: colors.textSecondary }]} numberOfLines={2}>
              {recipe.description}
            </Text>
          </TouchableOpacity>

          {/* Ingredients Preview */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <View style={rc.ingredientsPreview}>
              {recipe.ingredients.slice(0, 3).map((ing, i) => (
                <View key={i} style={[rc.ingChip, { backgroundColor: colors.background + '70' }]}>
                  <Text style={[rc.ingChipText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {ing.split(',')[0]}
                  </Text>
                </View>
              ))}
              {recipe.ingredients.length > 3 && (
                <View style={[rc.ingChip, { backgroundColor: colors.background + '70' }]}>
                  <Text style={[rc.ingChipText, { color: colors.primary }]}>
                    +{recipe.ingredients.length - 3} más
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Macros Bar */}
          <View style={rc.macros}>
            <View
              style={[
                rc.macroPill,
                { backgroundColor: `${colors.protein}15`, borderColor: `${colors.protein}35` },
              ]}
            >
              <Text style={[rc.macroLabel, { color: colors.protein }]}>
                {t('recipes.protein', 'PROTEÍNA')}
              </Text>
              <Text style={[rc.macroText, { color: colors.protein }]}>{recipe.protein}g</Text>
            </View>

            <View
              style={[
                rc.macroPill,
                { backgroundColor: `${colors.carbs}15`, borderColor: `${colors.carbs}35` },
              ]}
            >
              <Text style={[rc.macroLabel, { color: colors.carbs }]}>
                {t('recipes.carbs', 'CARBOS')}
              </Text>
              <Text style={[rc.macroText, { color: colors.carbs }]}>{recipe.carbs}g</Text>
            </View>

            <View
              style={[
                rc.macroPill,
                { backgroundColor: `${colors.fat}15`, borderColor: `${colors.fat}35` },
              ]}
            >
              <Text style={[rc.macroLabel, { color: colors.fat }]}>{t('recipes.fat', 'GRASA')}</Text>
              <Text style={[rc.macroText, { color: colors.fat }]}>{recipe.fat}g</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={rc.actionsRow}>
            <TouchableOpacity
              style={[rc.viewRecipeBtn, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}
              onPress={onOpenDetail}
              activeOpacity={0.8}
            >
              <ChefHat size={15} color={colors.primary} />
              <Text style={[rc.viewRecipeText, { color: colors.primary }]}>
                {t('recipes.viewFull', 'Ver Preparación')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[rc.askCoachBtn, { backgroundColor: colors.surfaceAlt + '90' }]}
              onPress={() => {
                const prompt = t('recipes.promptHowToPrepare', {
                  defaultValue: `Hola Coach, ¿me puedes dar las instrucciones paso a paso para preparar esta receta: "{{name}}"? Descripción y detalles: {{desc}} (P: {{p}}g, C: {{c}}g, F: {{f}}g, {{kcal}} kcal).`,
                  name: recipe.name,
                  desc: recipe.description,
                  p: recipe.protein,
                  c: recipe.carbs,
                  f: recipe.fat,
                  kcal: recipe.calories,
                });
                router.push(`/(tabs)/coach?initialTab=nutritionist&prompt=${encodeURIComponent(prompt)}`);
              }}
              activeOpacity={0.8}
            >
              <MessageSquare size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const rc = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  card: {
    borderRadius: Radius.xl,
  },
  info: {
    padding: Spacing.md,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  favBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  ingredientsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ingChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  ingChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  macros: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  macroText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  viewRecipeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 6,
  },
  viewRecipeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  askCoachBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const s = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  chefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  chefBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  tabsTrack: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.full,
    gap: 6,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Search
  searchSection: {
    paddingHorizontal: Spacing.lg,
    gap: 10,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 5,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  searchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  searchBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  suggChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  suggChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Content Area
  contentArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    paddingTop: 4,
  },

  // Loading
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 12,
  },
  loadingIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Empty State
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.full,
    marginTop: 8,
  },
  exploreBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Paywall
  paywallContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    gap: 16,
  },
  paywallEmojiBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paywallEmoji: {
    fontSize: 44,
  },
  paywallTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  paywallSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  proBtn: {
    width: '100%',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  proGrad: {
    padding: 16,
    alignItems: 'center',
  },
  proText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },

  // Recipe Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: Spacing.lg,
    paddingTop: 12,
    position: 'relative',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalScroll: {
    paddingBottom: 30,
    gap: 16,
  },
  modalBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalRecipeTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    paddingRight: 32,
  },
  modalRecipeDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalMacrosGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  modalMacroCard: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    gap: 2,
  },
  modalMacroLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalMacroVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSection: {
    gap: 8,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  ingredientsList: {
    gap: 6,
    marginTop: 4,
  },
  ingredientCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  stepsList: {
    gap: 8,
    marginTop: 4,
  },
  stepCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 10,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
    fontWeight: '500',
  },
  askCoachBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    gap: 8,
    marginTop: 6,
  },
  askCoachBigText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
