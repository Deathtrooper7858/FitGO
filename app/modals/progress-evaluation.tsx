import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  X,
  Upload,
  Brain,
  CheckCircle,
  ArrowUpCircle,
  History,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles,
  ShieldCheck,
  Lightbulb,
  ArrowLeft,
  Flame,
  Activity,
  RotateCcw,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, Radius } from '../../constants';
import { analyzePhysiquePhoto } from '../../services/groq';
import { useSettingsStore, useProgressStore, useAuthStore } from '../../store';
import { waitForProgressHydration } from '../../store/progressStore';
import { useAdStore } from '../../store/adStore';
import { useIsPro } from '../../hooks/useIsPro';
import { AdTimerOverlay } from '../../components/AdTimerOverlay';
import { RewardedAdGate } from '../../components/RewardedAdGate';
import { getLocalDateString } from '../../utils/date';
import { CustomAlert, AlertType } from '../../components/CustomAlert';

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  try {
    Haptics.impactAsync(style);
  } catch {
    // Ignore on unsupported platforms
  }
};

/** Strips raw API/AI jargon from error messages and returns a user-friendly string. */
function sanitizeAIError(msg: string): string {
  if (!msg) return '';
  const cleaned = msg.replace(/^AI Service Error:\s*/i, '').trim();
  if (/failed to validate json/i.test(cleaned)) {
    return 'La IA no pudo procesar la solicitud en este momento. Inténtalo de nuevo en unos segundos.';
  }
  if (/rate limit|tokens per day|too many requests/i.test(cleaned)) {
    return 'El servicio de IA está ocupado. Por favor, intenta de nuevo en unos minutos.';
  }
  if (/timed out/i.test(cleaned)) {
    return 'La solicitud tardó demasiado tiempo. Verifica tu conexión e intenta de nuevo.';
  }
  if (/network|no internet/i.test(cleaned)) {
    return 'Sin conexión a internet. Revisa tu red e inténtalo de nuevo.';
  }
  return cleaned;
}

const Accordion = ({
  title,
  icon,
  color,
  defaultExpanded = false,
  children,
  colors,
}: any) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <View
      style={[
        s.listCard,
        { backgroundColor: colors.surfaceAlt + '70', borderColor: colors.border + '35' },
      ]}
    >
      <TouchableOpacity
        style={s.listHeader}
        onPress={() => {
          triggerHaptic();
          setExpanded(!expanded);
        }}
        activeOpacity={0.7}
      >
        <View style={s.listHeaderLeft}>
          <View style={[s.accordionIconWrap, { backgroundColor: `${color}18` }]}>{icon}</View>
          <Text style={[s.listTitle, { color: colors.textPrimary }]}>{title}</Text>
        </View>
        <View style={[s.chevronCircle, { backgroundColor: colors.surfaceAlt }]}>
          {expanded ? (
            <ChevronUp size={16} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={16} color={colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>
      {expanded && <View style={s.accordionBody}>{children}</View>}
    </View>
  );
};

export default function ProgressEvaluationModal() {
  const { t } = useTranslation();
  const colors = useTheme();
  const { language } = useSettingsStore();
  const { evaluations, addEvaluation, deleteEvaluation } = useProgressStore();
  const { profile } = useAuthStore();
  const currentUserId = profile?.id;
  const userEvaluations = evaluations.filter(e => !e.userId || e.userId === currentUserId);

  const [alert, setAlert] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showAlert = (
    type: AlertType,
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm?.();
        setAlert(prev => ({ ...prev, visible: false }));
      },
      onCancel: onCancel
        ? () => {
            onCancel();
            setAlert(prev => ({ ...prev, visible: false }));
          }
        : undefined,
    });
  };

  const handleDeleteItem = (item: typeof evaluations[0]) => {
    showAlert(
      'confirm',
      t('evaluation.deleteConfirmTitle', 'Eliminar Evaluación'),
      t('evaluation.deleteConfirmMsg', '¿Estás seguro de que deseas eliminar esta evaluación del historial?'),
      async () => {
        try {
          const fileUri = item.fileName ? `${FileSystem.documentDirectory}${item.fileName}` : item.uri;
          if (fileUri) {
            const info = await FileSystem.getInfoAsync(fileUri);
            if (info.exists) {
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
            }
          }
        } catch (err) {
          console.warn('Error deleting photo file:', err);
        }
        deleteEvaluation(item.id);
      },
      undefined,
      t('common.delete', 'Eliminar'),
      t('common.cancel', 'Cancelar')
    );
  };

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  type TargetArea = 'full' | 'upper' | 'lower' | 'back' | 'arms' | 'core';
  const [targetArea, setTargetArea] = useState<TargetArea>('full');
  const [userContext, setUserContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    id?: string;
    feedback: string;
    strengths: string[];
    improvements: string[];
    estimatedFatPercentage: string;
    base64ImageData?: string;
    postureAnalysis?: string;
    symmetry?: string;
    recommendations?: string[];
  } | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const isProActually = useIsPro();
  const { hasPremiumAdAccess, grantPremiumAdAccess } = useAdStore();
  const featureId = 'evaluation';
  const hasAccess = isProActually || hasPremiumAdAccess(featureId);
  const [showAdGate, setShowAdGate] = useState(false);

  if (!hasAccess) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[`${colors.primary}25`, colors.background]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        />
        <View style={s.paywallContainer}>
          <View style={s.paywallEmojiBox}>
            <Text style={s.paywallEmoji}>📸</Text>
          </View>
          <Text style={[s.paywallTitle, { color: colors.textPrimary }]}>
            {t('evaluation.proTitle', 'Evaluación Física con IA')}
          </Text>
          <Text style={[s.paywallSub, { color: colors.textSecondary }]}>
            {t(
              'evaluation.proSub',
              'Desbloquea el análisis biomecánico de tu físico: porcentaje de grasa corporal estimado, simetría muscular, postura y plan de acción con FitGO Pro.'
            )}
          </Text>

          <TouchableOpacity
            style={[s.proBtn, { marginBottom: 12 }]}
            onPress={() => setShowAdGate(true)}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={s.proGrad}>
              <Text style={s.proText}>▶ Ver video · Desbloquear análisis</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.proBtn}
            onPress={() => router.push('/modals/paywall')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={s.proGrad}>
              <Text style={s.proText}>{t('recipes.unlockNow', 'Desbloquear con Pro')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <RewardedAdGate
          visible={showAdGate}
          onClose={() => setShowAdGate(false)}
          onRewarded={() => {
            setShowAdGate(false);
            grantPremiumAdAccess(featureId);
          }}
          emoji="📸"
          title="Análisis Físico IA"
          subtitle="Ve un breve video y obtén tu evaluación detallada de grasa, postura y simetría muscular"
          watchLabel="▶ Ver video · Analizar mi cuerpo"
        />
      </SafeAreaView>
    );
  }

  const pickImage = async (useCamera: boolean = false) => {
    triggerHaptic();
    try {
      let pickResult;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert(
            'warning',
            t('common.permissionRequired', 'Permiso requerido'),
            t('common.cameraPermissionDenied', 'Se necesita permiso para la cámara.')
          );
          return;
        }
        pickResult = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          aspect: [3, 4],
          quality: 0.55,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert(
            'warning',
            t('common.permissionRequired', 'Permiso requerido'),
            t('common.galleryPermissionDenied', 'Se necesita permiso para la galería.')
          );
          return;
        }
        pickResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          aspect: [3, 4],
          quality: 0.55,
          base64: true,
        });
      }

      if (!pickResult.canceled && pickResult.assets && pickResult.assets[0]) {
        const asset = pickResult.assets[0];
        setImageUri(asset.uri);
        let b64 = asset.base64 || null;
        if (!b64 && asset.uri) {
          try {
            b64 = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch (readErr) {
            console.warn('[Evaluation] Could not read image as base64:', readErr);
          }
        }
        setBase64Image(b64);
        setResult(null);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleAnalyze = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    let currentBase64 = base64Image;
    if (!currentBase64 && imageUri) {
      try {
        currentBase64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setBase64Image(currentBase64);
      } catch (err) {
        console.warn('[Evaluation] Fallback base64 read failed:', err);
      }
    }
    if (!currentBase64 || !imageUri) return;
    setIsAnalyzing(true);
    try {
      const response = await analyzePhysiquePhoto(currentBase64, language, targetArea, userContext);

      const fileName = `eval_${Date.now()}.jpg`;
      const localUri = `${FileSystem.documentDirectory}${fileName}`;

      try {
        if (imageUri.startsWith('content://') || imageUri.startsWith('ph://')) {
          await FileSystem.writeAsStringAsync(localUri, currentBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } else {
          await FileSystem.copyAsync({ from: imageUri, to: localUri });
        }
      } catch {
        await FileSystem.writeAsStringAsync(localUri, currentBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      await waitForProgressHydration();

      const newEvaluation = {
        id: Math.random().toString(36).substring(7),
        uri: localUri,
        fileName: fileName,
        date: getLocalDateString(),
        userId: currentUserId || undefined,
        ...response,
      };
      setResult(newEvaluation);
      addEvaluation(newEvaluation);
    } catch (error: any) {
      console.error(error);
      const rawMsg: string = error?.message ?? '';
      const friendlyMsg =
        sanitizeAIError(rawMsg) || t('evaluation.error', 'Ocurrió un error al analizar la imagen.');
      showAlert('error', t('common.error', 'Error'), friendlyMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderResult = (res: typeof result, hideNewBtn = false) => {
    if (!res) return null;
    return (
      <View style={s.resultContainer}>
        {/* Coach Verdict Card */}
        <View style={[s.verdictCard, { backgroundColor: colors.surfaceAlt + '80', borderColor: `${colors.primary}45` }]}>
          <View style={s.verdictHeader}>
            <View style={[s.verdictIconCircle, { backgroundColor: `${colors.primary}20` }]}>
              <Brain size={18} color={colors.primary} />
            </View>
            <Text style={[s.verdictTitle, { color: colors.primary }]}>
              {t('evaluation.feedbackTitle', 'Veredicto del Coach IA')}
            </Text>
          </View>
          <Text style={[s.verdictText, { color: colors.textPrimary }]}>{res.feedback}</Text>
        </View>

        {/* Biometrics Quick Cards */}
        <View style={s.statsGrid}>
          <View style={[s.statCard, { backgroundColor: colors.surfaceAlt + '70', borderColor: colors.border + '35' }]}>
            <View style={[s.statIconWrap, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
              <Flame size={16} color={colors.calories || '#F43F5E'} />
            </View>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>
              {t('evaluation.estFat', 'Grasa Est.')}
            </Text>
            <Text style={[s.statValue, { color: colors.primary }]}>{res.estimatedFatPercentage}</Text>
          </View>

          <View style={[s.statCard, { backgroundColor: colors.surfaceAlt + '70', borderColor: colors.border + '35' }]}>
            <View style={[s.statIconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Activity size={16} color="#06B6D4" />
            </View>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>
              {t('evaluation.focusLabel', 'Enfoque')}
            </Text>
            <Text style={[s.statValueSmall, { color: colors.textPrimary }]}>
              {t(`evaluation.focusAreas.${targetArea}`, targetArea === 'full'
                ? 'Completo'
                : targetArea === 'upper'
                ? 'Tren Superior'
                : targetArea === 'lower'
                ? 'Piernas'
                : targetArea === 'arms'
                ? 'Brazos'
                : targetArea === 'back'
                ? 'Espalda'
                : 'Core')}
            </Text>
          </View>
        </View>

        {/* Strengths & Improvements */}
        <Accordion
          title={t('evaluation.strengths', 'Puntos Fuertes')}
          icon={<CheckCircle size={18} color={colors.success} />}
          color={colors.success}
          defaultExpanded={true}
          colors={colors}
        >
          {(Array.isArray(res.strengths) ? res.strengths : []).map((str, i) => (
            <View key={i} style={s.bulletRow}>
              <View style={[s.bulletDot, { backgroundColor: colors.success }]} />
              <Text style={[s.listItem, { color: colors.textPrimary }]}>{str}</Text>
            </View>
          ))}
        </Accordion>

        <Accordion
          title={t('evaluation.improvements', 'Áreas de Oportunidad')}
          icon={<ArrowUpCircle size={18} color={colors.warning} />}
          color={colors.warning}
          defaultExpanded={true}
          colors={colors}
        >
          {(Array.isArray(res.improvements) ? res.improvements : []).map((imp, i) => (
            <View key={i} style={s.bulletRow}>
              <View style={[s.bulletDot, { backgroundColor: colors.warning }]} />
              <Text style={[s.listItem, { color: colors.textPrimary }]}>{imp}</Text>
            </View>
          ))}
        </Accordion>

        {res.postureAnalysis && (
          <Accordion
            title={t('evaluation.posture', 'Alineación y Postura')}
            icon={<Text style={{ fontSize: 16 }}>🧍‍♂️</Text>}
            color={colors.primary}
            defaultExpanded={false}
            colors={colors}
          >
            <Text style={[s.listItemText, { color: colors.textSecondary }]}>{res.postureAnalysis}</Text>
          </Accordion>
        )}

        {res.symmetry && (
          <Accordion
            title={t('evaluation.symmetry', 'Simetría y Proporciones')}
            icon={<Text style={{ fontSize: 16 }}>⚖️</Text>}
            color={colors.primary}
            defaultExpanded={false}
            colors={colors}
          >
            <Text style={[s.listItemText, { color: colors.textSecondary }]}>{res.symmetry}</Text>
          </Accordion>
        )}

        {Array.isArray(res.recommendations) && res.recommendations.length > 0 && (
          <Accordion
            title={t('evaluation.recommendations', 'Recomendaciones del Coach')}
            icon={<Sparkles size={18} color="#F59E0B" />}
            color="#F59E0B"
            defaultExpanded={false}
            colors={colors}
          >
            {res.recommendations.map((rec, i) => (
              <View key={i} style={s.bulletRow}>
                <View style={[s.stepNumBadge, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#F59E0B' }}>{i + 1}</Text>
                </View>
                <Text style={[s.listItem, { color: colors.textPrimary }]}>{rec}</Text>
              </View>
            ))}
          </Accordion>
        )}

        {!hideNewBtn && (
          <TouchableOpacity
            style={s.newAnalysisBtn}
            onPress={() => {
              triggerHaptic();
              setImageUri(null);
              setResult(null);
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.newAnalysisGrad}
            >
              <RotateCcw size={18} color="#FFF" />
              <Text style={s.newAnalysisText}>{t('evaluation.newAnalysis', 'Nueva Evaluación')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const viewHistoryItem = (item: typeof evaluations[0]) => {
    triggerHaptic();
    const displayUri = item.fileName ? `${FileSystem.documentDirectory}${item.fileName}` : item.uri;
    setImageUri(displayUri);
    setResult(item);
    setShowHistory(false);
  };

  const targetAreasList = [
    { id: 'full', label: `🧍 ${t('evaluation.areas.full', 'Cuerpo Completo')}`, icon: '🧍' },
    { id: 'upper', label: `👕 ${t('evaluation.areas.upper', 'Tren Superior')}`, icon: '👕' },
    { id: 'lower', label: `👖 ${t('evaluation.areas.lower', 'Piernas')}`, icon: '👖' },
    { id: 'back', label: `🔙 ${t('evaluation.areas.back', 'Espalda')}`, icon: '🔙' },
    { id: 'arms', label: `💪 ${t('evaluation.areas.arms', 'Brazos')}`, icon: '💪' },
    { id: 'core', label: `🍫 ${t('evaluation.areas.core', 'Core & Abdomen')}`, icon: '🍫' },
  ];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Aurora Glow */}
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.16)', 'rgba(6, 182, 212, 0.06)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
        pointerEvents="none"
      />

      {/* ── Top Bar ── */}
      <View style={[s.header, { borderBottomColor: colors.border + '30' }]}>
        <View style={s.headerLeft}>
          <Text style={[s.title, { color: colors.textPrimary }]}>
            {t('dashboard.evaluatePhysique', 'Evaluar Físico')}
          </Text>
          <View style={[s.aiBadge, { backgroundColor: `${colors.primary}18` }]}>
            <Sparkles size={11} color={colors.primary} />
            <Text style={[s.aiBadgeText, { color: colors.primary }]}>{t('evaluation.aiBadge', 'Biometría IA')}</Text>
          </View>
        </View>

        <View style={s.headerRight}>
          {userEvaluations.length > 0 && !showHistory && (
            <TouchableOpacity
              style={[s.headerHistoryBtn, { backgroundColor: colors.surfaceAlt + '90' }]}
              onPress={() => {
                triggerHaptic();
                setShowHistory(true);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <History size={16} color={colors.primary} />
              <Text style={[s.headerHistoryText, { color: colors.primary }]}>
                {userEvaluations.length}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.back()}
            style={[s.closeBtn, { backgroundColor: colors.surfaceAlt + '90' }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showHistory ? (
            /* ── History View ── */
            <View style={s.historySection}>
              <TouchableOpacity
                style={s.backToMainBtn}
                onPress={() => {
                  triggerHaptic();
                  setShowHistory(false);
                }}
              >
                <ArrowLeft size={18} color={colors.primary} />
                <Text style={[s.backToMainText, { color: colors.primary }]}>
                  {t('common.back', 'Volver a Evaluar')}
                </Text>
              </TouchableOpacity>

              <Text style={[s.historyTitle, { color: colors.textPrimary }]}>
                {t('evaluation.history', 'Historial de Evaluaciones')}
              </Text>

              {userEvaluations.length === 0 ? (
                <View style={[s.emptyHistoryCard, { backgroundColor: colors.surfaceAlt + '60' }]}>
                  <History size={32} color={colors.textMuted} />
                  <Text style={[s.emptyHistoryText, { color: colors.textSecondary }]}>
                    {t('evaluation.noHistory', 'Aún no tienes evaluaciones registradas.')}
                  </Text>
                </View>
              ) : (
                userEvaluations.map(e => (
                  <View
                    key={e.id}
                    style={[
                      s.historyItem,
                      { backgroundColor: colors.surfaceAlt + '80', borderColor: colors.border + '35' },
                    ]}
                  >
                    <TouchableOpacity
                      style={s.historyItemMain}
                      onPress={() => viewHistoryItem(e)}
                      activeOpacity={0.7}
                    >
                      <Image
                        cachePolicy="memory-disk"
                        source={{
                          uri: e.fileName ? `${FileSystem.documentDirectory}${e.fileName}` : e.uri,
                        }}
                        style={s.historyThumb}
                      />
                      <View style={s.historyInfo}>
                        <Text style={[s.historyDate, { color: colors.textPrimary }]}>{e.date}</Text>
                        <View style={s.historyFatRow}>
                          <Flame size={13} color={colors.calories || '#F43F5E'} />
                          <Text style={[s.historyFat, { color: colors.textSecondary }]}>
                            {t('evaluation.fatLabel', 'Grasa')}: {e.estimatedFatPercentage}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteItem(e)}
                      style={s.historyDeleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color={colors.error || '#EF4444'} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          ) : !imageUri ? (
            /* ── Initial Selection & Upload View ── */
            <View style={s.uploadSection}>
              {/* Feature Hero Card */}
              <View
                style={[
                  s.heroCard,
                  { backgroundColor: colors.surfaceAlt + '70', borderColor: colors.border + '40' },
                ]}
              >
                <View style={s.heroTop}>
                  <View style={[s.heroIconCircle, { backgroundColor: `${colors.primary}20` }]}>
                    <Brain size={22} color={colors.primary} />
                  </View>
                  <View style={s.heroTitleWrap}>
                    <Text style={[s.heroTitle, { color: colors.textPrimary }]}>
                      {t('evaluation.heroTitle', 'Diagnóstico Físico Inteligente')}
                    </Text>
                    <Text style={[s.heroSub, { color: colors.textSecondary }]}>
                      {t('evaluation.heroSub', 'Tu entrenador de visión por computadora para analizar desarrollo muscular, simetría y grasa estimada.')}
                    </Text>
                  </View>
                </View>

                {/* Value Props Row */}
                <View style={s.heroPillsRow}>
                  <View style={[s.heroPill, { backgroundColor: colors.background + '80' }]}>
                    <Text style={[s.heroPillText, { color: colors.textSecondary }]}>{t('evaluation.propFat', '📊 % Grasa')}</Text>
                  </View>
                  <View style={[s.heroPill, { backgroundColor: colors.background + '80' }]}>
                    <Text style={[s.heroPillText, { color: colors.textSecondary }]}>{t('evaluation.propSymmetry', '⚖️ Simetría')}</Text>
                  </View>
                  <View style={[s.heroPill, { backgroundColor: colors.background + '80' }]}>
                    <Text style={[s.heroPillText, { color: colors.textSecondary }]}>{t('evaluation.propPosture', '🧍 Postura')}</Text>
                  </View>
                  <View style={[s.heroPill, { backgroundColor: colors.background + '80' }]}>
                    <Text style={[s.heroPillText, { color: colors.textSecondary }]}>{t('evaluation.propFocus', '🎯 Enfoque')}</Text>
                  </View>
                </View>
              </View>

              {/* Area Selector Section */}
              <View style={s.sectionHeaderRow}>
                <Text style={[s.sectionSubtitle, { color: colors.textPrimary }]}>
                  {t('evaluation.selectArea', '¿Qué zona deseas evaluar?')}
                </Text>
                <Text style={[s.swipeHint, { color: colors.textMuted }]}>
                  {t('common.swipe', 'Desliza')} ›
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.areaScroll}
                contentContainerStyle={s.areaScrollContent}
              >
                {targetAreasList.map(area => {
                  const isSelected = targetArea === area.id;
                  return (
                    <TouchableOpacity
                      key={area.id}
                      style={[
                        s.areaBtn,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceAlt + '80',
                          borderColor: isSelected ? colors.primary : colors.border + '40',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setTargetArea(area.id as TargetArea);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          s.areaBtnText,
                          { color: isSelected ? '#FFF' : colors.textPrimary },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {area.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Upload Action Cards (Cámara & Galería) */}
              <View style={s.buttonRow}>
                <TouchableOpacity
                  style={[
                    s.actionCard,
                    { backgroundColor: colors.surfaceAlt + '85', borderColor: colors.border + '40' },
                  ]}
                  onPress={() => pickImage(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(139, 92, 246, 0.25)', 'rgba(139, 92, 246, 0.05)']}
                    style={s.actionCardGradient}
                  >
                    <View style={[s.actionIconWrap, { backgroundColor: `${colors.primary}25` }]}>
                      <Camera size={26} color={colors.primary} />
                    </View>
                    <Text style={[s.actionCardTitle, { color: colors.textPrimary }]}>
                      {t('common.camera', 'Cámara')}
                    </Text>
                    <Text style={[s.actionCardSub, { color: colors.textSecondary }]}>
                      {t('evaluation.takePhotoNow', 'Tomar foto ahora')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    s.actionCard,
                    { backgroundColor: colors.surfaceAlt + '85', borderColor: colors.border + '40' },
                  ]}
                  onPress={() => pickImage(false)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(6, 182, 212, 0.25)', 'rgba(6, 182, 212, 0.05)']}
                    style={s.actionCardGradient}
                  >
                    <View style={[s.actionIconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.25)' }]}>
                      <Upload size={26} color="#06B6D4" />
                    </View>
                    <Text style={[s.actionCardTitle, { color: colors.textPrimary }]}>
                      {t('common.gallery', 'Galería')}
                    </Text>
                    <Text style={[s.actionCardSub, { color: colors.textSecondary }]}>
                      {t('evaluation.chooseExisting', 'Elegir foto existente')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Photography Tips Accordion */}
              <View
                style={[
                  s.tipsCard,
                  { backgroundColor: colors.surfaceAlt + '50', borderColor: colors.border + '30' },
                ]}
              >
                <TouchableOpacity
                  style={s.tipsHeader}
                  onPress={() => {
                    triggerHaptic();
                    setShowTips(!showTips);
                  }}
                >
                  <View style={s.tipsHeaderLeft}>
                    <Lightbulb size={16} color="#F59E0B" />
                    <Text style={[s.tipsTitle, { color: colors.textPrimary }]}>
                      {t('evaluation.tipsTitle', 'Consejos para una evaluación precisa')}
                    </Text>
                  </View>
                  {showTips ? (
                    <ChevronUp size={16} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={16} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>

                {showTips && (
                  <View style={s.tipsContent}>
                    <View style={s.tipItem}>
                      <Text style={s.tipEmoji}>💡</Text>
                      <Text style={[s.tipText, { color: colors.textSecondary }]}>
                        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{t('evaluation.tipLightLabel', 'Luz frontal:')}</Text>{' '}
                        {t('evaluation.tipLight', 'Evita contraluces o sombras pronunciadas que oculten el relieve muscular.')}
                      </Text>
                    </View>
                    <View style={s.tipItem}>
                      <Text style={s.tipEmoji}>🧍</Text>
                      <Text style={[s.tipText, { color: colors.textSecondary }]}>
                        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{t('evaluation.tipPoseLabel', 'Pose natural:')}</Text>{' '}
                        {t('evaluation.tipPose', 'Mantén una postura relajada y recta sin flexionar forzadamente para evaluar simetría real.')}
                      </Text>
                    </View>
                    <View style={s.tipItem}>
                      <Text style={s.tipEmoji}>📏</Text>
                      <Text style={[s.tipText, { color: colors.textSecondary }]}>
                        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{t('evaluation.tipDistanceLabel', 'Distancia:')}</Text>{' '}
                        {t('evaluation.tipDistance', 'Ubica la cámara a la altura del pecho o cintura a unos 1.5 - 2 metros.')}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Privacy Footer */}
              <View style={s.privacyNotice}>
                <ShieldCheck size={14} color={colors.textMuted} />
                <Text style={[s.privacyText, { color: colors.textMuted }]}>
                  {t('evaluation.privacyGuarantee', 'Privacidad garantizada · Tu imagen se procesa de forma segura y confidencial.')}
                </Text>
              </View>
            </View>
          ) : (
            /* ── Image Preview & Analysis View ── */
            <View style={s.imageSection}>
              <View style={[s.previewCard, { borderColor: colors.border + '50' }]}>
                <Image
                  cachePolicy="memory-disk"
                  source={{ uri: imageUri }}
                  style={s.previewImage}
                  contentFit="cover"
                />
                <View style={[s.previewBadge, { backgroundColor: `${colors.primary}D0` }]}>
                  <Text style={s.previewBadgeText}>
                    {targetAreasList.find(a => a.id === targetArea)?.label || 'Evaluación'}
                  </Text>
                </View>
              </View>

              {!result && !isAnalyzing && (
                <View style={s.inputActionWrap}>
                  <View style={s.contextBox}>
                    <Text style={[s.contextLabel, { color: colors.textSecondary }]}>
                      {t(
                        'evaluation.optionalContext',
                        'Contexto adicional para el Coach (opcional)'
                      )}
                    </Text>
                    <TextInput
                      style={[
                        s.contextInput,
                        {
                          backgroundColor: colors.surfaceAlt + '80',
                          color: colors.textPrimary,
                          borderColor: colors.border + '40',
                        },
                      ]}
                      placeholder={t(
                        'evaluation.contextPlaceholder',
                        'Ej: "Llevo 4 meses en volumen", "foto en ayunas"...'
                      )}
                      placeholderTextColor={colors.textMuted}
                      value={userContext}
                      onChangeText={setUserContext}
                    />
                  </View>

                  <View style={s.buttonRowImage}>
                    <TouchableOpacity
                      style={[s.secondaryBtn, { backgroundColor: colors.surfaceAlt }]}
                      onPress={() => {
                        triggerHaptic();
                        setImageUri(null);
                        setResult(null);
                        setUserContext('');
                      }}
                    >
                      <Text style={[s.secondaryBtnText, { color: colors.textPrimary }]}>
                        {t('common.retake', 'Cambiar')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.analyzeBtn}
                      onPress={handleAnalyze}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#8B5CF6', '#6D28D9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={s.analyzeBtnGrad}
                      >
                        <Brain size={20} color="#FFF" />
                        <Text style={s.analyzeBtnText}>
                          {t('evaluation.analyzeBtn', 'Analizar Físico')}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {isAnalyzing && (
            <View style={s.loadingContainer}>
              <View style={[s.loadingCircle, { backgroundColor: `${colors.primary}20` }]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
              <Text style={[s.loadingTitle, { color: colors.textPrimary }]}>
                {t('evaluation.analyzing', 'Analizando composición y simetría...')}
              </Text>
              <Text style={[s.loadingSub, { color: colors.textSecondary }]}>
                {t('evaluation.analyzingSub', 'El algoritmo está examinando proporciones musculares, postura y grasa corporal estimada.')}
              </Text>
            </View>
          )}

          {result &&
            renderResult(
              result,
              !!result.id && imageUri === userEvaluations.find(e => e.id === result.id)?.uri
            )}

          {result && result.id && (
            <TouchableOpacity
              style={[s.backHomeBtn, { backgroundColor: colors.surfaceAlt + '90' }]}
              onPress={() => {
                triggerHaptic();
                setImageUri(null);
                setResult(null);
              }}
            >
              <Text style={[s.backHomeBtnText, { color: colors.textPrimary }]}>
                {t('evaluation.backToMain', 'Volver al Inicio')}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <AdTimerOverlay featureId="evaluation" />

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  headerHistoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 50,
  },

  // Hero Card
  uploadSection: {
    gap: 16,
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1.5,
    gap: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitleWrap: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Target Area
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: 2,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  swipeHint: {
    fontSize: 12,
    fontWeight: '600',
  },
  areaScroll: {
    width: '100%',
  },
  areaScrollContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  areaBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  areaBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Action Cards (Cámara / Galería)
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionCard: {
    flex: 1,
    height: 140,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  actionCardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionCardSub: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Tips Card
  tipsCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  tipsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  tipsContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipEmoji: {
    fontSize: 14,
    marginTop: 1,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },

  // Privacy
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 10,
  },
  privacyText: {
    fontSize: 11,
    textAlign: 'center',
  },

  // Preview Image
  imageSection: {
    gap: 16,
  },
  previewCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 420,
  },
  previewBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  previewBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  inputActionWrap: {
    gap: 14,
  },
  contextBox: {
    gap: 6,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  contextInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
  },
  buttonRowImage: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    width: 100,
    height: 50,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  analyzeBtn: {
    flex: 1,
    height: 50,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  analyzeBtnGrad: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  analyzeBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 24,
  },

  // Result View
  resultContainer: {
    gap: 14,
    marginTop: 4,
  },
  verdictCard: {
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    gap: 10,
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verdictIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verdictTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  verdictText: {
    fontSize: 14,
    lineHeight: 21,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statValueSmall: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Accordion
  listCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  listHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  accordionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accordionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  stepNumBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  listItem: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  listItemText: {
    fontSize: 13,
    lineHeight: 19,
  },

  newAnalysisBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: 6,
  },
  newAnalysisGrad: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  newAnalysisText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  backHomeBtn: {
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginTop: 8,
  },
  backHomeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // History Section
  historySection: {
    gap: 12,
  },
  backToMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  backToMainText: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emptyHistoryCard: {
    padding: 30,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyHistoryText: {
    fontSize: 14,
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  historyThumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
  },
  historyInfo: {
    flex: 1,
    gap: 4,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyFatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyFat: {
    fontSize: 12,
  },
  historyDeleteBtn: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Paywall
  paywallContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    gap: 16,
  },
  paywallEmojiBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paywallEmoji: {
    fontSize: 44,
  },
  paywallTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  paywallSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  proBtn: {
    width: '100%',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  proGrad: {
    padding: 16,
    alignItems: 'center',
  },
  proText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
