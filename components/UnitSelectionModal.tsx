import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, X, Scale, Droplets, Ruler, Zap, Thermometer, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

export interface UnitOption {
  value: string;
  label: string;
  description?: string;
}

export interface UnitSelectionModalProps {
  visible: boolean;
  title: string;
  options: UnitOption[];
  selectedValue: string;
  onSelect: (value: any) => void;
  onClose: () => void;
}

function getUnitMeta(title: string, sampleVal?: string) {
  const t = (title || '').toLowerCase();
  if (
    t.includes('masa') ||
    t.includes('peso') ||
    t.includes('mass') ||
    t.includes('weight') ||
    sampleVal === 'kg' ||
    sampleVal === 'lb' ||
    sampleVal === 'g'
  ) {
    return {
      icon: Scale,
      color: '#10B981',
      gradient: ['#10B981', '#059669'] as [string, string],
      subtitle: 'Para registro de alimentos, peso corporal y cargas',
    };
  }
  if (
    t.includes('volumen') ||
    t.includes('volume') ||
    t.includes('agua') ||
    sampleVal === 'ml' ||
    sampleVal === 'l' ||
    sampleVal === 'oz'
  ) {
    return {
      icon: Droplets,
      color: '#06B6D4',
      gradient: ['#06B6D4', '#0891B2'] as [string, string],
      subtitle: 'Para hidratación, bebidas y líquidos diarios',
    };
  }
  if (
    t.includes('longitud') ||
    t.includes('estatura') ||
    t.includes('length') ||
    t.includes('height') ||
    sampleVal === 'cm' ||
    sampleVal === 'in' ||
    sampleVal === 'ft'
  ) {
    return {
      icon: Ruler,
      color: '#6366F1',
      gradient: ['#6366F1', '#4338CA'] as [string, string],
      subtitle: 'Para estatura, medidas corporales y distancias',
    };
  }
  if (t.includes('energ') || sampleVal === 'kcal' || sampleVal === 'kj') {
    return {
      icon: Zap,
      color: '#F59E0B',
      gradient: ['#F59E0B', '#D97706'] as [string, string],
      subtitle: 'Para calorías, gasto metabólico y nutrición',
    };
  }
  if (t.includes('temp') || sampleVal === 'c' || sampleVal === 'f') {
    return {
      icon: Thermometer,
      color: '#EC4899',
      gradient: ['#EC4899', '#BE185D'] as [string, string],
      subtitle: 'Para clima y temperatura corporal o ambiental',
    };
  }
  return {
    icon: Sparkles,
    color: '#7C5CFC',
    gradient: ['#7C5CFC', '#4F46E5'] as [string, string],
    subtitle: 'Elige tu preferencia de medición',
  };
}

function getSystemBadge(val: string) {
  const v = val.toLowerCase();
  if (['kg', 'g', 'ml', 'l', 'cm', 'm', 'c'].includes(v)) {
    return { label: 'Métrico', isMetric: true };
  }
  if (['lb', 'oz', 'in', 'ft', 'f'].includes(v)) {
    return { label: 'Imperial', isMetric: false };
  }
  if (['kcal', 'kj'].includes(v)) {
    return { label: 'Nutricional', isMetric: true };
  }
  return null;
}

export function UnitSelectionModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: UnitSelectionModalProps) {
  const colors = useTheme();

  const meta = getUnitMeta(title, options[0]?.value);
  const IconComp = meta.icon;

  const handleSelect = (val: string) => {
    Haptics.selectionAsync();
    onSelect(val);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable
          style={[
            s.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border + '60',
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Ambient Glow */}
          <LinearGradient
            colors={[meta.color + '20', 'transparent']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Cabecera */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <LinearGradient colors={meta.gradient} style={s.iconWrap}>
                <IconComp size={20} color="#FFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.title, { color: colors.textPrimary }]}>
                  {title}
                </Text>
                <Text style={[s.subtitle, { color: colors.textMuted }]}>
                  {meta.subtitle}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[s.closeBtn, { backgroundColor: colors.surfaceAlt }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Lista de Opciones */}
          <View style={s.optionsContainer}>
            {options.map((option) => {
              const isSelected = option.value === selectedValue;
              const badge = getSystemBadge(option.value);

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    s.optionCard,
                    {
                      backgroundColor: isSelected ? colors.surfaceAlt : colors.surfaceAlt + '40',
                      borderColor: isSelected ? meta.color : colors.border + '40',
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                  activeOpacity={0.78}
                  onPress={() => handleSelect(option.value)}
                >
                  {/* Chip de Abreviatura */}
                  <View
                    style={[
                      s.symbolChip,
                      {
                        backgroundColor: isSelected ? meta.color + '25' : colors.surface,
                        borderColor: isSelected ? meta.color + '60' : colors.border + '50',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.symbolText,
                        { color: isSelected ? meta.color : colors.textPrimary },
                      ]}
                    >
                      {option.value.toUpperCase()}
                    </Text>
                  </View>

                  {/* Textos */}
                  <View style={s.textCol}>
                    <Text
                      style={[
                        s.optionLabel,
                        {
                          color: isSelected ? colors.textPrimary : colors.textPrimary,
                          fontWeight: isSelected ? '800' : '700',
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {badge && (
                      <Text style={[s.systemBadgeText, { color: colors.textMuted }]}>
                        {badge.label}
                      </Text>
                    )}
                  </View>

                  {/* Indicador de Selección */}
                  {isSelected ? (
                    <View style={[s.checkCircle, { backgroundColor: meta.color }]}>
                      <Check size={14} color="#FFF" strokeWidth={3} />
                    </View>
                  ) : (
                    <View style={[s.uncheckCircle, { borderColor: colors.border + '70' }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
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
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  symbolChip: {
    minWidth: 42,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  symbolText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  textCol: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
  },
  systemBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
});
