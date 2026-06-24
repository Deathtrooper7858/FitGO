import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, LayoutAnimation, Modal } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Sword, Bot, X, Info, ChevronDown, ChevronUp, Settings, Check } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Radius } from '../../constants';
import { GlassCard } from '../../components/GlassCard';
import { useSocialStore, useAuthStore, useSettingsStore, useNutritionStore } from '../../store';
import { generateSocialChallenge } from '../../services/groq';
import { getLocalDateString } from '../../utils/date';
import { getNameStyle } from '../../utils/styles';

const s = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  userName: { fontSize: 15, fontWeight: '700' },
  avatarSmall: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  mainBtn: { height: 52, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: Radius.lg },
  aiResult: { marginTop: 16, padding: 20, borderRadius: Radius.xl, borderWidth: 1, borderStyle: 'dashed' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  inputField: { height: 48, borderRadius: Radius.md, paddingHorizontal: 16, fontSize: 15, marginBottom: 16 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full },
  friendSelectCard: { width: 80, padding: 12, borderRadius: Radius.lg, alignItems: 'center', marginRight: 12, borderWidth: 2 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  tabContent: { flex: 1 },
});

export default function FitGOChallenges() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { profile } = useAuthStore();
  const { language, premiumColor } = useSettingsStore();
  const socialStore = useSocialStore();
  const nutritionStore = useNutritionStore();

  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

// Challenges state
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    type: 'steps',
    target_value: '10000',
    custom_goal: '',       // for 'physical' type free text goal
    duration_days: '7',
    selectedFriendIds: [] as string[],
    includeSelf: true,     // always starts selected
  });

  // For AI challenge acceptance: shows a participant picker
  const [aiChallengeParticipantModal, setAiChallengeParticipantModal] = useState(false);
  const [aiChallengeSelectedFriends, setAiChallengeSelectedFriends] = useState<string[]>([]);
  const [aiChallengeIncludeSelf, setAiChallengeIncludeSelf] = useState(true);
  const [aiChallengeTitle, setAiChallengeTitle] = useState('');

  // New UI states
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  
  // Challenge details modal
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [selectedChallengeParticipants, setSelectedChallengeParticipants] = useState<any[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
const generateAIChallenge = async () => {
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

  const handleCreateChallenge = async (overrideTitle?: string, overrideFriendIds?: string[], overrideIncludeSelf?: boolean) => {
    if (!profile?.id) return;
    const title = overrideTitle || challengeForm.title;
    if (!title) return;
    
    const isAi = !!overrideTitle;
    const challengeType = isAi ? 'physical' : challengeForm.type;
    const targetVal = challengeType === 'physical' ? 1 : (parseFloat(challengeForm.target_value) || 0);
    const days = parseInt(challengeForm.duration_days) || 7;
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    const challenge = {
      creator_id: profile.id,
      title,
      description: isAi
        ? (aiRecommendation || '')
        : (challengeType === 'physical' ? challengeForm.custom_goal : challengeForm.description),
      type: challengeType,
      target_value: targetVal,
      start_date: getLocalDateString(startDate),
      end_date: getLocalDateString(endDate),
      status: 'active' as any
    };

    const friendIds = overrideFriendIds ?? challengeForm.selectedFriendIds;
    const includeSelf = overrideIncludeSelf ?? challengeForm.includeSelf;
    const participants = includeSelf ? [profile.id, ...friendIds] : [...friendIds];
    // Always include at least the creator
    if (!participants.includes(profile.id)) participants.unshift(profile.id);

    await socialStore.createChallenge(challenge, participants);
    setIsCreatingChallenge(false);
    setAiChallengeParticipantModal(false);
    setAiChallengeSelectedFriends([]);
    setAiChallengeTitle('');
    setAiChallengeIncludeSelf(true);
    setChallengeForm({ title: '', description: '', type: 'steps', target_value: '10000', custom_goal: '', duration_days: '7', selectedFriendIds: [], includeSelf: true });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  };

  
  

  const openChallengeDetails = async (challenge: any) => {
    setSelectedChallenge(challenge);
    setIsLoadingParticipants(true);
    try {
      const parts = await socialStore.fetchChallengeParticipants(challenge.id);
      setSelectedChallengeParticipants(parts);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const acceptedFriends = socialStore.friends.filter(f => f.status === 'accepted');

  return (
    <View style={ s.tabContent }>
      {/* Content from renderChallenges */}
      
      <View style={s.tabContent}>
        {!isCreatingChallenge ? (
          <GlassCard style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
            <LinearGradient colors={[colors.error + '20', 'transparent']} style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Sword size={24} color={colors.error} />
                <Text style={[s.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('social.challenges.fitgoChallenges', 'FitGo Challenges')}</Text>
              </View>

              <TouchableOpacity 
                style={[s.aiBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary + '40', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }]}
                onPress={generateAIChallenge}
              >
                <Bot size={22} color={colors.primary} />
                <Text style={{ color: colors.textPrimary, fontWeight: '800', flex: 1 }}>{t('social.challenges.suggestAI', 'Sugerencia de Fitz (IA)')}</Text>
              </TouchableOpacity>

              {aiLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 15 }} />}

              {aiRecommendation && !aiLoading && (
                <View style={[s.aiResult, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '50' }]}>
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontStyle: 'italic', lineHeight: 22, fontWeight: '500' }}>&quot;{aiRecommendation}&quot;</Text>
                  <TouchableOpacity 
                    style={[s.actionBtn, { backgroundColor: colors.primary, marginTop: 16, alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10 }]}
                    onPress={() => {
                      setAiChallengeTitle(`${t('social.challenges.aiChallengePrefix', 'Reto IA')}: ${new Date().toLocaleDateString()}`);
                      setAiChallengeSelectedFriends([]);
                      setAiChallengeParticipantModal(true);
                    }}
                  >
                    <Sword size={16} color="#fff" />
                    <Text style={[s.actionBtnText, { fontSize: 14 }]}>{t('social.challenges.acceptChallenge', 'Aceptar Reto')}</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <TouchableOpacity 
                style={{ marginTop: 15, borderRadius: Radius.xl, overflow: 'hidden' }}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setIsCreatingChallenge(true);
                }}
              >
                <LinearGradient colors={[colors.primary, colors.secondary || '#A855F7']} start={{x:0, y:0}} end={{x:1, y:1}} style={s.mainBtn}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>{t('social.challenges.newCustomChallenge', 'Nuevo Reto Personalizado')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </GlassCard>
        ) : (
          <GlassCard accentColor={colors.primary} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[s.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('social.challenges.createChallenge', 'Crear Nuevo Reto')}</Text>
              <TouchableOpacity onPress={() => setIsCreatingChallenge(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.challengeTitle', 'Título del Reto')}</Text>
            <TextInput
              style={[s.inputField, { backgroundColor: colors.surface, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border + '50', borderRadius: Radius.lg }]}
              placeholder={t('social.challenges.titlePlaceholder', 'Ej. Rey de los Pasos')}
              placeholderTextColor={colors.textMuted}
              value={challengeForm.title}
              onChangeText={t => setChallengeForm({...challengeForm, title: t})}
            />

            <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.description', 'Descripción')}</Text>
            <TextInput
              style={[s.inputField, { backgroundColor: colors.surface, color: colors.textPrimary, height: 80, borderWidth: 1, borderColor: colors.border + '50', borderRadius: Radius.lg, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder={t('social.challenges.descPlaceholder', 'Descripción del reto...')}
              placeholderTextColor={colors.textMuted}
              multiline
              value={challengeForm.description}
              onChangeText={t => setChallengeForm({...challengeForm, description: t})}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.type', 'Tipo')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(['steps', 'calories', 'physical'] as const).map(type => {
                    const isSelected = challengeForm.type === type;
                    return (
                      <TouchableOpacity 
                        key={type}
                        style={{ overflow: 'hidden', borderRadius: Radius.full, borderWidth: isSelected ? 0 : 1, borderColor: colors.border + '40' }}
                        onPress={() => setChallengeForm({...challengeForm, type})}
                      >
                        <LinearGradient
                          colors={isSelected ? [colors.primary, colors.secondary || '#A855F7'] : [colors.surfaceAlt, colors.surfaceAlt]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                          style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full }}
                        >
                          <Text style={{ color: isSelected ? '#fff' : colors.textPrimary, fontSize: 12, fontWeight: '800' }}>
                            {type === 'steps' ? `🚶 ${t('activities.steps', 'Pasos')}` : type === 'calories' ? `🔥 ${t('activities.calories', 'Calorías')}` : `💪 ${t('social.challenges.physical', 'Físico')}`}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.days', 'Días')}</Text>
                <TextInput
                  style={[s.inputField, { backgroundColor: colors.surface, color: colors.textPrimary, marginBottom: 0, borderWidth: 1, borderColor: colors.border + '50', borderRadius: Radius.lg }]}
                  keyboardType="numeric"
                  value={challengeForm.duration_days}
                  onChangeText={t => setChallengeForm({...challengeForm, duration_days: t})}
                />
              </View>
            </View>

            {challengeForm.type === 'physical' ? (
              <View>
                <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.customGoal', 'Custom goal')}</Text>
                <TextInput
                  style={[s.inputField, { backgroundColor: colors.surface, color: colors.textPrimary, height: 80, borderWidth: 1, borderColor: colors.border + '50', borderRadius: Radius.lg, textAlignVertical: 'top', paddingTop: 12 }]}
                  placeholder={t('social.challenges.customGoalPlaceholder', 'e.g. 100 pushups...')}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={challengeForm.custom_goal}
                  onChangeText={t => setChallengeForm({...challengeForm, custom_goal: t})}
                />
              </View>
            ) : (
              <View>
                <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.goal', 'Goal')} ({challengeForm.type === 'steps' ? t('social.challenges.stepsPerDay', 'Steps per day') : t('social.challenges.calsPerDay', 'Calories per day')})</Text>
                <TextInput
                  style={[s.inputField, { backgroundColor: colors.surface, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border + '50', borderRadius: Radius.lg }]}
                  keyboardType="numeric"
                  value={challengeForm.target_value}
                  onChangeText={t => setChallengeForm({...challengeForm, target_value: t})}
                />
              </View>
            )}

            <Text style={[s.label, { color: colors.textSecondary }]}>{t('social.challenges.whoParticipates', '¿Quiénes participan?')}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 10 }}>{t('social.challenges.tapToSelect', 'Toca para seleccionar. Puedes incluirte a ti y a varios amigos.')}</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {/* Self card — toggleable */}
              <TouchableOpacity 
                style={[
                  s.friendSelectCard, 
                  { 
                    backgroundColor: challengeForm.includeSelf ? colors.primary + '20' : colors.surfaceAlt, 
                    borderColor: challengeForm.includeSelf ? colors.primary : 'transparent',
                    borderWidth: 2,
                  }
                ]}
                onPress={() => setChallengeForm({...challengeForm, includeSelf: !challengeForm.includeSelf})}
              >
                {profile?.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                ) : (
                  <View style={[s.avatarPlaceholder, { width: 40, height: 40, backgroundColor: colors.primary }]}>
                    <Text style={[s.avatarInitials, { fontSize: 16 }]}>{profile?.name?.[0]}</Text>
                  </View>
                )}
                <Text style={[{ color: colors.textPrimary, fontSize: 12, marginTop: 8, fontWeight: '600', textAlign: 'center' }, getNameStyle(profile?.nameColor, profile?.id, profile?.id, profile?.nameColor, premiumColor)]} numberOfLines={1}>
                  {t('social.challenges.me', 'Yo')}
                </Text>
                {challengeForm.includeSelf && (
                  <View style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {acceptedFriends.map(friend => {
                const fid = friend.friend_profile?.id || '';
                const isSelected = challengeForm.selectedFriendIds.includes(fid);
                return (
                  <TouchableOpacity 
                    key={fid}
                    style={[
                      s.friendSelectCard, 
                      { 
                        backgroundColor: isSelected ? colors.primary + '20' : colors.surfaceAlt, 
                        borderColor: isSelected ? colors.primary : 'transparent',
                        borderWidth: 2,
                      }
                    ]}
                    onPress={() => {
                      const current = challengeForm.selectedFriendIds;
                      const updated = current.includes(fid)
                        ? current.filter(id => id !== fid)
                        : [...current, fid];
                      setChallengeForm({...challengeForm, selectedFriendIds: updated});
                    }}
                  >
                    {friend.friend_profile?.avatar_url ? (
                      <Image source={{ uri: friend.friend_profile.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    ) : (
                      <View style={[s.avatarPlaceholder, { width: 40, height: 40, backgroundColor: colors.primary }]}>
                        <Text style={[s.avatarInitials, { fontSize: 16 }]}>{friend.friend_profile?.name?.[0]}</Text>
                      </View>
                    )}
                    <Text style={[{ color: colors.textPrimary, fontSize: 12, marginTop: 8, fontWeight: '600', textAlign: 'center' }, getNameStyle(friend.friend_profile?.name_color, friend.friend_profile?.id, profile?.id, profile?.nameColor, premiumColor)]} numberOfLines={1}>
                      {friend.friend_profile?.name?.split(' ')[0]}
                    </Text>
                    {isSelected && (
                      <View style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity 
              style={[s.mainBtn, { backgroundColor: challengeForm.title ? colors.primary : colors.surfaceAlt }]}
              onPress={() => handleCreateChallenge()}
              disabled={!challengeForm.title}
            >
              <Text style={{ color: challengeForm.title ? '#fff' : colors.textMuted, fontWeight: 'bold', fontSize: 16 }}>
                {challengeForm.selectedFriendIds.length === 0 && challengeForm.includeSelf
                  ? `🎯 ${t('social.challenges.startSolo', 'Comenzar (solo yo)')}`
                  : challengeForm.selectedFriendIds.length > 0 && challengeForm.includeSelf
                  ? `⚔️ ${t('common.me', 'Yo')} + ${challengeForm.selectedFriendIds.length} ${t('social.friends.friend', 'amigo')}${challengeForm.selectedFriendIds.length > 1 ? 's' : ''}`
                  : challengeForm.selectedFriendIds.length > 0
                  ? `⚔️ ${t('social.challenges.challenge', 'Retar a')} ${challengeForm.selectedFriendIds.length} ${t('social.friends.friend', 'amigo')}${challengeForm.selectedFriendIds.length > 1 ? 's' : ''} (${t('social.challenges.withoutMe', 'sin mí')})`
                  : `🎯 ${t('social.challenges.start', 'Comenzar')}`
                }
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 8, marginBottom: 12, marginTop: 10 }}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsAccordionOpen(!isAccordionOpen);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('social.challenges.activeChallenges', 'Retos Activos')}</Text>
            <TouchableOpacity onPress={() => setShowInfoModal(true)} style={{ padding: 4 }}>
              <Info size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 4 }}>
            {isAccordionOpen ? <ChevronUp size={20} color={colors.textSecondary} /> : <ChevronDown size={20} color={colors.textSecondary} />}
          </View>
        </TouchableOpacity>

        {isAccordionOpen && (
          socialStore.challenges.length === 0 ? (
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10, marginBottom: 20 }}>{t('social.challenges.noActiveChallenges', 'No hay retos activos.')}</Text>
          ) : (
            socialStore.challenges.map(challenge => {
              const todayStr = getLocalDateString(new Date());
              let currentProgress = 0;
              
              if (challenge.type === 'steps') {
                currentProgress = nutritionStore.dailySteps?.[todayStr] || 0;
              } else if (challenge.type === 'calories') {
                currentProgress = 0; // Mock fallback for calories
              }
              
              const target = challenge.target_value || 1;
              const globalCompleted = challenge.status === 'completed';
              const myCompleted = challenge.my_status === 'completed';
              const isFullyCompleted = globalCompleted || myCompleted || (currentProgress >= target);
              
              const percentage = isFullyCompleted ? 100 : Math.min(100, Math.round((currentProgress / target) * 100));

              return (
              <TouchableOpacity 
                key={challenge.id} 
                activeOpacity={0.8}
                onPress={() => openChallengeDetails(challenge)}
              >
                <GlassCard style={{ marginBottom: 12, padding: 0, overflow: 'hidden', borderWidth: 1, borderColor: colors.border + '50' }}>
                  <LinearGradient colors={[globalCompleted || myCompleted ? colors.success + '15' : colors.primary + '10', 'transparent']} style={{ padding: 16, borderLeftWidth: 4, borderLeftColor: globalCompleted || myCompleted ? colors.success : colors.primary }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text style={[s.userName, { color: colors.textPrimary, fontSize: 17, fontWeight: '800', flex: 1 }]} numberOfLines={2}>{challenge.title}</Text>
                          <TouchableOpacity 
                            style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 14, marginLeft: 10 }}
                            onPress={() => openChallengeDetails(challenge)}
                          >
                            <Settings size={20} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                        
                        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 6, lineHeight: 20 }}>{challenge.description || `${t('social.challenges.challengeOf', 'Reto de')} ${challenge.type}`}</Text>
                        
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                          <View style={[s.chip, { backgroundColor: colors.primary + '20', borderRadius: Radius.full }]}>
                            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>
                              {challenge.type === 'steps' ? `🚶 ${t('activities.steps', 'Pasos')}` : challenge.type === 'calories' ? `🔥 ${t('activities.calories', 'Calorías')}` : `💪 ${t('social.challenges.physical', 'Físico')}`}
                            </Text>
                          </View>
                          <View style={[s.chip, { backgroundColor: colors.surfaceAlt, borderRadius: Radius.full, borderWidth: 1, borderColor: colors.border }]}>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                              {t('social.challenges.goal', 'Objetivo')}: {challenge.target_value}
                            </Text>
                          </View>
                        </View>

                        {/* Real-time progression tracking */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }}>
                          <View style={{ height: 8, flex: 1, backgroundColor: colors.border + '40', borderRadius: 4, overflow: 'hidden' }}>
                            <LinearGradient
                              colors={isFullyCompleted ? [colors.success, '#10B981'] : [colors.primary, colors.secondary || '#A855F7']}
                              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                              style={{ width: `${percentage}%`, height: '100%', borderRadius: 4 }}
                            />
                          </View>
                          <Text style={{ color: isFullyCompleted ? colors.success : colors.primary, fontSize: 12, fontWeight: '900', marginLeft: 12 }}>
                            {percentage}%
                          </Text>
                        </View>
                        
                        {/* Action button if not completed by user yet */}
                        {!myCompleted && !globalCompleted && (
                          <TouchableOpacity 
                            style={{ 
                              marginTop: 16, 
                              paddingVertical: 10, 
                              backgroundColor: isFullyCompleted || challenge.type === 'physical' ? colors.primary : colors.surfaceAlt, 
                              borderRadius: Radius.md, 
                              alignItems: 'center', 
                              flexDirection: 'row', 
                              justifyContent: 'center', 
                              gap: 6,
                              opacity: isFullyCompleted || challenge.type === 'physical' ? 1 : 0.6
                            }}
                            onPress={() => {
                              if (profile?.id) {
                                socialStore.completeChallengeAndAwardPoints(challenge.id, profile.id);
                              }
                            }}
                            disabled={!isFullyCompleted && challenge.type !== 'physical'}
                          >
                            <Check size={18} color={isFullyCompleted || challenge.type === 'physical' ? '#fff' : colors.textPrimary} />
                            <Text style={{ color: isFullyCompleted || challenge.type === 'physical' ? '#fff' : colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                              {t('social.challenges.markAsCompleted', 'Marcar como completado')}
                            </Text>
                          </TouchableOpacity>
                        )}

                        {myCompleted && !globalCompleted && (
                          <View style={{ marginTop: 16, paddingVertical: 10, backgroundColor: colors.success + '20', borderRadius: Radius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                            <Check size={18} color={colors.success} />
                            <Text style={{ color: colors.success, fontSize: 14, fontWeight: '800' }}>
                              {t('social.challenges.waitingForOthers', 'Completado - Esperando a los demás')}
                            </Text>
                          </View>
                        )}
                        
                        {globalCompleted && (
                          <View style={{ marginTop: 16, paddingVertical: 10, backgroundColor: colors.success + '20', borderRadius: Radius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                            <Check size={18} color={colors.success} />
                            <Text style={{ color: colors.success, fontSize: 14, fontWeight: '800' }}>
                              {t('social.challenges.fullyCompleted', '¡Reto finalizado!')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                </GlassCard>
              </TouchableOpacity>
            )})
          )
        )}
      </View>
    
      {/* AI Challenge Participant Picker Modal */}
      <Modal
        visible={aiChallengeParticipantModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAiChallengeParticipantModal(false)}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 1000 }]}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
            {/* Handle */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />
            
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 4 }}>{t('social.challenges.whoParticipates', '¿Quiénes participan?')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 20 }}>{t('social.challenges.selectSelfOrFriends', 'Selecciona a ti mismo y/o a tus amigos para este reto.')}</Text>

            {/* Friends list */}
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {/* Self - toggleable */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', padding: 14,
                  borderRadius: 14, marginBottom: 10,
                  backgroundColor: aiChallengeIncludeSelf ? colors.primary + '20' : colors.surfaceAlt,
                  borderWidth: 1.5,
                  borderColor: aiChallengeIncludeSelf ? colors.primary : 'transparent',
                }}
                onPress={() => setAiChallengeIncludeSelf(v => !v)}
              >
                {profile?.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                ) : (
                  <View style={[s.avatarPlaceholder, { width: 40, height: 40, backgroundColor: colors.primary }]}>
                    <Text style={[s.avatarInitials, { fontSize: 16 }]}>{profile?.name?.[0]}</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[{ color: colors.textPrimary, fontWeight: '700' }, getNameStyle(profile?.nameColor, profile?.id, profile?.id, profile?.nameColor, premiumColor)]}>{t('social.challenges.me', 'Yo')} ({profile?.name})</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('social.challenges.participateInChallenge', 'Participar en el reto')}</Text>
                </View>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: aiChallengeIncludeSelf ? colors.primary : colors.border + '50',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: aiChallengeIncludeSelf ? 0 : 1.5, borderColor: colors.border,
                }}>
                  {aiChallengeIncludeSelf && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>✓</Text>}
                </View>
              </TouchableOpacity>

              {socialStore.friends.filter(f => f.status === 'accepted').map(friend => {
                const fid = friend.friend_profile?.id || '';
                const isSelected = aiChallengeSelectedFriends.includes(fid);
                return (
                  <TouchableOpacity
                    key={fid}
                    style={{
                      flexDirection: 'row', alignItems: 'center', padding: 14,
                      borderRadius: 14, marginBottom: 10,
                      backgroundColor: isSelected ? colors.primary + '20' : colors.surfaceAlt,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : 'transparent',
                    }}
                    onPress={() => {
                      const updated = isSelected
                        ? aiChallengeSelectedFriends.filter(id => id !== fid)
                        : [...aiChallengeSelectedFriends, fid];
                      setAiChallengeSelectedFriends(updated);
                    }}
                  >
                    {friend.friend_profile?.avatar_url ? (
                      <Image source={{ uri: friend.friend_profile.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    ) : (
                      <View style={[s.avatarPlaceholder, { width: 40, height: 40, backgroundColor: colors.primary }]}>
                        <Text style={[s.avatarInitials, { fontSize: 16 }]}>{friend.friend_profile?.name?.[0]}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[{ color: colors.textPrimary, fontWeight: '700' }, getNameStyle(friend.friend_profile?.name_color, friend.friend_profile?.id, profile?.id, profile?.nameColor, premiumColor)]}>{friend.friend_profile?.name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('social.friend', 'Amigo')}</Text>
                    </View>
                    <View style={{
                      width: 22, height: 22, borderRadius: 11,
                      backgroundColor: isSelected ? colors.primary : colors.border + '50',
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: isSelected ? 0 : 1.5, borderColor: colors.border,
                    }}>
                      {isSelected && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={{ flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt }}
                onPress={() => setAiChallengeParticipantModal(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 15 }}>{t('common.cancel', 'Cancelar')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 2, height: 52, borderRadius: 16, overflow: 'hidden' }}
                onPress={() => handleCreateChallenge(aiChallengeTitle, aiChallengeSelectedFriends, aiChallengeIncludeSelf)}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary || '#A855F7']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>
                    {aiChallengeSelectedFriends.length === 0 && aiChallengeIncludeSelf
                      ? `🎯 ${t('social.challenges.acceptSolo', 'Aceptar (solo yo)')}`
                      : aiChallengeSelectedFriends.length > 0 && aiChallengeIncludeSelf
                      ? `⚔️ ${t('common.me', 'Yo')} + ${aiChallengeSelectedFriends.length} ${t('social.friends.friend', 'amigo')}${aiChallengeSelectedFriends.length > 1 ? 's' : ''}`
                      : `⚔️ ${t('social.challenges.challenge', 'Retar a')} ${aiChallengeSelectedFriends.length} ${t('social.friends.friend', 'amigo')}${aiChallengeSelectedFriends.length > 1 ? 's' : ''}`
                    }
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 1000 }]}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 24, width: '100%', maxWidth: 400 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '900' }}>{t('social.challenges.howItWorks', '¿Cómo funcionan los retos?')}</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 12 }}>
                1. <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>Invita a amigos:</Text> Crea un reto y reta a tus amigos a superarlo.
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 12 }}>
                2. <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>El fondo de puntos:</Text> Cada reto tiene un bote de recompensas (p.ej. 500 puntos base).
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 12 }}>
                3. <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>Gana y divide:</Text> Los puntos se dividen en partes iguales entre los participantes que <Text style={{ fontWeight: 'bold', color: colors.success }}>completen</Text> el objetivo. ¡Si lo hacen ambos, la recompensa se comparte!
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 12 }}>
                4. <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>No te rindas:</Text> Si decides <Text style={{ fontWeight: 'bold', color: '#EF4444' }}>rendirte</Text>, no recibirás ninguna recompensa.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[s.mainBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('common.understood', '¡Entendido!')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Challenge Details Modal */}
      <Modal
        visible={!!selectedChallenge}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedChallenge(null)}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 1000 }]}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '80%' }}>
            {/* Handle */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginBottom: 4 }}>{selectedChallenge?.title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22 }}>{selectedChallenge?.description}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedChallenge(null)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <View style={[s.chip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>
                  {selectedChallenge?.type === 'steps' ? '🚶 Pasos' : selectedChallenge?.type === 'calories' ? '🔥 Calorías' : '💪 Físico'}
                </Text>
              </View>
              <View style={[s.chip, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                  Objetivo: {selectedChallenge?.target_value}
                </Text>
              </View>
            </View>

            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>{t('social.challenges.participants', 'Participantes')}</Text>
            
            {isLoadingParticipants ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                {selectedChallengeParticipants.map(p => (
                  <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.surfaceAlt, borderRadius: 12, marginBottom: 8 }}>
                    {p.user_profile?.avatar_url ? (
                      <Image source={{ uri: p.user_profile.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                    ) : (
                      <View style={[s.avatarPlaceholder, { width: 36, height: 36, backgroundColor: colors.primary }]}>
                        <Text style={[s.avatarInitials, { fontSize: 14 }]}>{p.user_profile?.name?.[0]}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[{ color: colors.textPrimary, fontWeight: '700' }, getNameStyle(p.user_profile?.name_color, p.user_profile?.id, profile?.id, profile?.nameColor, premiumColor)]}>{p.user_profile?.name || 'Usuario'}</Text>
                      <Text style={{ 
                        color: p.status === 'completed' ? colors.success : p.status === 'surrendered' ? '#EF4444' : colors.textMuted,
                        fontSize: 12, fontWeight: '600', marginTop: 2 
                      }}>
                        {p.status === 'completed' ? 'Completado' : p.status === 'surrendered' ? 'Rendido' : 'En progreso'}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {selectedChallenge?.status !== 'completed' && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity
                  style={{ flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444' + '20' }}
                  onPress={() => {
                    socialStore.surrenderChallenge(selectedChallenge.id, profile?.id || '');
                    setSelectedChallenge(null);
                  }}
                >
                  <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 15 }}>{t('social.challenges.surrender', 'Rendirse')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success }}
                  onPress={() => {
                    socialStore.completeChallengeAndAwardPoints(selectedChallenge.id, profile?.id || '');
                    setSelectedChallenge(null);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{t('social.challenges.complete', 'Completar')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}
