import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Text, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';

interface AvatarViewerModalProps {
  visible: boolean;
  avatarUrl: string | null;
  name?: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');
const AVATAR_SIZE = Math.min(width * 0.78, 300);

export function AvatarViewerModal({ visible, avatarUrl, name, onClose }: AvatarViewerModalProps) {
  if (!avatarUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Blurred background */}
        {Platform.OS !== 'web' && (
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.overlay} />

        <TouchableOpacity activeOpacity={1} style={styles.content} onPress={() => {}}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#fff" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarRing}>
            <Image cachePolicy="memory-disk"
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>

          {/* Name */}
          {name ? (
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
          ) : null}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  content: {
    alignItems: 'center',
    gap: 18,
    zIndex: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: -(AVATAR_SIZE / 2 + 54),
    right: -AVATAR_SIZE / 2 + 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarRing: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
    backgroundColor: '#111',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
