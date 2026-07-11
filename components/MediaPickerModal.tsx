import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Image as ImageIcon, Video, Music, X, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { Radius } from '../constants';

interface MediaPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onRecordVideo: () => void;
  onSelectLibrary: () => void;
  onSelectAudio?: () => void;
  title?: string;
  subtitle?: string;
}

export function MediaPickerModal({
  visible,
  onClose,
  onTakePhoto,
  onRecordVideo,
  onSelectLibrary,
  onSelectAudio,
  title,
  subtitle
}: MediaPickerModalProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.dragIndicator, { backgroundColor: colors.border + '50' }]} />
              
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {title || t('social.picker.title', 'Compartir Multimedia')}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {subtitle || t('social.picker.subtitle', '¿Qué te gustaría compartir hoy?')}
              </Text>

              <View style={styles.optionsContainer}>
                {/* Take Photo */}
                <TouchableOpacity
                  style={[styles.optionItem, { backgroundColor: colors.surfaceAlt + '40', borderColor: colors.border + '20' }]}
                  onPress={() => {
                    onTakePhoto();
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.iconWrapper}>
                    <Camera size={20} color="#FFF" strokeWidth={2.5} />
                  </LinearGradient>
                  <View style={styles.optionTexts}>
                    <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                      {t('social.picker.takePhoto', 'Tomar foto')}
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                      {t('social.picker.takePhotoDesc', 'Usa la cámara para capturar una foto')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Record Video */}
                <TouchableOpacity
                  style={[styles.optionItem, { backgroundColor: colors.surfaceAlt + '40', borderColor: colors.border + '20' }]}
                  onPress={() => {
                    onRecordVideo();
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#EF4444', '#B91C1C']} style={styles.iconWrapper}>
                    <Video size={20} color="#FFF" strokeWidth={2.5} />
                  </LinearGradient>
                  <View style={styles.optionTexts}>
                    <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                      {t('social.picker.recordVideo', 'Grabar video')}
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                      {t('social.picker.recordVideoDesc', 'Graba un video corto con tu cámara')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Choose from Library */}
                <TouchableOpacity
                  style={[styles.optionItem, { backgroundColor: colors.surfaceAlt + '40', borderColor: colors.border + '20' }]}
                  onPress={() => {
                    onSelectLibrary();
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#06B6D4', '#0891B2']} style={styles.iconWrapper}>
                    <ImageIcon size={20} color="#FFF" strokeWidth={2.5} />
                  </LinearGradient>
                  <View style={styles.optionTexts}>
                    <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                      {t('social.picker.gallery', 'Elegir de la galería')}
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                      {t('social.picker.galleryDesc', 'Selecciona fotos o videos existentes')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Choose Audio */}
                {onSelectAudio && (
                  <TouchableOpacity
                    style={[styles.optionItem, { backgroundColor: colors.surfaceAlt + '40', borderColor: colors.border + '20' }]}
                    onPress={() => {
                      onSelectAudio();
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.iconWrapper}>
                      <Music size={20} color="#FFF" strokeWidth={2.5} />
                    </LinearGradient>
                    <View style={styles.optionTexts}>
                      <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                        {t('social.picker.audio', 'Elegir archivo de audio')}
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                        {t('social.picker.audioDesc', 'Selecciona un archivo MP3 u otro audio')}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.surfaceAlt }]} onPress={onClose}>
                <Text style={[styles.cancelText, { color: colors.textPrimary }]}>
                  {t('common.cancel', 'Cancelar')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  dragIndicator: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
  },
  closeBtn: {
    padding: 4,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTexts: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.xl,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
export default MediaPickerModal;
