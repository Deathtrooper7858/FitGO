import React from 'react';
import { View, Text } from 'react-native';
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
  t: (key: string, ...args: any[]) => string;
  router: any;
  hasPremiumAdAccess: (featureId: string) => boolean;
  handlePremiumFeaturePress: (featureId: string, featureName: string, icon: string, route: string) => void;
}

export function renderDashboardWidget(props: WidgetRendererProps) {
  const {
    id, index, isEditing, canMoveLeft, canMoveRight, onMoveLeft, onMoveRight, onLongPress,
    currentWeight, sleepHours, calories, bodyFat, isPro, colors, t, router,
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

  switch (id) {
    case 'weight':
      return (
        <WidgetCard key={id} {...commonProps} title={t('dashboard.weightWidget')} icon="⚖️"
          value={`${currentWeight} kg`} subValue={t('dashboard.tapToUpdate')}
          onPress={() => router.push('/modals/body-measurements')}
        />
      );
    case 'sleep':
      return (
        <WidgetCard key={id} {...commonProps} title={t('dashboard.sleepWidget')} icon="🌙"
          customContent={
            <View style={w.content}>
               <Text style={[w.value, { color: colors.textPrimary }]}>{sleepHours > 0 ? `${sleepHours}h` : '--'}</Text>
               <Text style={[w.subValue, { color: colors.textSecondary }]}>{sleepHours > 0 ? t('dashboard.loggedToday') : t('dashboard.tapToAdd')}</Text>
            </View>
          }
          onPress={() => router.push('/modals/sleep' as any)}
        />
      );
    case 'calories':
      return (
        <WidgetCard key={id} {...commonProps} title={t('dashboard.caloriesWidget')} icon="⚡"
          customContent={
            <View style={w.content}>
              <Text style={{fontSize: 24, fontWeight: '800', color: colors.textPrimary}}>{calories}</Text>
              <Text style={[w.subValue, { color: colors.textSecondary }]}>{t('dashboard.logFood')}</Text>
            </View>
          }
          onPress={() => router.push('/(tabs)/tracker')}
        />
      );
    case 'bodyFat':
      return (
        <WidgetCard key={id} {...commonProps} title={t('dashboard.bodyFatWidget')} icon="🔥"
          value={bodyFat ? `${bodyFat}%` : '--'} subValue={t('dashboard.tapToUpdate')}
          onPress={() => router.push('/modals/body-measurements')}
        />
      );
    // 'macros' widget has been removed permanently
    case 'measurements':
      return (
        <WidgetCard key={id} {...commonProps} title={t('dashboard.measurementsWidget')} icon="📏"
          value={t('dashboard.seeHistory', 'Ver historial')} subValue={t('dashboard.measurementsSub', 'Cintura, pecho, etc.')}
          onPress={() => router.push('/modals/body-measurements')}
        />
      );
    case 'photos':
      return (
        <WidgetCard key={id} {...commonProps} title={t('dashboard.evaluationWidget', 'Evaluación IA')} icon="🤖"
          adTimerFeatureId="evaluation"
          customContent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'relative' }}>
                <Text style={{ fontSize: 32, color: colors.textSecondary }}>📷</Text>
                {!isPro && !hasPremiumAdAccess('evaluation') && (
                  <View style={[w.lockOverlay, { borderColor: colors.primary }]}>
                    <Text style={w.lockIcon}>🔒</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 8 }}>{t('dashboard.evaluatePhysique', 'Evaluar Físico')}</Text>
              <Text style={[w.subValue, { color: colors.textSecondary }]}>{t('dashboard.getAIFeedback', 'Recibe feedback IA')}</Text>
              {!isPro && !hasPremiumAdAccess('evaluation') && (
                <View style={[w.premiumTag, { backgroundColor: colors.primary + '2E', borderColor: colors.primary + '66' }]}>
                  <Text style={[w.premiumTagText, { color: colors.primary }]}>👑 Premium</Text>
                </View>
              )}
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
    case 'achievements':
      return null;
    case 'recipe_search':
      return (
        <WidgetCard key={id} {...commonProps} title={t('dashboard.recipeSearchWidget', 'Buscar Recetas')} icon="🍳"
          adTimerFeatureId="recipes"
          customContent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'relative' }}>
                <Text style={{ fontSize: 32, color: colors.textSecondary }}>🥗</Text>
                {!isPro && !hasPremiumAdAccess('recipes') && (
                  <View style={[w.lockOverlay, { borderColor: colors.primary }]}>
                    <Text style={w.lockIcon}>🔒</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 8 }}>{t('dashboard.recipeSearchWidget', 'Buscar Recetas')}</Text>
              <Text style={[w.subValue, { color: colors.textSecondary }]}>{t('dashboard.withAI', 'Con IA')}</Text>
              {!isPro && !hasPremiumAdAccess('recipes') && (
                <View style={[w.premiumTag, { backgroundColor: colors.primary + '2E', borderColor: colors.primary + '66' }]}>
                  <Text style={[w.premiumTagText, { color: colors.primary }]}>👑 Premium</Text>
                </View>
              )}
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
    case 'muscle_directory':
      return (
        <WidgetCard key={id} {...commonProps} title={t('dashboard.muscleDirWidget', 'Ejercicios')} icon="💪"
          adTimerFeatureId="directory"
          customContent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'relative' }}>
                <Text style={{ fontSize: 32, color: colors.textSecondary }}>📖</Text>
                {!isPro && !hasPremiumAdAccess('directory') && (
                  <View style={[w.lockOverlay, { borderColor: colors.primary }]}>
                    <Text style={w.lockIcon}>🔒</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 8 }}>{t('dashboard.muscleDirTitle', 'Directorio')}</Text>
              <Text style={[w.subValue, { color: colors.textSecondary }]}>{t('dashboard.muscleDirSub', 'Por músculos')}</Text>
              {!isPro && !hasPremiumAdAccess('directory') && (
                <View style={[w.premiumTag, { backgroundColor: colors.primary + '2E', borderColor: colors.primary + '66' }]}>
                  <Text style={[w.premiumTagText, { color: colors.primary }]}>👑 Premium</Text>
                </View>
              )}
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
    default: return null;
  }
}
