import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Apple,
  Search,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps, FOOD_CATEGORIES, CAT_META_OB } from './constants';
import { FloatingHeroIcon } from './FloatingHeroIcon';

export function DietStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [expandedCats, setExpandedCats] = useState<string[]>(FOOD_CATEGORIES.map((c) => c.id));

  const availableFoods = useMemo(() => data.availableFoods ?? [], [data.availableFoods]);

  const toggleCat = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCats((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleFood = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const cur = data.availableFoods ?? [];
      onChange({ availableFoods: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
    },
    [data.availableFoods, onChange]
  );

  const selectAll = useCallback(
    (categoryItems: { id: string }[]) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const cur = data.availableFoods ?? [];
      const itemIds = categoryItems.map((i) => i.id);
      const allSelected = itemIds.every((id) => cur.includes(id));
      if (allSelected) {
        onChange({ availableFoods: cur.filter((id) => !itemIds.includes(id)) });
      } else {
        onChange({ availableFoods: [...new Set([...cur, ...itemIds])] });
      }
    },
    [data.availableFoods, onChange]
  );

  const filteredCategories = useMemo(() => {
    let cats = FOOD_CATEGORIES;
    if (selectedCategoryTab !== 'all') {
      cats = cats.filter((c) => c.id === selectedCategoryTab);
    }
    if (!searchQuery.trim()) return cats;

    const q = searchQuery.toLowerCase().trim();
    return cats
      .map((cat) => {
        const filteredItems = cat.items.filter((item) => {
          const translated = t(`onboarding.foodItems.${item.label}`) || item.label;
          return translated.toLowerCase().includes(q) || item.label.toLowerCase().includes(q);
        });
        return { ...cat, items: filteredItems };
      })
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery, selectedCategoryTab, t]);

  const totalSelected = availableFoods.length;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <FloatingHeroIcon
          icon={<Apple size={44} color="#10B981" />}
          color="#10B981"
          glowColor="#059669"
        />
        <Text style={[step.title, { color: colors.textPrimary }]}>
          {t('onboarding.foodsTitle', 'Select your favorite foods')}
        </Text>
        <Text style={[step.sub, { color: colors.textSecondary }]}>
          {t('onboarding.foodsSub', 'We will build your meal plan using foods you actually enjoy')}
        </Text>
      </View>

      {/* Category Requirements Progress Overview */}
      <View
        style={[
          styles.requirementsCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.requirementsHeader}>
          <Sparkles size={16} color={colors.primary} />
          <Text style={[styles.requirementsTitle, { color: colors.textPrimary }]}>
            {t('onboarding.categoryRequirements', 'SELECTION REQUIREMENTS')}
          </Text>
          <Text style={[styles.totalCountBadge, { color: colors.primary }]}>
            {totalSelected} {t('onboarding.selectedCount', 'selected')}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.requirementsList}>
          {FOOD_CATEGORIES.map((cat) => {
            const count = availableFoods.filter((id) => cat.items.some((i) => i.id === id)).length;
            const isFulfilled = cat.min === 0 || count >= cat.min;
            const meta = CAT_META_OB[cat.id] || { gradient: [colors.primary, colors.primary] as [string, string], icon: '🍽️' };

            return (
              <View
                key={cat.id}
                style={[
                  styles.requirementPill,
                  {
                    backgroundColor: isFulfilled ? '#10B98115' : colors.background,
                    borderColor: isFulfilled ? '#10B98150' : colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 13 }}>{meta.icon}</Text>
                <Text
                  style={[
                    styles.reqPillText,
                    { color: isFulfilled ? '#10B981' : colors.textSecondary },
                    isFulfilled && { fontWeight: '800' },
                  ]}
                >
                  {t(`onboarding.${cat.title}`)}: {count}{cat.min > 0 ? `/${cat.min}` : ''}
                </Text>
                {isFulfilled && (
                  <CheckCircle2 size={12} color="#10B981" />
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View
        style={[
          step.searchWrap,
          {
            backgroundColor: colors.surface,
            borderColor: searchQuery ? colors.primary : colors.border,
            marginVertical: 12,
          },
        ]}
      >
        <Search size={18} color={searchQuery ? colors.primary : colors.textSecondary} />
        <TextInput
          style={[step.searchInput, { color: colors.textPrimary }]}
          placeholder={t('onboarding.searchFood', 'Search food or beverage...')}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={[step.clearBtn, { backgroundColor: colors.surfaceAlt }]}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800' }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Category Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabsContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterTab,
            {
              backgroundColor: selectedCategoryTab === 'all' ? colors.primary : colors.surface,
              borderColor: selectedCategoryTab === 'all' ? colors.primary : colors.border,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedCategoryTab('all');
          }}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: selectedCategoryTab === 'all' ? '#FFF' : colors.textSecondary },
              selectedCategoryTab === 'all' && { fontWeight: '800' },
            ]}
          >
            {t('common.all', 'All Categories')}
          </Text>
        </TouchableOpacity>

        {FOOD_CATEGORIES.map((cat) => {
          const isSelected = selectedCategoryTab === cat.id;
          const meta = CAT_META_OB[cat.id] || { gradient: [colors.primary, colors.primary] as [string, string], icon: '🍽️' };
          const count = availableFoods.filter((id) => cat.items.some((i) => i.id === id)).length;

          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isSelected ? meta.gradient[0] : colors.surface,
                  borderColor: isSelected ? meta.gradient[0] : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategoryTab(cat.id);
              }}
            >
              <Text style={{ fontSize: 13 }}>{meta.icon}</Text>
              <Text
                style={[
                  styles.filterTabText,
                  { color: isSelected ? '#FFF' : colors.textSecondary },
                  isSelected && { fontWeight: '800' },
                ]}
              >
                {t(`onboarding.${cat.title}`)} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* No Results Message */}
      {searchQuery.trim() && filteredCategories.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 32, marginBottom: 10 }}>🔍</Text>
          <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 17 }}>
            {t('common.noResults', 'No foods found')}
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
            {t('common.tryAnotherTerm', 'Try searching for another food')}
          </Text>
        </View>
      )}

      {/* Categories Food List */}
      <View style={{ gap: 14, marginTop: 8 }}>
        {filteredCategories.map((cat, catIndex) => {
          const meta = CAT_META_OB[cat.id] || { gradient: [colors.primary, colors.primary] as [string, string], icon: '🍽️' };
          const isExpanded = expandedCats.includes(cat.id);
          const catSelectedCount = availableFoods.filter((id) => cat.items.some((i) => i.id === id)).length;
          const isFulfilled = cat.min === 0 || catSelectedCount >= cat.min;

          return (
            <Animated.View
              key={cat.id}
              entering={FadeInUp.delay(60 + catIndex * 50).springify().damping(18)}
              style={[
                styles.categoryCard,
                { backgroundColor: colors.surface, borderColor: isFulfilled ? meta.gradient[0] + '60' : colors.border },
              ]}
            >
              <TouchableOpacity
                style={styles.catHeader}
                onPress={() => toggleCat(cat.id)}
                activeOpacity={0.8}
              >
                <View style={styles.catIconWrap}>
                  <LinearGradient colors={meta.gradient as [string, string]} style={styles.catIconGrad}>
                    <Text style={{ fontSize: 20 }}>{meta.icon}</Text>
                  </LinearGradient>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.catTitle, { color: colors.textPrimary }]}>
                      {t(`onboarding.${cat.title}`)}
                    </Text>
                    {isFulfilled && <CheckCircle2 size={14} color="#10B981" />}
                  </View>
                  <Text style={[styles.catSub, { color: isFulfilled ? '#10B981' : colors.textSecondary }]}>
                    {catSelectedCount}/{cat.items.length} {t('onboarding.selectedCount', 'selected')}
                    {cat.min > 0 ? ` • min. ${cat.min}` : ''}
                  </Text>
                </View>

                <View style={[styles.catBadge, { backgroundColor: meta.gradient[0] + '25' }]}>
                  <Text style={[styles.catBadgeText, { color: meta.gradient[0] }]}>{catSelectedCount}</Text>
                </View>

                <View style={[styles.chevronWrap, { backgroundColor: colors.surfaceAlt }]}>
                  {isExpanded ? (
                    <ChevronUp size={16} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={16} color={colors.textSecondary} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Progress bar within category */}
              {cat.min > 0 && (
                <View style={[styles.progressTrack, { backgroundColor: colors.border + '50' }]}>
                  <LinearGradient
                    colors={meta.gradient as [string, string]}
                    style={[
                      styles.progressBar,
                      { width: `${Math.min((catSelectedCount / cat.min) * 100, 100)}%` },
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              )}

              {/* Grid of foods */}
              {isExpanded && (
                <View style={styles.itemsSection}>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => selectAll(cat.items)}
                      style={[styles.selectAllBtn, { backgroundColor: meta.gradient[0] + '15' }]}
                    >
                      <Text style={[styles.selectAllText, { color: meta.gradient[0] }]}>
                        {cat.items.every((i) => availableFoods.includes(i.id))
                          ? `✓ ${t('onboarding.allSelected', 'All Selected')}`
                          : t('onboarding.selectAll', 'Select All')}
                      </Text>
                    </TouchableOpacity>

                    <Text style={[styles.hintText, { color: colors.textMuted }]}>
                      {cat.min > 0 ? `${t('common.required', 'Req.')} min. ${cat.min}` : t('common.optional', 'Optional')}
                    </Text>
                  </View>

                  <View style={styles.dietGrid}>
                    {cat.items.map((item) => {
                      const active = availableFoods.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.dietPill,
                            {
                              backgroundColor: active ? meta.gradient[0] + '25' : colors.surface,
                              borderColor: active ? meta.gradient[0] : colors.border,
                            },
                          ]}
                          onPress={() => toggleFood(item.id)}
                          activeOpacity={0.75}
                        >
                          <Text style={{ fontSize: 19 }}>{item.emoji}</Text>
                          <Text
                            style={[
                              styles.dietPillText,
                              { color: active ? colors.textPrimary : colors.textSecondary },
                              active && { fontWeight: '800' },
                            ]}
                            numberOfLines={1}
                          >
                            {t(`onboarding.foodItems.${item.label}`) || item.label}
                          </Text>
                          {active && (
                            <View style={[styles.checkDot, { backgroundColor: meta.gradient[0] }]}>
                              <Check size={10} color="#FFF" strokeWidth={3.5} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  requirementsCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  requirementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requirementsTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    flex: 1,
    marginLeft: 6,
  },
  totalCountBadge: {
    fontSize: 12,
    fontWeight: '800',
  },
  requirementsList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  requirementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  reqPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  catIconGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  catSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    height: 3,
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  itemsSection: {
    padding: 14,
    paddingTop: 8,
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '800',
  },
  hintText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dietGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
    minWidth: '47%',
    flex: 1,
  },
  pillEmoji: {},
  dietPillText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    backgroundColor: 'transparent',
  },
  checkDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
