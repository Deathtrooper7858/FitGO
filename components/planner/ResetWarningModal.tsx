import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { Radius } from '../../constants';

interface ResetWarningModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function ResetWarningModal({ visible, onDismiss }: ResetWarningModalProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <View style={rw.overlay}>
        <View style={[rw.card, { backgroundColor: colors.surface }]}>
          <View style={[rw.iconCircle, { backgroundColor: colors.warning + '22', alignSelf: 'center', marginBottom: 16 }]}>
            <RefreshCw size={28} color={colors.warning} />
          </View>
          <Text style={[rw.title, { color: colors.textPrimary }]}>
            {t('planner.resetWarningTitle', '¡Plan semanal por expirar!')}
          </Text>
          <Text style={{ fontSize: 15, textAlign: 'center', lineHeight: 23, marginBottom: 20, fontWeight: '500', color: colors.textSecondary }}>
            {t('planner.resetWarningDesc', 'Esta noche a las 23:59 (domingo) tu plan semanal se reiniciará automáticamente. La próxima semana deberás generar un nuevo plan personalizado.')}
          </Text>
          <TouchableOpacity style={[rw.btnPrimary]} activeOpacity={0.85} onPress={onDismiss}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={rw.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={rw.btnPrimaryText}>{t('common.understood', 'Entendido')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const rw = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:           { width: '100%', maxWidth: 420, borderRadius: 28, overflow: 'hidden', padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 20 },
  iconCircle:     { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  title:          { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 16, letterSpacing: -0.3 },
  btnPrimary:     { borderRadius: Radius.full, overflow: 'hidden', marginBottom: 10, elevation: 4, shadowColor: '#7C5CFC', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnGrad:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
