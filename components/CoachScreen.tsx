import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { requestCameraPermissionsAsync, requestMediaLibraryPermissionsAsync, launchCameraAsync, launchImageLibraryAsync } from 'expo-image-picker';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import {
  Sparkles, Send, Camera, Mic, Clock,
  MessageSquarePlus, Edit2, ChevronRight, ChevronDown, ChevronUp,
  Target, Flame, Droplets, Utensils, Zap, Dumbbell,
  CheckCheck, Heart, Activity, Sun, Moon, Coffee, Info,
  Calendar, Sliders, TrendingUp, BarChart2
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useKeyboardNavBar } from '../hooks/useKeyboardNavBar';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { useAICredits } from '../hooks/useAICredits';
import {
  useAuthStore, useCoachStore, CoachMessage, useSettingsStore,
  usePurchaseStore, usePlannerStore, useWorkoutHistoryStore,
  useLeagueStore, useNutritionStore, useBodyStore, useToastStore,
  selectDailyTotals
} from '../store';
import { getLocalDateString } from '../utils/date';
import { sendCoachMessage, buildCoachSystemPrompt, transcribeAudio } from '../services/groq';
import { supabase } from '../services/supabase';
import { Spacing, Radius } from '../constants';
import { useTheme } from '../hooks/useTheme';
import { COACH_CONFIG, CoachType } from '../constants/coachConfig';
import CoachHistoryModal from './CoachHistoryModal';
import { ImageViewerModal } from './ImageViewerModal';
import { ImagePickerModal } from './ImagePickerModal';

const darkenHex = (hex: string, amount = 0.22): string => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

// ─── RICH CONTENT PARSER & RENDERER ──────────────────────────────────────────

// ─── RICH CONTENT PARSER & RENDERER ──────────────────────────────────────────

interface ParsedTargetPill {
  icon: 'utensils' | 'trending' | 'flame' | 'sparkles';
  value: string;
  label?: string;
}

interface ParsedTargetCard {
  title: string;
  mainMetric: string;
  subMetric?: string;
  pills: ParsedTargetPill[];
}

interface ParsedMealItem {
  iconType: 'sun' | 'moon' | 'utensils' | 'snack' | 'workout';
  name: string;
  details: string;
  badge?: string;
}

interface ParsedMessageData {
  greetingLines: string[];
  targetCard?: ParsedTargetCard;
  planTitle?: string;
  planItems: ParsedMealItem[];
  otherLines: string[];
  actionChips: string[];
}

function parseAssistantMessage(content: string): ParsedMessageData {
  const lines = content.split('\n');
  const greetingLines: string[] = [];
  let targetCard: ParsedTargetCard | undefined;
  let planTitle: string | undefined;
  const planItems: ParsedMealItem[] = [];
  const otherLines: string[] = [];
  const actionChips: string[] = [];

  let inTargetSection = false;
  let inPlanSection = false;
  let inActionSection = false;
  let currentSubMeal: ParsedMealItem | null = null;

  const flushSubMeal = () => {
    if (currentSubMeal) {
      if (currentSubMeal.details) {
        planItems.push(currentSubMeal);
      }
      currentSubMeal = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (line === '---') {
      flushSubMeal();
      inTargetSection = false;
      inPlanSection = false;
      continue;
    }

    // Hide disclaimer lines from bubble body (bottom row already covers it)
    const isDisclaimer = (
      line.toLowerCase().includes('esta información no') ||
      line.toLowerCase().includes('consulta a tu médico') ||
      line.toLowerCase().includes('no reemplaza la consulta') ||
      line.toLowerCase().includes('no soy médico') ||
      line.toLowerCase().includes('profesional certificado') ||
      line.toLowerCase().includes('disclaimer') ||
      line.toLowerCase().includes('not a certified professional') ||
      line.toLowerCase().includes('consult a real professional') ||
      line.toLowerCase().includes('consejo de ia') ||
      line.toLowerCase().includes('ia coach') ||
      line.toLowerCase().includes('ai coach')
    );
    if (isDisclaimer) continue;

    // Skip markdown table separators like |---|---|
    if (/^\|[-:\s|]+\|$/.test(line)) {
      continue;
    }

    // 1. Target section header
    if (line.includes('🎯') || /^(#+\s*)?(tu\s+objetivo|your\s+(daily\s+)?target|daily\s+target|objetivo\s+diario|votre\s+objectif|seu\s+objetivo|il\s+tuo\s+obiettivo|dein\s+tagesziel|цель)/i.test(line)) {
      flushSubMeal();
      inTargetSection = true;
      inPlanSection = false;
      inActionSection = false;
      targetCard = {
        title: line.replace(/^[#\s*]+/, '').replace(/[:*]+$/, '').trim(),
        mainMetric: '',
        subMetric: '',
        pills: [],
      };
      continue;
    }

    // 2. Action chips header
    if (/^(#+\s*)?(¿?qué\s+quieres\s+hacer|what\s+would\s+you\s+like\s+to\s+do|que\s+souhaitez-vous\s+faire|o\s+que\s+você\s+quer\s+fazer|cosa\s+vuoi\s+fare|was\s+möchtest\s+du\s+tun|что\s+вы\s+хотите\s+сделать|acciones\s+sugeridas|suggested\s+actions)/i.test(line)) {
      flushSubMeal();
      inActionSection = true;
      inTargetSection = false;
      inPlanSection = false;
      continue;
    }

    // 3. Plan section header
    const cleanHeader = line.replace(/^[#\s*]+/, '').trim();
    const isPlanHeader = (
      /^(#+\s*)?(plan\s+de\s+(comidas|entrenamiento|alimentación|hábitos)|suggested\s+(meal|workout|plan|eating|high-protein)|plan\s+sugerido|repas\s+suggéré|scheda\s+consigliata|trainingsplan|план\s+(питания|тренировок))/i.test(line) ||
      /^(#+\s*)?(🍽️|🥗|🍳|🏋️|💪|🥣|📋)\s*(plan|sample|suggested|ejemplo|menú|menu|rutina|comidas|meals|workout|dieta|diet)/i.test(line) ||
      /(plan\s+de\s+(comidas|entrenamiento|alimentación|nutrición|hábitos)|sample\s+.*plan|suggested\s+.*plan|meal\s+plan|workout\s+plan)/i.test(cleanHeader)
    );

    if (isPlanHeader && !inPlanSection) {
      flushSubMeal();
      inPlanSection = true;
      inTargetSection = false;
      inActionSection = false;
      planTitle = cleanHeader;
      continue;
    }

    // 4. Bracket actions: [Crear comidas] [Ver fuentes]
    const bracketMatches = line.match(/\[([^\]]+)\]/g);
    if (bracketMatches && bracketMatches.length > 0 && (inActionSection || line.startsWith('['))) {
      bracketMatches.forEach(m => {
        const clean = m.replace(/^\[|\]$/g, '').trim();
        if (clean && !actionChips.includes(clean)) {
          actionChips.push(clean);
        }
      });
      continue;
    }

    // Inside Target Section
    if (inTargetSection && targetCard) {
      if (/^#+/.test(line)) {
        inTargetSection = false;
      } else {
        const protMatch = line.match(/(?:protein|prote[ií]na):\s*([0-9,.]+)\s*g/i) || line.match(/\*\*([0-9,.]+)\s*g\*\*\s*(?:de\s+)?(prote[ií]na|protein)?/i);
        if (protMatch) {
          targetCard.mainMetric = `${protMatch[1]} g`;
          targetCard.subMetric = 'de proteína';
          continue;
        }

        const calMatch = line.match(/(?:calories|calorías):\s*([0-9,.\s]+)\s*(?:kcal)?/i) ||
                         line.match(/🔥\s*~?([0-9,.\s]+)\s*(?:kcal)?/i) ||
                         line.match(/^[•\-*]?\s*🔥?\s*~?([0-9,.\s]+)\s*kcal/i);
        if (calMatch) {
          targetCard.pills.push({ icon: 'flame', value: `${calMatch[1].trim()} kcal`, label: 'calorías diarias' });
          continue;
        }

        const carbMatch = line.match(/(?:carbs|carbohidratos):\s*([0-9,.]+)\s*g/i) ||
                          line.match(/🍞\s*~?([0-9,.]+)\s*g/i) ||
                          line.match(/^[•\-*]?\s*🍞?\s*~?([0-9,.]+)\s*g\s*(?:de\s+)?carbohidratos/i);
        if (carbMatch) {
          targetCard.pills.push({ icon: 'trending', value: `${carbMatch[1]} g`, label: 'carbohidratos' });
          continue;
        }

        const fatMatch = line.match(/(?:fat|grasas):\s*([0-9,.]+)\s*g/i) ||
                         line.match(/🥑\s*~?([0-9,.]+)\s*g/i) ||
                         line.match(/^[•\-*]?\s*🥑?\s*~?([0-9,.]+)\s*g\s*(?:de\s+)?grasas/i);
        if (fatMatch) {
          targetCard.pills.push({ icon: 'utensils', value: `${fatMatch[1]} g`, label: 'grasas' });
          continue;
        }

        const pillBullet = line.match(/^[•\-*]?\s*(🍴|📈|🔥|✨|⚡|🍞|🥑)?\s*([0-9–,\.\s]+g?|[0-9–,\.\s]+)\s*(.*)/i);
        if (pillBullet && (pillBullet[1] || pillBullet[3])) {
          const iconType = (pillBullet[1] === '🍴' || pillBullet[1] === '🥑') ? 'utensils' : (pillBullet[1] === '📈' || pillBullet[1] === '🍞') ? 'trending' : pillBullet[1] === '🔥' ? 'flame' : 'sparkles';
          targetCard.pills.push({
            icon: iconType,
            value: pillBullet[2].trim(),
            label: pillBullet[3].trim(),
          });
          continue;
        }

        if (!targetCard.mainMetric) {
          targetCard.mainMetric = line.replace(/\*\*/g, '').trim();
          continue;
        }
      }
    }

    // Inside Plan Section
    if (inPlanSection) {
      // Check for meal subheadings like: #### Breakfast (≈ 45 g P) or ### Desayuno
      const subMealMatch = /^(?:#+\s*)?(☀️|🍽️|🌙|☕|🥑|🏋️|🔥|🧘|💊|🥗|🥤|🍎|🥪|🍳|🥩|🍗|🐟|🥣|🍌|🍇|🥛|🧀)?\s*([A-Za-z\s-]*\b(?:Breakfast|Desayuno|Lunch|Comida|Almuerzo|Dinner|Cena|Snack|Merienda|Colación|Workout|Entrenamiento|Rutina|Pre-workout|Post-workout)\b)(.*)/i.exec(line);
      if (subMealMatch && (/^#+/.test(line) || subMealMatch[1])) {
        flushSubMeal();
        const emoji = subMealMatch[1] || '';
        const mealName = subMealMatch[2].trim();
        const extra = (subMealMatch[3] || '').trim();
        let badge: string | undefined;
        const bMatch = extra.match(/\(([^)]+)\)/);
        if (bMatch) badge = bMatch[1].trim();

        let iconType: ParsedMealItem['iconType'] = 'utensils';
        const nameLower = mealName.toLowerCase();
        if (emoji === '☀️' || nameLower.includes('desayuno') || nameLower.includes('breakfast')) iconType = 'sun';
        else if (emoji === '🌙' || nameLower.includes('cena') || nameLower.includes('dinner')) iconType = 'moon';
        else if (emoji === '☕' || emoji === '🥑' || emoji === '🥤' || emoji === '🍎' || nameLower.includes('snack') || nameLower.includes('merienda') || nameLower.includes('colación')) iconType = 'snack';
        else if (emoji === '🏋️' || emoji === '🔥' || emoji === '🧘' || nameLower.includes('workout')) iconType = 'workout';

        currentSubMeal = {
          name: mealName,
          iconType,
          badge,
          details: '',
        };
        continue;
      }

      if (/^#+/.test(line)) {
        flushSubMeal();
        inPlanSection = false;
      } else {
        // Table row support: | Grilled chicken breast | 200 g | 62 g P |
        if (line.startsWith('|') && line.endsWith('|')) {
          const parts = line.split('|').map(s => s.trim()).filter(Boolean);
          const isHeader = parts.some(p => /^(component|qty|macros|item|alimento|cantidad|porción)/i.test(p));
          if (isHeader) continue;

          if (parts.length >= 2) {
            const foodName = parts[0];
            const qtyOrDetail = parts[1];
            const macroInfo = parts.length > 2 ? parts[2] : '';

            if (currentSubMeal) {
              const itemText = qtyOrDetail ? `${foodName} (${qtyOrDetail})` : foodName;
              currentSubMeal.details = currentSubMeal.details ? `${currentSubMeal.details} • ${itemText}` : itemText;
              if (!currentSubMeal.badge && macroInfo) currentSubMeal.badge = macroInfo;
              continue;
            } else {
              planItems.push({
                iconType: 'utensils',
                name: foodName,
                details: qtyOrDetail,
                badge: macroInfo || undefined,
              });
              continue;
            }
          }
          continue;
        }

        // Bullet format: • ☀️ **Desayuno**: 3 huevos + avena (≈ 35 g proteína)
        // or • 🥗 Mid-morning snack: Greek yogurt...
        const mealBullet = /^[•\-*]?\s*(☀️|🍽️|🌙|☕|🥑|🏋️|🔥|🧘|💊|🥗|🥤|🍎|🥪|🍳|🥩|🍗|🐟|🥣|🍌|🍇|🥛|🧀)?\s*\*\*([^*]+)\*\*:(.*)/i.exec(line) ||
                           /^[•\-*]?\s*(☀️|🍽️|🌙|☕|🥑|🏋️|🔥|🧘|💊|🥗|🥤|🍎|🥪|🍳|🥩|🍗|🐟|🥣|🍌|🍇|🥛|🧀)\s*([^:]+):(.*)/i.exec(line) ||
                           /^[•\-*]?\s*([A-Za-z\s-]*\b(?:Breakfast|Desayuno|Lunch|Comida|Almuerzo|Dinner|Cena|Snack|Merienda|Colación)\b):(.*)/i.exec(line);
        if (mealBullet) {
          flushSubMeal();
          const emoji = mealBullet[1]?.length <= 2 ? mealBullet[1] : '';
          const name = (mealBullet[2] || mealBullet[1]).trim();
          let rest = (mealBullet[3] || mealBullet[2] || '').trim();
          let badge: string | undefined;

          const badgeMatch = rest.match(/\(([^)]+)\)$/) || rest.match(/\[([^\]]+)\]$/);
          if (badgeMatch) {
            badge = badgeMatch[1].trim();
            rest = rest.replace(badgeMatch[0], '').trim();
          }

          let iconType: ParsedMealItem['iconType'] = 'utensils';
          const nameLower = name.toLowerCase();
          if (emoji === '☀️' || nameLower.includes('desayuno') || nameLower.includes('breakfast')) iconType = 'sun';
          else if (emoji === '🌙' || nameLower.includes('cena') || nameLower.includes('dinner')) iconType = 'moon';
          else if (emoji === '☕' || emoji === '🥑' || emoji === '🥤' || emoji === '🍎' || nameLower.includes('snack') || nameLower.includes('merienda') || nameLower.includes('colación')) iconType = 'snack';
          else if (emoji === '🏋️' || emoji === '🔥' || emoji === '🧘' || nameLower.includes('workout')) iconType = 'workout';

          planItems.push({
            iconType,
            name,
            details: rest,
            badge,
          });
          continue;
        }

        // Inside a submeal, a plain bullet can be an ingredient
        if (currentSubMeal && /^[•\-*]/.test(line)) {
          const itemText = line.replace(/^[•\-*]\s*/, '').trim();
          currentSubMeal.details = currentSubMeal.details ? `${currentSubMeal.details} • ${itemText}` : itemText;
          continue;
        }

        // Subtitle line like *(≈ 800 kcal, ...)*
        if (line.startsWith('*(') || line.startsWith('(')) {
          continue;
        }
      }
    }

    // Default lines (greetings or context)
    if (!targetCard && planItems.length === 0 && !currentSubMeal && (
      line.startsWith('¡Hola') || line.startsWith('Hola') || line.startsWith('Hello') ||
      line.toLowerCase().includes('aquí tienes') || line.toLowerCase().includes('aquí está') ||
      greetingLines.length < 2
    )) {
      greetingLines.push(line);
    } else {
      // Don't leak raw table lines into otherLines
      if (!line.startsWith('|')) {
        otherLines.push(line);
      }
    }
  }

  flushSubMeal();

  if (targetCard && !targetCard.mainMetric && targetCard.pills.length > 0) {
    const first = targetCard.pills[0];
    targetCard.mainMetric = first.value;
    targetCard.subMetric = first.label;
    targetCard.pills = targetCard.pills.slice(1);
  }

  return {
    greetingLines,
    targetCard,
    planTitle,
    planItems,
    otherLines,
    actionChips,
  };
}

// ─── COMPONENT: TARGET CARD ──────────────────────────────────────────────────

function TargetCardView({ card, colors }: { card: ParsedTargetCard; colors: any }) {
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={['#2E1065', '#161434']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[msgStyles.targetCard, { borderColor: '#8B5CF645' }]}
    >
      <View style={msgStyles.targetHeaderRow}>
        <View style={msgStyles.targetIconWrap}>
          <Target size={15} color="#C4B5FD" />
        </View>
        <Text style={msgStyles.targetTitle}>{card.title || t('coach.dashboard.metrics.target', 'Tu objetivo diario')}</Text>
      </View>

      <View style={msgStyles.targetBodyRow}>
        {/* Left Side: Big Metric */}
        <View style={msgStyles.targetMainCol}>
          <Text style={msgStyles.targetMainVal}>{card.mainMetric || '204 g'}</Text>
          <Text style={msgStyles.targetSubVal}>{card.subMetric || 'de proteína'}</Text>
        </View>

        {/* Right Side: Stacked Stats */}
        {card.pills.length > 0 && (
          <>
            <View style={msgStyles.targetDivider} />
            <View style={msgStyles.targetPillsCol}>
              {card.pills.map((pill, idx) => (
                <View key={idx} style={msgStyles.targetStatPill}>
                  <View style={msgStyles.pillIconContainer}>
                    {pill.icon === 'utensils' ? (
                      <Utensils size={13} color="#C4B5FD" />
                    ) : pill.icon === 'trending' ? (
                      <TrendingUp size={13} color="#A78BFA" />
                    ) : pill.icon === 'flame' ? (
                      <Flame size={13} color="#F87171" />
                    ) : (
                      <Sparkles size={13} color="#C4B5FD" />
                    )}
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={msgStyles.statPillValue}>{pill.value}</Text>
                    {!!pill.label && <Text style={msgStyles.statPillLabel}>{pill.label}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

// ─── COMPONENT: PLAN ITEM & SECTION ──────────────────────────────────────────

function PlanItemCardView({ item, colors }: { item: ParsedMealItem; colors: any }) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    switch (item.iconType) {
      case 'sun': return <Sun size={17} color="#FBBF24" />;
      case 'moon': return <Moon size={17} color="#818CF8" />;
      case 'snack': return <Coffee size={17} color="#34D399" />;
      case 'workout': return <Dumbbell size={17} color="#EC4899" />;
      default: return <Utensils size={17} color="#A78BFA" />;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => setExpanded(!expanded)}
      style={[msgStyles.planItemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={msgStyles.planItemRow}>
        <View style={[msgStyles.planItemIconCircle, { backgroundColor: colors.background }]}>
          {getIcon()}
        </View>

        <View style={msgStyles.planItemTextCol}>
          <Text style={[msgStyles.planItemName, { color: '#C4B5FD' }]}>{item.name}</Text>
          <Text style={[msgStyles.planItemDetails, { color: colors.textSecondary }]} numberOfLines={expanded ? undefined : 2}>
            {item.details}
          </Text>
        </View>

        <View style={msgStyles.planItemRightCol}>
          {!!item.badge && (
            <View style={[msgStyles.planBadgePill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}>
              <Text style={[msgStyles.planBadgeText, { color: colors.primary }]}>{item.badge}</Text>
            </View>
          )}
          <ChevronRight size={14} color={colors.textMuted} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function PlanSectionView({
  planTitle,
  items,
  colors
}: {
  planTitle?: string;
  items: ParsedMealItem[];
  colors: any;
}) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  if (items.length === 0) return null;

  const visibleItems = showAll ? items : items.slice(0, 3);

  return (
    <View style={{ marginTop: 12 }}>
      {planTitle && (
        <Text style={[msgStyles.sectionHeading, { color: colors.textPrimary }]}>{planTitle}</Text>
      )}
      <View style={{ gap: 6, marginTop: 6 }}>
        {visibleItems.map((item, idx) => (
          <PlanItemCardView key={`plan-item-${idx}`} item={item} colors={colors} />
        ))}
      </View>

      {items.length > 3 && (
        <TouchableOpacity
          style={[msgStyles.seeFullPlanBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowAll(!showAll)}
          activeOpacity={0.7}
        >
          <Text style={[msgStyles.seeFullPlanText, { color: colors.textPrimary }]}>
            {showAll ? t('coach.hidePlan', 'Ocultar detalles') : t('coach.viewFullPlan', 'Ver plan completo')}
          </Text>
          {showAll ? <ChevronUp size={15} color={colors.textSecondary} /> : <ChevronDown size={15} color={colors.textSecondary} />}
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── COMPONENT: ACTION CHIPS ─────────────────────────────────────────────────

function ActionChipsView({ chips, onSelect, colors }: { chips: string[]; onSelect: (prompt: string) => void; colors: any }) {
  const { t } = useTranslation();
  if (chips.length === 0) return null;
  // Strict 2x2 grid: max 4 chips
  const gridChips = chips.slice(0, 4);

  const getChipIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('comida') || lower.includes('receta') || lower.includes('meal') || lower.includes('alimento') || lower.includes('snack')) {
      return <Utensils size={15} color="#A78BFA" />;
    }
    if (lower.includes('proteína') || lower.includes('fuente') || lower.includes('protein') || lower.includes('macro') || lower.includes('analiz')) {
      return <BarChart2 size={15} color="#38BDF8" />;
    }
    if (lower.includes('plan') || lower.includes('día') || lower.includes('rutina') || lower.includes('entren') || lower.includes('schedule')) {
      return <Calendar size={15} color="#818CF8" />;
    }
    if (lower.includes('ajust') || lower.includes('objetivo') || lower.includes('meta') || lower.includes('calor') || lower.includes('peso')) {
      return <Sliders size={15} color="#C084FC" />;
    }
    return <Sparkles size={15} color={colors.primary} />;
  };

  return (
    <View style={msgStyles.actionsContainer}>
      <Text style={[msgStyles.actionsTitle, { color: colors.textSecondary }]}>
        {t('coach.actionChipsTitle', '¿Qué quieres hacer?')}
      </Text>
      <View style={msgStyles.actionChipsGrid2Col}>
        {gridChips.map((chip, idx) => (
          <TouchableOpacity
            key={idx}
            style={[msgStyles.actionCardBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onSelect(chip)}
            activeOpacity={0.7}
          >
            <View style={[msgStyles.actionCardIconWrap, { backgroundColor: colors.background }]}>
              {getChipIcon(chip)}
            </View>
            <Text style={[msgStyles.actionCardText, { color: colors.textPrimary }]} numberOfLines={2}>
              {chip}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── COMPONENT: FORMATTED TEXT LINE ──────────────────────────────────────────

function FormattedTextLine({ line, colors, isUser }: { line: string; colors: any; isUser: boolean }) {
  const textColor = isUser ? '#FFFFFF' : colors.textPrimary;
  const boldColor = isUser ? '#FFFFFF' : colors.primary;

  const isHeading = !isUser && /^#+\s*/.test(line.trim());
  const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ');
  let cleanLine = line.trim();
  let prefix = '';
  if (isHeading) {
    cleanLine = cleanLine.replace(/^#+\s*/, '');
  } else if (isBullet) {
    cleanLine = cleanLine.substring(2);
    prefix = '• ';
  }

  const parts = cleanLine.split(/\*\*/g);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: isHeading ? 6 : 3 }}>
      {prefix ? (
        <Text style={{ color: isUser ? '#FFF' : colors.primary, fontWeight: '900', fontSize: 15, lineHeight: 22, marginRight: 6 }}>
          {prefix}
        </Text>
      ) : null}
      <Text style={{ fontSize: isHeading ? 16 : 14, lineHeight: 22, color: isHeading ? colors.textPrimary : textColor, fontWeight: isHeading ? '700' : '400', flexShrink: 1, letterSpacing: 0.15 }}>
        {parts.map((part, idx) => (
          <Text key={idx} style={{ fontWeight: idx % 2 === 1 || isHeading ? '800' : '400', color: idx % 2 === 1 ? boldColor : textColor }}>
            {part}
          </Text>
        ))}
      </Text>
    </View>
  );
}

// ─── COMPONENT: ASSISTANT BUBBLE BODY ────────────────────────────────────────

const AssistantBubbleBody = React.memo(function AssistantBubbleBody({
  content,
  onActionSelect,
  colors
}: {
  content: string;
  onActionSelect: (prompt: string) => void;
  colors: any;
}) {
  const parsed = useMemo(() => parseAssistantMessage(content), [content]);

  return (
    <View style={{ gap: 8 }}>
      {parsed.greetingLines.map((line, idx) => (
        <FormattedTextLine key={`greet-${idx}`} line={line} colors={colors} isUser={false} />
      ))}

      {parsed.targetCard && (
        <TargetCardView card={parsed.targetCard} colors={colors} />
      )}

      {parsed.planItems.length > 0 && (
        <PlanSectionView
          planTitle={parsed.planTitle}
          items={parsed.planItems}
          colors={colors}
        />
      )}

      {parsed.otherLines.map((line, idx) => (
        <FormattedTextLine key={`other-${idx}`} line={line} colors={colors} isUser={false} />
      ))}

      {parsed.actionChips.length > 0 && (
        <ActionChipsView chips={parsed.actionChips} onSelect={onActionSelect} colors={colors} />
      )}
    </View>
  );
});

// ─── COMPONENT: MESSAGE BUBBLE ───────────────────────────────────────────────

const MessageBubble = React.memo(function MessageBubble({
  msg,
  isLastUser,
  onEdit,
  onImagePress,
  badgeImage,
  onActionSelect
}: {
  msg: CoachMessage;
  isLastUser?: boolean;
  onEdit?: (m: CoachMessage) => void;
  onImagePress?: (url: string) => void;
  badgeImage: any;
  onActionSelect: (prompt: string) => void;
}) {
  const colors = useTheme();
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <View style={[bubble.row, bubble.rowUser]}>
        <LinearGradient
          colors={[colors.primary, darkenHex(colors.primary, 0.28)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[bubble.box, bubble.userBox, { shadowColor: colors.primary }]}
        >
          {msg.imageUrl && (
            <TouchableOpacity onPress={() => onImagePress?.(msg.imageUrl!)} activeOpacity={0.85}>
              <Image cachePolicy="memory-disk" source={{ uri: msg.imageUrl }} style={bubble.image} contentFit="cover" />
            </TouchableOpacity>
          )}
          <Text style={bubble.userText}>{msg.content}</Text>
          <View style={bubble.userFooter}>
            {isLastUser && onEdit && (
              <TouchableOpacity onPress={() => onEdit(msg)} hitSlop={8} style={{ marginRight: 6 }}>
                <Edit2 size={12} color="rgba(255,255,255,0.75)" />
              </TouchableOpacity>
            )}
            <Text style={bubble.userTime}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <CheckCheck size={13} color="rgba(255,255,255,0.85)" style={{ marginLeft: 3 }} />
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={bubble.row}>
      <View style={[bubble.avatarContainer, { borderColor: colors.primary + '40' }]}>
        <Image cachePolicy="memory-disk" source={badgeImage} style={bubble.avatar} contentFit="cover" />
      </View>
      <View style={[bubble.box, bubble.assistantBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {msg.imageUrl && (
          <TouchableOpacity onPress={() => onImagePress?.(msg.imageUrl!)} activeOpacity={0.85}>
            <Image cachePolicy="memory-disk" source={{ uri: msg.imageUrl }} style={bubble.image} contentFit="cover" />
          </TouchableOpacity>
        )}
        <AssistantBubbleBody content={msg.content} onActionSelect={onActionSelect} colors={colors} />
        <View style={bubble.assistantFooter}>
          <Text style={[bubble.assistantTime, { color: colors.textMuted }]}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </View>
  );
});

// ─── COMPONENT: TYPING INDICATOR ─────────────────────────────────────────────

const TypingIndicator = React.memo(function TypingIndicator({ badgeImage }: { badgeImage: any }) {
  const colors = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[bubble.row, { paddingHorizontal: Spacing.base, marginTop: 4 }]}>
      <View style={[bubble.avatarContainer, { borderColor: colors.primary + '40' }]}>
        <Image cachePolicy="memory-disk" source={badgeImage} style={bubble.avatar} contentFit="cover" />
      </View>
      <View style={[bubble.box, bubble.assistantBox, { backgroundColor: colors.surface, borderColor: colors.border, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '500' }}>{t('coach.thinking', 'Pensando respuesta...')}</Text>
      </View>
    </View>
  );
});

// ─── COMPONENT: COACH DASHBOARD (EMPTY STATE) ────────────────────────────────

interface CoachDashboardProps {
  coachType: CoachType;
  config: typeof COACH_CONFIG[CoachType];
  onSelectAction: (prompt: string) => void;
  colors: any;
  userName: string;
}

function CoachDashboardView({ coachType, config, onSelectAction, colors, userName }: CoachDashboardProps) {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  // 2 columns: paddingHorizontal 16 * 2 = 32, gap between cards is 10
  const cardWidth = Math.floor((windowWidth - 32 - 10) / 2);
  const [showAllActions, setShowAllActions] = useState(false);

  // Real store data for "Tu día hasta ahora"
  const today = getLocalDateString(new Date());
  const todayLogs = useNutritionStore(s => s.todayLogs);
  const dailyTotals = useMemo(() => selectDailyTotals({ selectedDate: today, todayLogs }), [today, todayLogs]);
  const dailyWater = useNutritionStore(s => s.dailyWater);
  const dailySleep = useNutritionStore(s => s.dailySleep);
  const dailySteps = useNutritionStore(s => s.dailySteps);
  const activityCals = useNutritionStore(s => s.activityCals);
  const { profile } = useAuthStore();
  const { myStreak } = useLeagueStore();
  const allWorkouts = useWorkoutHistoryStore(s => s.workouts);

  const waterToday = dailyWater[today] || 0;
  const targetCalories = profile?.targetCalories || 2000;
  const targetProtein = profile?.macros?.protein || 120;
  const workoutsTodayCount = useMemo(
    () => allWorkouts.filter(w => (!w.userId || w.userId === profile?.id) && String(w.completedAt || w.date || '').startsWith(today)).length,
    [allWorkouts, profile?.id, today]
  );
  const stepsToday = dailySteps[today] || 0;
  const sleepToday = dailySleep[today] || 7.5;

  const actions = showAllActions ? config.quickActions : config.quickActions.slice(0, 4);

  const renderMetrics = () => {
    if (coachType === 'nutritionist') {
      return (
        <View style={dash.metricsRow} key="metrics-nutritionist">
          <View style={[dash.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} key="m-prot">
            <Target size={16} color="#8B5CF6" />
            <Text style={[dash.metricLabel, { color: colors.textSecondary }]}>{t('coach.dashboard.metrics.protein', 'Proteína')}</Text>
            <Text style={[dash.metricValue, { color: colors.textPrimary }]}>
              <Text style={{ fontWeight: '800' }}>{Math.round(dailyTotals.protein)}</Text> / {targetProtein} g
            </Text>
            <View style={dash.metricBarBg}>
              <View style={[dash.metricBarFill, { width: `${Math.min(100, (dailyTotals.protein / targetProtein) * 100)}%`, backgroundColor: '#8B5CF6' }]} />
            </View>
          </View>

          <View style={[dash.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} key="m-cals">
            <Flame size={16} color="#EF4444" />
            <Text style={[dash.metricLabel, { color: colors.textSecondary }]}>{t('coach.dashboard.metrics.calories', 'Calorías')}</Text>
            <Text style={[dash.metricValue, { color: colors.textPrimary }]}>
              <Text style={{ fontWeight: '800' }}>{Math.round(dailyTotals.calories)}</Text> / {targetCalories}
            </Text>
            <View style={dash.metricBarBg}>
              <View style={[dash.metricBarFill, { width: `${Math.min(100, (dailyTotals.calories / targetCalories) * 100)}%`, backgroundColor: '#EF4444' }]} />
            </View>
          </View>

          <View style={[dash.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} key="m-water">
            <Droplets size={16} color="#06B6D4" />
            <Text style={[dash.metricLabel, { color: colors.textSecondary }]}>{t('coach.dashboard.metrics.water', 'Agua')}</Text>
            <Text style={[dash.metricValue, { color: colors.textPrimary }]}>
              <Text style={{ fontWeight: '800' }}>{(waterToday / 1000).toFixed(1)}</Text> / 2.4 L
            </Text>
            <View style={dash.metricBarBg}>
              <View style={[dash.metricBarFill, { width: `${Math.min(100, (waterToday / 2400) * 100)}%`, backgroundColor: '#06B6D4' }]} />
            </View>
          </View>

          <View style={[dash.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} key="m-meals">
            <Utensils size={16} color="#10B981" />
            <Text style={[dash.metricLabel, { color: colors.textSecondary }]}>{t('coach.dashboard.metrics.meals', 'Comidas')}</Text>
            <Text style={[dash.metricValue, { color: colors.textPrimary }]}>
              <Text style={{ fontWeight: '800' }}>{todayLogs.length}</Text> / 4
            </Text>
            <View style={dash.metricBarBg}>
              <View style={[dash.metricBarFill, { width: `${Math.min(100, (todayLogs.length / 4) * 100)}%`, backgroundColor: '#10B981' }]} />
            </View>
          </View>
        </View>
      );
    }

    if (coachType === 'trainer') {
      return (
        <View style={dash.metricsRow} key="metrics-trainer">
          <View style={[dash.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} key="m-routines">
            <Dumbbell size={16} color="#8B5CF6" />
            <Text style={[dash.metricLabel, { color: colors.textSecondary }]}>{t('coach.dashboard.metrics.routines', 'Rutinas')}</Text>
            <Text style={[dash.metricValue, { color: colors.textPrimary }]}>
              <Text style={{ fontWeight: '800' }}>{workoutsTodayCount}</Text> / 1 {t('coach.dashboard.metrics.today', 'hoy')}
            </Text>
            <View style={dash.metricBarBg}>
              <View style={[dash.metricBarFill, { width: `${workoutsTodayCount > 0 ? 100 : 0}%`, backgroundColor: '#8B5CF6' }]} />
            </View>
          </View>

          <View style={[dash.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} key="m-cals">
            <Flame size={16} color="#EF4444" />
            <Text style={[dash.metricLabel, { color: colors.textSecondary }]}>{t('coach.dashboard.metrics.burned', 'Quemadas')}</Text>
            <Text style={[dash.metricValue, { color: colors.textPrimary }]}>
              <Text style={{ fontWeight: '800' }}>{activityCals}</Text> / 500 kcal
            </Text>
            <View style={dash.metricBarBg}>
              <View style={[dash.metricBarFill, { width: `${Math.min(100, (activityCals / 500) * 100)}%`, backgroundColor: '#EF4444' }]} />
            </View>
          </View>

          <View style={[dash.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} key="m-steps">
            <Zap size={16} color="#F59E0B" />
            <Text style={[dash.metricLabel, { color: colors.textSecondary }]}>{t('coach.dashboard.metrics.steps', 'Pasos')}</Text>
            <Text style={[dash.metricValue, { color: colors.textPrimary }]}>
              <Text style={{ fontWeight: '800' }}>{stepsToday.toLocaleString()}</Text>
            </Text>
            <View style={dash.metricBarBg}>
              <View style={[dash.metricBarFill, { width: `${Math.min(100, (stepsToday / 10000) * 100)}%`, backgroundColor: '#F59E0B' }]} />
            </View>
          </View>

          <View style={[dash.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} key="m-streak">
            <Target size={16} color="#10B981" />
            <Text style={[dash.metricLabel, { color: colors.textSecondary }]}>{t('coach.dashboard.metrics.streak', 'Racha')}</Text>
            <Text style={[dash.metricValue, { color: colors.textPrimary }]}>
              <Text style={{ fontWeight: '800' }}>{myStreak || 0}</Text> {t('coach.dashboard.metrics.days', 'días')} 🔥
            </Text>
            <View style={dash.metricBarBg}>
              <View style={[dash.metricBarFill, { width: `${Math.min(100, ((myStreak || 1) / 7) * 100)}%`, backgroundColor: '#10B981' }]} />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={dash.metricsRow} key="metrics-doctor">
        <View style={[dash.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} key="m-sleep">
          <Clock size={16} color="#6366F1" />
          <Text style={[dash.metricLabel, { color: colors.textSecondary }]}>{t('coach.dashboard.metrics.sleep', 'Sueño')}</Text>
          <Text style={[dash.metricValue, { color: colors.textPrimary }]}>
            <Text style={{ fontWeight: '800' }}>{sleepToday}</Text> / 8.0 h
          </Text>
          <View style={dash.metricBarBg}>
            <View style={[dash.metricBarFill, { width: `${Math.min(100, (sleepToday / 8) * 100)}%`, backgroundColor: '#6366F1' }]} />
          </View>
        </View>

        <View style={[dash.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} key="m-water">
          <Droplets size={16} color="#06B6D4" />
          <Text style={[dash.metricLabel, { color: colors.textSecondary }]}>{t('coach.dashboard.metrics.water', 'Agua')}</Text>
          <Text style={[dash.metricValue, { color: colors.textPrimary }]}>
            <Text style={{ fontWeight: '800' }}>{(waterToday / 1000).toFixed(1)}</Text> / 2.4 L
          </Text>
          <View style={dash.metricBarBg}>
            <View style={[dash.metricBarFill, { width: `${Math.min(100, (waterToday / 2400) * 100)}%`, backgroundColor: '#06B6D4' }]} />
          </View>
        </View>

        <View style={[dash.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} key="m-recovery">
          <Heart size={16} color="#10B981" />
          <Text style={[dash.metricLabel, { color: colors.textSecondary }]}>{t('coach.dashboard.metrics.status', 'Estado')}</Text>
          <Text style={[dash.metricValue, { color: colors.textPrimary }]}>
            <Text style={{ fontWeight: '800' }}>{t('coach.dashboard.metrics.optimal', 'Óptimo')}</Text> ⚡
          </Text>
          <View style={dash.metricBarBg}>
            <View style={[dash.metricBarFill, { width: '85%', backgroundColor: '#10B981' }]} />
          </View>
        </View>

        <View style={[dash.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} key="m-steps">
          <Activity size={16} color="#F59E0B" />
          <Text style={[dash.metricLabel, { color: colors.textSecondary }]}>{t('coach.dashboard.metrics.steps', 'Pasos')}</Text>
          <Text style={[dash.metricValue, { color: colors.textPrimary }]}>
            <Text style={{ fontWeight: '800' }}>{stepsToday.toLocaleString()}</Text>
          </Text>
          <View style={dash.metricBarBg}>
            <View style={[dash.metricBarFill, { width: `${Math.min(100, (stepsToday / 8000) * 100)}%`, backgroundColor: '#F59E0B' }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={dash.content}>
      {/* 1. Hero Welcome Card */}
      <LinearGradient
        colors={[colors.primary + '25', colors.surface, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[dash.heroCard, { borderColor: colors.primary + '35' }]}
      >
        <View style={dash.heroTopRow}>
          <Text style={dash.heroGreeting}>👋 {t('coach.dashboard.hello', '¡Hola')}{userName ? `, ${userName}` : ''}!</Text>
          <Sparkles size={20} color={colors.primary} />
        </View>
        <Text style={[dash.heroBody, { color: colors.textSecondary }]}>
          {t((config as any).heroGreetingKey || '', config.heroGreeting)}
        </Text>
        <Text style={[dash.heroQuestion, { color: colors.textPrimary }]}>
          {t((config as any).heroQuestionKey || '', config.heroQuestion)}
        </Text>
      </LinearGradient>

      {/* 2. Acciones Rápidas */}
      <View style={dash.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Zap size={18} color={colors.primary} />
          <Text style={[dash.sectionTitle, { color: colors.textPrimary }]}>{t('coach.dashboard.quickActionsTitle', 'Acciones rápidas')}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAllActions(!showAllActions)} activeOpacity={0.7} style={dash.seeAllBtn}>
          <Text style={[dash.seeAllText, { color: colors.primary }]}>{showAllActions ? t('coach.dashboard.seeLess', 'Ver menos') : t('coach.dashboard.seeAll', 'Ver todas')}</Text>
          <ChevronRight size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={dash.quickGrid}>
        {actions.map((act) => {
          const IconComp = act.icon;
          const translatedTitle = t((act as any).titleKey || '', act.title);
          const translatedSub = t((act as any).subtitleKey || '', act.subtitle);
          const translatedPrompt = t((act as any).promptKey || '', act.prompt);
          return (
            <TouchableOpacity
              key={act.id}
              style={[dash.quickCard, { width: cardWidth, maxWidth: cardWidth, backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => onSelectAction(translatedPrompt)}
              activeOpacity={0.75}
            >
              <View style={dash.quickCardTop}>
                <View style={[dash.quickIconContainer, { backgroundColor: act.color + '18' }]}>
                  <IconComp size={18} color={act.color} />
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </View>
              <Text style={[dash.quickCardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {translatedTitle}
              </Text>
              <Text style={[dash.quickCardSub, { color: colors.textSecondary }]} numberOfLines={2}>
                {translatedSub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Tu día hasta ahora */}
      <View style={[dash.sectionHeaderRow, { marginTop: 22 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Target size={18} color={colors.primary} />
          <Text style={[dash.sectionTitle, { color: colors.textPrimary }]}>{t('coach.dashboard.yourDaySoFar', 'Tu día hasta ahora')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push(coachType === 'trainer' ? '/(tabs)/planner' : '/(tabs)/tracker')}
          activeOpacity={0.7}
          style={dash.seeAllBtn}
        >
          <Text style={[dash.seeAllText, { color: colors.primary }]}>
            {coachType === 'trainer' ? t('coach.dashboard.viewWorkouts', 'Ver entrenamientos') : coachType === 'doctor' ? t('coach.dashboard.viewHealth', 'Ver salud') : t('coach.dashboard.viewNutrition', 'Ver nutrición completa')}
          </Text>
          <ChevronRight size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {renderMetrics()}
    </View>
  );
}

// ─── MAIN COACH SCREEN COMPONENT ─────────────────────────────────────────────

interface CoachScreenProps {
  coachType: CoachType;
}

export default function CoachScreen({ coachType }: CoachScreenProps) {
  useKeyboardNavBar();
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const config = COACH_CONFIG[coachType];

  const [input, setInput] = useState(config.useParamPrompt ? (params.prompt as string) || '' : '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 500);
  const isRecording = recorderState.isRecording;
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const flatRef = useRef<any>(null);

  const { t } = useTranslation();
  const colors = useTheme();
  const { language } = useSettingsStore();
  const messages = useCoachStore(s => s[config.messagesKey]);
  const sessionId = useCoachStore(s => s[config.sessionIdKey]);
  const isTyping = useCoachStore(s => s.isTyping);
  const addMessage = useCoachStore(s => s.addMessage);
  const setMessages = useCoachStore(s => s.setMessages);
  const setTyping = useCoachStore(s => s.setTyping);
  const incrementCount = useCoachStore(s => s.incrementCount);
  const checkAndResetDaily = useCoachStore(s => s.checkAndResetDaily);
  const setCurrentSessionId = useCoachStore(s => s.setCurrentSessionId);
  const setSessions = useCoachStore(s => s.setSessions);
  const removeLastPair = useCoachStore(s => s.removeLastPair);
  const { profile } = useAuthStore();
  const { isPro } = usePurchaseStore();
  const isProActually = !!isPro || !!profile?.isPro || profile?.role === 'pro_user' || profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'owner';
  const { tryUseAI, creditsLeft, maxCredits } = useAICredits();

  // Active chat check: has user messages or non-welcome messages
  const hasActiveChat = messages.length > 1 || (messages.length === 1 && messages[0].id !== 'welcome');

  useEffect(() => {
    setTyping(false);
    setIsSending(false);
    checkAndResetDaily();
    if (config.useParamPrompt && params.prompt) {
      setInput(params.prompt as string);
    }
  }, [config.useParamPrompt, params.prompt, checkAndResetDaily, setTyping]);

  const loadSessions = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('coach_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .eq('coach_type', coachType)
      .order('created_at', { ascending: false });
    if (data) setSessions(data, coachType);
  }, [profile?.id, coachType, setSessions]);

  useEffect(() => { loadSessions(); }, [profile?.id, loadSessions]);

  useEffect(() => {
    if (!profile?.id) return;
    async function loadHistory() {
      if (isSending) return;
      if (!sessionId) {
        setMessages([{
          id: 'welcome',
          role: 'model',
          content: t(`coach.${coachType}.welcome`, config.heroGreeting),
          timestamp: new Date().toISOString(),
        }], coachType);
        return;
      }
      if (messages.length > 1) return;
      const { data, error } = await supabase
        .from('coach_conversations')
        .select('id, role, content, image_url, created_at')
        .eq('user_id', profile!.id)
        .eq('coach_type', coachType)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (data && !error && data.length > 0) {
        const formatted: CoachMessage[] = data.map((m: any) => ({
          id: String(m.id),
          role: m.role as 'user' | 'model',
          content: m.content ?? '',
          imageUrl: m.image_url,
          timestamp: m.created_at,
        }));
        setMessages(formatted, coachType);
      } else if (messages.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'model',
          content: t(`coach.${coachType}.welcome`, config.heroGreeting),
          timestamp: new Date().toISOString(),
        }], coachType);
      }
    }
    loadHistory();
  }, [profile?.id, language, sessionId, coachType, isSending, messages.length, profile, setMessages, t, config.heroGreeting]);

  const handleNewChat = useCallback(() => {
    setCurrentSessionId(null, coachType);
    setMessages([{
      id: 'welcome',
      role: 'model',
      content: t(`coach.${coachType}.welcome`, config.heroGreeting),
      timestamp: new Date().toISOString(),
    }], coachType);
  }, [coachType, t, setCurrentSessionId, setMessages, config.heroGreeting]);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 120);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isTyping]);

  const handlePickImage = useCallback(() => {
    setImagePickerVisible(true);
  }, []);

  const onLaunchCamera = async () => {
    try {
      const { granted } = await requestCameraPermissionsAsync();
      if (!granted) {
        useToastStore.getState().showToast({ title: t('common.warning', 'Advertencia'), text: t('profile.cameraPermission', 'Se necesitan permisos de cámara.'), type: 'warning' });
        return;
      }
      const result = await launchCameraAsync({ base64: true, quality: 0.2 });
      if (!result.canceled && result.assets?.[0]?.base64) {
        setSelectedImage(result.assets[0].base64!);
      }
    } catch {
      useToastStore.getState().showToast({ title: t('common.error', 'Error'), text: t('profile.cameraFailed', 'Error al abrir la cámara'), type: 'error' });
    }
  };

  const onLaunchGallery = async () => {
    try {
      const { granted } = await requestMediaLibraryPermissionsAsync();
      if (!granted) {
        useToastStore.getState().showToast({ title: t('common.warning', 'Advertencia'), text: t('profile.galleryPermission', 'Se necesitan permisos de galería.'), type: 'warning' });
        return;
      }
      const result = await launchImageLibraryAsync({ base64: true, quality: 0.2, mediaTypes: ['images'] });
      if (!result.canceled && result.assets?.[0]?.base64) {
        setSelectedImage(result.assets[0].base64!);
      }
    } catch {
      useToastStore.getState().showToast({ title: t('common.error', 'Error'), text: t('profile.galleryFailed', 'Error al abrir la galería'), type: 'error' });
    }
  };

  const startRecording = async () => {
    if (!isProActually) {
      router.push('/modals/paywall');
      return;
    }
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (permission.status !== 'granted') {
        useToastStore.getState().showToast({ title: t('common.warning', 'Advertencia'), text: t('tracker.micPermissionSub', 'Permite acceso al micrófono.'), type: 'warning' });
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err: any) {
      console.error(`${config.tag} Failed to start recording:`, err);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) {
        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(uri);
          if (text.trim()) setInput(text);
        } catch {
          useToastStore.getState().showToast({ title: t('common.error', 'Error'), text: t('tracker.voiceFailedSub', 'No pudimos procesar tu voz.'), type: 'error' });
        } finally {
          setIsTranscribing(false);
          await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: false }).catch(() => {});
        }
      }
    } catch (err) {
      console.error(`${config.tag} Failed to stop recording:`, err);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text && !selectedImage) return;
    if (isTyping || isSending) return;
    if (!isProActually && !tryUseAI()) return;
    if (!profile) {
      addMessage({
        id: `err-${Date.now()}`,
        role: 'model',
        content: 'Profile not loaded yet. Please wait a moment and try again.',
        timestamp: new Date().toISOString(),
      }, coachType);
      return;
    }

    const currentImg = selectedImage;
    let activeSessionId = sessionId;

    if (!activeSessionId) {
      const { data: newSession } = await supabase
        .from('coach_sessions')
        .insert({ user_id: profile.id, title: text.slice(0, 32) || 'Chat', coach_type: coachType })
        .select()
        .single();
      if (newSession) {
        activeSessionId = newSession.id;
        loadSessions();
      }
    }

    const userMsg: CoachMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text || '📷 [Foto adjunta]',
      imageUrl: currentImg ? `data:image/jpeg;base64,${currentImg}` : undefined,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg, coachType);
    incrementCount();
    setInput('');
    setSelectedImage(null);
    setIsSending(true);
    setTyping(true);

    await supabase.from('coach_conversations').insert({
      user_id: profile.id,
      role: 'user',
      content: text || '[Foto adjunta]',
      image_url: currentImg ? `data:image/jpeg;base64,${currentImg}` : undefined,
      coach_type: coachType,
      session_id: activeSessionId,
    });

    if (!sessionId && activeSessionId) {
      setCurrentSessionId(activeSessionId, coachType);
    }

    try {
      let raw = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({ role: m.role as 'user' | 'model', parts: [{ text: m.content || ' ' }] }));
      while (raw.length > 0 && raw[0].role !== 'user') raw = raw.slice(1);
      const history: typeof raw = [];
      for (const msg of raw) {
        if (history.length > 0 && history[history.length - 1].role === msg.role) {
          history[history.length - 1] = msg;
        } else {
          history.push(msg);
        }
      }

      const { mealPlans, workoutPlans } = usePlannerStore.getState();
      const workouts = useWorkoutHistoryStore.getState().getWorkoutsForUser(profile.id);
      const { myPoints, myStreak, squad } = useLeagueStore.getState();
      const { todayLogs, dailyWater, dailySleep } = useNutritionStore.getState();
      const { measurements } = useBodyStore.getState();

      const systemPrompt = buildCoachSystemPrompt({
        name: profile.name ?? 'User',
        goal: profile.goal ?? 'maintain',
        tdee: profile.tdee ?? 2000,
        targetCalories: profile.targetCalories ?? 2000,
        macros: profile.macros ?? { protein: 150, carbs: 200, fat: 67 },
        availableFoods: profile.availableFoods,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        sex: profile.sex,
        activityLevel: profile.activityLevel,
        dietaryRestrictions: profile.dietaryRestrictions,
        medicalConditions: profile.medicalConditions,
        medicationsSupplements: profile.medicationsSupplements,
        preferences: profile.preferences,
        mealPlans: isProActually ? mealPlans : undefined,
        workoutPlans: isProActually ? workoutPlans : undefined,
        sleepLogs: dailySleep,
        workoutHistory: workouts,
        isPremium: isProActually,
        leagueStats: { points: myPoints, streak: myStreak, squadName: squad?.name },
        nutritionLogs: todayLogs,
        waterLogs: dailyWater,
        bodyMeasurements: measurements,
      }, language, coachType);

      const reply = await sendCoachMessage(history, text, systemPrompt, currentImg ?? undefined);

      const botMsg: CoachMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      addMessage(botMsg, coachType);

      await supabase.from('coach_conversations').insert({
        user_id: profile.id,
        role: 'model',
        content: reply,
        coach_type: coachType,
        session_id: activeSessionId,
      });
    } catch (err: any) {
      console.error('[Coach] Error:', err?.message ?? err);
      addMessage({
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Lo siento, no pude conectarme en este momento. Por favor intenta de nuevo.`,
        timestamp: new Date().toISOString(),
      }, coachType);
    } finally {
      setTyping(false);
      setIsSending(false);
    }
  }, [input, selectedImage, isTyping, isSending, profile, messages, language, tryUseAI, coachType, addMessage, incrementCount, isProActually, loadSessions, sessionId, setCurrentSessionId, setTyping]);

  const handleEditMessage = useCallback((m: CoachMessage) => {
    setInput(m.content);
    removeLastPair(coachType);
    if (sessionId) {
      supabase.from('coach_conversations').delete().eq('session_id', sessionId).gte('created_at', m.timestamp).then();
    }
  }, [coachType, sessionId, removeLastPair]);

  const renderMessage = useCallback(({ item, index }: { item: CoachMessage; index: number }) => {
    const isLastUser = item.role === 'user' && (index === messages.length - 1 || (index === messages.length - 2 && messages[index + 1]?.role === 'model'));
    return (
      <MessageBubble
        msg={item}
        isLastUser={isLastUser}
        onImagePress={setViewingImage}
        badgeImage={config.badgeImage}
        onEdit={handleEditMessage}
        onActionSelect={handleSend}
      />
    );
  }, [messages, config.badgeImage, setViewingImage, handleEditMessage, handleSend]);

  const canSend = (input.trim().length > 0 || !!selectedImage) && !isTyping && !isSending;
  const userName = profile?.name ? profile.name.split(' ')[0] : '';

  return (
    <View style={[s.safe, { backgroundColor: colors.background }]}>
      {/* ─── HEADER ─── */}
      <View style={[s.headerContainer, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={s.header}>
          {/* Avatar with status */}
          <View style={s.headerAvatarWrap}>
            <View style={[s.headerAvatarBorder, { borderColor: isTyping ? colors.primary : colors.primary + '50' }]}>
              <Image cachePolicy="memory-disk" source={config.badgeImage} style={s.headerAvatar} contentFit="cover" />
              <View style={[s.onlineDot, { backgroundColor: colors.success }]} />
            </View>
          </View>

          {/* Title & Subtitle */}
          <View style={s.headerInfo}>
            <Text style={[s.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {t(config.headerLabel, config.headerLabelDefault)}
            </Text>
            <Text style={[s.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {hasActiveChat ? t('coach.onlineActive', 'En línea · Última actualización ahora') : t((config as any).subtitleKey || '', config.subtitle)}
            </Text>
          </View>

          {/* Right Action Badges */}
          <View style={s.headerRightActions}>
            {hasActiveChat && (
              <TouchableOpacity onPress={handleNewChat} style={[s.headerIconBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]} activeOpacity={0.7}>
                <MessageSquarePlus size={18} color={colors.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setHistoryVisible(true)} style={[s.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.7}>
              <Clock size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {!isProActually ? (
              <View style={[s.consultasPill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
                <Sparkles size={12} color={colors.primary} />
                <Text style={[s.consultasText, { color: colors.primary }]}>
                  {t('coach.consultasCount', '{{count}}/{{total}} consultas', { count: creditsLeft, total: maxCredits })}
                </Text>
              </View>
            ) : (
              <View style={[s.consultasPill, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}>
                <Zap size={12} color={colors.primary} fill={colors.primary} />
                <Text style={[s.consultasText, { color: colors.primary }]}>{t('coach.unlimitedAI', 'IA Ilimitada')}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ─── MAIN CONTENT: DASHBOARD OR CHAT ─── */}
      <KeyboardAvoidingView
        style={{ flex: 1, paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {!hasActiveChat ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <CoachDashboardView
              coachType={coachType}
              config={config}
              onSelectAction={handleSend}
              colors={colors}
              userName={userName}
            />
          </ScrollView>
        ) : (
          <FlashList<CoachMessage>
            ref={flatRef}
            key={`coach-chat-${coachType}`}
            data={messages}
            {...{ estimatedItemSize: 120 } as any}
            style={{ flex: 1 }}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={s.messagesContent}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={isTyping ? <TypingIndicator badgeImage={config.badgeImage} /> : null}
          />
        )}

        {/* ─── BOTTOM INPUT BAR ─── */}
        <View style={[s.inputAreaContainer, { borderTopColor: colors.border, backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 6) }]}>
          {selectedImage && (
            <View style={s.imagePreviewContainer}>
              <View style={[s.imagePreviewWrapper, { borderColor: colors.border }]}>
                <Image cachePolicy="memory-disk" source={{ uri: `data:image/jpeg;base64,${selectedImage}` }} style={s.imagePreview} contentFit="cover" />
                <TouchableOpacity onPress={() => setSelectedImage(null)} style={s.removeImageBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={s.inputRow}>
            <TouchableOpacity onPress={handlePickImage} style={[s.iconActionBtn, { backgroundColor: colors.background, borderColor: colors.border }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
              <Camera size={19} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleRecording}
              style={[s.iconActionBtn, { backgroundColor: colors.background, borderColor: colors.border }, isRecording && { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}
              activeOpacity={0.7}
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Mic size={19} color={isRecording ? '#EF4444' : colors.textSecondary} />
              )}
              {!isProActually && (
                <View style={s.lockBadge}><Text style={{ fontSize: 7 }}>🔒</Text></View>
              )}
            </TouchableOpacity>

            <TextInput
              style={[s.textInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              value={input}
              onChangeText={setInput}
              placeholder={t('coach.inputPlaceholderNew', 'Pregúntame algo...')}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => handleSend()}
            />

            <TouchableOpacity style={[s.sendBtn, !canSend && s.sendBtnDisabled]} onPress={() => handleSend()} disabled={!canSend} activeOpacity={0.8}>
              <LinearGradient colors={[colors.primary, darkenHex(colors.primary, 0.15)]} style={s.sendGradient}>
                <Send size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={s.disclaimerRow}>
            <Info size={11} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[s.disclaimerText, { color: colors.textMuted }]}>
              {t('coach.disclaimer', 'FitGO IA puede cometer errores. Verifica siempre la información de salud importante.')}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CoachHistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} coachType={coachType} />
      <ImagePickerModal visible={imagePickerVisible} onClose={() => setImagePickerVisible(false)} onCamera={onLaunchCamera} onGallery={onLaunchGallery} />
      <ImageViewerModal visible={!!viewingImage} imageUri={viewingImage} onClose={() => setViewingImage(null)} />
    </View>
  );
}

// ─── STYLES: DASHBOARD ───────────────────────────────────────────────────────

const dash = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  heroCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroGreeting: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  heroBody: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  heroQuestion: { fontSize: 15, fontWeight: '800' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 12, fontWeight: '700' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: 13,
    minHeight: 110,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  quickCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  quickIconContainer: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  quickCardTitle: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  quickCardSub: { fontSize: 11, lineHeight: 15 },
  metricsRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  metricCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1.2,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: { fontSize: 11, fontWeight: '600' },
  metricValue: { fontSize: 11 },
  metricBarBg: { width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 2, overflow: 'hidden' },
  metricBarFill: { height: '100%', borderRadius: 2 },
});

// ─── STYLES: MESSAGE PARSED CARDS ────────────────────────────────────────────

const msgStyles = StyleSheet.create({
  targetCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  targetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  targetIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EDE9FE',
  },
  targetBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetMainCol: {
    flex: 1,
    paddingRight: 6,
  },
  targetMainVal: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  targetSubVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DDD6FE',
    marginTop: 2,
  },
  targetDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(167, 139, 250, 0.25)',
    marginHorizontal: 10,
  },
  targetPillsCol: {
    flex: 1.3,
    gap: 7,
  },
  targetStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  pillIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statPillValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#C4B5FD',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  planItemCard: {
    borderRadius: Radius.md,
    borderWidth: 1.2,
    padding: 12,
    marginVertical: 4,
  },
  planItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planItemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  planItemTextCol: {
    flex: 1,
    paddingRight: 4,
  },
  planItemName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  planItemDetails: {
    fontSize: 11,
    lineHeight: 16,
  },
  planItemRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planBadgePill: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  seeFullPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    borderWidth: 1.2,
    paddingVertical: 10,
    marginTop: 6,
  },
  seeFullPlanText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionsContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  actionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  actionChipsGrid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  actionCardBtn: {
    width: '48%',
    maxWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.md,
    borderWidth: 1.2,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  actionCardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
});

// ─── STYLES: CHAT BUBBLES ────────────────────────────────────────────────────

const bubble = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginVertical: 6, paddingHorizontal: 16 },
  rowUser: { flexDirection: 'row-reverse' },
  avatarContainer: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, padding: 1, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 2 },
  avatar: { width: '100%', height: '100%', borderRadius: 18 },
  box: { borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 12 },
  userBox: {
    maxWidth: '82%',
    borderBottomRightRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  assistantBox: {
    flex: 1,
    maxWidth: '92%',
    borderWidth: 1.5,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  userText: { fontSize: 15, lineHeight: 22, color: '#FFFFFF', fontWeight: '500' },
  userFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6 },
  userTime: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  assistantFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
  assistantTime: { fontSize: 10 },
  image: { width: 190, height: 190, borderRadius: 12, marginBottom: 8 },
});

// ─── STYLES: SCREEN CONTAINER ────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },
  headerContainer: {
    borderBottomWidth: 1.2,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatarWrap: { position: 'relative' },
  headerAvatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.8,
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  headerAvatar: { width: '100%', height: '100%', borderRadius: 20 },
  onlineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderWidth: 2,
    borderColor: '#0B0F19',
  },
  headerInfo: { flex: 1, paddingRight: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
  },
  consultasPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  consultasText: { fontSize: 11, fontWeight: '800' },
  messagesContent: { paddingVertical: 14, paddingBottom: 24 },
  inputAreaContainer: {
    borderTopWidth: 1.2,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  imagePreviewContainer: { paddingBottom: 6, flexDirection: 'row' },
  imagePreviewWrapper: { borderWidth: 1.5, borderRadius: Radius.md, padding: 2, position: 'relative' },
  imagePreview: { width: 56, height: 56, borderRadius: Radius.sm },
  removeImageBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
  removeImageText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  iconActionBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    position: 'relative',
  },
  lockBadge: { position: 'absolute', top: 2, right: 2 },
  textInput: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    lineHeight: 20,
    borderWidth: 1.2,
    maxHeight: 140,
    minHeight: 42,
  },
  sendBtn: { borderRadius: 21, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.4 },
  sendGradient: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  disclaimerText: { fontSize: 10, textAlign: 'center', flexShrink: 1 },
});
