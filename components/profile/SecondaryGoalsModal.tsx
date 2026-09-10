import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, X, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store';
import { supabase } from '../../services/supabase';
import { SECONDARY_GOAL_OPTIONS } from '../onboarding/SecondaryGoalsStep';

interface SecondaryGoalsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function SecondaryGoalsModal({
  visible,
  onClose,
  onSaved,
}: SecondaryGoalsModalProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const { profile, setProfile } = useAuthStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setSelected(profile.secondaryGoals || profile.secondary_goals || []);
    }
  }, [visible, profile]);

  const handleToggle = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      const updatedProfile = {
        ...profile,
        secondaryGoals: selected,
        secondary_goals: selected,
      };

      setProfile(updatedProfile);

      await supabase
        .from('users')
        .update({
          secondary_goals: selected,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Error saving secondary goals:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable
          style={[
            s.box,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border + '60',
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Ambient Header Glow */}
          <LinearGradient
            colors={[colors.primary + '18', 'transparent']}
            style={s.topGlow}
            pointerEvents="none"
          />

          {/* Header Row */}
          <View style={s.header}>
            <View style={s.titleRow}>
              <View style={[s.iconWrap, { backgroundColor: colors.primary + '20' }]}>
                <Sparkles size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.title, { color: colors.textPrimary }]}>
                  {t('onboarding.secondaryGoalsTitle', '¿Qué quieres lograr además de tu meta principal?')}
                </Text>
                <Text style={[s.subtitle, { color: colors.textSecondary }]}>
                  {t('onboarding.secondaryGoalsSub', 'Selecciona todas las que apliquen para personalizar tu plan.')}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: colors.surfaceAlt }]} hitSlop={8}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <ScrollView style={s.scroll} contentContainerStyle={s.listContainer} showsVerticalScrollIndicator={false}>
            {SECONDARY_GOAL_OPTIONS.map((item) => {
              const isActive = selected.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    s.optionCard,
                    { backgroundColor: colors.surfaceAlt + '60', borderColor: colors.border + '50' },
                    isActive && {
                      borderColor: item.color,
                      backgroundColor: colors.surfaceAlt,
                    },
                  ]}
                  onPress={() => handleToggle(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={[s.emojiWrap, { backgroundColor: colors.background }]}>
                    <Text style={s.emojiText}>{item.emoji}</Text>
                  </View>

                  <Text
                    style={[
                      s.optionLabel,
                      { color: colors.textPrimary },
                      isActive && { fontWeight: '700' },
                    ]}
                  >
                    {t(item.key, item.fallback)}
                  </Text>

                  <View
                    style={[
                      s.checkbox,
                      {
                        borderColor: isActive ? item.color : colors.border + '80',
                        backgroundColor: isActive ? item.color : 'transparent',
                      },
                    ]}
                  >
                    {isActive && <Check size={13} color="#FFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary + 'DD']}
              style={s.saveGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={s.saveText}>
                {saving ? t('common.saving', 'Guardando...') : t('common.save', 'Guardar Cambios')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    maxHeight: 380,
  },
  listContainer: {
    gap: 10,
    paddingVertical: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  emojiWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 20,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
