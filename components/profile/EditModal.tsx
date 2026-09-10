import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { User, Scale, Ruler, Calendar, Check, Lock, X, Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
  visible,
  field,
  title,
  placeholder,
  keyboardType,
  initialValue,
  onSave,
  onClose,
  massUnit,
  lengthUnit,
  isPro,
  initialNameColor,
  role,
  premiumColor,
}: EditModalProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const [value, setValue] = useState(initialValue ?? '');
  const [selectedColor, setSelectedColor] = useState(initialNameColor ?? '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(initialValue ?? '');
      setSelectedColor(initialNameColor ?? '');
    }
  }, [visible, initialValue, initialNameColor]);

  // Metadatos temáticos según el campo
  let FieldIcon = User;
  let suffix = '';
  let fieldGradient: [string, string] = ['#7C5CFC', '#4F46E5'];
  let fieldAccent = '#7C5CFC';

  if (field === 'weight') {
    FieldIcon = Scale;
    suffix = massUnit;
    fieldGradient = ['#10B981', '#059669'];
    fieldAccent = '#10B981';
  } else if (field === 'height') {
    FieldIcon = Ruler;
    suffix = lengthUnit;
    fieldGradient = ['#3B82F6', '#1D4ED8'];
    fieldAccent = '#3B82F6';
  } else if (field === 'age') {
    FieldIcon = Calendar;
    fieldGradient = ['#F59E0B', '#D97706'];
    fieldAccent = '#F59E0B';
  } else if (field === 'name') {
    FieldIcon = User;
    fieldGradient = ['#7C5CFC', '#4F46E5'];
    fieldAccent = '#7C5CFC';
  }

  const allColors = [...PREMIUM_NAME_COLORS];
  if (role === 'admin' || role === 'owner' || role === 'super_admin') {
    allColors.push({ id: 'admin_glow', hex: 'admin_glow', name: 'Diamante Admin' });
  }

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(value, selectedColor);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <Pressable
            style={[
              styles.box,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border + '60',
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Ambient Glow */}
            <LinearGradient
              colors={[fieldAccent + '20', 'transparent']}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.headerLeft}>
                <LinearGradient colors={fieldGradient} style={styles.topIconGrad}>
                  <FieldIcon size={20} color="#fff" />
                </LinearGradient>
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    {field === 'name'
                      ? t('profile.editNameSubtitle', 'Actualiza tu nombre de perfil público')
                      : field === 'weight'
                      ? t('profile.editWeightSubtitle', 'Registra tu peso corporal actual')
                      : field === 'height'
                      ? t('profile.editHeightSubtitle', 'Establece tu estatura actual')
                      : field === 'age'
                      ? t('profile.editAgeSubtitle', 'Configura tu edad actual')
                      : ''}
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

            {/* Input Container */}
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surfaceAlt + '60',
                  borderColor: isFocused ? fieldAccent : colors.border + '45',
                  borderWidth: isFocused ? 2 : 1.5,
                },
              ]}
            >
              <FieldIcon
                size={19}
                color={isFocused ? fieldAccent : colors.textMuted}
                style={styles.inputIcon}
              />
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
                  <X size={15} color={colors.textMuted} />
                </TouchableOpacity>
              )}

              {/* Chip de unidad integrado */}
              {suffix !== '' && (
                <View
                  style={[
                    styles.suffixBadge,
                    {
                      backgroundColor: isFocused ? fieldAccent + '20' : colors.surfaceAlt,
                      borderColor: isFocused ? fieldAccent + '50' : colors.border + '40',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.suffixText,
                      { color: isFocused ? fieldAccent : colors.textSecondary },
                    ]}
                  >
                    {suffix.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Selector de color de nombre (Pro) */}
            {field === 'name' && (
              <View style={styles.nameColorWrap}>
                <View style={styles.nameColorHeader}>
                  <Crown size={14} color="#FFB800" />
                  <Text style={[styles.nameColorLabel, { color: colors.textSecondary }]}>
                    {t('profile.nameColorPro', 'Color del Nombre (Pro)')}
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.colorsScroll}
                >
                  {/* Opción por defecto */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.colorSwatchBtn,
                      {
                        backgroundColor: colors.textPrimary,
                        borderColor: selectedColor === '' ? fieldAccent : 'transparent',
                        borderWidth: selectedColor === '' ? 2.5 : 1,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedColor('');
                    }}
                  >
                    {selectedColor === '' && (
                      <Check size={18} color={colors.surface} strokeWidth={3} />
                    )}
                  </TouchableOpacity>

                  {/* Colores Pro */}
                  {allColors.map((c) => {
                    const isSel = selectedColor === c.hex;
                    const isAdminGlow = c.hex === 'admin_glow';
                    const hasAccess = isPro || isAdminGlow;

                    return (
                      <TouchableOpacity
                        key={c.id}
                        activeOpacity={0.8}
                        style={[
                          styles.colorSwatchBtn,
                          {
                            backgroundColor: isAdminGlow ? 'transparent' : c.hex,
                            borderColor: isSel ? '#FFF' : 'transparent',
                            borderWidth: isSel ? 2.5 : 1,
                            opacity: hasAccess ? 1 : 0.65,
                          },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          if (hasAccess) {
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
                        {isSel ? (
                          <Check size={18} color="#FFF" strokeWidth={3} />
                        ) : !hasAccess ? (
                          <Lock size={13} color="#FFF" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Botones de acción */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={[
                  styles.cancelBtn,
                  {
                    borderColor: colors.border + '50',
                    backgroundColor: colors.surfaceAlt + '40',
                  },
                ]}
                onPress={onClose}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                  {t('common.cancel', 'Cancelar')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.saveBtn}
                onPress={handleSave}
              >
                <LinearGradient colors={fieldGradient} style={styles.saveGrad}>
                  <Check size={16} color="#FFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <Text style={styles.saveText}>{t('common.save', 'Guardar')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardWrap: {
    width: '100%',
    maxWidth: 400,
  },
  box: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  headerContainer: {
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
  topIconGrad: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    height: '100%',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  suffixBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  suffixText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Name color picker
  nameColorWrap: {
    marginBottom: 16,
  },
  nameColorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  nameColorLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  colorsScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  colorSwatchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  // Acciones
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    height: 46,
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
