import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, LayoutAnimation, Modal
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  Sword, Bot, X, Info, Check, Clock, Flame,
  Footprints, Dumbbell, Sparkles, RefreshCw, Trophy, Plus
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { Radius } from '../../constants';
import { GlassCard } from '../../components/GlassCard';
import { useSocialStore, useAuthStore, useSettingsStore, useNutritionStore } from '../../store';
import { generateSocialChallenge } from '../../services/groq';
import { getLocalDateString } from '../../utils/date';
import { getNameStyle } from '../../utils/styles';

const PRESET_STEPS = [5000, 8000, 10000, 15000];
const PRESET_CALORIES = [300, 500, 750, 1000];
const PRESET_DAYS = [1, 3, 7, 14, 30];

export default function FitGOChallenges() {
  const { t } = useTranslation();
  const colors = useTheme();
  const profile = useAuthStore(s => s.profile);
  const language = useSettingsStore(s => s.language);
  const premiumColor = useSettingsStore(s => s.premiumColor);

  // Social Store
  const challenges = useSocialStore(s => s.challenges);
  const friends = useSocialStore(s => s.friends);
  const isChallengesLoading = useSocialStore(s => s.isChallengesLoading);
  const fetchChallenges = useSocialStore(s => s.fetchChallenges);
  const createChallenge = useSocialStore(s => s.createChallenge);
  const fetchChallengeParticipants = useSocialStore(s => s.fetchChallengeParticipants);
  const completeChallengeAndAwardPoints = useSocialStore(s => s.completeChallengeAndAwardPoints);
  const surrenderChallenge = useSocialStore(s => s.surrenderChallenge);

  // Nutrition Store for real-time progression
  const dailySteps = useNutritionStore(s => s.dailySteps);
  const todayLogs = useNutritionStore(s => s.todayLogs);
  const activityLogs = useNutritionStore(s => s.activityLogs);

  // Filter state: 'active' | 'completed' | 'all'
  const [activeFilter, setActiveFilter] = useState<'active' | 'completed' | 'all'>('active');

  // AI Challenge state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  // Form state
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    type: 'steps' as 'steps' | 'calories' | 'physical',
    target_value: '10000',
    custom_goal: '',
    duration_days: '7',
    selectedFriendIds: [] as string[],
    includeSelf: true,
  });

  // Participant picker modal for AI
  const [aiChallengeParticipantModal, setAiChallengeParticipantModal] = useState(false);
  const [aiChallengeSelectedFriends, setAiChallengeSelectedFriends] = useState<string[]>([]);
  const [aiChallengeIncludeSelf, setAiChallengeIncludeSelf] = useState(true);
  const [aiChallengeTitle, setAiChallengeTitle] = useState('');
  const [aiChallengeType, setAiChallengeType] = useState<'steps' | 'calories' | 'physical'>('physical');
  const [aiChallengeTarget, setAiChallengeTarget] = useState<number>(1);

  // Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [selectedChallengeParticipants, setSelectedChallengeParticipants] = useState<any[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

  // Always fetch challenges on component mount
  useEffect(() => {
    if (profile?.id) {
      fetchChallenges(profile.id);
    }
  }, [profile?.id, fetchChallenges]);

  // Real-time metrics for today
  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const todayStepsCount = dailySteps?.[todayStr] || 0;
  const todayCaloriesBurned = useMemo(() => {
    const actCalories = activityLogs.filter(a => a.loggedAt && a.loggedAt.startsWith(todayStr)).reduce((acc, a) => acc + (a.calories || 0), 0);
    const mealCalories = todayLogs.filter(l => l.loggedAt && l.loggedAt.startsWith(todayStr)).reduce((acc, l) => acc + (l.calories || 0), 0);
    return actCalories > 0 ? actCalories : mealCalories;
  }, [activityLogs, todayLogs, todayStr]);

  // AI challenge generator
  const generateAIChallenge = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAiLoading(true);
    try {
      const response = await generateSocialChallenge(language);
      setAiRecommendation(response);
    } catch {
      setAiRecommendation(t('social.challenges.aiFallback', 'Camina 10,000 pasos durante 3 días seguidos.'));
    } finally {
      setAiLoading(false);
    }
  };

  // Parse recommendation to suggest smart title and goal
  const parseAiSuggestion = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('paso') || lower.includes('step') || lower.includes('camin') || lower.includes('walk')) {
      return {
        title: t('social.challenges.aiStepTitle', 'Desafío de Pasos Fitz'),
        type: 'steps' as const,
        target: 10000,
      };
    }
    if (lower.includes('calor') || lower.includes('quem') || lower.includes('hiit') || lower.includes('burn')) {
      return {
        title: t('social.challenges.aiCalTitle', 'Quema Calórica Fitz'),
        type: 'calories' as const,
        target: 500,
      };
    }
    return {
      title: t('social.challenges.aiPhysTitle', 'Reto Físico Fitz'),
      type: 'physical' as const,
      target: 1,
    };
  };

  const handleOpenAiAcceptModal = () => {
    if (!aiRecommendation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const parsed = parseAiSuggestion(aiRecommendation);
    setAiChallengeTitle(parsed.title);
    setAiChallengeType(parsed.type);
    setAiChallengeTarget(parsed.target);
    setAiChallengeSelectedFriends([]);
    setAiChallengeIncludeSelf(true);
    setAiChallengeParticipantModal(true);
  };

  const handleCreateChallenge = async (
    overrideTitle?: string,
    overrideFriendIds?: string[],
    overrideIncludeSelf?: boolean,
    overrideType?: 'steps' | 'calories' | 'physical',
    overrideTarget?: number
  ) => {
    if (!profile?.id) return;
    const title = overrideTitle || challengeForm.title;
    if (!title.trim()) return;

    const isAi = !!overrideTitle;
    const challengeType = overrideType || (isAi ? 'physical' : challengeForm.type);
    const targetVal = overrideTarget !== undefined
      ? overrideTarget
      : (challengeType === 'physical' ? 1 : (parseFloat(challengeForm.target_value) || 1000));
    const days = parseInt(challengeForm.duration_days) || 7;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    const challenge = {
      creator_id: profile.id,
      title: title.trim(),
      description: isAi
        ? (aiRecommendation || '')
        : (challengeType === 'physical' ? challengeForm.custom_goal : challengeForm.description),
      type: challengeType,
      target_value: targetVal,
      start_date: getLocalDateString(startDate),
      end_date: getLocalDateString(endDate),
      status: 'active' as const,
    };

    const friendIds = overrideFriendIds ?? challengeForm.selectedFriendIds;
    const includeSelf = overrideIncludeSelf ?? challengeForm.includeSelf;
    const participants = includeSelf ? [profile.id, ...friendIds] : [...friendIds];
    if (!participants.includes(profile.id)) participants.unshift(profile.id);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await createChallenge(challenge, participants);

    setIsCreatingChallenge(false);
    setAiChallengeParticipantModal(false);
    setAiChallengeSelectedFriends([]);
    setAiChallengeTitle('');
    setAiChallengeIncludeSelf(true);
    setChallengeForm({
      title: '',
      description: '',
      type: 'steps',
      target_value: '10000',
      custom_goal: '',
      duration_days: '7',
      selectedFriendIds: [],
      includeSelf: true,
    });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const openChallengeDetails = async (challenge: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChallenge(challenge);
    setIsLoadingParticipants(true);
    try {
      const parts = await fetchChallengeParticipants(challenge.id);
      setSelectedChallengeParticipants(parts);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const acceptedFriends = useMemo(() => {
    return friends.filter((f: any) => f.status === 'accepted');
  }, [friends]);

  // Categorize challenges
  const activeChallenges = useMemo(() => {
    return challenges.filter((c: any) => c.status !== 'completed' && c.my_status !== 'completed');
  }, [challenges]);

  const completedChallenges = useMemo(() => {
    return challenges.filter((c: any) => c.status === 'completed' || c.my_status === 'completed');
  }, [challenges]);

  const displayedChallenges = useMemo(() => {
    if (activeFilter === 'active') return activeChallenges;
    if (activeFilter === 'completed') return completedChallenges;
    return challenges;
  }, [activeFilter, activeChallenges, completedChallenges, challenges]);

  // Days remaining helper
  const getDaysRemaining = (endDateStr: string) => {
    if (!endDateStr) return null;
    try {
      const end = new Date(endDateStr);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  const primaryColor = colors.primary || '#8B5CF6';

  return (
    <View style={s.container}>
      {/* ── Top Summary & AI Fitz Card ── */}
      {!isCreatingChallenge && (
        <GlassCard style={s.aiCard}>
          <LinearGradient
            colors={[primaryColor + '18', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.aiCardGradient}
          >
            {/* Header with Title and Info modal trigger */}
            <View style={s.aiHeaderRow}>
              <View style={s.aiTitleRow}>
                <View style={[s.swordBadge, { backgroundColor: '#EF4444' + '20' }]}>
                  <Sword size={18} color="#EF4444" />
                </View>
                <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
                  {t('social.challenges.fitgoChallenges', 'Retos FitGo')}
                </Text>
              </View>

              <TouchableOpacity
                style={[s.infoBtn, { backgroundColor: colors.surfaceAlt ? colors.surfaceAlt + '80' : 'rgba(255,255,255,0.08)' }]}
                onPress={() => setShowInfoModal(true)}
                activeOpacity={0.8}
              >
                <Info size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* AI Generator Button / Box */}
            <TouchableOpacity
              style={[
                s.aiTriggerBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: primaryColor + '40',
                }
              ]}
              onPress={generateAIChallenge}
              activeOpacity={0.85}
            >
              <View style={[s.botIconWrap, { backgroundColor: primaryColor + '20' }]}>
                <Bot size={20} color={primaryColor} />
              </View>
              <Text style={[s.aiTriggerText, { color: colors.textPrimary }]}>
                {t('social.challenges.suggestAI', 'Sugerencia de Fitz (IA)')}
              </Text>
              {aiLoading ? (
                <ActivityIndicator size="small" color={primaryColor} />
              ) : (
                <Sparkles size={18} color={primaryColor} />
              )}
            </TouchableOpacity>

            {/* AI Recommendation Result Box */}
            {aiRecommendation && !aiLoading && (
              <View style={[s.aiResultBox, { backgroundColor: primaryColor + '12', borderColor: primaryColor + '45' }]}>
                <View style={s.aiResultHeader}>
                  <View style={s.aiBadge}>
                    <Text style={[s.aiBadgeText, { color: primaryColor }]}>💡 RETO SUGERIDO</Text>
                  </View>
                  <TouchableOpacity
                    style={s.aiRerollBtn}
                    onPress={generateAIChallenge}
                    activeOpacity={0.7}
                  >
                    <RefreshCw size={13} color={colors.textSecondary} />
                    <Text style={[s.aiRerollText, { color: colors.textSecondary }]}>
                      {t('social.challenges.reRoll', 'Otra idea')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[s.aiQuoteText, { color: colors.textPrimary }]}>
                  &ldquo;{aiRecommendation}&rdquo;
                </Text>

                <TouchableOpacity
                  style={[s.acceptAiBtn, { backgroundColor: primaryColor }]}
                  onPress={handleOpenAiAcceptModal}
                  activeOpacity={0.85}
                >
                  <Sword size={16} color="#fff" />
                  <Text style={s.acceptAiText}>
                    {t('social.challenges.acceptChallenge', 'Aceptar Reto')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* New Custom Challenge Button */}
            <TouchableOpacity
              style={s.createCustomBtnWrap}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsCreatingChallenge(true);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[primaryColor, colors.secondary || '#A855F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.createCustomBtn}
              >
                <Plus size={18} color="#fff" strokeWidth={2.5} />
                <Text style={s.createCustomText}>
                  {t('social.challenges.newCustomChallenge', 'Nuevo Reto Personalizado')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </GlassCard>
      )}

      {/* ── Inline Custom Challenge Creator ── */}
      {isCreatingChallenge && (
        <GlassCard accentColor={primaryColor} style={s.formCard}>
          <View style={s.formHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sword size={20} color={primaryColor} />
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
                {t('social.challenges.createChallenge', 'Crear Nuevo Reto')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsCreatingChallenge(false);
              }}
              style={[s.closeFormBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={[s.inputLabel, { color: colors.textSecondary }]}>
            {t('social.challenges.challengeTitle', 'Título del Reto')}
          </Text>
          <TextInput
            style={[s.textInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border + '50' }]}
            placeholder={t('social.challenges.titlePlaceholder', 'Ej. Semana de Acero, Rey del Gym...')}
            placeholderTextColor={colors.textMuted || '#64748B'}
            value={challengeForm.title}
            onChangeText={text => setChallengeForm(f => ({ ...f, title: text }))}
            maxLength={60}
          />

          {/* Type Selector */}
          <Text style={[s.inputLabel, { color: colors.textSecondary }]}>
            {t('social.challenges.type', 'Tipo de Reto')}
          </Text>
          <View style={s.typeSelectorRow}>
            {[
              { key: 'steps', label: t('social.challenges.steps', 'Pasos'), icon: Footprints },
              { key: 'calories', label: t('social.challenges.calories', 'Calorías'), icon: Flame },
              { key: 'physical', label: t('social.challenges.physical', 'Físico'), icon: Dumbbell },
            ].map(item => {
              const isSelected = challengeForm.type === item.key;
              const IconComp = item.icon;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    s.typeTabBtn,
                    {
                      backgroundColor: isSelected ? primaryColor : (colors.surfaceAlt || '#1E293B'),
                      borderColor: isSelected ? primaryColor : (colors.border + '30'),
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setChallengeForm(f => ({
                      ...f,
                      type: item.key as any,
                      target_value: item.key === 'steps' ? '10000' : item.key === 'calories' ? '500' : '1'
                    }));
                  }}
                  activeOpacity={0.8}
                >
                  <IconComp size={15} color={isSelected ? '#fff' : colors.textSecondary} />
                  <Text style={[s.typeTabText, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Target Value & Presets */}
          {challengeForm.type === 'physical' ? (
            <View>
              <Text style={[s.inputLabel, { color: colors.textSecondary }]}>
                {t('social.challenges.customGoal', 'Meta u Objetivo')}
              </Text>
              <TextInput
                style={[s.textInputArea, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border + '50' }]}
                placeholder={t('social.challenges.customGoalPlaceholder', 'Ej. Hacer 100 flexiones o 3 sesiones de HIIT...')}
                placeholderTextColor={colors.textMuted || '#64748B'}
                multiline
                value={challengeForm.custom_goal}
                onChangeText={text => setChallengeForm(f => ({ ...f, custom_goal: text }))}
              />
            </View>
          ) : (
            <View>
              <Text style={[s.inputLabel, { color: colors.textSecondary }]}>
                {challengeForm.type === 'steps' ? 'Meta en Pasos' : 'Meta en Calorías (kcal)'}
              </Text>
              <TextInput
                style={[s.textInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border + '50' }]}
                keyboardType="numeric"
                value={challengeForm.target_value}
                onChangeText={text => setChallengeForm(f => ({ ...f, target_value: text }))}
              />
              <View style={s.presetPillRow}>
                {(challengeForm.type === 'steps' ? PRESET_STEPS : PRESET_CALORIES).map(val => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      s.presetPill,
                      {
                        backgroundColor: challengeForm.target_value === String(val) ? primaryColor + '25' : colors.surfaceAlt,
                        borderColor: challengeForm.target_value === String(val) ? primaryColor : colors.border + '30',
                      }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setChallengeForm(f => ({ ...f, target_value: String(val) }));
                    }}
                  >
                    <Text style={[s.presetPillText, { color: challengeForm.target_value === String(val) ? primaryColor : colors.textSecondary }]}>
                      {val.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Duration Chips */}
          <Text style={[s.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>
            {t('social.challenges.duration', 'Duración del Reto')}
          </Text>
          <View style={s.durationRow}>
            {PRESET_DAYS.map(days => {
              const isSelected = challengeForm.duration_days === String(days);
              return (
                <TouchableOpacity
                  key={days}
                  style={[
                    s.durationChip,
                    {
                      backgroundColor: isSelected ? primaryColor : (colors.surfaceAlt || '#1E293B'),
                      borderColor: isSelected ? primaryColor : (colors.border + '30'),
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setChallengeForm(f => ({ ...f, duration_days: String(days) }));
                  }}
                >
                  <Text style={[s.durationChipText, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                    {days} {days === 1 ? 'día' : 'días'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Participants Picker */}
          <Text style={[s.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
            {t('social.challenges.whoParticipates', '¿Quiénes participan?')}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
            {/* Self Card */}
            <TouchableOpacity
              style={[
                s.friendCard,
                {
                  backgroundColor: challengeForm.includeSelf ? primaryColor + '20' : colors.surfaceAlt,
                  borderColor: challengeForm.includeSelf ? primaryColor : 'transparent',
                }
              ]}
              onPress={() => setChallengeForm(f => ({ ...f, includeSelf: !f.includeSelf }))}
            >
              {profile?.avatarUrl ? (
                <Image cachePolicy="memory-disk" source={{ uri: profile.avatarUrl }} style={s.friendAvatar} />
              ) : (
                <View style={[s.friendAvatarPlaceholder, { backgroundColor: primaryColor }]}>
                  <Text style={s.friendInitials}>{profile?.name?.[0] || 'Y'}</Text>
                </View>
              )}
              <Text style={[s.friendName, { color: colors.textPrimary }]} numberOfLines={1}>
                {t('social.challenges.me', 'Yo')}
              </Text>
              {challengeForm.includeSelf && (
                <View style={[s.checkBadge, { backgroundColor: primaryColor }]}>
                  <Check size={11} color="#fff" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>

            {/* Friends Cards */}
            {acceptedFriends.map((friend: any) => {
              const fid = friend.friend_profile?.id || '';
              const isSelected = challengeForm.selectedFriendIds.includes(fid);
              return (
                <TouchableOpacity
                  key={fid}
                  style={[
                    s.friendCard,
                    {
                      backgroundColor: isSelected ? primaryColor + '20' : colors.surfaceAlt,
                      borderColor: isSelected ? primaryColor : 'transparent',
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const current = challengeForm.selectedFriendIds;
                    const updated = current.includes(fid) ? current.filter(id => id !== fid) : [...current, fid];
                    setChallengeForm(f => ({ ...f, selectedFriendIds: updated }));
                  }}
                >
                  {friend.friend_profile?.avatar_url ? (
                    <Image cachePolicy="memory-disk" source={{ uri: friend.friend_profile.avatar_url }} style={s.friendAvatar} />
                  ) : (
                    <View style={[s.friendAvatarPlaceholder, { backgroundColor: primaryColor }]}>
                      <Text style={s.friendInitials}>{friend.friend_profile?.name?.[0] || '?'}</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      s.friendName,
                      { color: colors.textPrimary },
                      getNameStyle(friend.friend_profile?.name_color, friend.friend_profile?.id, profile?.id, profile?.nameColor, premiumColor)
                    ]}
                    numberOfLines={1}
                  >
                    {friend.friend_profile?.name?.split(' ')[0] || 'Amigo'}
                  </Text>
                  {isSelected && (
                    <View style={[s.checkBadge, { backgroundColor: primaryColor }]}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            style={[s.launchBtn, { backgroundColor: challengeForm.title.trim() ? primaryColor : colors.surfaceAlt }]}
            onPress={() => handleCreateChallenge()}
            disabled={!challengeForm.title.trim()}
            activeOpacity={0.85}
          >
            <Text style={{ color: challengeForm.title.trim() ? '#fff' : colors.textMuted, fontWeight: '900', fontSize: 16 }}>
              ⚔️ {t('social.challenges.launchChallenge', 'Crear y Comenzar Reto')}
            </Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      {/* ── Active / Completed Challenges Section ── */}
      <View style={s.listSection}>
        {/* Filter Tabs Bar */}
        <View style={s.filterRow}>
          <TouchableOpacity
            style={[
              s.filterTab,
              activeFilter === 'active' && { backgroundColor: primaryColor }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveFilter('active');
            }}
          >
            <Text style={[s.filterTabText, { color: activeFilter === 'active' ? '#fff' : colors.textSecondary }]}>
              🔥 {t('social.challenges.filterActive', 'En Curso')} ({activeChallenges.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.filterTab,
              activeFilter === 'completed' && { backgroundColor: '#10B981' }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveFilter('completed');
            }}
          >
            <Text style={[s.filterTabText, { color: activeFilter === 'completed' ? '#fff' : colors.textSecondary }]}>
              🏆 {t('social.challenges.filterCompleted', 'Completados')} ({completedChallenges.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.filterTab,
              activeFilter === 'all' && { backgroundColor: colors.surfaceAlt }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveFilter('all');
            }}
          >
            <Text style={[s.filterTabText, { color: activeFilter === 'all' ? colors.textPrimary : colors.textSecondary }]}>
              {t('common.all', 'Todos')} ({challenges.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading indicator */}
        {isChallengesLoading && challenges.length === 0 ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={primaryColor} size="large" />
            <Text style={[s.loadingText, { color: colors.textMuted }]}>
              {t('social.challenges.loading', 'Cargando retos...')}
            </Text>
          </View>
        ) : displayedChallenges.length === 0 ? (
          /* Empty State */
          <GlassCard style={s.emptyCard}>
            <View style={[s.emptyIconWrap, { backgroundColor: colors.surfaceAlt }]}>
              <Trophy size={28} color={colors.textMuted || '#94A3B8'} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
              {activeFilter === 'completed'
                ? t('social.challenges.noCompleted', 'Aún no has completado retos')
                : t('social.challenges.noActive', 'No tienes retos en curso')}
            </Text>
            <Text style={[s.emptySubtitle, { color: colors.textSecondary }]}>
              {activeFilter === 'completed'
                ? t('social.challenges.noCompletedSub', '¡Acepta una sugerencia de Fitz o crea un reto con amigos para ganar puntos de liga!')
                : t('social.challenges.noActiveSub', 'Pídele una sugerencia a Fitz o crea un reto personalizado para desafiar a tu squad.')}
            </Text>
          </GlassCard>
        ) : (
          /* Challenge Cards */
          displayedChallenges.map((challenge: any) => {
            let currentProgress = 0;
            const target = Number(challenge.target_value) || 1;

            if (challenge.type === 'steps') {
              currentProgress = todayStepsCount;
            } else if (challenge.type === 'calories') {
              currentProgress = todayCaloriesBurned;
            }

            const globalCompleted = challenge.status === 'completed';
            const myCompleted = challenge.my_status === 'completed';
            const isFullyCompleted = globalCompleted || myCompleted || (challenge.type !== 'physical' && currentProgress >= target);
            const percentage = isFullyCompleted ? 100 : Math.min(100, Math.round((currentProgress / target) * 100));
            const daysRemaining = getDaysRemaining(challenge.end_date);

            const typeColor = challenge.type === 'steps' ? '#06B6D4' : challenge.type === 'calories' ? '#F59E0B' : '#8B5CF6';
            const typeLabel = challenge.type === 'steps' ? 'Pasos' : challenge.type === 'calories' ? 'Calorías' : 'Físico';

            return (
              <TouchableOpacity
                key={challenge.id}
                activeOpacity={0.88}
                onPress={() => openChallengeDetails(challenge)}
                style={{ marginBottom: 14 }}
              >
                <GlassCard style={s.challengeCard} noPadding>
                  <LinearGradient
                    colors={[
                      isFullyCompleted ? '#10B98114' : typeColor + '10',
                      'transparent'
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={s.challengeCardInner}
                  >
                    {/* Top Row: Type tag & Countdown / Status pill */}
                    <View style={s.cardTopRow}>
                      <View style={[s.typeBadge, { backgroundColor: typeColor + '20', borderColor: typeColor + '40' }]}>
                        {challenge.type === 'steps' && <Footprints size={12} color={typeColor} />}
                        {challenge.type === 'calories' && <Flame size={12} color={typeColor} />}
                        {challenge.type === 'physical' && <Dumbbell size={12} color={typeColor} />}
                        <Text style={[s.typeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
                      </View>

                      {isFullyCompleted ? (
                        <View style={[s.statusPill, { backgroundColor: '#10B98120', borderColor: '#10B98150' }]}>
                          <Check size={12} color="#10B981" strokeWidth={3} />
                          <Text style={[s.statusPillText, { color: '#10B981' }]}>
                            {t('social.challenges.statusDone', 'Completado')}
                          </Text>
                        </View>
                      ) : daysRemaining !== null ? (
                        <View style={[s.statusPill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '30' }]}>
                          <Clock size={12} color={colors.textSecondary} />
                          <Text style={[s.statusPillText, { color: colors.textSecondary }]}>
                            {daysRemaining <= 0
                              ? t('social.challenges.endsToday', 'Termina hoy')
                              : `${daysRemaining}d restantes`}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Title & Description */}
                    <Text style={[s.challengeTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                      {challenge.title}
                    </Text>
                    {challenge.description ? (
                      <Text style={[s.challengeDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {challenge.description}
                      </Text>
                    ) : null}

                    {/* Progression bar & metrics */}
                    <View style={s.progressSection}>
                      <View style={s.progressHeader}>
                        <Text style={[s.progressValues, { color: colors.textSecondary }]}>
                          {challenge.type === 'steps' ? (
                            `${currentProgress.toLocaleString()} / ${target.toLocaleString()} pasos`
                          ) : challenge.type === 'calories' ? (
                            `${currentProgress.toLocaleString()} / ${target.toLocaleString()} kcal`
                          ) : (
                            isFullyCompleted ? 'Completado (1/1)' : 'Pendiente (0/1)'
                          )}
                        </Text>
                        <Text style={[s.progressPct, { color: isFullyCompleted ? '#10B981' : typeColor }]}>
                          {percentage}%
                        </Text>
                      </View>

                      <View style={[s.progressBarTrack, { backgroundColor: colors.border + '35' }]}>
                        <LinearGradient
                          colors={isFullyCompleted ? ['#10B981', '#059669'] : [typeColor, primaryColor]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[s.progressBarFill, { width: `${percentage}%` }]}
                        />
                      </View>
                    </View>

                    {/* Action button if not yet completed */}
                    {!myCompleted && !globalCompleted && (
                      <TouchableOpacity
                        style={[
                          s.completeActionBtn,
                          {
                            backgroundColor: isFullyCompleted || challenge.type === 'physical' ? '#10B981' : colors.surfaceAlt,
                            opacity: isFullyCompleted || challenge.type === 'physical' ? 1 : 0.65,
                          }
                        ]}
                        onPress={() => {
                          if (profile?.id) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            completeChallengeAndAwardPoints(challenge.id, profile.id);
                          }
                        }}
                        disabled={!isFullyCompleted && challenge.type !== 'physical'}
                        activeOpacity={0.85}
                      >
                        <Check size={16} color={isFullyCompleted || challenge.type === 'physical' ? '#fff' : colors.textPrimary} strokeWidth={2.5} />
                        <Text style={[s.completeActionText, { color: isFullyCompleted || challenge.type === 'physical' ? '#fff' : colors.textPrimary }]}>
                          {t('social.challenges.markAsCompleted', 'Marcar como completado')}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {myCompleted && !globalCompleted && (
                      <View style={[s.completedBadgeRow, { backgroundColor: '#10B98118' }]}>
                        <Check size={15} color="#10B981" strokeWidth={3} />
                        <Text style={[s.completedBadgeText, { color: '#10B981' }]}>
                          {t('social.challenges.waitingForOthers', '¡Completado por ti! Esperando al squad')}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </GlassCard>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* ── AI Challenge Participant Picker Modal ── */}
      <Modal
        visible={aiChallengeParticipantModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAiChallengeParticipantModal(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={[s.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.border }]} />

            <Text style={[s.modalTitle, { color: colors.textPrimary }]}>
              {t('social.challenges.whoParticipates', '¿Quiénes participan?')}
            </Text>
            <Text style={[s.modalSubtitle, { color: colors.textSecondary }]}>
              {t('social.challenges.selectSelfOrFriends', 'Selecciona a quiénes retarás con esta sugerencia de Fitz.')}
            </Text>

            {/* AI Summary Preview Card */}
            <View style={[s.aiPreviewCard, { backgroundColor: primaryColor + '15', borderColor: primaryColor + '35' }]}>
              <Text style={[s.aiPreviewTitle, { color: primaryColor }]}>{aiChallengeTitle}</Text>
              <Text style={[s.aiPreviewDesc, { color: colors.textPrimary }]}>&ldquo;{aiRecommendation}&rdquo;</Text>
            </View>

            {/* Friends Selector List */}
            <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
              {/* Self */}
              <TouchableOpacity
                style={[
                  s.modalFriendRow,
                  {
                    backgroundColor: aiChallengeIncludeSelf ? primaryColor + '20' : colors.surfaceAlt,
                    borderColor: aiChallengeIncludeSelf ? primaryColor : 'transparent',
                  }
                ]}
                onPress={() => setAiChallengeIncludeSelf(v => !v)}
              >
                {profile?.avatarUrl ? (
                  <Image cachePolicy="memory-disk" source={{ uri: profile.avatarUrl }} style={s.modalAvatar} />
                ) : (
                  <View style={[s.modalAvatarPlaceholder, { backgroundColor: primaryColor }]}>
                    <Text style={s.modalAvatarInitials}>{profile?.name?.[0] || 'Y'}</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[s.modalFriendName, { color: colors.textPrimary }]}>
                    {t('social.challenges.me', 'Yo')} ({profile?.name})
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Participar en el reto</Text>
                </View>
                <View style={[s.modalCheckRing, { backgroundColor: aiChallengeIncludeSelf ? primaryColor : 'transparent', borderColor: colors.border }]}>
                  {aiChallengeIncludeSelf && <Check size={12} color="#fff" strokeWidth={3} />}
                </View>
              </TouchableOpacity>

              {/* Friends */}
              {acceptedFriends.map((friend: any) => {
                const fid = friend.friend_profile?.id || '';
                const isSelected = aiChallengeSelectedFriends.includes(fid);
                return (
                  <TouchableOpacity
                    key={fid}
                    style={[
                      s.modalFriendRow,
                      {
                        backgroundColor: isSelected ? primaryColor + '20' : colors.surfaceAlt,
                        borderColor: isSelected ? primaryColor : 'transparent',
                      }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAiChallengeSelectedFriends(prev =>
                        prev.includes(fid) ? prev.filter(id => id !== fid) : [...prev, fid]
                      );
                    }}
                  >
                    {friend.friend_profile?.avatar_url ? (
                      <Image cachePolicy="memory-disk" source={{ uri: friend.friend_profile.avatar_url }} style={s.modalAvatar} />
                    ) : (
                      <View style={[s.modalAvatarPlaceholder, { backgroundColor: primaryColor }]}>
                        <Text style={s.modalAvatarInitials}>{friend.friend_profile?.name?.[0] || '?'}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          s.modalFriendName,
                          { color: colors.textPrimary },
                          getNameStyle(friend.friend_profile?.name_color, friend.friend_profile?.id, profile?.id, profile?.nameColor, premiumColor)
                        ]}
                      >
                        {friend.friend_profile?.name}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>Amigo</Text>
                    </View>
                    <View style={[s.modalCheckRing, { backgroundColor: isSelected ? primaryColor : 'transparent', borderColor: colors.border }]}>
                      {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={s.modalActionRow}>
              <TouchableOpacity
                style={[s.modalCancelBtn, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setAiChallengeParticipantModal(false)}
              >
                <Text style={[s.modalCancelText, { color: colors.textSecondary }]}>
                  {t('common.cancel', 'Cancelar')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.modalConfirmBtn}
                onPress={() => handleCreateChallenge(
                  aiChallengeTitle,
                  aiChallengeSelectedFriends,
                  aiChallengeIncludeSelf,
                  aiChallengeType,
                  aiChallengeTarget
                )}
              >
                <LinearGradient
                  colors={[primaryColor, colors.secondary || '#A855F7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.modalConfirmGradient}
                >
                  <Text style={s.modalConfirmText}>
                    {aiChallengeSelectedFriends.length === 0 && aiChallengeIncludeSelf
                      ? `🎯 ${t('social.challenges.acceptSolo', 'Aceptar (solo yo)')}`
                      : `⚔️ ${t('social.challenges.launchChallenge', 'Comenzar Reto')}`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Info Modal ── */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={s.infoModalBackdrop}>
          <View style={[s.infoModalContent, { backgroundColor: colors.surface }]}>
            <View style={s.infoHeader}>
              <Text style={[s.infoTitle, { color: colors.textPrimary }]}>
                {t('social.challenges.howItWorks', '¿Cómo funcionan los retos?')}
              </Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              <View style={s.infoPoint}>
                <Text style={[s.infoPointTitle, { color: colors.textPrimary }]}>1. Compite con amigos</Text>
                <Text style={[s.infoPointDesc, { color: colors.textSecondary }]}>
                  Crea retos de pasos, calorías o actividad física y desafía a tus amigos a superarlos en equipo o en duelo.
                </Text>
              </View>

              <View style={s.infoPoint}>
                <Text style={[s.infoPointTitle, { color: colors.textPrimary }]}>2. Progreso en tiempo real</Text>
                <Text style={[s.infoPointDesc, { color: colors.textSecondary }]}>
                  Tus pasos y calorías quemadas registradas en FitGO actualizan automáticamente tu porcentaje de cumplimiento.
                </Text>
              </View>

              <View style={s.infoPoint}>
                <Text style={[s.infoPointTitle, { color: colors.textPrimary }]}>3. Puntos y gloria de liga</Text>
                <Text style={[s.infoPointDesc, { color: colors.textSecondary }]}>
                  Completar retos te otorga puntos de liga para ascender en el ranking global y sumar al marcador de tu Squad.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[s.infoUnderstoodBtn, { backgroundColor: primaryColor }]}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={s.infoUnderstoodText}>{t('common.understood', '¡Entendido!')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Challenge Details Modal ── */}
      <Modal
        visible={!!selectedChallenge}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedChallenge(null)}
      >
        <View style={s.modalBackdrop}>
          <View style={[s.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.border }]} />

            <View style={s.detailsHeader}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[s.detailsTitle, { color: colors.textPrimary }]}>
                  {selectedChallenge?.title}
                </Text>
                {selectedChallenge?.description ? (
                  <Text style={[s.detailsDesc, { color: colors.textSecondary }]}>
                    {selectedChallenge?.description}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => setSelectedChallenge(null)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Chips */}
            <View style={s.detailsChipRow}>
              <View style={[s.typeBadge, { backgroundColor: primaryColor + '20', borderColor: primaryColor + '40' }]}>
                <Text style={[s.typeBadgeText, { color: primaryColor }]}>
                  {selectedChallenge?.type === 'steps' ? '🚶 Pasos' : selectedChallenge?.type === 'calories' ? '🔥 Calorías' : '💪 Físico'}
                </Text>
              </View>
              <View style={[s.typeBadge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '30' }]}>
                <Text style={[s.typeBadgeText, { color: colors.textSecondary }]}>
                  Meta: {selectedChallenge?.target_value}
                </Text>
              </View>
            </View>

            <Text style={[s.participantsTitle, { color: colors.textPrimary }]}>
              {t('social.challenges.participants', 'Participantes')}
            </Text>

            {isLoadingParticipants ? (
              <ActivityIndicator color={primaryColor} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                {selectedChallengeParticipants.map(p => {
                  const isDone = p.status === 'completed';
                  const isSurrendered = p.status === 'surrendered';
                  return (
                    <View key={p.id} style={[s.participantRow, { backgroundColor: colors.surfaceAlt }]}>
                      {p.user_profile?.avatar_url ? (
                        <Image cachePolicy="memory-disk" source={{ uri: p.user_profile.avatar_url }} style={s.partAvatar} />
                      ) : (
                        <View style={[s.partAvatarPlaceholder, { backgroundColor: primaryColor }]}>
                          <Text style={s.partAvatarInitials}>{p.user_profile?.name?.[0] || '?'}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text
                          style={[
                            s.partName,
                            { color: colors.textPrimary },
                            getNameStyle(p.user_profile?.name_color, p.user_profile?.id, profile?.id, profile?.nameColor, premiumColor)
                          ]}
                        >
                          {p.user_profile?.name || 'Usuario'}
                        </Text>
                        <Text style={{ color: isDone ? '#10B981' : isSurrendered ? '#EF4444' : colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                          {isDone ? '✓ Completado' : isSurrendered ? '✗ Rendido' : 'En progreso'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Action Buttons */}
            {selectedChallenge?.status !== 'completed' && (
              <View style={s.detailsActionRow}>
                <TouchableOpacity
                  style={[s.detailsSurrenderBtn, { backgroundColor: '#EF4444' + '18' }]}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    surrenderChallenge(selectedChallenge.id, profile?.id || '');
                    setSelectedChallenge(null);
                  }}
                >
                  <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>
                    {t('social.challenges.surrender', 'Rendirse')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.detailsCompleteBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    completeChallengeAndAwardPoints(selectedChallenge.id, profile?.id || '');
                    setSelectedChallenge(null);
                  }}
                >
                  <Check size={16} color="#fff" strokeWidth={3} />
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                    {t('social.challenges.complete', 'Completar')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  // AI Card
  aiCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
    borderRadius: Radius.xl,
  },
  aiCardGradient: {
    padding: 16,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swordBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  botIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTriggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  aiResultBox: {
    marginTop: 14,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  aiRerollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiRerollText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aiQuoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 14,
  },
  acceptAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  acceptAiText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  createCustomBtnWrap: {
    marginTop: 14,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  createCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
  },
  createCustomText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // Form Card
  formCard: {
    marginBottom: 20,
    padding: 18,
    borderRadius: Radius.xl,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeFormBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  textInput: {
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 14,
  },
  textInputArea: {
    height: 72,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    fontSize: 14,
    marginBottom: 14,
    textAlignVertical: 'top',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  presetPillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  presetPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  durationChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  durationChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  friendCard: {
    width: 78,
    padding: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    position: 'relative',
  },
  friendAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  friendAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendInitials: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  friendName: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchBtn: {
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List Section & Filters
  listSection: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 28,
    alignItems: 'center',
    borderRadius: Radius.xl,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Challenge Card
  challengeCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  challengeCardInner: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  challengeDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  progressSection: {
    marginTop: 4,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  progressValues: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  completeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  completeActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  completedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 38,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  aiPreviewCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  aiPreviewTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  aiPreviewDesc: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  modalFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  modalAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  modalAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarInitials: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalFriendName: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalCheckRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },

  // Info Modal
  infoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  infoModalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 22,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  infoPoint: {
    marginBottom: 14,
  },
  infoPointTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  infoPointDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoUnderstoodBtn: {
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  infoUnderstoodText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  // Details Modal
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  detailsDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailsChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  participantsTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  partAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  partAvatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partAvatarInitials: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  partName: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailsActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  detailsSurrenderBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCompleteBtn: {
    flex: 2,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
