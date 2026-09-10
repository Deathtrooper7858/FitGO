import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useConnectivity } from '../hooks/useConnectivity';

export function OfflineBanner() {
  const { t } = useTranslation();
  const isConnected = useConnectivity();

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{t('common.offline', 'Sin conexión')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
