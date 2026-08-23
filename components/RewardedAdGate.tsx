import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, X, Crown } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useRewardedAd } from '../hooks/useRewardedAd';

interface RewardedAdGateProps {
  visible: boolean;
  onClose: () => void;
  /** Se llama cuando el usuario termina el video y gana la recompensa */
  onRewarded: () => void;
  /** Emoji grande que identifica la función (ej: '🍳', '📸', '📅') */
  emoji: string;
  /** Título del modal (ej: 'Recetas Desbloqueadas') */
  title: string;
  /** Subtítulo / descripción breve de la recompensa */
  subtitle: string;
  /** Texto del botón de ver video (ej: '▶ Ver video · Desbloquear') */
  watchLabel?: string;
  /** Si true, muestra botón de Go Pro al pie */
  showProButton?: boolean;
}

/**
 * Modal de Rewarded Ad genérico y reutilizable para todas las funciones
 * de FitGO que ofrecen contenido premium a cambio de ver un anuncio.
 *
 * Uso:
 * ```tsx
 * <RewardedAdGate
 *   visible={showGate}
 *   onClose={() => setShowGate(false)}
 *   onRewarded={() => { setShowGate(false); doUnlock(); }}
 *   emoji="🍳"
 *   title="Recetas Premium"
 *   subtitle="Ve un breve video y accede a 5 recetas extra de hoy"
 * />
 * ```
 */
export function RewardedAdGate({
  visible,
  onClose,
  onRewarded,
  emoji,
  title,
  subtitle,
  watchLabel = '▶ Ver video · Desbloquear gratis',
  showProButton = true,
}: RewardedAdGateProps) {
  const colors = useTheme();

  const handleRewarded = () => {
    onRewarded();
  };

  const { showAd, loading } = useRewardedAd(handleRewarded, onClose);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.card, { backgroundColor: colors.surface }]}>

          {/* Cerrar */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={10}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Emoji */}
          <LinearGradient
            colors={['#7C5CFC', '#4338CA']}
            style={s.emojiCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={s.emoji}>{emoji}</Text>
          </LinearGradient>

          {/* Textos */}
          <Text style={[s.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>

          {/* Botón ver video */}
          <TouchableOpacity
            style={s.watchBtn}
            onPress={showAd}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.watchBtnInner}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Play size={18} color="#FFF" fill="#FFF" />
                  <Text style={s.watchBtnText}>{watchLabel}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Go Pro */}
          {showProButton && (
            <TouchableOpacity
              style={[s.proBtn, { borderColor: colors.primary + '50', backgroundColor: colors.primary + '10' }]}
              onPress={() => { onClose(); setTimeout(() => router.push('/modals/paywall' as any), 200); }}
              activeOpacity={0.85}
            >
              <Crown size={15} color={colors.primary} />
              <Text style={[s.proBtnText, { color: colors.primary }]}>Ir a Pro · Sin anuncios</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onClose} style={{ marginTop: 10 }}>
            <Text style={[s.cancelTxt, { color: colors.textMuted }]}>Ahora no</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 44,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 10,
  },
  emojiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  emoji: {
    fontSize: 38,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  watchBtn: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  watchBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
  },
  watchBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  proBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  proBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  cancelTxt: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
