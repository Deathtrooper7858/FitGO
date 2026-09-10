import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { X, Check, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';

interface SexSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  selectedValue?: string;
  premiumColor?: string | null;
}

export function SexSelectionModal({
  visible,
  onClose,
  onSelect,
  selectedValue,
  premiumColor,
}: SexSelectionModalProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const [localSelection, setLocalSelection] = useState(selectedValue ?? '');
  const [customValue, setCustomValue] = useState('');
  const [isOther, setIsOther] = useState(false);

  useEffect(() => {
    if (visible) {
      const isPredefined = selectedValue === 'male' || selectedValue === 'female';
      if (selectedValue && !isPredefined) {
        setLocalSelection('other');
        setCustomValue(selectedValue);
        setIsOther(true);
      } else {
        setLocalSelection(selectedValue ?? '');
        setCustomValue('');
        setIsOther(selectedValue === 'other');
      }
    }
  }, [visible, selectedValue]);

  const handleSelectOption = (opt: string) => {
    Haptics.selectionAsync();
    setLocalSelection(opt);
    if (opt === 'other') {
      setIsOther(true);
    } else {
      setIsOther(false);
      onSelect(opt);
      onClose();
    }
  };

  const handleSaveCustom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const finalVal = customValue.trim() || 'other';
    onSelect(finalVal);
    onClose();
  };

  const safeColor = premiumColor === 'admin_glow' ? '#00F0FF' : premiumColor;
  const accentGradient: [string, string] =
    safeColor && safeColor.startsWith('#')
      ? [safeColor, safeColor + 'AA']
      : (colors.gradientPrimary as [string, string]);

  const OPTIONS = [
    {
      id: 'male',
      emoji: '👨',
      label: t('profile.male', 'Hombre'),
      sub: t('profile.maleDesc', 'Estimación metabólica masculina'),
      gradient: ['#3B82F6', '#1D4ED8'] as [string, string],
    },
    {
      id: 'female',
      emoji: '👩',
      label: t('profile.female', 'Mujer'),
      sub: t('profile.femaleDesc', 'Estimación metabólica femenina'),
      gradient: ['#EC4899', '#BE185D'] as [string, string],
    },
    {
      id: 'other',
      emoji: '✨',
      label: t('profile.other', 'Otro'),
      sub: t('profile.otherDesc', 'Personalizado / No binario'),
      gradient: ['#8B5CF6', '#6D28D9'] as [string, string],
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          style={styles.keyboardWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={[
              styles.content,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border + '60',
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Manija superior */}
            <View style={[styles.handle, { backgroundColor: colors.border + '80' }]} />

            {/* Cabecera */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <LinearGradient colors={['#7C5CFC', '#4F46E5']} style={styles.iconWrap}>
                  <Users size={18} color="#FFF" />
                </LinearGradient>
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>
                    {t('profile.sex', 'Sexo Biológico')}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    {t(
                      'profile.bmrQuest',
                      'Se usa para calcular con precisión tu tasa metabólica basal (BMR):'
                    )}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Lista de Opciones */}
            <ScrollView
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {OPTIONS.map((opt) => {
                const isSelected = localSelection === opt.id;

                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.78}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected ? colors.surfaceAlt : colors.surfaceAlt + '40',
                        borderColor: isSelected ? colors.primary : colors.border + '40',
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => handleSelectOption(opt.id)}
                  >
                    <LinearGradient colors={opt.gradient} style={styles.emojiCircle}>
                      <Text style={{ fontSize: 18 }}>{opt.emoji}</Text>
                    </LinearGradient>

                    <View style={styles.optionTextCol}>
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isSelected ? colors.textPrimary : colors.textPrimary,
                            fontWeight: isSelected ? '800' : '700',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                        {opt.sub}
                      </Text>
                    </View>

                    {isSelected ? (
                      <View style={[styles.checkContainer, { backgroundColor: colors.primary }]}>
                        <Check size={13} color="#fff" strokeWidth={3} />
                      </View>
                    ) : (
                      <View style={[styles.uncheckContainer, { borderColor: colors.border + '70' }]} />
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Input personalizado si selecciona "Otro" */}
              {isOther && (
                <View style={styles.customInputWrapper}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    {t('profile.specifyOther', 'Especifica tu opción:')}
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: colors.surfaceAlt + '60',
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary }]}
                      value={customValue}
                      onChangeText={setCustomValue}
                      placeholder={t('profile.specifyPlaceholder', 'Ej: No binario, etc.')}
                      placeholderTextColor={colors.textMuted}
                      maxLength={30}
                      autoFocus
                    />
                    {!!customValue && (
                      <TouchableOpacity onPress={() => setCustomValue('')} style={styles.clearBtn}>
                        <X size={15} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.saveBtn}
                    onPress={handleSaveCustom}
                  >
                    <LinearGradient colors={accentGradient} style={styles.saveGrad}>
                      <Check size={16} color="#fff" strokeWidth={2.5} style={{ marginRight: 6 }} />
                      <Text style={styles.saveText}>{t('common.save', 'Guardar')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'flex-end',
  },
  keyboardWrap: {
    width: '100%',
  },
  content: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingTop: 10,
    maxHeight: '85%',
    borderWidth: 1.5,
    borderBottomWidth: 0,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    gap: 10,
    paddingBottom: 30,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  emojiCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextCol: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
  },
  optionSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  checkContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  customInputWrapper: {
    marginTop: 6,
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    height: '100%',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    height: 46,
    marginTop: 4,
  },
  saveGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
