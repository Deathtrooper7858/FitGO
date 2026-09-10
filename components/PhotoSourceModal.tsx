import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Image as ImageIcon, X, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { Radius, Spacing } from '../constants';

interface PhotoSourceModalProps {
  visible: boolean;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  onClose: () => void;
}

export function PhotoSourceModal({
  visible,
  onSelectCamera,
  onSelectGallery,
  onClose,
}: PhotoSourceModalProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const handleCamera = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelectCamera();
    onClose();
  };

  const handleGallery = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelectGallery();
    onClose();
  };

  const handleClose = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay || 'rgba(0,0,0,0.65)' }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Drag Indicator */}
          <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={styles.headerIconGradient}
              >
                <Camera size={20} color="#FFF" strokeWidth={2.5} />
              </LinearGradient>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {t('profile.photoSourceTitle', 'Foto de Perfil')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {t('profile.photoSourceSubtitle', '¿Cómo te gustaría seleccionar tu nueva foto?')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionItem,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border + '60',
                },
              ]}
              onPress={handleCamera}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={styles.iconWrapper}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Camera size={22} color="#FFF" strokeWidth={2.5} />
              </LinearGradient>
              <View style={styles.optionTexts}>
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                  {t('profile.takePhoto', 'Tomar foto')}
                </Text>
                <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                  {t('profile.takePhotoDesc', 'Usa la cámara de tu dispositivo')}
                </Text>
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: colors.border + '30' }]}>
                <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionItem,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border + '60',
                },
              ]}
              onPress={handleGallery}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#06B6D4', '#0891B2']}
                style={styles.iconWrapper}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ImageIcon size={22} color="#FFF" strokeWidth={2.5} />
              </LinearGradient>
              <View style={styles.optionTexts}>
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                  {t('profile.chooseGallery', 'Elegir de la galería')}
                </Text>
                <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                  {t('profile.chooseGalleryDesc', 'Selecciona una imagen existente')}
                </Text>
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: colors.border + '30' }]}>
                <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              {t('common.cancel', 'Cancelar')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.base,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.base,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  dragIndicator: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerIconGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTexts: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
