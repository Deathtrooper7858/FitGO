import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

interface SexSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  selectedValue?: string;
  premiumColor?: string | null;
}

export function SexSelectionModal({
  visible, onClose, onSelect, selectedValue, premiumColor
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
    const finalVal = customValue.trim() || 'other';
    onSelect(finalVal);
    onClose();
  };

  const safeColor = premiumColor === 'admin_glow' ? '#00F0FF' : premiumColor;
  const accentGradient: [string, string] = (safeColor && safeColor.startsWith('#'))
    ? [safeColor, safeColor + 'AA']
    : colors.gradientPrimary as [string, string];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.content, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {t('profile.sex', 'Sex')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {t('profile.bmrQuest', 'Used to calculate your basal metabolic rate:')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Male option card */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.optionCard,
                {
                  backgroundColor: localSelection === 'male' ? colors.primary + '15' : colors.surfaceAlt,
                  borderColor: localSelection === 'male' ? colors.primary : colors.border,
                }
              ]}
              onPress={() => handleSelectOption('male')}
            >
              <Text style={styles.optionEmoji}>👨</Text>
              <Text style={[styles.optionLabel, { color: colors.textPrimary, fontWeight: localSelection === 'male' ? '800' : '600' }]}>
                {t('profile.male', 'Hombre')}
              </Text>
              {localSelection === 'male' && (
                <View style={[styles.checkContainer, { backgroundColor: colors.primary }]}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>

            {/* Female option card */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.optionCard,
                {
                  backgroundColor: localSelection === 'female' ? colors.primary + '15' : colors.surfaceAlt,
                  borderColor: localSelection === 'female' ? colors.primary : colors.border,
                }
              ]}
              onPress={() => handleSelectOption('female')}
            >
              <Text style={styles.optionEmoji}>👩</Text>
              <Text style={[styles.optionLabel, { color: colors.textPrimary, fontWeight: localSelection === 'female' ? '800' : '600' }]}>
                {t('profile.female', 'Mujer')}
              </Text>
              {localSelection === 'female' && (
                <View style={[styles.checkContainer, { backgroundColor: colors.primary }]}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>

            {/* Other option card */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.optionCard,
                {
                  backgroundColor: localSelection === 'other' ? colors.primary + '15' : colors.surfaceAlt,
                  borderColor: localSelection === 'other' ? colors.primary : colors.border,
                }
              ]}
              onPress={() => handleSelectOption('other')}
            >
              <Text style={styles.optionEmoji}>✨</Text>
              <Text style={[styles.optionLabel, { color: colors.textPrimary, fontWeight: localSelection === 'other' ? '800' : '600' }]}>
                {t('profile.other', 'Otro')}
              </Text>
              {localSelection === 'other' && (
                <View style={[styles.checkContainer, { backgroundColor: colors.primary }]}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>

            {/* Custom specification input (Only visible when other is selected) */}
            {isOther && (
              <View style={styles.customInputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {t('profile.specifyOther', 'Especifica tu sexo/género:')}
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
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
                      <X size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Save button for custom value */}
                <TouchableOpacity
                  activeOpacity={0.8}
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  content: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingTop: 12, maxHeight: '85%', borderWidth: 1, borderBottomWidth: 0 },
  handle: { width: 48, height: 5, borderRadius: 2.5, alignSelf: 'center', marginBottom: 20, opacity: 0.6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerTextContainer: { flex: 1, paddingRight: 16 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  list: { gap: 12, paddingBottom: 40 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1.5, gap: 14, height: 58 },
  optionEmoji: { fontSize: 20 },
  optionLabel: { fontSize: 16, flex: 1 },
  checkContainer: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  customInputWrapper: { marginTop: 12, gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, height: 50 },
  input: { flex: 1, fontSize: 15, fontWeight: '600', height: '100%' },
  clearBtn: { padding: 4 },
  saveBtn: { borderRadius: 16, overflow: 'hidden', height: 48, marginTop: 8 },
  saveGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
