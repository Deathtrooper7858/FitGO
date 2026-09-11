import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import {
  X,
  Search,
  BookOpen,
  Camera,
  Barcode,
  Droplets,
  Flame,
  Calendar,
  BarChart2,
  MessageSquare,
  CalendarDays,
  Users,
  Settings,
  Sparkles,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  Timer,
  Activity,
  Heart,
  ChevronRight,
  Lightbulb,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { GlassCard } from '../../components/GlassCard';
import { GlobalBackground } from '../../components/GlobalBackground';

type CategoryKey = 'all' | 'tracker' | 'dashboard' | 'coach' | 'planner' | 'social' | 'settings';

interface GuideItem {
  id: string;
  category: CategoryKey;
  icon: any;
  iconColor: string;
  title: string;
  subtitle: string;
  description: string;
  howToUse: string[];
  actionLabel?: string;
  actionRoute?: string;
  actionParams?: any;
}

export default function AppGuideModal() {
  const { t } = useTranslation();
  const colors = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const categories: { key: CategoryKey; label: string; icon: string }[] = useMemo(() => [
    { key: 'all', label: t('guide.catAll', 'Todo'), icon: '🌟' },
    { key: 'tracker', label: t('guide.catTracker', 'Tracker y Botones'), icon: '🥗' },
    { key: 'dashboard', label: t('guide.catDashboard', 'Métricas & Panel'), icon: '📊' },
    { key: 'coach', label: t('guide.catCoach', 'Coach IA'), icon: '🤖' },
    { key: 'planner', label: t('guide.catPlanner', 'Planificador'), icon: '📅' },
    { key: 'social', label: t('guide.catSocial', 'Comunidad & Retos'), icon: '👥' },
    { key: 'settings', label: t('guide.catSettings', 'Perfil & Metas'), icon: '⚙️' },
  ], [t]);

  const guideItems: GuideItem[] = useMemo(() => [
    // ─── 1. TRACKER & BOTONES ───────────────────────────────────────
    {
      id: 'scan_food',
      category: 'tracker',
      icon: Camera,
      iconColor: colors.primary,
      title: t('guide.itemScanTitle', 'Escáner Inteligente con IA'),
      subtitle: t('guide.itemScanSub', 'Registra cualquier comida con solo tomar una foto'),
      description: t(
        'guide.itemScanDesc',
        'Nuestra IA analiza tu plato en segundos, identificando ingredientes, estimando cantidades y calculando calorías y macronutrientes automáticamente.'
      ),
      howToUse: [
        t('guide.itemScanStep1', 'En la pestaña Tracker, presiona el botón "+" de Desayuno, Almuerzo, Cena o Snack.'),
        t('guide.itemScanStep2', 'Apunta tu cámara a tu plato y toma la foto.'),
        t('guide.itemScanStep3', 'Revisa el desglose generado, ajusta gramos si es necesario y confirma con "Guardar".'),
      ],
      actionLabel: t('guide.actionTryScan', 'Probar Escáner IA'),
      actionRoute: '/modals/scan',
    },
    {
      id: 'barcode_scan',
      category: 'tracker',
      icon: Barcode,
      iconColor: '#3B82F6',
      title: t('guide.itemBarcodeTitle', 'Escáner de Código de Barras'),
      subtitle: t('guide.itemBarcodeSub', 'Para alimentos empacados y productos de supermercado'),
      description: t(
        'guide.itemBarcodeDesc',
        'Lee el código de barras de cualquier producto comercial para obtener al instante su tabla nutricional oficial sin tener que escribir nada.'
      ),
      howToUse: [
        t('guide.itemBarcodeStep1', 'Toca el botón "+" en la comida que deseas registrar.'),
        t('guide.itemBarcodeStep2', 'Selecciona la pestaña o modo "Código de Barras".'),
        t('guide.itemBarcodeStep3', 'Enfoca el código del empaque; se reconocerá automáticamente.'),
      ],
      actionLabel: t('guide.actionTryBarcode', 'Abrir Lector de Barras'),
      actionRoute: '/modals/scan',
      actionParams: { initialMode: 'barcode' },
    },
    {
      id: 'calorie_arc',
      category: 'tracker',
      icon: Flame,
      iconColor: '#EF4444',
      title: t('guide.itemRingTitle', 'Anillo Calórico y Balance Diario'),
      subtitle: t('guide.itemRingSub', 'Tu balance exacto entre calorías consumidas y quemadas'),
      description: t(
        'guide.itemRingDesc',
        'El anillo central te muestra cuántas calorías te quedan por consumir. Resta lo que comes de tu meta diaria y suma las calorías quemadas por tus pasos y actividades.'
      ),
      howToUse: [
        t('guide.itemRingStep1', 'Meta: Calculada científicamente según tu objetivo (perder peso, ganar músculo o mantener).'),
        t('guide.itemRingStep2', 'Consumidas: La suma de todos los alimentos registrados en el día.'),
        t('guide.itemRingStep3', 'Quemadas: Incluye tu gasto diario base (NEAT) más pasos y entrenamientos.'),
      ],
      actionLabel: t('guide.actionGoTracker', 'Ver Anillo en Tracker'),
      actionRoute: '/(tabs)/tracker',
    },
    {
      id: 'macro_bars',
      category: 'tracker',
      icon: Activity,
      iconColor: '#8B5CF6',
      title: t('guide.itemMacrosTitle', 'Barras de Macronutrientes'),
      subtitle: t('guide.itemMacrosSub', 'Proteínas, Carbohidratos y Grasas Saludables'),
      description: t(
        'guide.itemMacrosDesc',
        'No todas las calorías son iguales. FitGo distribuye tus calorías en los tres macros clave para optimizar tu salud, composición corporal y niveles de energía.'
      ),
      howToUse: [
        t('guide.itemMacrosStep1', '🟣 Proteína: Esencial para reparar y construir masa muscular magra y saciedad.'),
        t('guide.itemMacrosStep2', '🔵 Carbohidratos: Tu principal combustible para el cerebro y entrenamientos de alta intensidad.'),
        t('guide.itemMacrosStep3', '🟡 Grasas: Claves para la regulación hormonal y absorción de vitaminas.'),
      ],
      actionLabel: t('guide.actionGoTracker', 'Ver Mis Macros'),
      actionRoute: '/(tabs)/tracker',
    },
    {
      id: 'water_tracker',
      category: 'tracker',
      icon: Droplets,
      iconColor: '#06B6D4',
      title: t('guide.itemWaterTitle', 'Registro de Hidratación'),
      subtitle: t('guide.itemWaterSub', 'Controla tus vasos de agua con un solo toque'),
      description: t(
        'guide.itemWaterDesc',
        'Mantenerte hidratado mejora tu metabolismo, concentración y rendimiento físico. Puedes sumar agua en vasos o mililitros rápidamente.'
      ),
      howToUse: [
        t('guide.itemWaterStep1', 'En la tarjeta de Agua del Tracker, toca "+" para sumar 250ml o un vaso.'),
        t('guide.itemWaterStep2', 'Si tomaste una botella grande, mantén presionado para ingresar una cantidad personalizada.'),
      ],
      actionLabel: t('guide.actionGoTracker', 'Registrar Agua'),
      actionRoute: '/(tabs)/tracker',
    },
    {
      id: 'fasting_widget',
      category: 'tracker',
      icon: Timer,
      iconColor: '#F59E0B',
      title: t('guide.itemFastingTitle', 'Cronómetro de Ayuno Intermitente'),
      subtitle: t('guide.itemFastingSub', 'Protocolos 16:8, 14:10 o personalizados'),
      description: t(
        'guide.itemFastingDesc',
        'Sigue tu ventana de alimentación y ayuno fácilmente. La app te notificará cuando tu ventana de ayuno esté completa.'
      ),
      howToUse: [
        t('guide.itemFastingStep1', 'Toca "Iniciar Ayuno" justo al terminar tu última comida.'),
        t('guide.itemFastingStep2', 'Observa la barra de progreso mientras tu cuerpo ingresa en estado metabólico de ayuno.'),
        t('guide.itemFastingStep3', 'Toca "Finalizar" al romper tu ayuno con tu primera comida del día siguiente.'),
      ],
      actionLabel: t('guide.actionGoTracker', 'Ver Widget de Ayuno'),
      actionRoute: '/(tabs)/tracker',
    },
    {
      id: 'date_navigator',
      category: 'tracker',
      icon: Calendar,
      iconColor: '#10B981',
      title: t('guide.itemDateNavTitle', 'Navegador de Fechas y Racha'),
      subtitle: t('guide.itemDateNavSub', 'Viaja entre días y mantén viva tu racha'),
      description: t(
        'guide.itemDateNavDesc',
        '¿Olvidaste registrar la cena de ayer? ¿Quieres planificar la comida de mañana? Usa el selector de fechas superior para moverte libremente.'
      ),
      howToUse: [
        t('guide.itemDateNavStep1', 'Toca las flechas < o > para retroceder o avanzar de día.'),
        t('guide.itemDateNavStep2', 'Toca el botón con la fecha o el icono de Calendario para abrir el calendario mensual completo.'),
        t('guide.itemDateNavStep3', 'El fuego 🔥 indica tus días consecutivos registrando alimentos. ¡No dejes que se apague!'),
      ],
      actionLabel: t('guide.actionOpenCalendar', 'Ver Calendario'),
      actionRoute: '/modals/calendar',
    },

    // ─── 2. DASHBOARD & MÉTRICAS ────────────────────────────────────
    {
      id: 'dashboard_overview',
      category: 'dashboard',
      icon: BarChart2,
      iconColor: '#8B5CF6',
      title: t('guide.itemDashTitle', 'Panel de Métricas y Consistencia'),
      subtitle: t('guide.itemDashSub', 'La foto completa de tu evolución semanal'),
      description: t(
        'guide.itemDashDesc',
        'En la pestaña Dashboard encuentras tu adherencia nutricional semanal, la puntuación de calidad de tus comidas y el progreso de peso en el tiempo.'
      ),
      howToUse: [
        t('guide.itemDashStep1', 'Revisa tu Consistency Score para verificar qué días cumpliste tus calorías y macros.'),
        t('guide.itemDashStep2', 'Consulta el resumen semanal para detectar patrones en tu alimentación.'),
      ],
      actionLabel: t('guide.actionGoDashboard', 'Ir al Dashboard'),
      actionRoute: '/(tabs)/dashboard',
    },
    {
      id: 'body_symmetry',
      category: 'dashboard',
      icon: Heart,
      iconColor: '#EC4899',
      title: t('guide.itemSymmetryTitle', 'Simetría Muscular y Medidas'),
      subtitle: t('guide.itemSymmetrySub', 'Monitorea el estímulo muscular y cambios corporales'),
      description: t(
        'guide.itemSymmetryDesc',
        'El mapa anatómico interactivo ilumina los grupos musculares que has trabajado en la semana para evitar desbalances y optimizar tu hipertrofia.'
      ),
      howToUse: [
        t('guide.itemSymmetryStep1', 'Toca cualquier grupo muscular en el modelo para ver ejercicios recomendados.'),
        t('guide.itemSymmetryStep2', 'Registra tus medidas corporales (cintura, pecho, bíceps) para ver resultados más allá de la báscula.'),
      ],
      actionLabel: t('guide.actionGoBody', 'Ver Directorio Muscular'),
      actionRoute: '/modals/muscle-directory',
    },

    // ─── 3. COACH IA ────────────────────────────────────────────────
    {
      id: 'coach_chat',
      category: 'coach',
      icon: MessageSquare,
      iconColor: '#06B6D4',
      title: t('guide.itemCoachTitle', 'Tu Coach Nutricional Inteligente'),
      subtitle: t('guide.itemCoachSub', 'Pregúntale lo que quieras las 24 horas del día'),
      description: t(
        'guide.itemCoachDesc',
        'Fitz es tu asistente personalizado. Conoce tus calorías, tus alimentos favoritos y tus metas para darte respuestas precisas y basadas en ciencia.'
      ),
      howToUse: [
        t('guide.itemCoachStep1', 'Ve a la pestaña Coach en la barra inferior.'),
        t('guide.itemCoachStep2', 'Pídele ideas: "¿Qué puedo cenar rápido con 35g de proteína?", "Ajusta mis calorías", o "¿Cómo superar un estancamiento?".'),
        t('guide.itemCoachStep3', 'Revisa el "Consejo del Día" diario con recomendaciones de nutrición y recuperación.'),
      ],
      actionLabel: t('guide.actionGoCoach', 'Chatear con el Coach'),
      actionRoute: '/(tabs)/coach',
    },

    // ─── 4. PLANIFICADOR & RECETAS ──────────────────────────────────
    {
      id: 'planner_recipes',
      category: 'planner',
      icon: CalendarDays,
      iconColor: '#10B981',
      title: t('guide.itemPlannerTitle', 'Planificador Semanal y Recetas IA'),
      subtitle: t('guide.itemPlannerSub', 'Organiza tus comidas y genera recetas con lo que tienes'),
      description: t(
        'guide.itemPlannerDesc',
        'Ahorra tiempo y dinero planificando tu semana. El generador de recetas te propone platos nutritivos ajustados exactamente a tus macros restantes.'
      ),
      howToUse: [
        t('guide.itemPlannerStep1', 'Crea o importa planes de alimentación para cada día de la semana.'),
        t('guide.itemPlannerStep2', 'Genera recetas creativas indicando los ingredientes que tienes en tu nevera.'),
        t('guide.itemPlannerStep3', 'Exporta los ingredientes faltantes a tu Lista del Supermercado con un toque.'),
      ],
      actionLabel: t('guide.actionGoPlanner', 'Abrir Planificador'),
      actionRoute: '/(tabs)/planner',
    },

    // ─── 5. COMUNIDAD & SOCIAL ──────────────────────────────────────
    {
      id: 'social_league',
      category: 'social',
      icon: Users,
      iconColor: '#F59E0B',
      title: t('guide.itemSocialTitle', 'Ligas, Amigos y Retos Diarios'),
      subtitle: t('guide.itemSocialSub', 'Mantén la motivación compitiendo con la comunidad'),
      description: t(
        'guide.itemSocialDesc',
        'El fitness es más fácil en compañía. Agrega amigos, compite en la liga semanal sumando puntos por consistencia y comparte tus logros.'
      ),
      howToUse: [
        t('guide.itemSocialStep1', 'En la pestaña Social, busca amigos por su ID o invita a compañeros de entrenamiento.'),
        t('guide.itemSocialStep2', 'Cada comida registrada, meta de agua y paso cuenta puntos para subir en la tabla de la liga.'),
        t('guide.itemSocialStep3', 'Desbloquea medallas y trofeos en tu Vitrina de Logros.'),
      ],
      actionLabel: t('guide.actionGoSocial', 'Ver Comunidad'),
      actionRoute: '/(tabs)/social',
    },

    // ─── 6. PERFIL & AJUSTES ────────────────────────────────────────
    {
      id: 'profile_settings',
      category: 'settings',
      icon: Settings,
      iconColor: '#6366F1',
      title: t('guide.itemSettingsTitle', 'Ajuste de Metas, NEAT y Recordatorios'),
      subtitle: t('guide.itemSettingsSub', 'Personaliza la app al 100% para tu estilo de vida'),
      description: t(
        'guide.itemSettingsDesc',
        'Tu metabolismo cambia con el tiempo. Aquí puedes recalcular tu gasto calórico, cambiar unidades (kg/lb, kcal/kJ) y activar notificaciones oportunas.'
      ),
      howToUse: [
        t('guide.itemSettingsStep1', 'Toca tu avatar en la esquina superior izquierda del Tracker para entrar a tu Perfil.'),
        t('guide.itemSettingsStep2', 'En "Mi Plan", cambia tu peso meta o nivel de actividad física diaria (NEAT).'),
        t('guide.itemSettingsStep3', 'Activa "Recordatorios" para que FitGo te recuerde tomar agua o registrar tus comidas a tus horas preferidas.'),
      ],
      actionLabel: t('guide.actionGoProfile', 'Ir a Mi Perfil'),
      actionRoute: '/(tabs)/profile',
    },
  ], [colors, t]);

  // Filtered items by category and search query
  const filteredItems = useMemo(() => {
    return guideItems.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchCat) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(query);
      const inSub = item.subtitle.toLowerCase().includes(query);
      const inDesc = item.description.toLowerCase().includes(query);
      const inSteps = item.howToUse.some(s => s.toLowerCase().includes(query));
      return inTitle || inSub || inDesc || inSteps;
    });
  }, [guideItems, selectedCategory, searchQuery]);

  const handleAction = (item: GuideItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    router.back();
    setTimeout(() => {
      if (item.actionRoute) {
        if (item.actionParams) {
          router.push({ pathname: item.actionRoute as any, params: item.actionParams });
        } else {
          router.push(item.actionRoute as any);
        }
      }
    }, 200);
  };

  const toggleItem = (id: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setExpandedItemId(prev => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalBackground />

      {/* Top App Bar */}
      <View style={[styles.navBar, { borderBottomColor: colors.border + '30' }]}>
        <View style={styles.navBarLeft}>
          <View style={[styles.headerIconBadge, { backgroundColor: colors.primary + '25' }]}>
            <BookOpen size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.navBarTitle, { color: colors.textPrimary }]}>
              {t('guide.modalTitle', 'Instructivo y Manual')}
            </Text>
            <Text style={[styles.navBarSub, { color: colors.textMuted }]}>
              {t('guide.modalSub', 'Domina FitGo paso a paso')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.back();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt + '60', borderColor: colors.border + '40' }]}
        >
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Card */}
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={[colors.primary + '35', '#06B6D4' + '25', colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: colors.primary + '40' }]}
          >
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.heroBadge}>
                  <Sparkles size={12} color={colors.primary} />
                  <Text style={[styles.heroBadgeText, { color: colors.primary }]}>
                    {t('guide.heroBadge', 'GUÍA DE INICIO RÁPIDO')}
                  </Text>
                </View>
                <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                  {t('guide.heroTitle', 'Tu Centro de Mando Fitness')}
                </Text>
                <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                  {t('guide.heroDesc', 'Todo lo que necesitas saber para registrar tus comidas con IA, entender tus métricas y alcanzar tus metas sin complicaciones.')}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Live Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border + '50' }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('guide.searchPlaceholder', 'Buscar duda, botón o función (ej. escanear, macros)...')}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Horizontal Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesBar}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setSelectedCategory(cat.key);
                }}
                activeOpacity={0.75}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border + '40',
                  },
                ]}
              >
                <Text style={styles.catEmoji}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.catText,
                    {
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Header with Count */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {selectedCategory === 'all'
              ? t('guide.allTopics', 'Todos los Temas y Botones')
              : categories.find(c => c.key === selectedCategory)?.label}
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
            {filteredItems.length} {t('guide.topicsCount', 'guías')}
          </Text>
        </View>

        {/* Empty State if search yields no results */}
        {filteredItems.length === 0 && (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border + '30' }]}>
            <HelpCircle size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {t('guide.noResultsTitle', 'No encontramos coincidencias')}
            </Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {t('guide.noResultsDesc', 'Intenta buscar con otros términos como "agua", "escanear", "calorías" o "coach".')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              style={[styles.emptyResetBtn, { backgroundColor: colors.primary + '25' }]}
            >
              <Text style={[styles.emptyResetText, { color: colors.primary }]}>
                {t('guide.clearSearch', 'Ver todas las guías')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Guide Cards List */}
        {filteredItems.map((item) => {
          const isExpanded = expandedItemId === item.id;
          const IconComp = item.icon;

          return (
            <View key={item.id} style={styles.itemWrapper}>
              <GlassCard
                noPadding
                showStripe
                accentColor={item.iconColor}
                style={[styles.guideCard, { borderColor: isExpanded ? item.iconColor + '60' : colors.border + '30' }]}
              >
                <TouchableOpacity
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.7}
                  style={styles.cardHeaderPressable}
                >
                  <View style={[styles.itemIconCircle, { backgroundColor: item.iconColor + '20' }]}>
                    <IconComp size={20} color={item.iconColor} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]} numberOfLines={isExpanded ? undefined : 2}>
                      {item.subtitle}
                    </Text>
                  </View>

                  <View style={[styles.chevronBadge, { backgroundColor: colors.surfaceAlt + '40' }]}>
                    <ChevronRight
                      size={18}
                      color={colors.textMuted}
                      style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={[styles.cardBody, { borderTopColor: colors.border + '25' }]}>
                    <Text style={[styles.itemDescription, { color: colors.textPrimary }]}>
                      {item.description}
                    </Text>

                    {/* Step-by-step checklist */}
                    <View style={styles.stepsBox}>
                      <Text style={[styles.stepsHeader, { color: colors.textPrimary }]}>
                        {t('guide.howToHeader', '¿Cómo utilizarlo?')}:
                      </Text>
                      {item.howToUse.map((step, idx) => (
                        <View key={idx} style={styles.stepRow}>
                          <CheckCircle2 size={16} color={item.iconColor} style={{ marginTop: 2 }} />
                          <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                            {step}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Action button if available */}
                    {item.actionLabel && item.actionRoute && (
                      <TouchableOpacity
                        onPress={() => handleAction(item)}
                        activeOpacity={0.8}
                        style={styles.actionBtnWrapper}
                      >
                        <LinearGradient
                          colors={[item.iconColor, colors.primary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.actionBtn}
                        >
                          <Text style={styles.actionBtnText}>{item.actionLabel}</Text>
                          <ArrowRight size={16} color="#FFFFFF" />
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </GlassCard>
            </View>
          );
        })}

        {/* Pro Tips Card */}
        <View style={styles.proTipsWrapper}>
          <LinearGradient
            colors={['#F59E0B20', '#10B98115', colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.proTipsCard, { borderColor: '#F59E0B40' }]}
          >
            <View style={styles.proTipHeader}>
              <Lightbulb size={20} color="#F59E0B" />
              <Text style={[styles.proTipTitle, { color: colors.textPrimary }]}>
                {t('guide.proTipsTitle', 'Consejos Clave para tus Primeros 60 Días')}
              </Text>
            </View>
            <View style={styles.proTipItem}>
              <Text style={[styles.proTipBullet, { color: '#F59E0B' }]}>1.</Text>
              <Text style={[styles.proTipText, { color: colors.textSecondary }]}>
                {t('guide.proTip1', 'La consistencia supera a la perfección: Es mejor registrar un plato aproximado que dejar de registrar por un día entero.')}
              </Text>
            </View>
            <View style={styles.proTipItem}>
              <Text style={[styles.proTipBullet, { color: '#F59E0B' }]}>2.</Text>
              <Text style={[styles.proTipText, { color: colors.textSecondary }]}>
                {t('guide.proTip2', 'Prioriza tu proteína: Llegar a tu meta de proteína mantendrá tu masa muscular y te mantendrá saciado durante el día.')}
              </Text>
            </View>
            <View style={styles.proTipItem}>
              <Text style={[styles.proTipBullet, { color: '#F59E0B' }]}>3.</Text>
              <Text style={[styles.proTipText, { color: colors.textSecondary }]}>
                {t('guide.proTip3', 'Activa los recordatorios en Perfil para no olvidar registrar tus comidas y tomar agua en tus horarios habituales.')}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBarTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  navBarSub: {
    fontSize: 12,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 24,
  },
  heroWrapper: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    padding: 0,
  },
  categoriesBar: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  catEmoji: {
    fontSize: 13,
  },
  catText: {
    fontSize: 12.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 12,
  },
  itemWrapper: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  guideCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  itemIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12.5,
    lineHeight: 16,
  },
  chevronBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  itemDescription: {
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 12,
  },
  stepsBox: {
    marginBottom: 14,
    gap: 8,
  },
  stepsHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
  },
  actionBtnWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  emptyBox: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyResetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  emptyResetText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  proTipsWrapper: {
    marginHorizontal: 16,
    marginTop: 10,
  },
  proTipsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  proTipTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  proTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  proTipBullet: {
    fontSize: 13,
    fontWeight: '700',
  },
  proTipText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
  },
});
