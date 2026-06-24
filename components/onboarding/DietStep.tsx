import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronUp, Check, Search, Apple } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { step, StepProps, FOOD_CATEGORIES, CAT_META_OB } from './constants';

export function DietStep({ value: data, onChange }: StepProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCats, setExpandedCats] = useState<string[]>([]);

  const toggleCat = (id: string) => {
    setExpandedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return FOOD_CATEGORIES;
    const q = searchQuery.toLowerCase().trim();
    return FOOD_CATEGORIES.map(cat => {
      const filteredItems = cat.items.filter(item => {
        const translatedLabel = t(`onboarding.foodItems.${item.label}`) || item.label;
        return translatedLabel.toLowerCase().includes(q) || item.label.toLowerCase().includes(q);
      });
      return { ...cat, items: filteredItems };
    }).filter(cat => cat.items.length > 0);
  }, [searchQuery, t]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedCats(filteredCategories.map(c => c.id));
    }
  }, [searchQuery, filteredCategories]);

  const toggle = (id: string) => {
    const cur = data.availableFoods ?? [];
    onChange({ availableFoods: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };

  const selectAll = (categoryItems: { id: string }[]) => {
    const cur = data.availableFoods ?? [];
    const itemIds = categoryItems.map(i => i.id);
    const allSelected = itemIds.every(id => cur.includes(id));
    if (allSelected) {
      onChange({ availableFoods: cur.filter(id => !itemIds.includes(id)) });
    } else {
      onChange({ availableFoods: [...new Set([...cur, ...itemIds])] });
    }
  };

  const totalSelected = (data.availableFoods ?? []).length;

  return (
    <View style={step.container}>
      <View style={step.headerSection}>
        <LinearGradient colors={[colors.primary + '25', colors.primary + '08']} style={step.heroGrad}>
          <View style={[step.heroIcon, { backgroundColor: colors.primary + '20' }]}>
            <Apple size={36} color={colors.primary} />
          </View>
          <Text style={[step.title, { color: colors.textPrimary }]}>{t('onboarding.foodsTitle')}</Text>
          <Text style={[step.sub, { color: colors.textSecondary }]}>{t('onboarding.foodsSub')}</Text>
          {totalSelected > 0 && (
            <View style={[step.selectedBadge, { backgroundColor: colors.primary }]}>
              <Text style={step.selectedBadgeText}>{totalSelected} {t('onboarding.selectedCount')}</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      <View style={[step.searchWrap, { backgroundColor: colors.surface, borderColor: searchQuery ? colors.primary : colors.border }]}>
        <Search size={18} color={searchQuery ? colors.primary : colors.textSecondary} />
        <TextInput
          style={[step.searchInput, { color: colors.textPrimary }]}
          placeholder={t('onboarding.searchFood')}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={[step.clearBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800' }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {searchQuery.trim() && filteredCategories.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 32, marginBottom: 10 }}>🔍</Text>
          <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 17 }}>{t('common.noResults', 'No results')}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{t('common.tryAnotherTerm', 'Try another term')}</Text>
        </View>
      )}

      {filteredCategories.map((cat) => {
        const meta = CAT_META_OB[cat.id] || { gradient: [colors.primary, colors.primary] as [string, string], icon: '🍽️' };
        const isExpanded = expandedCats.includes(cat.id);
        const catSelected = (data.availableFoods ?? []).filter(id => cat.items.some(i => i.id === id)).length;

        return (
          <View key={cat.id} style={[step.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={step.catHeader} onPress={() => toggleCat(cat.id)} activeOpacity={0.7}>
              <View style={step.catIconWrap}>
                <LinearGradient colors={meta.gradient as [string, string]} style={step.catIconGrad}>
                  <Text style={{ fontSize: 20 }}>{meta.icon}</Text>
                </LinearGradient>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[step.catTitle, { color: colors.textPrimary }]}>{t(`onboarding.${cat.title}`)}</Text>
                <Text style={[step.catSub, { color: colors.textSecondary }]}>
                  {catSelected}/{cat.items.length} {t('onboarding.selectedCount')}{cat.min > 0 ? ` • min ${cat.min}` : ''}
                </Text>
              </View>
              {catSelected > 0 && (
                <View style={[step.catBadge, { backgroundColor: meta.gradient[0] + '30' }]}>
                  <Text style={[step.catBadgeText, { color: meta.gradient[0] }]}>{catSelected}</Text>
                </View>
              )}
              <View style={[step.chevronWrap, { backgroundColor: colors.surfaceAlt }]}>
                {isExpanded ? <ChevronUp size={16} color={colors.textSecondary} /> : <ChevronDown size={16} color={colors.textSecondary} />}
              </View>
            </TouchableOpacity>

            {cat.min > 0 && (
              <View style={[step.progressTrack, { backgroundColor: colors.border }]}>
                <LinearGradient
                  colors={meta.gradient as [string, string]}
                  style={[step.progressBar, { width: `${Math.min((catSelected / cat.min) * 100, 100)}%` }]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              </View>
            )}

            {isExpanded && (
              <View style={step.itemsSection}>
                <TouchableOpacity onPress={() => selectAll(cat.items)} style={step.selectAllBtn}>
                  <Text style={[step.selectAllText, { color: meta.gradient[0] }]}>
                    {cat.items.every(i => (data.availableFoods ?? []).includes(i.id)) ? `✓ ${t('onboarding.allSelected')}` : t('onboarding.selectAll')}
                  </Text>
                </TouchableOpacity>
                <View style={step.dietGrid}>
                  {cat.items.map((item) => {
                    const active = (data.availableFoods ?? []).includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          step.dietPill,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          active && { borderColor: meta.gradient[0], backgroundColor: meta.gradient[0] + '15' }
                        ]}
                        onPress={() => toggle(item.id)}
                        activeOpacity={0.75}
                      >
                        <View style={[step.pillEmoji, { backgroundColor: active ? meta.gradient[0] + '25' : colors.surfaceAlt }]}>
                          <Text style={{ fontSize: 17 }}>{item.emoji}</Text>
                        </View>
                        <Text style={[step.dietPillText, { color: active ? colors.textPrimary : colors.textSecondary }, active && { fontWeight: '700', color: colors.textPrimary }]}>
                          {t(`onboarding.foodItems.${item.label}`) || item.label}
                        </Text>
                        {active && (
                          <View style={[step.checkDot, { backgroundColor: meta.gradient[0] }]}>
                            <Check size={9} color="#FFF" strokeWidth={3} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
