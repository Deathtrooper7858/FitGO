import React, { useState, useEffect, useRef, Suspense } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { Sparkles, X, Flashlight, FlashlightOff, Camera, Barcode, PenLine, Search, Lightbulb, Crown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Spacing, Radius } from '../../constants';
import { getFoodByBarcode } from '../../services/foodDatabase';
import { analyzeFoodPhoto , parseVoiceLog } from '../../services/groq';
import { useNutritionStore, useSettingsStore } from '../../store';
import { useIsPro } from '../../hooks/useIsPro';
import { useTheme } from '../../hooks/useTheme';
import { SuccessModal } from '../../components/SuccessModal';
import { getLocalDateString } from '../../utils/date';
import { getSafeColor, isValidPremiumColor } from '../../utils/styles';
import { CustomAlert, AlertType } from '../../components/CustomAlert';
import { AIEnergyGate, useAIEnergy, AIEnergyMode } from '../../components/AIEnergyGate';
import VoiceInput from '../../components/scan/VoiceInput';

import { useAdStore, MAX_AI_PHOTO_ENERGY, MAX_AI_TEXT_ENERGY } from '../../store/adStore';
import { tryShowInterstitialAd } from '../../hooks/useInterstitialAd';

const BarcodeScanner = React.lazy(() => import('../../components/scan/BarcodeScanner'));
const FoodResultCard = React.lazy(() => import('../../components/scan/FoodResultCard'));
const TextSearch = React.lazy(() => import('../../components/scan/TextSearch'));

type ScanMode = 'barcode' | 'photo' | 'text' | 'search';
type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_SUGGESTIONS: Record<Meal, { emoji: string; text: string }[]> = {
  breakfast: [
    { emoji: '🥣', text: 'Avena con leche de almendras y frutos rojos' },
    { emoji: '🍳', text: '2 huevos revueltos con 1 tostada integral' },
    { emoji: '🥑', text: 'Tostada de aguacate con huevo estrellado' },
    { emoji: '🥞', text: 'Hotcakes de avena con plátano y miel' },
    { emoji: '☕', text: 'Café con leche y 1 manzana' },
  ],
  lunch: [
    { emoji: '🍗', text: '200g pechuga a la plancha con arroz blanco' },
    { emoji: '🥩', text: '180g carne asada con papas al horno' },
    { emoji: '🥗', text: 'Bowl de ensalada con atún, aguacate y quinoa' },
    { emoji: '🍝', text: 'Pasta boloñesa con carne molida y queso' },
    { emoji: '🐟', text: 'Filete de pescado con verduras al vapor' },
  ],
  dinner: [
    { emoji: '🐟', text: 'Filete de salmón 150g con ensalada fresca' },
    { emoji: '🥪', text: 'Sándwich de pechuga de pavo y queso panela' },
    { emoji: '🥣', text: 'Yogur griego con frutos secos y fresas' },
    { emoji: '🥑', text: 'Ensalada ligera de pollo y aguacate' },
    { emoji: '🍳', text: 'Omelette de 3 claras con champiñones' },
  ],
  snack: [
    { emoji: '🥤', text: 'Batido de proteína con 300ml de leche' },
    { emoji: '🍎', text: '1 manzana picada con mantequilla de maní' },
    { emoji: '🥜', text: 'Puñado de 30g de nueces o almendras' },
    { emoji: '🍫', text: '1 barra de proteína de 20g' },
    { emoji: '🧀', text: '1 taza de queso cottage con durazno' },
  ],
};

export default function ScanModal() {
  const { t } = useTranslation();
  const { initialMeal, date, initialMode } = useLocalSearchParams<{ initialMeal?: Meal, date?: string, initialMode?: ScanMode }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ScanMode>(initialMode || 'photo');
  const [textInput, setTextInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const colors = useTheme();
  const { language, premiumColor } = useSettingsStore();
  const addLog = useNutritionStore(s => s.addLog);
  const isProActually = useIsPro();
  const { aiPhotoEnergy, aiTextEnergy } = useAdStore();

  const safePremiumColor = getSafeColor(premiumColor, colors.primary);
  const isPremiumCustom = !!(isProActually && isValidPremiumColor(premiumColor));
  const [showSuccess, setShowSuccess] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  const { gateVisible, gateMode, setGateVisible, setGateMode, setPendingAction, requestAIAction, handleEnergyGranted } = useAIEnergy();


  const isAddingAllRef = useRef(false);

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
    type: AlertType, title: string, message: string,
    onConfirm?: () => void, onCancel?: () => void,
    confirmText?: string, cancelText?: string
  ) => {
    setAlert({
      visible: true, type, title, message, confirmText, cancelText,
      onConfirm: () => { onConfirm?.(); setAlert(prev => ({ ...prev, visible: false })); },
      onCancel: () => { onCancel?.(); setAlert(prev => ({ ...prev, visible: false })); },
    });
  };

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission?.granted, requestPermission]);

  const [photoResult, setPhotoResult] = useState<{
    foods: {
      name: string; grams: number; calories: number; protein: number; carbs: number; fat: number;
      sugar?: number; fiber?: number; sodium?: number; iron?: number; calcium?: number; saturatedFat?: number; transFat?: number;
    }[];
    totalCalories: number;
    confidence: 'high' | 'medium' | 'low';
    notes: string;
  } | null>(null);

  const [editedFoods, setEditedFoods] = useState<{
    name: string; grams: number; calories: number; protein: number; carbs: number; fat: number;
    sugar?: number; fiber?: number; sodium?: number; iron?: number; calcium?: number; saturatedFat?: number; transFat?: number;
    originalGrams: number; originalCal: number; originalProt: number; originalCarbs: number; originalFat: number;
    originalSugar?: number; originalFiber?: number; originalSodium?: number; originalIron?: number; originalCalcium?: number; originalSatFat?: number; originalTransFat?: number;
  }[]>([]);

  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const [logTime, setLogTime] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const nameDebounceRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timers = nameDebounceRefs.current;
    return () => {
      Object.values(timers).forEach(t => clearTimeout(t));
    };
  }, []);

  const updateName = (index: number, newName: string) => {
    setEditedFoods(prev => prev.map((f, i) => i !== index ? f : { ...f, name: newName }));
    if (nameDebounceRefs.current[index]) clearTimeout(nameDebounceRefs.current[index]);
    // Recalculate on blur — handled via onBlur pattern in FoodResultCard not possible with current design,
    // so we debounce and call handleNameBlur when user stops typing
    nameDebounceRefs.current[index] = setTimeout(() => handleNameBlur(index, newName), 1000);
  };

  const handleNameBlur = async (index: number, newName: string) => {
    if (!newName.trim()) return;
    try {
      setLoading(true);
      const parsedItems = await parseVoiceLog(newName, language);
      if (parsedItems && parsedItems.length > 0) {
        const item = parsedItems[0];
        setEditedFoods(prev => prev.map((f, i) => {
          if (i !== index) return f;
          const currentGrams = f.grams;
          const ratio = currentGrams / item.grams;
          return {
            ...f,
            name: item.name || f.name,
            originalGrams: item.grams,
            originalCal: item.calories,
            originalProt: item.protein,
            originalCarbs: item.carbs,
            originalFat: item.fat,
            originalSugar: item.sugar,
            originalFiber: item.fiber,
            originalSodium: item.sodium,
            originalIron: item.iron,
            originalCalcium: item.calcium,
            originalSatFat: item.saturatedFat,
            originalTransFat: item.transFat,
            calories: Math.round(item.calories * ratio),
            protein:  Math.round(item.protein  * ratio),
            carbs:    Math.round(item.carbs    * ratio),
            fat:      Math.round(item.fat      * ratio),
            sugar:    item.sugar      ? Math.round(item.sugar      * ratio) : undefined,
            fiber:    item.fiber      ? Math.round(item.fiber      * ratio) : undefined,
            sodium:   item.sodium     ? Math.round(item.sodium     * ratio) : undefined,
            iron:     item.iron       ? Math.round(item.iron       * ratio) : undefined,
            calcium:  item.calcium    ? Math.round(item.calcium    * ratio) : undefined,
            saturatedFat: item.saturatedFat ? Math.round(item.saturatedFat * ratio) : undefined,
            transFat:     item.transFat     ? Math.round(item.transFat     * ratio) : undefined,
          };
        }));
      }
    } catch (err) {
      console.warn('Error recalculating macros:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateGrams = (index: number, newGrams: string) => {
    const val = parseInt(newGrams) || 0;
    setEditedFoods(prev => prev.map((f, i) => {
      if (i !== index) return f;
      const ratio = val / f.originalGrams;
      return {
        ...f,
        grams: val,
        calories: Math.round(f.originalCal * ratio),
        protein:  Math.round(f.originalProt * ratio),
        carbs:    Math.round(f.originalCarbs * ratio),
        fat:      Math.round(f.originalFat * ratio),
        sugar:    f.originalSugar ? Math.round(f.originalSugar * ratio) : undefined,
        fiber:    f.originalFiber ? Math.round(f.originalFiber * ratio) : undefined,
        sodium:   f.originalSodium ? Math.round(f.originalSodium * ratio) : undefined,
        iron:     f.originalIron ? Math.round(f.originalIron * ratio) : undefined,
        calcium:  f.originalCalcium ? Math.round(f.originalCalcium * ratio) : undefined,
        saturatedFat: f.originalSatFat ? Math.round(f.originalSatFat * ratio) : undefined,
        transFat:     f.originalTransFat ? Math.round(f.originalTransFat * ratio) : undefined,
      };
    }));
  };

  const checkAiLimit = (scanMode: 'photo' | 'text', onAllowed: () => void): void => {
    if (isProActually) { onAllowed(); return; }
    requestAIAction(onAllowed, scanMode as AIEnergyMode);
  };

  const getAutoMeal = (): Meal => {
    const h = new Date().getHours();
    if (h < 10) return 'breakfast';
    if (h < 14) return 'lunch';
    if (h < 18) return 'snack';
    return 'dinner';
  };

  const handleBarcode = async (code: string) => {
    if (loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const food = await getFoodByBarcode(code, language);
      setLoading(false);
      if (!food) {
        showAlert(
          'confirm', t('scan.productNotFound'),
          `Barcode: ${code}\n\n${t('scan.productNotFoundSub')}`,
          () => setScanned(false),
          () => router.back(),
          t('scan.tryAgain'), t('common.cancel')
        );
        return;
      }
      router.replace({
        pathname: '/modals/food-detail',
        params: { foodJson: JSON.stringify(food), meal: initialMeal || getAutoMeal(), date: date },
      });
    } catch {
      setLoading(false);
      showAlert('error', t('common.error'), t('scan.lookupFailed'), () => setScanned(false));
    }
  };

  const handlePickImage = async () => {
    if (loading) return;
    checkAiLimit('photo', async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'], allowsEditing: true, quality: 0.5, base64: true,
        });
        if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];
          let b64 = asset.base64 || null;
          if (!b64 && asset.uri) {
            try {
              b64 = await FileSystem.readAsStringAsync(asset.uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
            } catch (readErr) {
              console.warn('[Scan] Could not read base64 from image uri:', readErr);
            }
          }
          if (!b64) {
            throw new Error(t('scan.imageReadFailed', 'No se pudo procesar la imagen seleccionada.'));
          }

          setLoading(true);
          setCapturedUri(asset.uri);
          const analysis = await analyzeFoodPhoto(b64, language);
          setPhotoResult(analysis);
          const foodsList = Array.isArray(analysis?.foods) ? analysis.foods : [];
          setEditedFoods(foodsList.map(f => ({
            ...f,
            originalGrams: f.grams, originalCal: f.calories, originalProt: f.protein,
            originalCarbs: f.carbs, originalFat: f.fat, originalSugar: f.sugar,
            originalFiber: f.fiber, originalSodium: f.sodium, originalIron: f.iron,
            originalCalcium: f.calcium, originalSatFat: f.saturatedFat, originalTransFat: f.transFat,
          })));
        }
      } catch (err: any) {
        console.warn('Picker Error:', err);
        const isOffline = err?.message?.includes('Sin conexión') || err?.message?.includes('Network Error');
        showAlert('error', t('common.error'), isOffline
          ? t('scan.noInternet', 'Sin conexión a internet. La Inteligencia Artificial requiere conexión.')
          : t('scan.analysisFailedSub', { error: err?.message || err }));
      } finally { setLoading(false); }
    });
  };

  const handleTakePhoto = async () => {
    if (loading || !cameraRef.current) return;
    checkAiLimit('photo', async () => {
      setLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5, exif: false });
        let b64 = photo.base64 || null;
        if (!b64 && photo.uri) {
          try {
            b64 = await FileSystem.readAsStringAsync(photo.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch (readErr) {
            console.warn('[Scan] Could not read base64 from photo uri:', readErr);
          }
        }
        if (!b64) {
          throw new Error(t('scan.imageReadFailed', 'No se pudo procesar la foto tomada.'));
        }

        setCapturedUri(photo.uri);
        const result = await analyzeFoodPhoto(b64, language);
        setPhotoResult(result);
        const foodsList = Array.isArray(result?.foods) ? result.foods : [];
        setEditedFoods(foodsList.map(f => ({
          ...f,
          originalGrams: f.grams, originalCal: f.calories, originalProt: f.protein,
          originalCarbs: f.carbs, originalFat: f.fat, originalSugar: f.sugar,
          originalFiber: f.fiber, originalSodium: f.sodium, originalIron: f.iron,
          originalCalcium: f.calcium, originalSatFat: f.saturatedFat, originalTransFat: f.transFat,
        })));
      } catch (err: any) {
        console.warn('Analysis Error:', err);
        const isOffline = err?.message?.includes('Sin conexión') || err?.message?.includes('Network Error');
        showAlert('error', t('common.error'), isOffline
          ? t('scan.noInternet', 'Sin conexión a internet. La Inteligencia Artificial requiere conexión.')
          : t('scan.analysisFailedSub', { error: err?.message || err }));
      } finally { setLoading(false); }
    });
  };

  const handleTextAnalyze = async () => {
    if (!textInput.trim()) return;
    checkAiLimit('text', async () => {
      setLoading(true);
      try {
        const items = await parseVoiceLog(textInput, language);
        if (!items || items.length === 0) {
          showAlert('warning', t('common.error'), t('scan.noFoodsFound'));
          return;
        }
        setPhotoResult({
          foods: items,
          totalCalories: items.reduce((acc: number, f: any) => acc + f.calories, 0),
          confidence: 'high',
          notes: textInput
        });
        setEditedFoods(items.map((f: any) => ({
          ...f,
          originalGrams: f.grams, originalCal: f.calories, originalProt: f.protein,
          originalCarbs: f.carbs, originalFat: f.fat, originalSugar: f.sugar,
          originalFiber: f.fiber, originalSodium: f.sodium, originalIron: f.iron,
          originalCalcium: f.calcium, originalSatFat: f.saturatedFat, originalTransFat: f.transFat,
        })));
        setCapturedUri('text');
      } catch (err: any) {
        console.warn('[ScanModal] Text analyze error:', err);
        const isOffline = err?.message?.includes('Sin conexión') || err?.message?.includes('Network Error');
        showAlert('error', t('common.error'), isOffline
          ? t('scan.noInternet', 'Sin conexión a internet.')
          : (err?.message || t('scan.analysisFailed') || 'AI analysis failed.'));
      } finally { setLoading(false); }
    });
  };

  const handleAddAllFoods = async () => {
    if (!editedFoods.length || loading || isAddingAllRef.current) return;
    isAddingAllRef.current = true;
    setLoading(true);

    const targetMeal = initialMeal || getAutoMeal();

    const ts = logTime.toISOString().split('T')[1] || '12:00:00.000Z';
    const finalLoggedAt = date ? `${date}T${ts}` : logTime.toISOString();

    const localLogs = editedFoods.map((food) => {
      const origG = food.originalGrams > 0 ? food.originalGrams : (food.grams > 0 ? food.grams : 100);
      return {
        id: Crypto.randomUUID(),
        foodItem: {
          id: Crypto.randomUUID(),
          name: food.name,
          calories: Math.round(((food.originalCal || food.calories) / origG) * 100),
          protein: Math.round(((food.originalProt || food.protein) / origG) * 100),
          carbs: Math.round(((food.originalCarbs || food.carbs) / origG) * 100),
          fat: Math.round(((food.originalFat || food.fat) / origG) * 100),
          sugar: food.originalSugar ? Math.round((food.originalSugar / origG) * 100) : undefined,
          fiber: food.originalFiber ? Math.round((food.originalFiber / origG) * 100) : undefined,
          sodium: food.originalSodium ? Math.round((food.originalSodium / origG) * 100) : undefined,
          iron: food.originalIron ? Math.round((food.originalIron / origG) * 100) : undefined,
          calcium: food.originalCalcium ? Math.round((food.originalCalcium / origG) * 100) : undefined,
          saturatedFat: food.originalSatFat ? Math.round((food.originalSatFat / origG) * 100) : undefined,
          transFat: food.originalTransFat ? Math.round((food.originalTransFat / origG) * 100) : undefined,
          source: 'custom' as const,
        },
        grams: food.grams,
        meal: targetMeal,
        loggedAt: finalLoggedAt,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        sugar: food.sugar,
        fiber: food.fiber,
        sodium: food.sodium,
        iron: food.iron,
        calcium: food.calcium,
        saturatedFat: food.saturatedFat,
        transFat: food.transFat,
      };
    });

    try {
      await Promise.all(localLogs.map(log => addLog(log)));
    } catch (err) {
      console.warn('[ScanModal] Sync error (local save succeeded):', err);
    } finally {
      isAddingAllRef.current = false;
      setLoading(false);
    }
    setShowSuccess(true);
  };

  const resetPhoto = () => {
    setCapturedUri(null);
    setPhotoResult(null);
  };

  const handleBarcodeScanned = (code: string) => handleBarcode(code);

  const handleVoiceTextResult = (text: string) => {
    setTextInput(prev => prev ? `${prev} ${text}` : text);
  };

  const handleFoodSearchSelect = (food: any) => {
    router.replace({
      pathname: '/modals/food-detail',
      params: {
        foodJson: JSON.stringify(food),
        meal: initialMeal || getAutoMeal(),
        date: date
      },
    });
  };

  const handleAddMissing = () => {
    handleAddAllFoods().then(() => {
      router.replace({
        pathname: '/modals/scan',
        params: { initialMeal: initialMeal || getAutoMeal(), date: date || getLocalDateString(), initialMode: 'search' },
      } as any);
    });
  };

  let content;

  if (!permission) {
    content = (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  } else if (!permission.granted) {
    content = (
      <View style={s.center}>
        <Text style={s.noPermText}>{t('scan.noPermission')}</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <LinearGradient colors={['#7C5CFC', '#4338CA']} style={s.permGrad}>
            <Text style={s.permBtnText}>{t('scan.grantPermission')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  } else if (photoResult && capturedUri) {
    content = (
      <Suspense fallback={<ActivityIndicator color={colors.primary} size="large" />}>
      <FoodResultCard
        food={photoResult}
        editedFoods={editedFoods}
        capturedUri={capturedUri}
        logTime={logTime}
        showTimePicker={showTimePicker}
        loading={loading}
        colors={colors}
        t={t}
        language={language}
        initialMeal={initialMeal}
        date={date}
        isPremiumCustom={isPremiumCustom}
        safePremiumColor={safePremiumColor}
        onUpdateName={updateName}
        onUpdateGrams={updateGrams}
        onResetPhoto={resetPhoto}
        onAddAll={handleAddAllFoods}
        onAddMissing={handleAddMissing}
        onTimeChange={(d: Date) => setLogTime(d)}
        onToggleTimePicker={() => setShowTimePicker(p => Platform.OS === 'ios' ? !p : true)}
      />
      </Suspense>
    );
  } else {
    const isCameraMode = mode === 'barcode' || mode === 'photo';
    const currentMeal: Meal = initialMeal || getAutoMeal();

    content = (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        {isCameraMode ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            flash={flash}
            enableTorch={flash === 'on'}
            onBarcodeScanned={mode === 'barcode' && !scanned ? (e) => handleBarcode(e.data) : undefined}
            barcodeScannerSettings={mode === 'barcode' ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128'] } : undefined}
          />
        ) : (
          <>
            <LinearGradient
              colors={[colors.background, colors.primary + '30', colors.background]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <LinearGradient
              colors={[colors.primary + '40', 'transparent']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </>
        )}

        <View style={s.overlay}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity
              style={[s.closeBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <X size={18} color="#fff" />
            </TouchableOpacity>

            <View style={s.titleContainer}>
              <View style={s.titleRow}>
                <Text style={s.title}>FitGO AI</Text>
                <View style={[s.aiPill, { backgroundColor: colors.primary + '2E', borderColor: colors.primary + '60' }]}>
                  <Sparkles size={10} color={colors.primaryLight || '#C4B5FD'} />
                  <Text style={[s.aiPillText, { color: colors.primaryLight || '#C4B5FD' }]}>AI</Text>
                </View>
              </View>
              <Text style={s.subtitle}>
                {t(`tracker.${currentMeal}`)} · {t('scan.aiNutrition', 'Nutrición Inteligente')}
              </Text>
            </View>

            {isCameraMode ? (
              <TouchableOpacity
                style={[s.closeBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setFlash(f => f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off')}
                activeOpacity={0.7}
              >
                {flash === 'on' ? (
                  <Flashlight size={18} color="#F59E0B" />
                ) : flash === 'auto' ? (
                  <Sparkles size={18} color="#38BDF8" />
                ) : (
                  <FlashlightOff size={18} color="rgba(255,255,255,0.6)" />
                )}
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36, height: 36 }} />
            )}
          </View>

          {/* Mode Selector Tabs */}
          <View style={s.tabContainer}>
            <View style={[s.modeRow, { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
              {(['barcode', 'photo', 'text', 'search'] as ScanMode[]).map((m) => {
                const isActive = mode === m;
                const iconColor = isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)';
                return (
                  <TouchableOpacity
                    key={m}
                    style={[s.modePill, isActive && s.modePillActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMode(m);
                    }}
                    activeOpacity={0.75}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={[colors.primary, colors.secondary || '#A855F7']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[StyleSheet.absoluteFill, { borderRadius: Radius.full }]}
                      />
                    ) : null}
                    {m === 'barcode' ? (
                      <Barcode size={13} color={iconColor} />
                    ) : m === 'photo' ? (
                      <Camera size={13} color={iconColor} />
                    ) : m === 'text' ? (
                      <PenLine size={13} color={iconColor} />
                    ) : (
                      <Search size={13} color={iconColor} />
                    )}
                    <Text style={[s.modeText, isActive && s.modeTextActive]} numberOfLines={1}>
                      {m === 'barcode' ? t('scan.barcode') : m === 'photo' ? t('scan.photo') : m === 'text' ? t('scan.text') : t('common.search') || 'Buscar'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={s.viewfinderWrap}>
            {mode === 'barcode' ? (
              <Suspense fallback={<ActivityIndicator color={colors.primary} size="large" />}>
              <BarcodeScanner
                onBarcodeScanned={handleBarcodeScanned}
                onClose={() => router.back()}
                colors={colors}
              />
              </Suspense>
            ) : mode === 'photo' ? (
              <>
                <View style={s.viewfinder}>
                  <View style={[s.corner, s.tl, { borderColor: '#fff' }]} />
                  <View style={[s.corner, s.tr, { borderColor: '#fff' }]} />
                  <View style={[s.corner, s.bl, { borderColor: '#fff' }]} />
                  <View style={[s.corner, s.br, { borderColor: '#fff' }]} />
                </View>
                <View style={s.photoInstructions}>
                  <Text style={[s.photoHint, { color: colors.primary }]}>{t('scan.photoHint') || 'Point at your meal'}</Text>
                  <Text style={[s.photoHintSub, { color: colors.primary + 'CC' }]}>{t('scan.photoHintSub') || 'AI will analyze and estimate nutrition'}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', fontStyle: 'italic', marginTop: 12 }}>
                    💡 {t('scan.photoPrecisionHint', 'Para mayor precisión, intenta que las proporciones se vean claras.')}
                  </Text>
                </View>
                <View style={s.statusWrap}>
                  <View style={s.photoControls}>
                    <TouchableOpacity style={s.galleryBtn} onPress={handlePickImage}>
                      <Text style={{ fontSize: 20 }}>🖼️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.shutterOuter} onPress={handleTakePhoto} disabled={loading}>
                      <LinearGradient colors={[colors.tabActive, colors.tabActive + 'CC']} style={s.shutterInner}>
                        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.shutterIcon}>📸</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.galleryBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
                      <Text style={{ fontSize: 20 }}>🔄</Text>
                    </TouchableOpacity>
                  </View>
                  {!isProActually && (
                    <TouchableOpacity style={s.creditRow} onPress={() => { setGateMode('photo'); setPendingAction(() => {}); setGateVisible(true); }}>
                      {Array.from({ length: MAX_AI_PHOTO_ENERGY }).map((_, i) => (
                        <View key={i} style={[s.creditDot, i < aiPhotoEnergy ? s.creditDotActive : s.creditDotEmpty]} />
                      ))}
                      <Text style={s.limitNote}> {aiPhotoEnergy}/{MAX_AI_PHOTO_ENERGY} ⚡ <Text style={{ color: colors.tabActive, fontWeight: 'bold' }}>+</Text></Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : mode === 'text' ? (
              <ScrollView
                contentContainerStyle={s.textScrollContent}
                style={{ width: '100%' }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Active Meal Badge */}
                <View style={s.mealBadgeRow}>
                  <View style={[s.mealBadge, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <Text style={s.mealBadgeEmoji}>
                      {currentMeal === 'breakfast' ? '🍳' : currentMeal === 'lunch' ? '🍗' : currentMeal === 'dinner' ? '🥗' : '🍎'}
                    </Text>
                    <Text style={s.mealBadgeText}>
                      {t('scan.loggingTo', 'Registrando en')}:{' '}
                      <Text style={{ fontWeight: '800', color: colors.primaryLight || '#C4B5FD' }}>
                        {t(`tracker.${currentMeal}`)}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Main Text Input Card */}
                <View
                  style={[
                    s.textCard,
                    {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderColor: isFocused ? (colors.primaryLight || '#8B5CF6') : 'rgba(255,255,255,0.12)',
                      shadowColor: isFocused ? (colors.primary || '#8B5CF6') : '#000',
                      shadowOpacity: isFocused ? 0.35 : 0.15,
                      shadowRadius: isFocused ? 12 : 6,
                    },
                  ]}
                >
                  {/* Card Header */}
                  <View style={s.cardHeader}>
                    <View style={s.cardHeaderLeft}>
                      <Sparkles size={14} color={colors.primaryLight || '#C4B5FD'} />
                      <Text style={[s.cardHeaderTitle, { color: colors.primaryLight || '#C4B5FD' }]}>
                        {t('scan.aiInputPrompt', 'Describe tu comida o usa tu voz')}
                      </Text>
                    </View>
                    {textInput.length > 0 && (
                      <TouchableOpacity
                        style={s.clearBtn}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setTextInput('');
                        }}
                      >
                        <X size={14} color="rgba(255,255,255,0.6)" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* TextInput */}
                  <TextInput
                    style={[s.textInputArea, { backgroundColor: 'transparent' }]}
                    placeholder={t('scan.textPlaceholder') || "Describe lo que comiste (ej. 2 huevos revueltos con un café y pan tostado)..."}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                    value={textInput}
                    onChangeText={setTextInput}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    underlineColorAndroid="transparent"
                    textAlignVertical="top"
                    cursorColor={colors.primaryLight || '#C4B5FD'}
                    selectionColor={(colors.primary || '#7C5CFC') + '55'}
                  />

                  {/* Card Footer */}
                  <View style={s.cardFooter}>
                    <Text style={s.charCount}>
                      {textInput.length > 0
                        ? `${textInput.length} ${t('common.characters', 'caracteres')}`
                        : t('scan.voicePrompt', 'Toca el micro para dictar')}
                    </Text>
                    <VoiceInput
                      onTextResult={handleVoiceTextResult}
                      language={language}
                      colors={colors}
                      t={t}
                    />
                  </View>
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  style={[s.analyzeBtn, (!textInput.trim() || loading) && { opacity: 0.55 }]}
                  onPress={handleTextAnalyze}
                  disabled={loading || !textInput.trim()}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.secondary || '#A855F7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.analyzeGrad}
                  >
                    {loading ? (
                      <View style={s.loadingRow}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={s.analyzeText}>{t('scan.analyzing', 'Analizando con IA...')}</Text>
                      </View>
                    ) : (
                      <View style={s.loadingRow}>
                        <Sparkles size={18} color="#fff" />
                        <Text style={s.analyzeText}>{t('scan.analyze') || 'Analizar comida con IA'}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Pro / Energy Badge */}
                {isProActually ? (
                  <View style={s.proPill}>
                    <Crown size={14} color="#F59E0B" />
                    <Text style={s.proPillText}>FitGO AI Pro · Análisis Ilimitados</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={s.creditRow}
                    onPress={() => {
                      setGateMode('text');
                      setPendingAction(() => {});
                      setGateVisible(true);
                    }}
                  >
                    <View style={s.dotsWrap}>
                      {Array.from({ length: MAX_AI_TEXT_ENERGY }).map((_, i) => (
                        <View
                          key={i}
                          style={[s.creditDot, i < aiTextEnergy ? s.creditDotActive : s.creditDotEmpty]}
                        />
                      ))}
                    </View>
                    <Text style={s.limitNote}>
                      {aiTextEnergy}/{MAX_AI_TEXT_ENERGY} {t('scan.aiEnergyAvailable', 'análisis disponibles hoy')} ·{' '}
                      <Text style={{ color: colors.tabActive, fontWeight: '800' }}>{t('scan.getMore', 'Recargar +')}</Text>
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Quick Meal Suggestion Chips */}
                <View style={s.suggestionsSection}>
                  <View style={s.sectionHeaderRow}>
                    <Text style={s.sectionTitle}>💡 {t('scan.quickIdeas', 'Ideas para tu comida')}</Text>
                    <Text style={s.sectionSubtitle}>{t('scan.tapToUse', 'Toca para rellenar')}</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.chipsScroll}
                  >
                    {(MEAL_SUGGESTIONS[currentMeal] || MEAL_SUGGESTIONS.lunch).map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={s.chip}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setTextInput(prev => prev ? `${prev}, ${item.text}` : item.text);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={s.chipEmoji}>{item.emoji}</Text>
                        <Text style={s.chipText}>{item.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* AI Precision Guide Card */}
                <View style={[s.tipsCard, { borderColor: 'rgba(255,255,255,0.08)' }]}>
                  <View style={s.tipsHeader}>
                    <Lightbulb size={16} color="#F59E0B" />
                    <Text style={s.tipsTitle}>{t('scan.tipsTitle', 'Tips para máxima precisión')}</Text>
                  </View>
                  <View style={s.tipItem}>
                    <Text style={s.tipIcon}>⚖️</Text>
                    <Text style={s.tipText}>
                      <Text style={s.tipBold}>Cantidades: </Text>
                      {t('scan.tipQuantities', 'Indica gramos o porciones (ej. 150g pollo, 1 taza arroz).')}
                    </Text>
                  </View>
                  <View style={s.tipItem}>
                    <Text style={s.tipIcon}>🍳</Text>
                    <Text style={s.tipText}>
                      <Text style={s.tipBold}>Cocción: </Text>
                      {t('scan.tipCooking', 'Menciona si es a la plancha, frito, hervido o al vapor.')}
                    </Text>
                  </View>
                  <View style={s.tipItem}>
                    <Text style={s.tipIcon}>🏷️</Text>
                    <Text style={s.tipText}>
                      <Text style={s.tipBold}>Marcas y aderezos: </Text>
                      {t('scan.tipBrands', 'Añade aceites, salsas o marcas conocidas si aplica.')}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <Suspense fallback={<ActivityIndicator color={colors.primary} size="large" />}>
              <TextSearch
                onFoodSelected={handleFoodSearchSelect}
                colors={colors}
                t={t}
                language={language}
              />
              </Suspense>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
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
      {content}
      <SuccessModal
        visible={showSuccess}
        title={t('common.success')}
        message={`${editedFoods.length} ${t('scan.itemsAdded')} ${t(`tracker.${initialMeal || getAutoMeal()}`)}.`}
        onClose={() => {
          setShowSuccess(false);
          // Intersticial al cerrar el modal de éxito — momento natural
          if (!isProActually) tryShowInterstitialAd();
          router.back();
        }}
      />
      <AIEnergyGate
        visible={gateVisible}
        onClose={() => setGateVisible(false)}
        onEnergyGranted={handleEnergyGranted}
        mode={gateMode}
      />
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.base },
  noPermText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  permBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  permGrad: { paddingHorizontal: 24, paddingVertical: 14 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: 54, paddingBottom: 14 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  titleContainer: { alignItems: 'center', gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 17, fontWeight: '800', letterSpacing: 0.5, color: '#fff' },
  aiPill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  aiPillText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  tabContainer: { paddingHorizontal: Spacing.base, marginBottom: 14 },
  modeRow: { flexDirection: 'row', borderRadius: Radius.full, padding: 3, overflow: 'hidden' },
  modePill: { flex: 1, borderRadius: Radius.full, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  modePillActive: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
  modeText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '700' },
  modeTextActive: { color: '#fff' },
  viewfinderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  viewfinder: { width: 280, height: 200 },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderWidth: CORNER_THICKNESS },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },
  photoInstructions: { position: 'absolute', top: 60, width: '100%', alignItems: 'center', paddingHorizontal: 40 },
  photoHint: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  photoHintSub: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontWeight: '500' },
  statusWrap: { position: 'absolute', bottom: 0, width: '100%', padding: Spacing.base, paddingBottom: 60, alignItems: 'center' },
  shutterOuter: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.2)', padding: 4, justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: '100%', height: '100%', borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  shutterIcon: { fontSize: 32 },
  photoControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 48, width: '100%', marginBottom: 12 },
  galleryBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  textScrollContent: { paddingHorizontal: Spacing.base, paddingTop: 6, paddingBottom: 50, gap: 14 },
  mealBadgeRow: { alignItems: 'center' },
  mealBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, gap: 6 },
  mealBadgeEmoji: { fontSize: 13 },
  mealBadgeText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },
  textCard: { borderRadius: Radius.xl, borderWidth: 1.5, padding: 16, minHeight: 180, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardHeaderTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  clearBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  textInputArea: { flex: 1, minHeight: 95, fontSize: 15, color: '#FFFFFF', textAlignVertical: 'top', paddingTop: 4, paddingBottom: 4, paddingHorizontal: 0, lineHeight: 22, fontWeight: '500', backgroundColor: 'transparent' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  charCount: { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  analyzeBtn: { borderRadius: Radius.xl, overflow: 'hidden', marginTop: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  analyzeGrad: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  analyzeText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  proPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(245, 158, 11, 0.12)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, alignSelf: 'center' },
  proPillText: { color: '#F59E0B', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  creditRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'center', paddingVertical: 3 },
  dotsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  creditDot: { width: 8, height: 8, borderRadius: 4 },
  creditDotActive: { backgroundColor: '#F59E0B' },
  creditDotEmpty: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  limitNote: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  suggestionsSection: { gap: 8, marginTop: 4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4 },
  sectionTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  sectionSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '500' },
  chipsScroll: { gap: 8, paddingHorizontal: 2, paddingVertical: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 13, paddingVertical: 9, borderRadius: Radius.full },
  chipEmoji: { fontSize: 15 },
  chipText: { color: '#F1F5F9', fontSize: 12, fontWeight: '600' },
  tipsCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: Radius.lg, borderWidth: 1, padding: 14, gap: 8, marginTop: 2 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipsTitle: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipIcon: { fontSize: 13, marginTop: 1 },
  tipText: { flex: 1, color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 17 },
  tipBold: { color: '#FFFFFF', fontWeight: '700' },
});
