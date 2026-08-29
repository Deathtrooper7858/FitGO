import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal, TextInput, KeyboardAvoidingView,
  Platform, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { User, Scale, Ruler, Calendar, Check, Lock, X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

const PREMIUM_NAME_COLORS = [
  { id: 'gold', hex: '#FFC000', name: 'Dorado Élite' },
  { id: 'electric', hex: '#3B82F6', name: 'Azul Eléctrico' },
  { id: 'neon', hex: '#10B981', name: 'Verde Neón' },
  { id: 'ruby', hex: '#EF4444', name: 'Rojo Rubí' },
  { id: 'magenta', hex: '#D946EF', name: 'Magenta' },
  { id: 'fire', hex: '#FF5722', name: 'Naranja Fuego' },
  { id: 'ocean', hex: '#06B6D4', name: 'Turquesa' },
  { id: 'purple', hex: '#8B5CF6', name: 'Púrpura' },
  { id: 'silver', hex: '#94A3B8', name: 'Plata' },
];

interface EditModalProps {
  visible: boolean;
  field: string;
  title: string;
  placeholder: string;
  keyboardType?: 'numeric' | 'default';
  initialValue?: string;
  onSave: (val: string, color?: string) => void;
  onClose: () => void;
  massUnit: string;
  lengthUnit: string;
  isPro?: boolean;
  initialNameColor?: string;
  role?: string;
  premiumColor?: string | null;
}

export function EditModal({
  visible, field, title, placeholder, keyboardType, initialValue,
  onSave, onClose, massUnit, lengthUnit, isPro, initialNameColor,
  role, premiumColor,
}: EditModalProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const safeColor = premiumColor === 'admin_glow' ? '#00F0FF' : premiumColor;
  const accentGradient: [string, string] = (safeColor && safeColor.startsWith('#'))
    ? [safeColor, safeColor + 'AA']
    : colors.gradientPrimary as [string, string];
  const [value, setValue] = useState(initialValue ?? '');
  const [selectedColor, setSelectedColor] = useState(initialNameColor ?? '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(initialValue ?? '');
      setSelectedColor(initialNameColor ?? '');
    }
  }, [visible, initialValue, initialNameColor]);

  let FieldIcon = User;
  let suffix = '';
  if (field === 'weight') { FieldIcon = Scale; suffix = massUnit; }
  else if (field === 'height') { FieldIcon = Ruler; suffix = lengthUnit; }
  else if (field === 'age') { FieldIcon = Calendar; }
  else if (field === 'name') { FieldIcon = User; }

  const allColors = [...PREMIUM_NAME_COLORS];
  if (role === 'admin' || role === 'owner' || role === 'super_admin') {
    allColors.push({ id: 'admin_glow', hex: 'admin_glow', name: 'Diamante Admin' });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: 'rgba(15, 23, 42, 0.5)' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <LinearGradient colors={accentGradient} style={styles.topIconGrad}>
              <FieldIcon size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {field === 'name' ? t('profile.editNameSubtitle', 'Actualiza tu nombre de perfil') :
                 field === 'weight' ? t('profile.editWeightSubtitle', 'Registra tu peso actual') :
                 field === 'height' ? t('profile.editHeightSubtitle', 'Establece tu estatura actual') :
                 field === 'age' ? t('profile.editAgeSubtitle', 'Configura tu edad actual') : ''}
              </Text>
            </View>
          </View>

          {/* Input */}
          <View style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: isFocused ? (safeColor || colors.primary) : colors.border,
            }
          ]}>
            <FieldIcon size={20} color={isFocused ? (safeColor || colors.primary) : colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              keyboardType={keyboardType ?? 'default'}
              autoFocus
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {!!value && value.length > 0 && (
              <TouchableOpacity onPress={() => setValue('')} style={styles.clearBtn}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
            {suffix !== '' && (
              <Text style={[styles.suffix, { color: isFocused ? (safeColor || colors.primary) : colors.textSecondary }]}>
                {suffix.toUpperCase()}
              </Text>
            )}
          </View>

          {/* Name color picker */}
          {field === 'name' && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 12 }}>
                {t('profile.nameColorPro', 'Color del Nombre (Pro)')}
              </Text>
              <ScrollView
                ref={(ref) => {
                  if (ref) {
                    // We can scroll to the position of the selected color
                    // Each item is 44px + 12px gap.
                    // The default option (selectedColor === '') is at index 0.
                    let idx = 0;
                    if (selectedColor !== '') {
                      const foundIdx = allColors.findIndex(c => c.hex === selectedColor);
                      if (foundIdx !== -1) {
                        idx = foundIdx + 1; // +1 to account for the default option
                      }
                    }
                    // Approx offset calculation: idx * (itemWidth + gap)
                    // itemWidth = 44, gap = 12
                    const offset = Math.max(0, idx * 56 - 40); // Subtracting a bit so it centers/shows context
                    setTimeout(() => {
                      ref.scrollTo({ x: offset, animated: true });
                    }, 50);
                  }
                }}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: colors.textPrimary,
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 3,
                    borderColor: selectedColor === '' ? colors.primary : 'transparent',
                  }}
                  onPress={() => setSelectedColor('')}
                >
                  {selectedColor === '' && <Check size={20} color={colors.surface} strokeWidth={3} />}
                </TouchableOpacity>
                {allColors.map(c => {
                  const isSel = selectedColor === c.hex;
                  const isAdminGlow = c.hex === 'admin_glow';
                  return (
                    <TouchableOpacity
                      key={c.id}
                      activeOpacity={0.8}
                      style={{
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: isAdminGlow ? 'transparent' : c.hex,
                        justifyContent: 'center', alignItems: 'center',
                        borderWidth: 3,
                        borderColor: isSel ? colors.textPrimary : 'transparent',
                        opacity: isPro || isAdminGlow ? 1 : 0.5,
                        overflow: 'hidden'
                      }}
                      onPress={() => {
                        if (isPro || isAdminGlow) {
                          setSelectedColor(c.hex);
                        } else {
                          onClose();
                          setTimeout(() => router.push('/modals/paywall'), 300);
                        }
                      }}
                    >
                      {isAdminGlow && (
                        <LinearGradient
                          colors={['#00F0FF', '#7C5CFC']}
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                      {isSel && <Check size={20} color="#fff" strokeWidth={3} style={{ zIndex: 10 }} />}
                      {!isPro && !isSel && !isAdminGlow && <Lock size={16} color="#fff" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Actions */}
          <View style={styles.row}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt + '30' }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.saveBtn}
              onPress={() => { onSave(value, selectedColor); onClose(); }}
            >
              <LinearGradient colors={accentGradient} style={styles.saveGrad}>
                <Check size={18} color="#fff" strokeWidth={2.5} style={{ marginRight: 6 }} />
                <Text style={styles.saveText}>{t('common.save')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 20 },
  box: { borderRadius: 24, padding: 24, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  topIconGrad: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, marginTop: 2, opacity: 0.8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, height: 54, marginBottom: 20 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', paddingVertical: 10, height: '100%' },
  clearBtn: { padding: 6, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  suffix: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginLeft: 4 },
  row: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderRadius: 16, borderWidth: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700' },
  saveBtn: { flex: 1, borderRadius: 16, overflow: 'hidden', height: 48 },
  saveGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
