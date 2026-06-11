import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store';
import { supabase } from '../../services/supabase';
import { Radius, Spacing } from '../../constants';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple, ChevronLeft, Sparkles, AlertCircle, Search, Check, ChevronDown, ChevronUp, Utensils } from 'lucide-react-native';

// Category color palettes & icons
const CAT_META: Record<string, { gradient: [string, string]; icon: string }> = {
  proteins: { gradient: ['#FF6B6B', '#EE5A24'], icon: '🍗' },
  carbs:    { gradient: ['#F9CA24', '#F0932B'], icon: '🍚' },
  fats:     { gradient: ['#6AB04C', '#BADC58'], icon: '🥑' },
  fruits:   { gradient: ['#EB4D8B', '#FD79A8'], icon: '🍓' },
  veggies:  { gradient: ['#00B894', '#00CEC9'], icon: '🥦' },
  condiments: { gradient: ['#FDCB6E', '#E17055'], icon: '🧂' },
  dairy:    { gradient: ['#74B9FF', '#0984E3'], icon: '🥛' },
  beverages:{ gradient: ['#A29BFE', '#6C5CE7'], icon: '☕' },
};

const FOOD_CATEGORIES = [
  {
    id: 'proteins', title: 'proteins', min: 3,
    items: [
      { id: 'chicken', label: 'chicken', emoji: '🍗' },
      { id: 'beef', label: 'beef', emoji: '🥩' },
      { id: 'fish', label: 'fish', emoji: '🐟' },
      { id: 'pork', label: 'pork', emoji: '🍖' },
      { id: 'eggs', label: 'eggs', emoji: '🥚' },
      { id: 'turkey', label: 'turkey', emoji: '🦃' },
      { id: 'tuna', label: 'tuna', emoji: '🐠' },
      { id: 'salmon', label: 'salmon', emoji: '🍣' },
      { id: 'shrimp', label: 'shrimp', emoji: '🦐' },
      { id: 'tilapia', label: 'tilapia', emoji: '🐟' },
      { id: 'octopus', label: 'octopus', emoji: '🐙' },
      { id: 'squid', label: 'squid', emoji: '🦑' },
      { id: 'crab', label: 'crab', emoji: '🦀' },
      { id: 'sardines', label: 'sardines', emoji: '🐟' },
      { id: 'lamb', label: 'lamb', emoji: '🍖' },
      { id: 'goat', label: 'goat', emoji: '🥩' },
      { id: 'duck', label: 'duck', emoji: '🦆' },
      { id: 'rabbit', label: 'rabbit', emoji: '🐇' },
      { id: 'guinea_pig', label: 'guinea_pig', emoji: '🥩' },
      { id: 'chorizo', label: 'chorizo', emoji: '🌭' },
      { id: 'morcilla', label: 'morcilla', emoji: '🥩' },
      { id: 'chicharron', label: 'chicharron', emoji: '🥓' },
      { id: 'cecina', label: 'cecina', emoji: '🥩' },
      { id: 'tofu', label: 'tofu', emoji: '🍱' },
      { id: 'tempeh', label: 'tempeh', emoji: '🌱' },
      { id: 'seitan', label: 'seitan', emoji: '🌾' },
      { id: 'protein_powder', label: 'protein_powder', emoji: '💪' },
      { id: 'greek_yogurt', label: 'greek_yogurt', emoji: '🥄' },
      { id: 'cottage_cheese', label: 'cottage_cheese', emoji: '🧀' },
      { id: 'quail_eggs', label: 'quail_eggs', emoji: '🥚' }
    ]
  },
  {
    id: 'carbs', title: 'carbs', min: 3,
    items: [
      { id: 'rice', label: 'rice', emoji: '🍚' },
      { id: 'potato', label: 'potato', emoji: '🥔' },
      { id: 'sweet_potato', label: 'sweet_potato', emoji: '🍠' },
      { id: 'cassava', label: 'cassava', emoji: '🥔' },
      { id: 'corn', label: 'corn', emoji: '🌽' },
      { id: 'plantain', label: 'plantain', emoji: '🍌' },
      { id: 'beans', label: 'beans', emoji: '🫘' },
      { id: 'lentils', label: 'lentils', emoji: '🍲' },
      { id: 'chickpeas', label: 'chickpeas', emoji: '🫘' },
      { id: 'peas', label: 'peas', emoji: '🫛' },
      { id: 'oats', label: 'oats', emoji: '🫓' },
      { id: 'quinoa', label: 'quinoa', emoji: '🌾' },
      { id: 'amaranth', label: 'amaranth', emoji: '🌾' },
      { id: 'pasta', label: 'pasta', emoji: '🍝' },
      { id: 'bread', label: 'bread', emoji: '🍞' },
      { id: 'whole_wheat_bread', label: 'whole_wheat_bread', emoji: '🍞' },
      { id: 'tortilla_corn', label: 'tortilla_corn', emoji: '🫓' },
      { id: 'tortilla_flour', label: 'tortilla_flour', emoji: '🫓' },
      { id: 'arepa', label: 'arepa', emoji: '🫓' },
      { id: 'empanada_dough', label: 'empanada_dough', emoji: '🥟' },
      { id: 'tamal_masa', label: 'tamal_masa', emoji: '🫔' },
      { id: 'taro', label: 'taro', emoji: '🍠' },
      { id: 'arracacha', label: 'arracacha', emoji: '🥔' },
      { id: 'olluco', label: 'olluco', emoji: '🥔' },
      { id: 'mote', label: 'mote', emoji: '🌽' },
      { id: 'tapioca', label: 'tapioca', emoji: '🧋' },
      { id: 'granola', label: 'granola', emoji: '🥣' },
      { id: 'rice_cakes', label: 'rice_cakes', emoji: '🍘' },
      { id: 'crackers', label: 'crackers', emoji: '🍘' },
      { id: 'couscous', label: 'couscous', emoji: '🍲' }
    ]
  },
  {
    id: 'fats', title: 'fats', min: 1,
    items: [
      { id: 'avocado', label: 'avocado', emoji: '🥑' },
      { id: 'olive_oil', label: 'olive_oil', emoji: '🫒' },
      { id: 'coconut_oil', label: 'coconut_oil', emoji: '🥥' },
      { id: 'avocado_oil', label: 'avocado_oil', emoji: '🫒' },
      { id: 'corn_oil', label: 'corn_oil', emoji: '🫒' },
      { id: 'soybean_oil', label: 'soybean_oil', emoji: '🫒' },
      { id: 'peanut_oil', label: 'peanut_oil', emoji: '🫒' },
      { id: 'butter', label: 'butter', emoji: '🧈' },
      { id: 'lard', label: 'lard', emoji: '🧈' },
      { id: 'ghee', label: 'ghee', emoji: '🧈' },
      { id: 'margarine', label: 'margarine', emoji: '🧈' },
      { id: 'peanuts', label: 'peanuts', emoji: '🥜' },
      { id: 'almonds', label: 'almonds', emoji: '🌰' },
      { id: 'walnuts', label: 'walnuts', emoji: '🌰' },
      { id: 'brazil_nuts', label: 'brazil_nuts', emoji: '🌰' },
      { id: 'cashews', label: 'cashews', emoji: '🌰' },
      { id: 'pecans', label: 'pecans', emoji: '🌰' },
      { id: 'pistachios', label: 'pistachios', emoji: '🥜' },
      { id: 'peanut_butter', label: 'peanut_butter', emoji: '🥜' },
      { id: 'almond_butter', label: 'almond_butter', emoji: '🥜' },
      { id: 'chia_seeds', label: 'chia_seeds', emoji: '🌱' },
      { id: 'flaxseeds', label: 'flaxseeds', emoji: '🌱' },
      { id: 'pumpkin_seeds', label: 'pumpkin_seeds', emoji: '🎃' },
      { id: 'sunflower_seeds', label: 'sunflower_seeds', emoji: '🌻' },
      { id: 'sesame_seeds', label: 'sesame_seeds', emoji: '🌱' },
      { id: 'olives', label: 'olives', emoji: '🫒' },
      { id: 'cheese_fat', label: 'cheese_fat', emoji: '🧀' },
      { id: 'bacon_fat', label: 'bacon_fat', emoji: '🥓' },
      { id: 'dark_chocolate', label: 'dark_chocolate', emoji: '🍫' },
      { id: 'mayo_fat', label: 'mayo_fat', emoji: '🍳' }
    ]
  },
  {
    id: 'fruits', title: 'fruits', min: 2,
    items: [
      { id: 'banana', label: 'banana', emoji: '🍌' },
      { id: 'apple', label: 'apple', emoji: '🍎' },
      { id: 'papaya', label: 'papaya', emoji: '🍈' },
      { id: 'mango', label: 'mango', emoji: '🥭' },
      { id: 'pineapple', label: 'pineapple', emoji: '🍍' },
      { id: 'watermelon', label: 'watermelon', emoji: '🍉' },
      { id: 'guava', label: 'guava', emoji: '🍐' },
      { id: 'passion_fruit', label: 'passion_fruit', emoji: '🥭' },
      { id: 'lulo', label: 'lulo', emoji: '🍊' },
      { id: 'tree_tomato', label: 'tree_tomato', emoji: '🍅' },
      { id: 'orange', label: 'orange', emoji: '🍊' },
      { id: 'lime', label: 'lime', emoji: '🍋' },
      { id: 'lemon', label: 'lemon', emoji: '🍋' },
      { id: 'grapefruit', label: 'grapefruit', emoji: '🍊' },
      { id: 'mandarin', label: 'mandarin', emoji: '🍊' },
      { id: 'grapes', label: 'grapes', emoji: '🍇' },
      { id: 'strawberries', label: 'strawberries', emoji: '🍓' },
      { id: 'blueberries', label: 'blueberries', emoji: '🫐' },
      { id: 'blackberries', label: 'blackberries', emoji: '🫐' },
      { id: 'melon', label: 'melon', emoji: '🍈' },
      { id: 'peach', label: 'peach', emoji: '🍑' },
      { id: 'plum', label: 'plum', emoji: '🍑' },
      { id: 'pear', label: 'pear', emoji: '🍐' },
      { id: 'kiwi', label: 'kiwi', emoji: '🥝' },
      { id: 'dragonfruit', label: 'dragonfruit', emoji: '🐉' },
      { id: 'soursop', label: 'soursop', emoji: '🍈' },
      { id: 'tamarind', label: 'tamarind', emoji: '🫘' },
      { id: 'mamey', label: 'mamey', emoji: '🥭' },
      { id: 'cherimoya', label: 'cherimoya', emoji: '🍈' },
      { id: 'coconut', label: 'coconut', emoji: '🥥' }
    ]
  },
  {
    id: 'veggies', title: 'veggies', min: 2,
    items: [
      { id: 'tomato', label: 'tomato', emoji: '🍅' },
      { id: 'onion', label: 'onion', emoji: '🧅' },
      { id: 'garlic_veg', label: 'garlic_veg', emoji: '🧄' },
      { id: 'bell_pepper', label: 'bell_pepper', emoji: '🫑' },
      { id: 'chili_pepper', label: 'chili_pepper', emoji: '🌶️' },
      { id: 'carrot', label: 'carrot', emoji: '🥕' },
      { id: 'broccoli', label: 'broccoli', emoji: '🥦' },
      { id: 'cauliflower', label: 'cauliflower', emoji: '🥦' },
      { id: 'cabbage', label: 'cabbage', emoji: '🥬' },
      { id: 'lettuce', label: 'lettuce', emoji: '🥬' },
      { id: 'spinach', label: 'spinach', emoji: '🥬' },
      { id: 'cilantro', label: 'cilantro', emoji: '🌿' },
      { id: 'zucchini', label: 'zucchini', emoji: '🥒' },
      { id: 'pumpkin', label: 'pumpkin', emoji: '🎃' },
      { id: 'cucumber', label: 'cucumber', emoji: '🥒' },
      { id: 'chayote', label: 'chayote', emoji: '🍐' },
      { id: 'cactus', label: 'cactus', emoji: '🌵' },
      { id: 'jicama', label: 'jicama', emoji: '🥔' },
      { id: 'green_beans', label: 'green_beans', emoji: '🫛' },
      { id: 'celery', label: 'celery', emoji: '🥬' },
      { id: 'beet', label: 'beet', emoji: '🍠' },
      { id: 'radish', label: 'radish', emoji: '🧅' },
      { id: 'eggplant', label: 'eggplant', emoji: '🍆' },
      { id: 'mushroom', label: 'mushroom', emoji: '🍄' },
      { id: 'asparagus', label: 'asparagus', emoji: '🥦' },
      { id: 'artichoke', label: 'artichoke', emoji: '🥦' },
      { id: 'leek', label: 'leek', emoji: '🧅' },
      { id: 'scallion', label: 'scallion', emoji: '🧅' },
      { id: 'swiss_chard', label: 'swiss_chard', emoji: '🥬' },
      { id: 'watercress', label: 'watercress', emoji: '🌿' }
    ]
  },
  {
    id: 'condiments', title: 'condiments', min: 1,
    items: [
      { id: 'salt', label: 'salt', emoji: '🧂' },
      { id: 'black_pepper', label: 'black_pepper', emoji: '🌶️' },
      { id: 'cumin', label: 'cumin', emoji: '🌰' },
      { id: 'oregano', label: 'oregano', emoji: '🌿' },
      { id: 'achiote', label: 'achiote', emoji: '🔴' },
      { id: 'cilantro_cond', label: 'cilantro_cond', emoji: '🌿' },
      { id: 'parsley', label: 'parsley', emoji: '🌿' },
      { id: 'garlic_cond', label: 'garlic_cond', emoji: '🧄' },
      { id: 'onion_powder', label: 'onion_powder', emoji: '🧅' },
      { id: 'paprika', label: 'paprika', emoji: '🌶️' },
      { id: 'chili_powder', label: 'chili_powder', emoji: '🌶️' },
      { id: 'hot_sauce', label: 'hot_sauce', emoji: '🔥' },
      { id: 'soy_sauce', label: 'soy_sauce', emoji: '🍶' },
      { id: 'vinegar', label: 'vinegar', emoji: '🍶' },
      { id: 'apple_cider_vinegar', label: 'apple_cider_vinegar', emoji: '🍎' },
      { id: 'lemon_juice', label: 'lemon_juice', emoji: '🍋' },
      { id: 'mustard', label: 'mustard', emoji: '🌶️' },
      { id: 'mayonnaise', label: 'mayonnaise', emoji: '🍳' },
      { id: 'ketchup', label: 'ketchup', emoji: '🍅' },
      { id: 'hogao', label: 'hogao', emoji: '🍅' },
      { id: 'salsa_verde', label: 'salsa_verde', emoji: '🟢' },
      { id: 'salsa_roja', label: 'salsa_roja', emoji: '🔴' },
      { id: 'honey', label: 'honey', emoji: '🍯' },
      { id: 'panela', label: 'panela', emoji: '🟤' },
      { id: 'cinnamon', label: 'cinnamon', emoji: '🌰' },
      { id: 'cloves', label: 'cloves', emoji: '🌰' },
      { id: 'vanilla', label: 'vanilla', emoji: '🍦' },
      { id: 'ginger', label: 'ginger', emoji: '🥔' },
      { id: 'turmeric', label: 'turmeric', emoji: '🫚' },
      { id: 'bouillon', label: 'bouillon', emoji: '🧊' }
    ]
  },
  {
    id: 'dairy', title: 'dairy', min: 0,
    items: [
      { id: 'milk', label: 'milk', emoji: '🥛' },
      { id: 'queso_fresco', label: 'queso_fresco', emoji: '🧀' },
      { id: 'queso_doble_crema', label: 'queso_doble_crema', emoji: '🧀' },
      { id: 'queso_costeno', label: 'queso_costeno', emoji: '🧀' },
      { id: 'queso_panela', label: 'queso_panela', emoji: '🧀' },
      { id: 'queso_rallado', label: 'queso_rallado', emoji: '🧀' },
      { id: 'mozzarella', label: 'mozzarella', emoji: '🧀' },
      { id: 'cheddar', label: 'cheddar', emoji: '🧀' },
      { id: 'cream_cheese', label: 'cream_cheese', emoji: '🧀' },
      { id: 'suero', label: 'suero', emoji: '🥣' },
      { id: 'crema_leche', label: 'crema_leche', emoji: '🥛' },
      { id: 'yogurt', label: 'yogurt', emoji: '🥄' },
      { id: 'greek_yogurt_dairy', label: 'greek_yogurt_dairy', emoji: '🥄' },
      { id: 'kefir', label: 'kefir', emoji: '🥛' },
      { id: 'butter_dairy', label: 'butter_dairy', emoji: '🧈' },
      { id: 'dulce_de_leche', label: 'dulce_de_leche', emoji: '🍯' },
      { id: 'condensed_milk', label: 'condensed_milk', emoji: '🥛' },
      { id: 'evaporated_milk', label: 'evaporated_milk', emoji: '🥛' },
      { id: 'powdered_milk', label: 'powdered_milk', emoji: '🥛' },
      { id: 'ice_cream', label: 'ice_cream', emoji: '🍦' },
      { id: 'lactose_free_milk', label: 'lactose_free_milk', emoji: '🥛' },
      { id: 'skim_milk', label: 'skim_milk', emoji: '🥛' },
      { id: 'almond_milk_dairy', label: 'almond_milk_dairy', emoji: '🥛' },
      { id: 'oat_milk_dairy', label: 'oat_milk_dairy', emoji: '🥛' },
      { id: 'soy_milk_dairy', label: 'soy_milk_dairy', emoji: '🥛' },
      { id: 'coconut_milk_dairy', label: 'coconut_milk_dairy', emoji: '🥥' },
      { id: 'ricotta', label: 'ricotta', emoji: '🧀' },
      { id: 'cottage_cheese_dairy', label: 'cottage_cheese_dairy', emoji: '🧀' },
      { id: 'goat_cheese', label: 'goat_cheese', emoji: '🧀' },
      { id: 'goat_milk', label: 'goat_milk', emoji: '🥛' }
    ]
  },
  {
    id: 'beverages', title: 'beverages', min: 0,
    items: [
      { id: 'water', label: 'water', emoji: '💧' },
      { id: 'sparkling_water', label: 'sparkling_water', emoji: '🫧' },
      { id: 'coffee', label: 'coffee', emoji: '☕' },
      { id: 'cafe_con_leche', label: 'cafe_con_leche', emoji: '☕' },
      { id: 'agua_panela', label: 'agua_panela', emoji: '🍹' },
      { id: 'mate', label: 'mate', emoji: '🧉' },
      { id: 'tea', label: 'tea', emoji: '🍵' },
      { id: 'hot_chocolate', label: 'hot_chocolate', emoji: '☕' },
      { id: 'jugo_naranja', label: 'jugo_naranja', emoji: '🍊' },
      { id: 'jugo_mora', label: 'jugo_mora', emoji: '🧃' },
      { id: 'jugo_lulo', label: 'jugo_lulo', emoji: '🍹' },
      { id: 'jugo_maracuya', label: 'jugo_maracuya', emoji: '🧃' },
      { id: 'jugo_guanabana', label: 'jugo_guanabana', emoji: '🥤' },
      { id: 'lemonade', label: 'lemonade', emoji: '🍋' },
      { id: 'agua_fresca', label: 'agua_fresca', emoji: '🍹' },
      { id: 'chicha', label: 'chicha', emoji: '🥤' },
      { id: 'avena_bebida', label: 'avena_bebida', emoji: '🥤' },
      { id: 'smoothie', label: 'smoothie', emoji: '🥤' },
      { id: 'protein_shake_bev', label: 'protein_shake_bev', emoji: '🧃' },
      { id: 'coconut_water', label: 'coconut_water', emoji: '🥥' },
      { id: 'sports_drink', label: 'sports_drink', emoji: '🧃' },
      { id: 'energy_drink', label: 'energy_drink', emoji: '⚡' },
      { id: 'soda', label: 'soda', emoji: '🥤' },
      { id: 'diet_soda', label: 'diet_soda', emoji: '🥤' },
      { id: 'kombucha', label: 'kombucha', emoji: '🍹' },
      { id: 'beer', label: 'beer', emoji: '🍺' },
      { id: 'wine', label: 'wine', emoji: '🍷' },
      { id: 'aguardiente', label: 'aguardiente', emoji: '🥃' },
      { id: 'bone_broth', label: 'bone_broth', emoji: '🍲' },
      { id: 'aloe_vera', label: 'aloe_vera', emoji: '🧃' }
    ]
  }
];

export default function FoodSelectionModal() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { profile, setProfile } = useAuthStore();
  const [selected, setSelected] = useState<string[]>(profile?.availableFoods || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCats, setExpandedCats] = useState<string[]>([]);

  const toggleCat = (id: string) => {
    setExpandedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const filteredCategories = React.useMemo(() => {
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
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = (categoryItems: {id: string}[]) => {
    const itemIds = categoryItems.map(i => i.id);
    const allSelected = itemIds.every(id => selected.includes(id));
    if (allSelected) {
      setSelected(prev => prev.filter(id => !itemIds.includes(id)));
    } else {
      setSelected(prev => [...new Set([...prev, ...itemIds])]);
    }
  };

  const handleSave = async () => {
    for (const cat of FOOD_CATEGORIES) {
      if (cat.min === 0) continue;
      const selectedInCategory = cat.items.filter(item => selected.includes(item.id));
      if (selectedInCategory.length < cat.min && !searchQuery) {
        setError(t('onboarding.validationFoodMin', { category: t(`onboarding.${cat.title}`), min: cat.min }));
        return;
      }
    }
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('users').update({ available_foods: selected }).eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, availableFoods: selected });
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert(t('common.error'), t('profile.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const totalSelected = selected.length;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      {/* Error Toast */}
      {error && (
        <View style={s.errorContainer}>
          <LinearGradient colors={[colors.error + 'EE', colors.error]} style={s.errorGradient}>
            <AlertCircle size={20} color="#FFF" />
            <Text style={s.errorText}>{error}</Text>
          </LinearGradient>
        </View>
      )}

      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { backgroundColor: colors.surface }]}>
          <ChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>{t('profile.mealPlanFoods')}</Text>
        <View style={[s.countBadge, { backgroundColor: colors.primary }]}>
          <Text style={s.countText}>{totalSelected}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={[colors.primary + '20', colors.primary + '05', 'transparent']} style={s.hero}>
          <View style={[s.heroIconWrap, { backgroundColor: colors.primary + '20' }]}>
            <Utensils size={36} color={colors.primary} />
          </View>
          <Text style={[s.introTitle, { color: colors.textPrimary }]}>{t('onboarding.foodsTitle')}</Text>
          <Text style={[s.introSub, { color: colors.textSecondary }]}>{t('onboarding.foodsSub')}</Text>
        </LinearGradient>

        {/* Search Bar */}
        <View style={[s.searchWrap, { backgroundColor: colors.surface, borderColor: searchQuery ? colors.primary : colors.border }]}>
          <Search size={18} color={searchQuery ? colors.primary : colors.textSecondary} />
          <TextInput
            style={[s.searchInput, { color: colors.textPrimary }]}
            placeholder="Buscar alimento..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={[s.clearBtn, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* No Results */}
        {searchQuery.trim() && filteredCategories.length === 0 && (
          <View style={s.noResultsWrap}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🔍</Text>
            <Text style={[s.noResultsText, { color: colors.textPrimary }]}>{t('common.noResults', 'Sin resultados')}</Text>
            <Text style={[s.noResultsSub, { color: colors.textSecondary }]}>{t('common.tryAnotherTerm', 'Intenta con otro término')}</Text>
          </View>
        )}

        {/* Categories */}
        {filteredCategories.map((cat) => {
          const meta = CAT_META[cat.id] || { gradient: [colors.primary, colors.primary], icon: '🍽️' };
          const isExpanded = expandedCats.includes(cat.id);
          const catSelected = cat.items.filter(i => selected.includes(i.id)).length;

          return (
            <View key={cat.id} style={[s.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Category Header */}
              <TouchableOpacity style={s.catHeader} onPress={() => toggleCat(cat.id)} activeOpacity={0.7}>
                <View style={[s.catIconWrap]}>
                  <LinearGradient colors={meta.gradient as [string, string]} style={s.catIconGrad}>
                    <Text style={{ fontSize: 20 }}>{meta.icon}</Text>
                  </LinearGradient>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[s.catTitle, { color: colors.textPrimary }]}>{t(`onboarding.${cat.title}`)}</Text>
                  <Text style={[s.catSub, { color: colors.textSecondary }]}>
                    {catSelected}/{cat.items.length} seleccionados
                    {cat.min > 0 && ` • min ${cat.min}`}
                  </Text>
                </View>

                {catSelected > 0 && (
                  <View style={[s.catBadge, { backgroundColor: meta.gradient[0] + '30' }]}>
                    <Text style={[s.catBadgeText, { color: meta.gradient[0] }]}>{catSelected}</Text>
                  </View>
                )}

                <View style={[s.chevronWrap, { backgroundColor: colors.surfaceAlt }]}>
                  {isExpanded
                    ? <ChevronUp size={16} color={colors.textSecondary} />
                    : <ChevronDown size={16} color={colors.textSecondary} />
                  }
                </View>
              </TouchableOpacity>

              {/* Progress bar */}
              {cat.min > 0 && (
                <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
                  <LinearGradient
                    colors={meta.gradient as [string, string]}
                    style={[s.progressBar, { width: `${Math.min((catSelected / cat.min) * 100, 100)}%` }]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  />
                </View>
              )}

              {/* Items Grid */}
              {isExpanded && (
                <View style={s.itemsSection}>
                  <TouchableOpacity onPress={() => selectAll(cat.items)} style={s.selectAllBtn}>
                    <Text style={[s.selectAllText, { color: meta.gradient[0] }]}>
                      {cat.items.every(i => selected.includes(i.id)) ? '✓ Todo seleccionado' : 'Seleccionar todo'}
                    </Text>
                  </TouchableOpacity>

                  <View style={s.grid}>
                    {cat.items.map((item) => {
                      const active = selected.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            s.pill,
                            { backgroundColor: colors.background, borderColor: colors.border },
                            active && { borderColor: meta.gradient[0], backgroundColor: meta.gradient[0] + '15' }
                          ]}
                          onPress={() => toggle(item.id)}
                          activeOpacity={0.7}
                        >
                          <View style={[s.pillEmoji, { backgroundColor: active ? meta.gradient[0] + '25' : colors.surfaceAlt }]}>
                            <Text style={{ fontSize: 17 }}>{item.emoji}</Text>
                          </View>
                          <Text style={[s.pillText, { color: active ? colors.textPrimary : colors.textSecondary }, active && { fontWeight: '700' }]}>
                            {t(`onboarding.foodItems.${item.label}`) || item.label}
                          </Text>
                          {active && (
                            <View style={[s.checkDot, { backgroundColor: meta.gradient[0] }]}>
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
      </ScrollView>

      {/* Footer Save Button */}
      <View style={[s.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <LinearGradient colors={['#7C5CFC', '#4338CA']} style={s.saveGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.saveText}>{t('common.save')}</Text>
                <Sparkles size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },
  countBadge: {
    minWidth: 32, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8,
  },
  countText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  content: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },

  hero: {
    alignItems: 'center', paddingVertical: 28, borderRadius: 20,
    marginVertical: 16, paddingHorizontal: 20,
  },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  introTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 6, letterSpacing: -0.5 },
  introSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, opacity: 0.8 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 0,
    marginBottom: 20, gap: 10,
  },
  searchInput: { flex: 1, height: 50, fontSize: 16 },
  clearBtn: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },

  noResultsWrap: { alignItems: 'center', paddingVertical: 48 },
  noResultsText: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  noResultsSub: { fontSize: 14 },

  categoryCard: {
    borderRadius: 20, borderWidth: 1,
    marginBottom: 16, overflow: 'hidden',
  },
  catHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16,
  },
  catIconWrap: { borderRadius: 14, overflow: 'hidden' },
  catIconGrad: {
    width: 48, height: 48,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 14,
  },
  catTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  catSub: { fontSize: 12, fontWeight: '500', opacity: 0.7 },
  catBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginRight: 10,
  },
  catBadgeText: { fontSize: 13, fontWeight: '800' },
  chevronWrap: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },

  progressTrack: {
    height: 3, marginHorizontal: 16, borderRadius: 2, marginBottom: 2,
  },
  progressBar: { height: 3, borderRadius: 2, minWidth: 4 },

  itemsSection: { paddingHorizontal: 14, paddingBottom: 16, paddingTop: 8 },
  selectAllBtn: { alignSelf: 'flex-end', marginBottom: 12, paddingVertical: 4 },
  selectAllText: { fontSize: 13, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, borderWidth: 1.5,
    paddingRight: 12, paddingLeft: 4, paddingVertical: 4,
    overflow: 'hidden',
  },
  pillEmoji: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', marginRight: 6,
  },
  pillText: { fontSize: 14, fontWeight: '600', marginRight: 4 },
  checkDot: {
    width: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginLeft: 2,
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1,
  },
  saveBtn: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  saveGrad: { paddingVertical: 17, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },

  errorContainer: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 1000 },
  errorGradient: {
    padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
  },
  errorText: { color: '#FFF', fontSize: 14, fontWeight: '700', flex: 1 },
});
