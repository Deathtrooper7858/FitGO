import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  const primaryGradient = colors.gradientPrimary || [colors.primary, colors.primaryDark || colors.primary];

  return (
    <GlassCard noPadding showStripe accentColor={colors.primary}>
      <View style={[s.card, { borderWidth: 0 }]}>
        <View style={s.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Timer size={20} color={colors.primary} />
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
              {t('tracker.intermittentFasting', 'Ayuno Intermitente')}
            </Text>
          </View>
          <View style={[s.badge, { backgroundColor: isFasting ? '#10B98120' : colors.surfaceAlt }]}>
            <Text style={[s.badgeText, { color: isFasting ? '#10B981' : (protocol ? colors.primary : colors.textMuted) }]}>
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
              {(['14:10', '16:8', '18:6', '20:4'] as FastingProtocol[]).map((p) => {
                const isSelected = protocol === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      s.presetBtn,
                      {
                        backgroundColor: isSelected ? colors.primary + '22' : colors.surfaceAlt,
                        borderColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => handleSelectProtocol(p)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        s.presetText,
                        { color: isSelected ? colors.primary : colors.textSecondary, fontWeight: isSelected ? '800' : '600' },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleToggleFast}
              activeOpacity={0.85}
              style={[s.actionBtnWrap, { shadowColor: colors.primary }]}
            >
              <LinearGradient
                colors={primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.mainActionBtn}
              >
                <Play size={18} color="#fff" fill="#fff" />
                <Text style={s.mainActionBtnText}>
                  {t('tracker.startFast', 'Comenzar Ayuno')} ({targetHours}h)
                </Text>
              </LinearGradient>
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
                <Text style={{ fontSize: 22, fontWeight: '900', color: progress >= 1 ? '#10B981' : colors.primary }}>
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
              <LinearGradient
                colors={progress >= 1 ? ['#10B981', '#059669'] : primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  s.progressBar,
                  {
                    width: `${progressPct}%`,
                  },
                ]}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[s.cancelBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt + '55' }]}
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
                style={[s.actionBtnWrap, { flex: 2 }]}
                onPress={handleToggleFast}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={progress >= 1 ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.mainActionBtn}
                >
                  <Square size={16} color="#fff" fill="#fff" />
                  <Text style={s.mainActionBtnText}>
                    {t('tracker.endFast', 'Terminar Ayuno')}
                  </Text>
                </LinearGradient>
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
  actionBtnWrap: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
