import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Pressable
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { MessageSquarePlus, MessageSquare, Trash2, X, Clock } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useCoachStore } from '../store';
import { Spacing, Radius } from '../constants';
import { supabase } from '../services/supabase';
import { CustomAlert } from './CustomAlert';

interface HistoryModalProps {
  visible: boolean;
  onClose: () => void;
  coachType: 'nutritionist' | 'trainer' | 'doctor';
}

export default function CoachHistoryModal({ visible, onClose, coachType }: HistoryModalProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const {
    nutritionistSessions, trainerSessions, doctorSessions,
    currentNutritionistSessionId, currentTrainerSessionId, currentDoctorSessionId,
    setCurrentSessionId, setSessions, resetMessages
  } = useCoachStore();

  const [alert, setAlert] = React.useState<{
    visible: boolean;
    targetId: string | null;
  }>({ visible: false, targetId: null });

  const sessions = coachType === 'nutritionist' ? nutritionistSessions : coachType === 'trainer' ? trainerSessions : doctorSessions;
  const currentId = coachType === 'nutritionist' ? currentNutritionistSessionId : coachType === 'trainer' ? currentTrainerSessionId : currentDoctorSessionId;

  const handleSelect = (id: string | null) => {
    if (id !== currentId) {
      resetMessages(coachType);
      setCurrentSessionId(id, coachType);
    }
    onClose();
  };

  const handleNewChat = () => {
    setCurrentSessionId(null, coachType);
    resetMessages(coachType);
    onClose();
  };

  const handleDelete = (id: string) => {
    setAlert({ visible: true, targetId: id });
  };

  const confirmDelete = async () => {
    const id = alert.targetId;
    if (!id) return;

    const { error } = await supabase.from('coach_sessions').delete().eq('id', id);
    if (!error) {
      const updated = sessions.filter(s => s.id !== id);
      setSessions(updated, coachType);
      if (currentId === id) {
        setCurrentSessionId(updated.length > 0 ? updated[0].id : null, coachType);
      }
    }
    setAlert({ visible: false, targetId: null });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <View style={[s.content, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[s.header, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color={colors.primary} />
              <Text style={[s.title, { color: colors.textPrimary }]}>{t('coach.history', 'Historial de chats')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={s.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* New Chat Button */}
          <TouchableOpacity 
            style={[s.newBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
            onPress={handleNewChat}
            activeOpacity={0.8}
          >
            <MessageSquarePlus size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[s.newBtnText, { color: colors.primary }]}>{t('coach.newChat', 'Iniciar nuevo chat')}</Text>
          </TouchableOpacity>

          {/* Sessions List */}
          <FlashList
            data={sessions}
            // @ts-ignore
            estimatedItemSize={60}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            renderItem={({ item }) => {
              const isSelected = currentId === item.id;
              return (
                <View style={[s.itemRow, { borderBottomColor: colors.border }, isSelected && { backgroundColor: colors.primary + '10', borderRadius: Radius.md }]}>
                  <TouchableOpacity 
                    style={s.itemMain}
                    onPress={() => handleSelect(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={s.itemContentWrap}>
                      <View style={[s.iconBox, { backgroundColor: isSelected ? colors.primary + '25' : colors.background }]}>
                        <MessageSquare size={16} color={isSelected ? colors.primary : colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text 
                          style={[
                            s.itemTitle, 
                            { color: colors.textPrimary },
                            isSelected && { color: colors.primary, fontWeight: '800' }
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={[s.itemDate, { color: colors.textMuted }]}>
                          {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleDelete(item.id)}
                    style={s.deleteBtn}
                    hitSlop={8}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={s.empty}>
                <Clock size={36} color={colors.textMuted} style={{ marginBottom: 10, opacity: 0.6 }} />
                <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '600' }}>
                  {t('coach.noHistory', 'Aún no tienes conversaciones')}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                  Tus preguntas y consejos de los coaches aparecerán aquí.
                </Text>
              </View>
            }
          />
        </View>
      </View>

      <CustomAlert
        visible={alert.visible}
        type="confirm"
        title={t('common.confirm', 'Confirmar')}
        message={t('coach.confirmDeleteSession', '¿Estás seguro de que quieres eliminar este chat?')}
        confirmText={t('common.delete', 'Eliminar')}
        cancelText={t('common.cancel', 'Cancelar')}
        onConfirm={confirmDelete}
        onCancel={() => setAlert({ visible: false, targetId: null })}
      />
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  content: { height: '72%', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: 36 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: Spacing.base, borderBottomWidth: 1.2 
  },
  title: { fontSize: 17, fontWeight: '800' },
  closeBtn: { padding: 4 },
  newBtn: { 
    margin: Spacing.base, padding: 13, borderRadius: Radius.lg, 
    borderWidth: 1.2, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
  },
  newBtnText: { fontWeight: '800', fontSize: 14 },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderBottomWidth: 1 },
  itemMain: { flex: 1 },
  itemContentWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  itemTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  itemDate: { fontSize: 11 },
  deleteBtn: { padding: 8, borderRadius: 8 },
  empty: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 20 }
});
