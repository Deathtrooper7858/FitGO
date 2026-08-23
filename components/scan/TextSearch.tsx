import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { searchFood } from '../../services/foodDatabase';
import { Spacing, Radius } from '../../constants';

interface TextSearchProps {
  onFoodSelected: (food: any) => void;
  colors: any;
  t: any;
  language: string;
}

export default function TextSearch({ onFoodSelected, colors, t, language }: TextSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchFood(query, language);
        setResults(res);
      } catch (err) {
        console.warn('Search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [query, language]);

  return (
    <View style={[s.searchWrap, { backgroundColor: 'rgba(0,0,0,0.6)', flex: 1, width: '100%' }]}>
      <View style={[s.searchInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>🔎</Text>
        <TextInput
          style={[s.searchTextInput, { color: colors.textPrimary }]}
          placeholder={t('scan.searchPlaceholder') || 'Search food in database...'}
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
        {isSearching && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
      </View>
      <ScrollView contentContainerStyle={s.searchResultsList} style={{ flex: 1, width: '100%' }}>
        {results.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[s.searchResultItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onFoodSelected(item)}
            activeOpacity={0.7}
          >
            {item.imageUrl ? (
              <Image cachePolicy="memory-disk" source={{ uri: item.imageUrl }} style={s.searchResultImage} />
            ) : (
              <View style={[s.searchResultImage, { backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 24 }}>🍽️</Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.searchResultName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[s.searchResultBrand, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.brand ? `${item.brand} • ` : ''}{item.calories} kcal
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                <View style={[s.macroBadge, { backgroundColor: colors.protein + '15' }]}>
                  <Text style={[s.macroBadgeText, { color: colors.protein }]}>P {item.protein}g</Text>
                </View>
                <View style={[s.macroBadge, { backgroundColor: colors.carbs + '15' }]}>
                  <Text style={[s.macroBadgeText, { color: colors.carbs }]}>C {item.carbs}g</Text>
                </View>
                <View style={[s.macroBadge, { backgroundColor: colors.fat + '15' }]}>
                  <Text style={[s.macroBadgeText, { color: colors.fat }]}>G {item.fat}g</Text>
                </View>
              </View>
            </View>
            <LinearGradient colors={[colors.primary, colors.secondary || '#A855F7']} style={s.searchResultAddBtn}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
        {query.length > 0 && results.length === 0 && !isSearching && (
          <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>
            {t('common.noResultsFound', 'No se encontraron resultados')}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  searchWrap: { padding: Spacing.md },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.md },
  searchTextInput: { flex: 1, fontSize: 16 },
  searchResultsList: { paddingBottom: 40 },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: Radius.lg, borderWidth: 1, marginBottom: 12 },
  searchResultImage: { width: 64, height: 64, borderRadius: Radius.md },
  searchResultName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  searchResultBrand: { fontSize: 13, marginBottom: 2 },
  macroBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  macroBadgeText: { fontSize: 10, fontWeight: '700' },
  searchResultAddBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});
