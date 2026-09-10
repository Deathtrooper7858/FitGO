import React from 'react';
import { View, Text } from 'react-native';
import {
  Scale,
  Moon,
  Zap,
  Flame,
  Ruler,
  Camera,
  UtensilsCrossed,
  Dumbbell,
  Sparkles,
  Lock,
} from 'lucide-react-native';
import { WidgetCard, w } from './WidgetCard';

export interface WidgetRendererProps {
  id: string;
  index: number;
  isEditing: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onLongPress: () => void;
  // State from Dashboard
  currentWeight: number;
  sleepHours: number;
  calories: number;
  bodyFat?: number;
  totalsData: any;
  isPro: boolean;
  colors: any;
  massUnit?: string;
  t: (key: string, ...args: any[]) => string;
  router: any;
  hasPremiumAdAccess: (featureId: string) => boolean;
  handlePremiumFeaturePress: (featureId: string, featureName: string, icon: string, route: string) => void;
}

export function renderDashboardWidget(props: WidgetRendererProps) {
  const {
    id, index, isEditing, canMoveLeft, canMoveRight, onMoveLeft, onMoveRight, onLongPress,
    currentWeight, sleepHours, calories, bodyFat, isPro, colors, massUnit = 'kg', t, router,
    hasPremiumAdAccess, handlePremiumFeaturePress
  } = props;

  const commonProps = {
    index,
    isEditing,
    onLongPress,
    onMoveLeft,
    onMoveRight,
    canMoveLeft,
    canMoveRight
  };

  const isLbs = massUnit === 'lb';
  const displayWeight = isLbs ? (currentWeight * 2.20462).toFixed(1) : currentWeight.toFixed(1);

  switch (id) {
    case 'weight':
      return (
        <WidgetCard
          key={id}
          {...commonProps}
          title={t('dashboard.weightWidget', 'Peso')}
          icon={<Scale size={18} color="#8B5CF6" />}
          iconColor="#8B5CF6"
          value={`${displayWeight} ${massUnit}`}
          subValue={t('dashboard.tapToUpdate', 'Toca para actualizar')}
          onPress={() => router.push('/modals/body-measurements')}
        />
      );

    case 'sleep': {
      const isGoodSleep = sleepHours >= 7;
      const sleepColor = sleepHours > 0 ? (isGoodSleep ? '#10B981' : '#F59E0B') : '#6366F1';
      return (
        <WidgetCard
          key={id}
          {...commonProps}
          title={t('dashboard.sleepWidget', 'Sueño')}
          icon={<Moon size={18} color={sleepColor} />}
          iconColor={sleepColor}
          badge={sleepHours > 0 ? (isGoodSleep ? 'Óptimo' : 'Mejorable') : undefined}
          badgeColor={sleepColor}
          customContent={
            <View style={w.content}>
              <Text style={[w.value, { color: colors.textPrimary }]}>
                {sleepHours > 0 ? `${sleepHours}h` : '--'}
              </Text>
              <Text style={[w.subValue, { color: colors.textSecondary }]}>
                {sleepHours > 0 ? t('dashboard.loggedToday', 'Registrado hoy') : t('dashboard.tapToAdd', 'Toca para añadir')}
              </Text>
            </View>
          }
          onPress={() => router.push('/modals/sleep' as any)}
        />
      );
    }

    case 'calories':
      return (
        <WidgetCard
          key={id}
          {...commonProps}
          title={t('dashboard.caloriesWidget', 'Calorías')}
          icon={<Zap size={18} color="#F59E0B" />}
          iconColor="#F59E0B"
          customContent={
            <View style={w.content}>
              <Text style={[w.value, { color: colors.textPrimary }]}>{calories}</Text>
              <Text style={[w.subValue, { color: colors.textSecondary }]}>
                {t('dashboard.logFood', 'Ver desglose')}
              </Text>
            </View>
          }
          onPress={() => router.push('/(tabs)/tracker')}
        />
      );

    case 'bodyFat': {
      const fatColor = '#EC4899';
      return (
        <WidgetCard
          key={id}
          {...commonProps}
          title={t('dashboard.bodyFatWidget', 'Grasa')}
          icon={<Flame size={18} color={fatColor} />}
          iconColor={fatColor}
          value={bodyFat ? `${bodyFat}%` : '--'}
          subValue={t('dashboard.tapToUpdate', 'Toca para actualizar')}
          onPress={() => router.push('/modals/body-measurements')}
        />
      );
    }

    case 'measurements':
      return (
        <WidgetCard
          key={id}
          {...commonProps}
          title={t('dashboard.measurementsWidget', 'Medidas')}
          icon={<Ruler size={18} color="#10B981" />}
          iconColor="#10B981"
          value={t('dashboard.seeHistory', 'Historial')}
          subValue={t('dashboard.measurementsSub', 'Cintura, pecho, etc.')}
          onPress={() => router.push('/modals/body-measurements')}
        />
      );

    case 'photos': {
      const hasPhotoAccess = isPro || hasPremiumAdAccess('evaluation');
      return (
        <WidgetCard
          key={id}
          {...commonProps}
          title={t('dashboard.evaluationWidget', 'Evaluación IA')}
          icon={<Camera size={18} color="#A855F7" />}
          iconColor="#A855F7"
          badge={hasPhotoAccess ? 'IA' : 'PRO'}
          badgeColor="#A855F7"
          adTimerFeatureId="evaluation"
          customContent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
              <View style={{ position: 'relative', marginBottom: 6 }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#A855F71A',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#A855F733',
                }}>
                  <Sparkles size={22} color="#A855F7" />
                </View>
                {!hasPhotoAccess && (
                  <View style={[w.lockOverlay, { borderColor: colors.primary }]}>
                    <Lock size={10} color="#FFF" />
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' }}>
                {t('dashboard.evaluatePhysique', 'Evaluar Físico')}
              </Text>
              <Text style={[w.subValue, { color: colors.textSecondary, marginTop: 1 }]} numberOfLines={1}>
                {t('dashboard.getAIFeedback', 'Análisis inteligente')}
              </Text>
            </View>
          }
          onPress={() => handlePremiumFeaturePress(
            'evaluation',
            t('dashboard.evaluationWidget', 'Evaluación IA'),
            '📷',
            '/modals/progress-evaluation'
          )}
        />
      );
    }

    case 'recipe_search': {
      const hasRecipeAccess = isPro || hasPremiumAdAccess('recipes');
      return (
        <WidgetCard
          key={id}
          {...commonProps}
          title={t('dashboard.recipeSearchWidget', 'Recetas IA')}
          icon={<UtensilsCrossed size={18} color="#14B8A6" />}
          iconColor="#14B8A6"
          badge={hasRecipeAccess ? 'IA' : 'PRO'}
          badgeColor="#14B8A6"
          adTimerFeatureId="recipes"
          customContent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
              <View style={{ position: 'relative', marginBottom: 6 }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#14B8A61A',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#14B8A633',
                }}>
                  <UtensilsCrossed size={22} color="#14B8A6" />
                </View>
                {!hasRecipeAccess && (
                  <View style={[w.lockOverlay, { borderColor: '#14B8A6' }]}>
                    <Lock size={10} color="#FFF" />
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' }}>
                {t('dashboard.recipeSearchWidget', 'Buscar Recetas')}
              </Text>
              <Text style={[w.subValue, { color: colors.textSecondary, marginTop: 1 }]} numberOfLines={1}>
                {t('dashboard.withAI', 'Crear con IA')}
              </Text>
            </View>
          }
          onPress={() => handlePremiumFeaturePress(
            'recipes',
            t('dashboard.recipeSearchWidget', 'Buscar Recetas con IA'),
            '🥗',
            '/modals/recipes'
          )}
        />
      );
    }

    case 'muscle_directory': {
      const hasDirAccess = isPro || hasPremiumAdAccess('directory');
      return (
        <WidgetCard
          key={id}
          {...commonProps}
          title={t('dashboard.muscleDirWidget', 'Ejercicios')}
          icon={<Dumbbell size={18} color="#06B6D4" />}
          iconColor="#06B6D4"
          badge="Guía"
          badgeColor="#06B6D4"
          adTimerFeatureId="directory"
          customContent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
              <View style={{ position: 'relative', marginBottom: 6 }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: '#06B6D41A',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#06B6D433',
                }}>
                  <Dumbbell size={22} color="#06B6D4" />
                </View>
                {!hasDirAccess && (
                  <View style={[w.lockOverlay, { borderColor: '#06B6D4' }]}>
                    <Lock size={10} color="#FFF" />
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' }}>
                {t('dashboard.muscleDirTitle', 'Directorio')}
              </Text>
              <Text style={[w.subValue, { color: colors.textSecondary, marginTop: 1 }]} numberOfLines={1}>
                {t('dashboard.muscleDirSub', 'Por músculos')}
              </Text>
            </View>
          }
          onPress={() => handlePremiumFeaturePress(
            'directory',
            t('dashboard.muscleDirWidget', 'Directorio de Ejercicios'),
            '📖',
            '/modals/muscle-directory'
          )}
        />
      );
    }

    default:
      return null;
  }
}
