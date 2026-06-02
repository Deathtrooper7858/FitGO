import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, LayoutAnimation, Platform, Modal } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Sword, Bot, X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Radius } from '../../constants';
import { GlassCard } from '../../components/GlassCard';
import { useSocialStore, useAuthStore, useSettingsStore } from '../../store';
import { generateSocialChallenge } from '../../services/groq';
import { getLocalDateString } from '../../utils/date';

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
  const { language } = useSettingsStore();
  const socialStore = useSocialStore();

  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

// Challenges state
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [showRankingInstructions, setShowRankingInstructions] = useState(false);

  const [inspectingUser, setInspectingUser] = useState<any>(null);
  const { achievements, unlockedCount } = require('../../hooks/useAchievements').useAchievements();
  const ALL_BADGES = require('../../hooks/useAchievements').ALL_BADGES;

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

  
const generateAIChallenge = async () => {
    setAiLoading(true);
    try {
      const response = await generateSocialChallenge(language);
      setAiRecommendation(response);
    } catch (err) {
      setAiRecommendation('Camina 10,000 pasos durante 3 días seguidos.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateChallenge = async (overrideTitle?: string, overrideFriendIds?: string[], overrideIncludeSelf?: boolean) => {
    if (!profile?.id) return;
    const title = overrideTitle || challengeForm.title;
    if (!title) return;
    
    const targetVal = challengeForm.type === 'physical' ? 1 : (parseFloat(challengeForm.target_value) || 0);
    const days = parseInt(challengeForm.duration_days) || 7;
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    const challenge = {
      creator_id: profile.id,
      title,
      description: overrideTitle
        ? (aiRecommendation || '')
        : (challengeForm.type === 'physical' ? challengeForm.custom_goal : challengeForm.description),
      type: overrideTitle ? challengeForm.type : challengeForm.type,
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

  
  

  const acceptedFriends = socialStore.friends.filter(f => f.status === 'accepted');

  return (
    <View style={ s.tabContent }>
      {/* Content from renderChallenges */}
      
      <View style={s.tabContent}>
        {!isCreatingChallenge ? (
          <GlassCard accentColor={colors.error} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Sword size={24} color={colors.error} />
              <Text style={[s.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('social.challenges.fitgoChallenges', 'FitGo Challenges')}</Text>
            </View>

            <TouchableOpacity 
              style={[s.aiBtn, { backgroundColor: colors.surfaceAlt }]}
              onPress={generateAIChallenge}
            >
              <Bot size={20} color={colors.primary} />
              <Text style={{ color: colors.textPrimary, fontWeight: '700', flex: 1 }}>{t('social.challenges.suggestAI', 'Fitz Suggestion (AI)')}</Text>
            </TouchableOpacity>

            {aiLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 15 }} />}

            {aiRecommendation && !aiLoading && (
              <View style={[s.aiResult, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '33' }]}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontStyle: 'italic', lineHeight: 20 }}>"{aiRecommendation}"</Text>
                <TouchableOpacity 
                  style={[s.actionBtn, { backgroundColor: colors.primary, marginTop: 12, alignSelf: 'flex-start' }]}
                  onPress={() => {
                    setAiChallengeTitle(`Reto IA: ${new Date().toLocaleDateString()}`);
                    setAiChallengeSelectedFriends([]);
                    setAiChallengeParticipantModal(true);
                  }}
                >
                  <Text style={s.actionBtnText}>{t('social.challenges.acceptChallenge')}</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity 
              style={[s.mainBtn, { backgroundColor: colors.primary, marginTop: 15 }]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsCreatingChallenge(true);
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('social.challenges.newCustomChallenge', 'New Custom Challenge')}</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <GlassCard accentColor={colors.primary} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[s.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Crear Nuevo Reto</Text>
              <TouchableOpacity onPress={() => setIsCreatingChallenge(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[s.label, { color: colors.textSecondary }]}>Título del Reto</Text>
            <TextInput
              style={[s.inputField, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary }]}
              placeholder={t('social.challenges.titlePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={challengeForm.title}
              onChangeText={t => setChallengeForm({...challengeForm, title: t})}
            />

            <Text style={[s.label, { color: colors.textSecondary }]}>Descripción</Text>
            <TextInput
              style={[s.inputField, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, height: 80 }]}
              placeholder={t('social.challenges.descPlaceholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              value={challengeForm.description}
              onChangeText={t => setChallengeForm({...challengeForm, description: t})}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: colors.textSecondary }]}>Tipo</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(['steps', 'calories', 'physical'] as const).map(type => (
                    <TouchableOpacity 
                      key={type}
                      style={[
                        s.typeBtn, 
                        { backgroundColor: challengeForm.type === type ? colors.primary : colors.surfaceAlt }
                      ]}
                      onPress={() => setChallengeForm({...challengeForm, type})}
                    >
                      <Text style={{ color: challengeForm.type === type ? '#fff' : colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
                        {type === 'steps' ? '🚶 Pasos' : type === 'calories' ? '🔥 Calorías' : '💪 Físico'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: colors.textSecondary }]}>Días</Text>
                <TextInput
                  style={[s.inputField, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, marginBottom: 0 }]}
                  keyboardType="numeric"
                  value={challengeForm.duration_days}
                  onChangeText={t => setChallengeForm({...challengeForm, duration_days: t})}
                />
              </View>
            </View>

            {challengeForm.type === 'physical' ? (
              <View>
                <Text style={[s.label, { color: colors.textSecondary }]}>Objetivo personalizado</Text>
                <TextInput
                  style={[s.inputField, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, height: 80 }]}
                  placeholder="Ej. Hacer 100 flexiones en total, completar 5 km..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={challengeForm.custom_goal}
                  onChangeText={t => setChallengeForm({...challengeForm, custom_goal: t})}
                />
              </View>
            ) : (
              <View>
                <Text style={[s.label, { color: colors.textSecondary }]}>Objetivo ({challengeForm.type === 'steps' ? 'Pasos por día' : 'Calorías por día'})</Text>
                <TextInput
                  style={[s.inputField, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary }]}
                  keyboardType="numeric"
                  value={challengeForm.target_value}
                  onChangeText={t => setChallengeForm({...challengeForm, target_value: t})}
                />
              </View>
            )}

            <Text style={[s.label, { color: colors.textSecondary }]}>¿Quiénes participan?</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 10 }}>Toca para seleccionar. Puedes incluirte a ti y a varios amigos.</Text>
            
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
                <Text style={{ color: colors.textPrimary, fontSize: 12, marginTop: 8, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>
                  Yo
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
                    <Text style={{ color: colors.textPrimary, fontSize: 12, marginTop: 8, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>
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
                  ? '🎯 Comenzar (solo yo)'
                  : challengeForm.selectedFriendIds.length > 0 && challengeForm.includeSelf
                  ? `⚔️ Yo + ${challengeForm.selectedFriendIds.length} amigo${challengeForm.selectedFriendIds.length > 1 ? 's' : ''}`
                  : challengeForm.selectedFriendIds.length > 0
                  ? `⚔️ Retar a ${challengeForm.selectedFriendIds.length} amigo${challengeForm.selectedFriendIds.length > 1 ? 's' : ''} (sin mí)`
                  : '🎯 Comenzar'
                }
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        <Text style={[s.sectionTitle, { color: colors.textPrimary, marginLeft: 8, marginBottom: 12 }]}>{t('social.challenges.activeChallenges', 'Active Challenges')}</Text>
        {socialStore.challenges.length === 0 ? (
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10 }}>{t('social.challenges.noActiveChallenges', 'No active challenges.')}</Text>
        ) : (
          socialStore.challenges.map(challenge => (
            <GlassCard key={challenge.id} style={{ marginBottom: 12, borderLeftWidth: 4, borderLeftColor: challenge.status === 'completed' ? colors.success : colors.error }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.userName, { color: colors.textPrimary, fontSize: 16 }]}>{challenge.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{challenge.description || `Reto de ${challenge.type}`}</Text>
                  
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <View style={[s.chip, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                        {challenge.type === 'steps' ? 'Pasos' : 'Calorías'}
                      </Text>
                    </View>
                    <View style={[s.chip, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                        Objetivo: {challenge.target_value}
                      </Text>
                    </View>
                  </View>

                  {/* Progress mock since we don't have realtime progression tracked perfectly yet */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                    <View style={{ height: 6, flex: 1, backgroundColor: colors.border + '33', borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ width: challenge.status === 'completed' ? '100%' : '35%', height: '100%', backgroundColor: challenge.status === 'completed' ? colors.success : colors.primary, borderRadius: 3 }} />
                    </View>
                    <Text style={{ color: challenge.status === 'completed' ? colors.success : colors.primary, fontSize: 11, fontWeight: '800', marginLeft: 10 }}>
                      {challenge.status === 'completed' ? '100%' : '35%'}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          ))
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
            
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 4 }}>¿Quiénes participan?</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 20 }}>Selecciona a ti mismo y/o a tus amigos para este reto.</Text>

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
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Yo ({profile?.name})</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Participar en el reto</Text>
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
                      <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{friend.friend_profile?.name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>Amigo</Text>
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
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 15 }}>Cancelar</Text>
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
                      ? '🎯 Aceptar (solo yo)'
                      : aiChallengeSelectedFriends.length > 0 && aiChallengeIncludeSelf
                      ? `⚔️ Yo + ${aiChallengeSelectedFriends.length} amigo${aiChallengeSelectedFriends.length > 1 ? 's' : ''}`
                      : `⚔️ Retar a ${aiChallengeSelectedFriends.length} amigo${aiChallengeSelectedFriends.length > 1 ? 's' : ''}`
                    }
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
