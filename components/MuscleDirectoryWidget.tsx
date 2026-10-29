import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ChevronRight, Dumbbell, Activity, Flame, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { Radius, Shadow, Spacing } from '../constants';

const MUSCLE_SHORTCUTS = [
  { id: 'chest',     name: 'Pecho',     nameKey: 'chest',     icon: Activity, color: '#FF4D6D', count: 180 },
  { id: 'back',      name: 'Espalda',   nameKey: 'back',      icon: Dumbbell, color: '#3B82F6', count: 240 },
  { id: 'legs',      name: 'Piernas',   nameKey: 'legs',      icon: Flame,    color: '#F59E0B', count: 320 },
  { id: 'shoulders', name: 'Hombros',   nameKey: 'shoulders', icon: Activity, color: '#8B5CF6', count: 160 },
  { id: 'arms',      name: 'Brazos',    nameKey: 'arms',      icon: Dumbbell, color: '#10B981', count: 210 },
  { id: 'core',      name: 'Core',      nameKey: 'core',      icon: Flame,    color: '#06B6D4', count: 130 },
];

export function MuscleDirectoryWidget() {
  const { t } = useTranslation();
  const colors = useTheme();

  const handleOpenGroup = (groupId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push({
      pathname: '/modals/muscle-directory',
      params: { group: groupId },
    });
  };

  const handleOpenAll = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push('/modals/muscle-directory');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header with Title and "Ver Todo" link */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={{ fontSize: 22 }}>💪</Text>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('dashboard.muscleDirectory', 'Directorio Muscular')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {t('dashboard.muscleDirectorySub', 'Explora ejercicios y anatomía por grupo muscular')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.seeAllBtn, { backgroundColor: `${colors.primary}18` }]}
          onPress={handleOpenAll}
          activeOpacity={0.8}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>
            {t('common.seeAll', 'Ver Todo')}
          </Text>
          <ChevronRight size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Grid of Muscle Categories */}
      <View style={styles.grid}>
        {MUSCLE_SHORTCUTS.map(item => {
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.muscleCard,
                {
                  backgroundColor: colors.surfaceAlt + '90',
                  borderColor: `${item.color}35`,
                },
              ]}
              onPress={() => handleOpenGroup(item.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[`${item.color}14`, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${item.color}22` }]}>
                  <IconComp size={18} color={item.color} />
                </View>

                <View style={styles.cardTextWrap}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {t(`muscleDirectory.${item.nameKey}`, item.name)}
                  </Text>
                  <Text style={[styles.cardCount, { color: item.color }]}>
                    +{item.count} {t('muscleDirectory.exercisesShort', 'ejercicios')}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Full Explorer Banner CTA */}
      <TouchableOpacity
        style={styles.bannerCTA}
        onPress={handleOpenAll}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bannerGrad}
        >
          <Sparkles size={16} color="#FFF" />
          <Text style={styles.bannerText}>
            {t('muscleDirectory.exploreFull', 'Abrir Directorio Interactivo 3D')}
          </Text>
          <ChevronRight size={16} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.md,
    marginTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    gap: 3,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  muscleCard: {
    width: '48%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardCount: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerCTA: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  bannerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    gap: 8,
  },
  bannerText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
