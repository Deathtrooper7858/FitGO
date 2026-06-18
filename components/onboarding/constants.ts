import { StyleSheet } from 'react-native';

export const STEPS = [
  'goal', 'stats', 'activity', 'lifestyle',
  'dietaryRestrictions', 'medicalConditions', 'medications',
  'dietType', 'diet', 'personalization', 'terms', 'projection'
] as const;

export type Step = typeof STEPS[number];

export interface OnboardingData {
  goal:         'lose' | 'maintain' | 'gain';
  sex:          'male' | 'female' | 'other';
  customGender?: string;
  age:          number;
  weight:       number;
  height:       number;
  activityLevel:'sedentary'|'light'|'moderate'|'active'|'very_active';
  lifestyle:     'seated'|'standing_sometimes'|'standing_mostly'|'moving'|'physical_work';
  dietaryRestrictions: string[];
  medicalConditions: string[];
  medicationsSupplements: string[];
  dietType:     'recommended' | 'high_protein' | 'low_carb' | 'keto' | 'low_fat';
  targetWeight: number;
  velocity:     'slow' | 'moderate' | 'fast';
  availableFoods: string[];
  weightUnit:   'kg' | 'lbs';
  heightUnit:   'cm' | 'ft';
  termsAccepted?: boolean;
}

export interface StepProps {
  value: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
  colors?: any;
  t?: any;
  profile?: any;
}

export const FOOD_CATEGORIES = [
  {
    id: 'proteins',
    title: 'proteins',
    min: 3,
    items: [
      { id: 'chicken', label: 'chicken', emoji: '🍗' },
      { id: 'beef', label: 'beef', emoji: '🥩' },
      { id: 'fish', label: 'fish', emoji: '🐟' },
      { id: 'salmon', label: 'salmon', emoji: '🍣' },
      { id: 'tuna', label: 'tuna', emoji: '🐟' },
      { id: 'turkey', label: 'turkey', emoji: '🦃' },
      { id: 'pork', label: 'pork', emoji: '🥩' },
      { id: 'eggs', label: 'eggs', emoji: '🥚' },
      { id: 'tofu', label: 'tofu', emoji: '🧊' },
      { id: 'greek_yogurt', label: 'greek_yogurt', emoji: '🍦' },
      { id: 'cottage_cheese', label: 'cottage_cheese', emoji: '🧀' },
      { id: 'protein_powder', label: 'protein_powder', emoji: '🥛' },
      { id: 'shrimp', label: 'shrimp', emoji: '🦐' },
      { id: 'seitan', label: 'seitan', emoji: '🌾' },
      { id: 'tempeh', label: 'tempeh', emoji: '🧊' },
      { id: 'lamb', label: 'lamb', emoji: '🍖' },
    ]
  },
  {
    id: 'carbs',
    title: 'carbs',
    min: 3,
    items: [
      { id: 'rice', label: 'rice', emoji: '🍚' },
      { id: 'potato', label: 'potato', emoji: '🥔' },
      { id: 'sweet_potato', label: 'sweet_potato', emoji: '🍠' },
      { id: 'pasta', label: 'pasta', emoji: '🍝' },
      { id: 'oats', label: 'oats', emoji: '🥣' },
      { id: 'quinoa', label: 'quinoa', emoji: '🥗' },
      { id: 'couscous', label: 'couscous', emoji: '🍚' },
      { id: 'bulgur', label: 'bulgur', emoji: '🥣' },
      { id: 'beans', label: 'beans', emoji: '🫘' },
      { id: 'lentils', label: 'lentils', emoji: '🥘' },
      { id: 'bread', label: 'bread', emoji: '🍞' },
      { id: 'rice_cakes', label: 'rice_cakes', emoji: '🍘' },
      { id: 'corn', label: 'corn', emoji: '🌽' },
      { id: 'tortilla', label: 'tortilla', emoji: '🫓' },
      { id: 'plantain', label: 'plantain', emoji: '🍌' },
    ]
  },
  {
    id: 'fats',
    title: 'fats',
    min: 1,
    items: [
      { id: 'avocado', label: 'avocado', emoji: '🥑' },
      { id: 'nuts', label: 'nuts', emoji: '🥜' },
      { id: 'almonds', label: 'almonds', emoji: '🫘' },
      { id: 'walnuts', label: 'walnuts', emoji: '🥜' },
      { id: 'peanut_butter', label: 'peanut_butter', emoji: '🍯' },
      { id: 'olive_oil', label: 'olive_oil', emoji: '🫒' },
      { id: 'cheese', label: 'cheese', emoji: '🧀' },
      { id: 'yogurt', label: 'yogurt', emoji: '🍦' },
      { id: 'chia_seeds', label: 'chia_seeds', emoji: '🌱' },
      { id: 'pumpkin_seeds', label: 'pumpkin_seeds', emoji: '🎃' },
      { id: 'sunflower_seeds', label: 'sunflower_seeds', emoji: '🌻' },
      { id: 'coconut_oil', label: 'coconut_oil', emoji: '🥥' },
      { id: 'ghee', label: 'ghee', emoji: '🧈' },
    ]
  },
  {
    id: 'fruits',
    title: 'fruits',
    min: 2,
    items: [
      { id: 'banana', label: 'banana', emoji: '🍌' },
      { id: 'apple', label: 'apple', emoji: '🍎' },
      { id: 'berries', label: 'berries', emoji: '🍓' },
      { id: 'grapes', label: 'grapes', emoji: '🍇' },
      { id: 'watermelon', label: 'watermelon', emoji: '🍉' },
      { id: 'orange', label: 'orange', emoji: '🍊' },
      { id: 'mango', label: 'mango', emoji: '🥭' },
      { id: 'pineapple', label: 'pineapple', emoji: '🍍' },
      { id: 'peach', label: 'peach', emoji: '🍑' },
      { id: 'pear', label: 'pear', emoji: '🍐' },
      { id: 'kiwi', label: 'kiwi', emoji: '🥝' },
      { id: 'cherry', label: 'cherry', emoji: '🍒' },
    ]
  },
  {
    id: 'veggies',
    title: 'veggies',
    min: 2,
    items: [
      { id: 'broccoli', label: 'broccoli', emoji: '🥦' },
      { id: 'spinach', label: 'spinach', emoji: '🥬' },
      { id: 'kale', label: 'kale', emoji: '🥬' },
      { id: 'carrot', label: 'carrot', emoji: '🥕' },
      { id: 'tomato', label: 'tomato', emoji: '🍅' },
      { id: 'onion', label: 'onion', emoji: '🧅' },
      { id: 'lettuce', label: 'lettuce', emoji: '🥬' },
      { id: 'cucumber', label: 'cucumber', emoji: '🥒' },
      { id: 'bell_pepper', label: 'bell_pepper', emoji: '🫑' },
      { id: 'zucchini', label: 'zucchini', emoji: '🥒' },
      { id: 'asparagus', label: 'asparagus', emoji: '🥬' },
      { id: 'cauliflower', label: 'cauliflower', emoji: '🥦' },
      { id: 'mushroom', label: 'mushroom', emoji: '🍄' },
      { id: 'eggplant', label: 'eggplant', emoji: '🍆' },
    ]
  },
  {
    id: 'condiments',
    title: 'condiments',
    min: 1,
    items: [
      { id: 'salt', label: 'salt', emoji: '🧂' },
      { id: 'pepper', label: 'pepper', emoji: '🌶️' },
      { id: 'soy_sauce', label: 'soy_sauce', emoji: '🍶' },
      { id: 'hot_sauce', label: 'hot_sauce', emoji: '🥫' },
      { id: 'sriracha', label: 'sriracha', emoji: '🔥' },
      { id: 'garlic', label: 'garlic', emoji: '🧄' },
      { id: 'mustard', label: 'mustard', emoji: '🍯' },
      { id: 'lemon_juice', label: 'lemon_juice', emoji: '🍋' },
      { id: 'balsamic', label: 'balsamic', emoji: '🍶' },
      { id: 'cinnamon', label: 'cinnamon', emoji: '🪵' },
      { id: 'turmeric', label: 'turmeric', emoji: '🟡' },
      { id: 'ginger', label: 'ginger', emoji: '🫚' },
      { id: 'mayonnaise', label: 'mayonnaise', emoji: '🍯' },
      { id: 'ketchup', label: 'ketchup', emoji: '🥫' },
    ]
  }
];

export const CAT_META_OB: Record<string, { gradient: [string, string]; icon: string }> = {
  proteins:   { gradient: ['#FF6B6B', '#EE5A24'], icon: '🍗' },
  carbs:      { gradient: ['#F9CA24', '#F0932B'], icon: '🍚' },
  fats:       { gradient: ['#6AB04C', '#BADC58'], icon: '🥑' },
  fruits:     { gradient: ['#EB4D8B', '#FD79A8'], icon: '🍓' },
  veggies:    { gradient: ['#00B894', '#00CEC9'], icon: '🥦' },
  condiments: { gradient: ['#FDCB6E', '#E17055'], icon: '🧂' },
  dairy:      { gradient: ['#74B9FF', '#0984E3'], icon: '🥛' },
  beverages:  { gradient: ['#A29BFE', '#6C5CE7'], icon: '☕' },
};

export const step = StyleSheet.create({
  container:        { flex: 1 },
  headerSection:    { alignItems: 'center', marginBottom: 20 },
  targetCircle:     {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10
  },
  title:            { fontSize: 22, fontWeight: '900', marginBottom: 6, textAlign: 'center' },
  sub:              { fontSize: 13, marginBottom: 24, textAlign: 'center', opacity: 0.7, paddingHorizontal: 30 },
  optionList:       { gap: 10 },
  optionCard:       {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 24,
    borderWidth: 2,
  },
  iconContainer:    {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  optionTitle:      { fontSize: 17, fontWeight: '900', marginBottom: 4, flexShrink: 1 },
  optionSub:        { fontSize: 13, opacity: 0.7, lineHeight: 18, flexShrink: 1 },
  radioOuter:       {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4
  },
  radioInner:       {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  statsGrid:        { gap: 24, paddingBottom: 16 },
  field:            { marginBottom: 8 },
  fieldLabel:       { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase', opacity: 0.6 },
  sexRow:           { flexDirection: 'row', gap: 12 },
  sexBtn:           {
    flex: 1,
    borderRadius: 24,
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden'
  },
  sexIconWrap:      {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sexLabel:         { fontSize: 17, fontWeight: '700' },
  numRow:           { flexDirection: 'row', alignItems: 'center', gap: 16 },
  numBtn:           {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  numDisplay:       {
    flex: 1,
    borderRadius: 24,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    height: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  numValue:         { fontSize: 28, fontWeight: '900' },
  numUnit:          { fontSize: 14, fontWeight: '700', opacity: 0.5, marginTop: 6 },
  miniNumRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniNumBtn:       { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  numValueSmall:    { fontSize: 16, fontWeight: '700', minWidth: 60, textAlign: 'center' },
  categoryTitle:    { fontSize: 20, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  categorySub:      { fontSize: 13, opacity: 0.6, fontWeight: '600' },
  dietGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  dietPill:         {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden'
  },
  dietPillActive:   { backgroundColor: '#7C5CFC22' },
  dietPillText:     { fontSize: 14, fontWeight: '600' },
  dietPillTextActive:{ fontWeight: '800' },
  heroGrad:         { alignItems: 'center', paddingVertical: 24, borderRadius: 20, marginBottom: 16, paddingHorizontal: 20 },
  heroIcon:         { width: 68, height: 68, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  selectedBadge:    { marginTop: 12, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  selectedBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  searchWrap:       {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, marginBottom: 16, gap: 10
  },
  searchInput:      { flex: 1, height: 48, fontSize: 16 },
  clearBtn:         { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  categoryCard:     { borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  catHeader:        { flexDirection: 'row', alignItems: 'center', padding: 14 },
  catIconWrap:      { borderRadius: 14, overflow: 'hidden' },
  catIconGrad:      { width: 46, height: 46, justifyContent: 'center', alignItems: 'center', borderRadius: 14 },
  catTitle:         { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  catSub:           { fontSize: 12, fontWeight: '500', opacity: 0.7 },
  catBadge:         { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 18, marginRight: 8 },
  catBadgeText:     { fontSize: 12, fontWeight: '800' },
  chevronWrap:      { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  progressTrack:    { height: 3, marginHorizontal: 14, borderRadius: 2, marginBottom: 2 },
  progressBar:      { height: 3, borderRadius: 2, minWidth: 4 },
  itemsSection:     { paddingHorizontal: 12, paddingBottom: 14, paddingTop: 6 },
  selectAllBtn:     { alignSelf: 'flex-end', marginBottom: 10, paddingVertical: 3 },
  selectAllText:    { fontSize: 12, fontWeight: '700' },
  pillEmoji:        { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  checkDot:         { width: 15, height: 15, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginLeft: 3 },
});
