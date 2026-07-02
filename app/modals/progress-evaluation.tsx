import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, X, Upload, Brain, CheckCircle, ArrowUpCircle, History, ChevronRight, ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, Radius, Shadow } from '../../constants';
import { analyzePhysiquePhoto } from '../../services/groq';
import { useSettingsStore, useProgressStore, useAuthStore, usePurchaseStore } from '../../store';
import { useAdStore } from '../../store/adStore';
import { AdTimerOverlay } from '../../components/AdTimerOverlay';
import { getLocalDateString } from '../../utils/date';

const Accordion = ({ title, icon, color, defaultExpanded = false, children, colors }: any) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <View style={[s.listCard, { backgroundColor: colors.surface, padding: 0, overflow: 'hidden', marginBottom: Spacing.md }]}>
      <TouchableOpacity 
        style={[s.listHeader, { padding: Spacing.lg, marginBottom: 0 }]} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {icon}
          <Text style={[s.listTitle, { color }]}>{title}</Text>
        </View>
        {expanded ? <ChevronUp size={20} color={colors.textSecondary} /> : <ChevronDown size={20} color={colors.textSecondary} />}
      </TouchableOpacity>
      {expanded && (
        <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }}>
          {children}
        </View>
      )}
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

  const handleDeleteItem = (item: typeof evaluations[0]) => {
    Alert.alert(
      t('evaluation.deleteConfirmTitle', 'Eliminar Evaluación'),
      t('evaluation.deleteConfirmMsg', '¿Estás seguro de que deseas eliminar esta evaluación del historial?'),
      [
        { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
        { 
          text: t('common.delete', 'Eliminar'), 
          style: 'destructive',
          onPress: async () => {
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
          }
        }
      ]
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

  const { isPro } = usePurchaseStore();
  const { hasPremiumAdAccess } = useAdStore();

  const isProActually = isPro || profile?.isPro || profile?.role === 'pro_user' || profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'owner';
  const featureId = 'evaluation';
  const hasAccess = isProActually || hasPremiumAdAccess(featureId);

  if (!hasAccess) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[`${colors.primary}15`, colors.background]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        />
        <View style={s.paywallContainer}>
          <Text style={s.paywallEmoji}>📸</Text>
          <Text style={[s.paywallTitle, { color: colors.textPrimary }]}>{t('evaluation.proTitle', 'Evaluación Física IA')}</Text>
          <Text style={[s.paywallSub, { color: colors.textSecondary }]}>{t('evaluation.proSub', 'Desbloquea el análisis detallado de tu progreso físico y porcentaje de grasa con FitGO Pro.')}</Text>
          <TouchableOpacity style={s.proBtn} onPress={() => router.push('/modals/paywall')}>
            <LinearGradient colors={[colors.primary, colors.primary + 'C0']} style={s.proGrad}>
              <Text style={s.proText}>{t('recipes.unlockNow', 'Desbloquear Ahora')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const pickImage = async (useCamera: boolean = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          alert(t('common.cameraPermissionDenied', 'Se necesita permiso para la cámara.'));
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          aspect: [3, 4],
          quality: 0.8,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert(t('common.galleryPermissionDenied', 'Se necesita permiso para la galería.'));
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          aspect: [3, 4],
          quality: 0.8,
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setBase64Image(result.assets[0].base64 || null);
        setResult(null); // Clear previous result
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!base64Image || !imageUri) return;
    setIsAnalyzing(true);
    try {
      const response = await analyzePhysiquePhoto(base64Image, language, targetArea, userContext);
      
      // Save image to filesystem for persistence
      const fileName = `eval_${Date.now()}.jpg`;
      const localUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: imageUri, to: localUri });

      const newEvaluation = {
        id: Math.random().toString(36).substring(7),
        uri: localUri,
        fileName: fileName, // Guaranteed persistence across app sessions without AsyncStorage bloat
        date: getLocalDateString(),
        userId: currentUserId || undefined,
        ...response
      };
      setResult(newEvaluation);
      addEvaluation(newEvaluation);
    } catch (error) {
      console.error(error);
      alert(t('evaluation.error', 'An error occurred while analyzing the image.'));
    } finally {
      setIsAnalyzing(false);
    }
  };


  const renderResult = (res: typeof result, hideNewBtn = false) => {
    if (!res) return null;
    return (
      <View style={s.resultContainer}>
        <View style={[s.resultCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.resultTitle, { color: colors.primary }]}>{t('evaluation.feedbackTitle', 'Veredicto del Coach')}</Text>
          <Text style={[s.feedbackText, { color: colors.textPrimary }]}>{res.feedback}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <View style={[s.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>{t('evaluation.estFat', 'Grasa Est.')}</Text>
            <Text style={[s.statValue, { color: colors.primary }]}>{res.estimatedFatPercentage}</Text>
          </View>
        </View>

        {res.postureAnalysis && (
          <Accordion title={t('evaluation.posture', 'Análisis de Postura')} icon={<Text style={{fontSize: 20}}>🧍‍♂️</Text>} color={colors.primary} defaultExpanded={false} colors={colors}>
            <Text style={[s.listItem, { color: colors.textPrimary }]}>{res.postureAnalysis}</Text>
          </Accordion>
        )}

        {res.symmetry && (
          <Accordion title={t('evaluation.symmetry', 'Simetría y Proporción')} icon={<Text style={{fontSize: 20}}>⚖️</Text>} color={colors.primary} defaultExpanded={false} colors={colors}>
            <Text style={[s.listItem, { color: colors.textPrimary }]}>{res.symmetry}</Text>
          </Accordion>
        )}

        <Accordion title={t('evaluation.strengths', 'Puntos Fuertes')} icon={<CheckCircle size={20} color={colors.success} />} color={colors.success} defaultExpanded={true} colors={colors}>
          {res.strengths.map((str, i) => (
            <Text key={i} style={[s.listItem, { color: colors.textPrimary }]}>• {str}</Text>
          ))}
        </Accordion>

        <Accordion title={t('evaluation.improvements', 'Áreas de Mejora')} icon={<ArrowUpCircle size={20} color={colors.warning} />} color={colors.warning} defaultExpanded={true} colors={colors}>
          {res.improvements.map((imp, i) => (
            <Text key={i} style={[s.listItem, { color: colors.textPrimary }]}>• {imp}</Text>
          ))}
        </Accordion>
        
        {res.recommendations && res.recommendations.length > 0 && (
          <Accordion title={t('evaluation.recommendations', 'Recomendaciones')} icon={<Text style={{fontSize: 20}}>💡</Text>} color="#F59E0B" defaultExpanded={false} colors={colors}>
            {res.recommendations.map((rec, i) => (
              <Text key={i} style={[s.listItem, { color: colors.textPrimary }]}>• {rec}</Text>
            ))}
          </Accordion>
        )}
        
        {!hideNewBtn && (
          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary, marginTop: Spacing.lg }]} onPress={() => { setImageUri(null); setResult(null); }}>
            <Text style={s.primaryBtnText}>{t('evaluation.newAnalysis', 'Nuevo Análisis')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const viewHistoryItem = (item: typeof evaluations[0]) => {
    // Dynamically reconstruct the URI in case the absolute path to the app's document directory changed
    const displayUri = item.fileName ? `${FileSystem.documentDirectory}${item.fileName}` : item.uri;
    setImageUri(displayUri);
    setResult(item);
    setShowHistory(false);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[`${colors.primary}30`, colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.8 }}
      />
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>
          {t('dashboard.evaluatePhysique', 'Evaluación Físca IA')}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={[s.closeBtn, { backgroundColor: colors.surface }]}>
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {showHistory ? (
          <View>
             <TouchableOpacity style={s.backToMainBtn} onPress={() => setShowHistory(false)}>
               <ChevronRight size={20} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
               <Text style={[s.backToMainText, { color: colors.primary }]}>{t('common.back', 'Volver')}</Text>
             </TouchableOpacity>
             <Text style={[s.historyTitle, { color: colors.textPrimary }]}>{t('evaluation.history', 'Historial de Evaluaciones')}</Text>
             {userEvaluations.length === 0 ? (
               <Text style={[s.instruction, { color: colors.textSecondary }]}>{t('evaluation.noHistory', 'Aún no hay evaluaciones.')}</Text>
             ) : (
               userEvaluations.map(e => (
                 <View key={e.id} style={[s.historyItem, { backgroundColor: colors.surface, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}>
                   <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => viewHistoryItem(e)}>
                     <Image cachePolicy="memory-disk" source={{ uri: e.fileName ? `${FileSystem.documentDirectory}${e.fileName}` : e.uri }} style={s.historyThumb} />
                     <View style={s.historyInfo}>
                       <Text style={[s.historyDate, { color: colors.textPrimary }]}>{e.date}</Text>
                       <Text style={[s.historyFat, { color: colors.textSecondary }]}>{t('evaluation.fatLabel', 'Grasa')}: {e.estimatedFatPercentage}</Text>
                     </View>
                     <ChevronRight size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => handleDeleteItem(e)}
                     style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}
                   >
                     <Trash2 size={20} color={colors.error || '#EF4444'} />
                   </TouchableOpacity>
                 </View>
               ))
             )}
          </View>
        ) : !imageUri ? (
          <View style={s.uploadSection}>
            <Text style={[s.instruction, { color: colors.textSecondary }]}>
              {t('evaluation.instruction', 'Sube o toma una foto de tu físico actual para recibir un análisis detallado de la IA sobre tus puntos fuertes y áreas a mejorar.')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
              <Text style={[s.sectionSubtitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('evaluation.selectArea', '¿Qué zona deseas evaluar?')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginRight: 2 }}>{t('common.swipe', 'Desliza')}</Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.areaScroll} contentContainerStyle={s.areaScrollContent}>
              {[
                { id: 'full', label: `🧍‍♂️ ${t('evaluation.fullBody','Full Body')}` },
                { id: 'upper', label: `👕 ${t('evaluation.upperBody','Upper Body')}` },
                { id: 'lower', label: `👖 ${t('evaluation.lowerBody','Legs')}` },
                { id: 'back', label: `🔙 ${t('evaluation.backBody','Back')}` },
                { id: 'arms', label: `💪 ${t('evaluation.arms','Arms')}` },
                { id: 'core', label: `🍫 ${t('evaluation.core','Core')}` },
              ].map(area => (
                <TouchableOpacity 
                  key={area.id} 
                  style={[s.areaBtn, targetArea === area.id ? { backgroundColor: colors.primary, borderColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 } : { backgroundColor: colors.surface, borderColor: `${colors.primary}20` }]}
                  onPress={() => setTargetArea(area.id as TargetArea)}
                >
                  <Text style={[s.areaBtnText, targetArea === area.id ? { color: '#FFF' } : { color: colors.textPrimary }]}>{area.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={s.buttonRow}>
              <TouchableOpacity style={[s.actionBtn, { 
                backgroundColor: colors.surface, 
                borderColor: `${colors.primary}20`,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 2 
              }]} onPress={() => pickImage(true)}>
                <Camera size={24} color={colors.primary} />
                <Text style={[s.actionBtnText, { color: colors.textPrimary }]}>{t('common.camera', 'Cámara')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[s.actionBtn, { 
                backgroundColor: colors.surface, 
                borderColor: `${colors.primary}20`,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 2 
              }]} onPress={() => pickImage(false)}>
                <Upload size={24} color={colors.primary} />
                <Text style={[s.actionBtnText, { color: colors.textPrimary }]}>{t('common.gallery', 'Galería')}</Text>
              </TouchableOpacity>
            </View>

            {userEvaluations.length > 0 && (
              <TouchableOpacity style={[s.historyBtn, { 
                backgroundColor: colors.surface,
                borderColor: `${colors.primary}20`,
                borderWidth: 1,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 2
              }]} onPress={() => setShowHistory(true)}>
                <History size={20} color={colors.textPrimary} />
                <Text style={[s.historyBtnText, { color: colors.textPrimary }]}>{t('evaluation.viewHistory', 'Ver Historial')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={s.imageSection}>
            <Image cachePolicy="memory-disk" source={{ uri: imageUri }} style={s.previewImage} contentFit="cover" />
            
            {!result && !isAnalyzing && (
              <View style={{ width: '100%' }}>
                <View style={{ width: '100%', marginTop: Spacing.lg }}>
                  <Text style={[s.statLabel, { color: colors.textSecondary, marginBottom: 8 }]}>{t('evaluation.optionalContext', 'Optional context (e.g. "It\'s my right arm doing a curl")')}</Text>
                  <TextInput
                    style={[s.contextInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                    placeholder={t('evaluation.contextPlaceholder', 'Enter details here...')}
                    placeholderTextColor={colors.textSecondary}
                    value={userContext}
                    onChangeText={setUserContext}
                  />
                </View>
                <View style={s.buttonRowImage}>
                  <TouchableOpacity style={[s.secondaryBtn, { backgroundColor: colors.surface }]} onPress={() => { setImageUri(null); setResult(null); setUserContext(''); }}>
                  <Text style={[s.secondaryBtnText, { color: colors.textPrimary }]}>{t('common.retake', 'Change')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleAnalyze}>
                  <Brain size={20} color="#FFF" />
                  <Text style={s.primaryBtnText}>{t('evaluation.analyzeBtn', 'Analizar Físico')}</Text>
                </TouchableOpacity>
              </View>
              </View>
            )}
          </View>
        )}

        {isAnalyzing && (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[s.loadingText, { color: colors.textSecondary }]}>
              {t('evaluation.analyzing', 'Analizando tu desarrollo muscular...')}
            </Text>
          </View>
        )}

        {result && renderResult(result, !!result.id && imageUri === userEvaluations.find(e => e.id === result.id)?.uri)}

        {result && result.id && (
          <TouchableOpacity style={[s.secondaryBtn, { backgroundColor: colors.surface, marginTop: Spacing.md }]} onPress={() => { setImageUri(null); setResult(null); }}>
             <Text style={[s.secondaryBtnText, { color: colors.textPrimary }]}>{t('evaluation.backToMain', 'Volver al Inicio')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <AdTimerOverlay featureId="evaluation" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 60 },
  uploadSection: { alignItems: 'center', marginTop: Spacing.xl },
  instruction: { fontSize: 16, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 24 },
  buttonRow: { flexDirection: 'row', gap: Spacing.md, width: '100%', justifyContent: 'center' },
  actionBtn: { flex: 1, height: 120, borderRadius: Radius.xl, borderWidth: 1, justifyContent: 'center', alignItems: 'center', gap: 12, ...Shadow.sm },
  actionBtnText: { fontSize: 16, fontWeight: '600' },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.xl, padding: Spacing.md, borderRadius: Radius.lg, width: '100%', justifyContent: 'center' },
  historyBtnText: { fontSize: 16, fontWeight: '600' },
  imageSection: { alignItems: 'center' },
  previewImage: { width: '100%', height: 400, borderRadius: Radius.xl },
  buttonRowImage: { flexDirection: 'row', gap: Spacing.md, width: '100%', marginTop: Spacing.lg },
  secondaryBtn: { flex: 1, height: 50, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  secondaryBtnText: { fontSize: 16, fontWeight: '600' },
  primaryBtn: { flex: 2, height: 50, borderRadius: Radius.full, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  loadingContainer: { alignItems: 'center', marginTop: Spacing.xl * 2 },
  loadingText: { marginTop: Spacing.md, fontSize: 16, fontWeight: '500' },
  resultContainer: { marginTop: Spacing.xl, gap: Spacing.md },
  resultCard: { padding: Spacing.lg, borderRadius: Radius.xl, ...Shadow.sm },
  resultTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  feedbackText: { fontSize: 15, lineHeight: 22 },
  statCard: { flex: 1, padding: Spacing.md, borderRadius: Radius.lg, alignItems: 'center', ...Shadow.sm },
  statLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800' },
  listCard: { padding: Spacing.lg, borderRadius: Radius.xl, ...Shadow.sm },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  listTitle: { fontSize: 16, fontWeight: '700' },
  listItem: { fontSize: 15, lineHeight: 22, marginBottom: 6 },
  backToMainBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  backToMainText: { fontSize: 16, fontWeight: '600' },
  historyTitle: { fontSize: 22, fontWeight: '700', marginBottom: Spacing.lg },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.md },
  historyThumb: { width: 60, height: 60, borderRadius: Radius.md, marginRight: Spacing.md },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  historyFat: { fontSize: 14 },
  paywallContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  paywallEmoji:     { fontSize: 64, marginBottom: 20 },
  paywallTitle:     { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  paywallSub:       { fontSize: 15, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  proBtn:           { width: '100%', borderRadius: Radius.md, overflow: 'hidden' },
  proGrad:          { padding: 16, alignItems: 'center' },
  proText:          { color: '#fff', fontWeight: '700', fontSize: 16 },
  sectionSubtitle:  { fontSize: 16, fontWeight: '600', marginBottom: 12, alignSelf: 'flex-start' },
  areaScroll:       { width: '100%', marginBottom: Spacing.xl },
  areaScrollContent:{ gap: Spacing.md, paddingRight: Spacing.xl },
  areaBtn:          { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1 },
  areaBtnText:      { fontSize: 14, fontWeight: '600' },
  contextInput:     { borderWidth: 1, borderRadius: Radius.lg, padding: 12, fontSize: 15 },
});

