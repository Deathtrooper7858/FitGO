import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, X, Utensils } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query, language]);

  return (
    <View style={[s.searchWrap, { backgroundColor: 'transparent', flex: 1, width: '100%' }]}>
      {/* Search Input Bar */}
      <View style={[s.searchInputContainer, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }]}>
        <Search size={18} color="rgba(255,255,255,0.55)" style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchTextInput}
          placeholder={t('scan.searchPlaceholder') || 'Buscar alimento en la base de datos...'}
          placeholderTextColor="rgba(255,255,255,0.38)"
          value={query}
          onChangeText={setQuery}
          underlineColorAndroid="transparent"
          autoCorrect={false}
          cursorColor={colors.primaryLight || '#C4B5FD'}
        />
        {isSearching && (
          <ActivityIndicator size="small" color={colors.primaryLight || '#C4B5FD'} style={{ marginRight: 6 }} />
        )}
        {query.length > 0 && (
          <TouchableOpacity
            style={s.clearBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setQuery('');
            }}
          >
            <X size={14} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results or Empty State */}
      <ScrollView
        contentContainerStyle={s.searchResultsList}
        style={{ flex: 1, width: '100%' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {results.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[s.searchResultItem, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }]}
            onPress={() => {
              Haptics.selectionAsync();
              onFoodSelected(item);
            }}
            activeOpacity={0.75}
          >
            {item.imageUrl ? (
              <Image cachePolicy="memory-disk" source={{ uri: item.imageUrl }} style={s.searchResultImage} />
            ) : (
              <View style={[s.searchResultImage, { backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' }]}>
                <Utensils size={22} color="rgba(255,255,255,0.4)" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.searchResultName} numberOfLines={1}>{item.name}</Text>
              <Text style={s.searchResultBrand} numberOfLines={1}>
                {item.brand ? `${item.brand} • ` : ''}{item.calories} kcal / 100g
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                <View style={[s.macroBadge, { backgroundColor: 'rgba(244,63,94,0.15)' }]}>
                  <Text style={[s.macroBadgeText, { color: '#FB7185' }]}>P {item.protein}g</Text>
                </View>
                <View style={[s.macroBadge, { backgroundColor: 'rgba(56,189,248,0.15)' }]}>
                  <Text style={[s.macroBadgeText, { color: '#38BDF8' }]}>C {item.carbs}g</Text>
                </View>
                <View style={[s.macroBadge, { backgroundColor: 'rgba(251,191,36,0.15)' }]}>
                  <Text style={[s.macroBadgeText, { color: '#FBBF24' }]}>G {item.fat}g</Text>
                </View>
              </View>
            </View>
            <LinearGradient colors={[colors.primary, colors.secondary || '#A855F7']} style={s.searchResultAddBtn}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {query.trim().length > 0 && results.length === 0 && !isSearching && (
          <View style={s.noResultsBox}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>🔍</Text>
            <Text style={s.noResultsTitle}>
              {t('common.noResultsFound', 'No se encontraron resultados')}
            </Text>
            <Text style={s.noResultsSubtitle}>
              {"Prueba con otro término o describe tu comida en la pestaña \"Texto\"."}
            </Text>
          </View>
        )}

        {!query.trim() && (
          <View style={s.emptyStateBox}>
            <Text style={{ fontSize: 32, marginBottom: 10 }}>🥗</Text>
            <Text style={s.emptyStateTitle}>
              Busca en miles de alimentos
            </Text>
            <Text style={s.emptyStateSubtitle}>
              {"Escribe el nombre de un ingrediente o producto (ej. 'pechuga de pollo', 'arroz blanco', 'avena')."}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  searchWrap: { paddingHorizontal: Spacing.base, paddingTop: 4 },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  searchResultsList: { paddingBottom: 50 },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchResultImage: { width: 56, height: 56, borderRadius: Radius.md },
  searchResultName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  searchResultBrand: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  macroBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  macroBadgeText: { fontSize: 10, fontWeight: '700' },
  searchResultAddBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  noResultsBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  noResultsTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  noResultsSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  emptyStateBox: { alignItems: 'center', paddingVertical: 45, paddingHorizontal: 25 },
  emptyStateTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  emptyStateSubtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
