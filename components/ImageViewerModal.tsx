import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Text, Dimensions, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';

interface ImageViewerModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

export function ImageViewerModal({ visible, imageUri, onClose }: ImageViewerModalProps) {
  if (!imageUri) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <X size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="contain"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  image: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
});
