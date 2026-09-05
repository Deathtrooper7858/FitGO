import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Timer, Play, Square, Flame } from 'lucide-react-native';
import { GlassCard } from '../GlassCard';
import { Radius } from '../../constants';
import { useFastingStore, FastingProtocol, FASTING_PRESETS } from '../../store/fastingStore';

interface FastingWidgetProps {
  colors: any;
  t: any;
}

export function FastingWidget({ colors, t }: FastingWidgetProps) {
  const { isFasting, protocol, targetHours, startTime, startFast, endFast, cancelFast, setProtocol } = useFastingStore();
  const [now, setNow] = useState(Date.now());

  // Tick every second if active
  useEffect(() => {
    if (!isFasting) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isFasting]);

  const elapsedMs = useMemo(() => {
    if (!isFasting || !startTime) return 0;
    return Math.max(0, now - startTime);
  }, [isFasting, startTime, now]);

  const totalTargetMs = targetHours * 60 * 60 * 1000;
  const progress = Math.min(1, elapsedMs / Math.max(1, totalTargetMs));
  const progressPct = Math.round(progress * 100);

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleFast = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFasting) {
      endFast();
    } else {
      startFast(protocol, targetHours);
    }
  };

  const handleSelectProtocol = (p: FastingProtocol) => {
    if (isFasting) return;
    Haptics.selectionAsync();
    setProtocol(p, FASTING_PRESETS[p]);
  };

  return (
    <GlassCard noPadding showStripe accentColor="#8B5CF6">
      <View style={[s.card, { borderWidth: 0 }]}>
        <View style={s.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Timer size={20} color="#8B5CF6" />
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
              {t('tracker.intermittentFasting', 'Ayuno Intermitente')}
            </Text>
          </View>
          <View style={[s.badge, { backgroundColor: isFasting ? '#10B98120' : colors.surfaceAlt }]}>
            <Text style={[s.badgeText, { color: isFasting ? '#10B981' : colors.textMuted }]}>
              {isFasting ? t('tracker.fastingActive', 'En Ayuno') : protocol}
            </Text>
          </View>
        </View>

        {!isFasting ? (
          <>
            <Text style={[s.subText, { color: colors.textSecondary }]}>
              {t('tracker.chooseProtocol', 'Elige tu protocolo de ayuno:')}
            </Text>
            <View style={s.presetRow}>
              {(['14:10', '16:8', '18:6', '20:4'] as FastingProtocol[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    s.presetBtn,
                    {
                      backgroundColor: protocol === p ? '#8B5CF622' : colors.surfaceAlt,
                      borderColor: protocol === p ? '#8B5CF6' : 'transparent',
                    },
                  ]}
                  onPress={() => handleSelectProtocol(p)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      s.presetText,
                      { color: protocol === p ? '#8B5CF6' : colors.textSecondary, fontWeight: protocol === p ? '800' : '600' },
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.mainActionBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={handleToggleFast}
              activeOpacity={0.8}
            >
              <Play size={18} color="#fff" fill="#fff" />
              <Text style={s.mainActionBtnText}>
                {t('tracker.startFast', 'Comenzar Ayuno')} ({targetHours}h)
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <View>
                <Text style={[s.timerText, { color: colors.textPrimary }]}>
                  {formatDuration(elapsedMs)}
                </Text>
                <Text style={[s.subText, { color: colors.textSecondary }]}>
                  {t('tracker.goal', 'Meta')}: {targetHours}h ({protocol})
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: progress >= 1 ? '#10B981' : '#8B5CF6' }}>
                  {progressPct}%
                </Text>
                {progress >= 1 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Flame size={14} color="#10B981" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981' }}>
                      {t('tracker.fastReached', '¡Meta cumplida!')}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Progress bar */}
            <View style={[s.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
              <View
                style={[
                  s.progressBar,
                  {
                    width: `${progressPct}%`,
                    backgroundColor: progress >= 1 ? '#10B981' : '#8B5CF6',
                  },
                ]}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[s.cancelBtn, { borderColor: colors.border }]}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  cancelFast();
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 13 }}>
                  {t('common.cancel', 'Cancelar')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.mainActionBtn, { flex: 2, backgroundColor: progress >= 1 ? '#10B981' : '#EF4444' }]}
                onPress={handleToggleFast}
                activeOpacity={0.8}
              >
                <Square size={16} color="#fff" fill="#fff" />
                <Text style={s.mainActionBtnText}>
                  {t('tracker.endFast', 'Terminar Ayuno')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: Radius.xl, padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: 11, fontWeight: '800' },
  subText: { fontSize: 13, marginBottom: 10 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: { fontSize: 13 },
  mainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.full,
    paddingVertical: 13,
  },
  mainActionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingVertical: 13,
  },
  timerText: { fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  progressTrack: { height: 8, borderRadius: 4, width: '100%', marginTop: 12, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
});
