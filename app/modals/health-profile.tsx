import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Platform
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Apple, Heart, Pill } from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store';
import { supabase } from '../../services/supabase';
import { OnboardingData } from '../../components/onboarding/constants';
import {
  DietaryRestrictionsStep,
  MedicalConditionsStep,
  MedicationsStep,
} from '../../components/onboarding';

type TabId = 'restrictions' | 'conditions' | 'medications';

const HEALTH_TABS: { id: TabId; labelKey: string; defaultLabel: string; icon: React.ElementType }[] = [
  { id: 'restrictions',  labelKey: 'profile.dietaryRestrictions',   defaultLabel: 'Diet',        icon: Apple   },
  { id: 'conditions',   labelKey: 'profile.medicalConditions',      defaultLabel: 'Health',      icon: Heart   },
  { id: 'medications',  labelKey: 'profile.medicationsSupplements', defaultLabel: 'Medications', icon: Pill    },
];

export default function HealthProfileModal() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { profile, setProfile } = useAuthStore();

  // Mirror the OnboardingData shape so step components work identically
  const [data, setData] = useState<Partial<OnboardingData>>({
    dietaryRestrictions:    profile?.dietaryRestrictions    || [],
    medicalConditions:      profile?.medicalConditions      || [],
    medicationsSupplements: profile?.medicationsSupplements || [],
  });

  const [activeTab, setActiveTab] = useState<TabId>('restrictions');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (patch: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...patch }));
    if (saveSuccess) setSaveSuccess(false);
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .runOnJS(true)
    .onEnd((e) => {
      if (Math.abs(e.velocityX) > 400 || Math.abs(e.translationX) > 80) {
        Haptics.selectionAsync();
        const ids = HEALTH_TABS.map(t => t.id);
        const currentIndex = ids.indexOf(activeTab);
        const direction = e.translationX > 0 ? -1 : 1;
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < ids.length) {
          setActiveTab(ids[newIndex]);
        }
      }
    });

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('users').update({
        dietary_restrictions:    data.dietaryRestrictions,
        medical_conditions:      data.medicalConditions,
        medications_supplements: data.medicationsSupplements,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);

      if (error) throw error;

      setProfile({
        ...profile,
        dietaryRestrictions:    data.dietaryRestrictions    || [],
        medicalConditions:      data.medicalConditions      || [],
        medicationsSupplements: data.medicationsSupplements || [],
      });

      setSaveSuccess(true);
      setTimeout(() => router.back(), 600);
    } catch (err) {
      console.error(err);
      Alert.alert(t('common.error'), t('profile.healthProfileFailed', 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={[s.header, { borderBottomColor: colors.border + '44' }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>
          {t('profile.editHealthProfile', 'Health Profile')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Tab Bar ── */}
      <View style={[s.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border + '33' }]}>
        {HEALTH_TABS.map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[s.tab, active && { borderBottomColor: colors.primary }]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab.id);
              }}
            >
              <Icon size={18} color={active ? colors.primary : colors.textMuted} />
              <Text style={[s.tabText, { color: active ? colors.primary : colors.textMuted }]} numberOfLines={1} adjustsFontSizeToFit>
                {t(tab.labelKey, tab.defaultLabel).split(' ')[0]}
              </Text>
              {active && (
                <View style={[s.tabUnderline, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Step Content (reuses onboarding components 1:1) ── */}
      <GestureDetector gesture={swipeGesture}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'restrictions' && (
            <DietaryRestrictionsStep value={data} onChange={handleChange} />
          )}
          {activeTab === 'conditions' && (
            <MedicalConditionsStep value={data} onChange={handleChange} />
          )}
          {activeTab === 'medications' && (
            <MedicationsStep value={data} onChange={handleChange} />
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      </GestureDetector>

      {/* ── Save Footer ── */}
      <View style={[s.footer, { borderTopColor: colors.border + '44' }]}>
        <TouchableOpacity
          style={s.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={saveSuccess ? ['#10B981', '#059669'] : ['#7C5CFC', '#4338CA']}
            style={s.saveGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.saveText}>
                {saveSuccess ? `✓ ${t('common.saved', 'Saved!')}` : t('common.save', 'Save Changes')}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0, left: 8, right: 8,
    height: 3, borderRadius: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  content: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1,
  },
  saveBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  saveGrad: {
    paddingVertical: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
