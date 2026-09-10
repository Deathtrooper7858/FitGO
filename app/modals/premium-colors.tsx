import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Check, X, Crown, Lock, Sparkles, ArrowRight, Palette } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore, useAuthStore } from '../../store';
import { usePurchaseStore } from '../../store/purchaseStore';
import { useIsPro } from '../../hooks/useIsPro';
import { supabase } from '../../services/supabase';
import { GlobalBackground } from '../../components/GlobalBackground';

const PREMIUM_COLORS = [
  { id: null,       nameKey: 'profile.colors.default',   defaultName: 'Morado Clásico',   hex: '#7C5CFC', isPro: false },
  { id: '#FFB800',  nameKey: 'profile.colors.gold',      defaultName: 'Dorado Élite',     hex: '#FFB800', isPro: true },
  { id: '#00F0FF',  nameKey: 'profile.colors.blue',      defaultName: 'Azul Eléctrico',   hex: '#00F0FF', isPro: true },
  { id: '#00E676',  nameKey: 'profile.colors.green',     defaultName: 'Verde Neón',       hex: '#00E676', isPro: true },
  { id: '#FF2A54',  nameKey: 'profile.colors.red',       defaultName: 'Rojo Rubí',        hex: '#FF2A54', isPro: true },
  { id: '#FF5722',  nameKey: 'profile.colors.orange',    defaultName: 'Naranja Fuego',    hex: '#FF5722', isPro: true },
  { id: '#FF00FF',  nameKey: 'profile.colors.magenta',   defaultName: 'Magenta Oscuro',   hex: '#FF00FF', isPro: true },
  { id: '#FF4081',  nameKey: 'profile.colors.pink',      defaultName: 'Rosa Atardecer',   hex: '#FF4081', isPro: true },
  { id: '#10B981',  nameKey: 'profile.colors.emerald',   defaultName: 'Verde Esmeralda',  hex: '#10B981', isPro: true },
  { id: '#06B6D4',  nameKey: 'profile.colors.turquoise', defaultName: 'Turquesa Profundo',hex: '#06B6D4', isPro: true },
  { id: '#4C1D95',  nameKey: 'profile.colors.purple',    defaultName: 'Púrpura Imperial', hex: '#4C1D95', isPro: true },
  { id: '#94A3B8',  nameKey: 'profile.colors.silver',    defaultName: 'Plata Cromo',      hex: '#94A3B8', isPro: true },
];

export default function PremiumColorsModal() {
  const colors = useTheme();
  const { t } = useTranslation();
  const { premiumColor, setPremiumColor } = useSettingsStore();
  const { verifyProStatus } = usePurchaseStore();
  const { profile, setProfile } = useAuthStore();
  const hasProRole = useIsPro();

  const [loading, setLoading] = useState(!hasProRole);
  const [actualIsPro, setActualIsPro] = useState(hasProRole);

  useEffect(() => {
    if (hasProRole) {
      setActualIsPro(true);
      setLoading(false);
      return;
    }
    verifyProStatus().then((status) => {
      setActualIsPro(status);
      setLoading(false);
    });
  }, [hasProRole, verifyProStatus]);

  const activeHex = premiumColor === 'admin_glow' ? '#00F0FF' : premiumColor || '#7C5CFC';
  const selectedColorObj = PREMIUM_COLORS.find((c) => c.id === premiumColor) || PREMIUM_COLORS[0];

  const handleSelect = async (color: typeof PREMIUM_COLORS[0]) => {
    Haptics.selectionAsync();

    if (loading) return;

    if (color.isPro && !actualIsPro) {
      router.push('/modals/paywall');
      return;
    }

    setPremiumColor(color.id);

    if (profile?.id) {
      setProfile({ ...profile, premiumColor: color.id || undefined });
      supabase.auth.updateUser({ data: { premium_color: color.id } }).catch(() => {});
      Promise.resolve(
        supabase.from('users').update({ premium_color: color.id }).eq('id', profile.id)
      ).catch((err) => {
        console.error('[PremiumColors] Failed to save to DB:', err);
      });
    }
  };

  return (
    <View style={styles.container}>
      <GlobalBackground />

      {/* Halo dinámico en la parte superior con el color activo */}
      <LinearGradient
        colors={[activeHex + '35', activeHex + '10', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.ambientGlow}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {/* Cabecera respetando Safe Area */}
        <View style={[styles.header, { borderBottomColor: colors.border + '40' }]}>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border + '50' }]}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Palette size={18} color={activeHex} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {t('premiumColors.title', 'Colores Premium')}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {t(selectedColorObj.nameKey, selectedColorObj.defaultName)}
            </Text>
          </View>

          <View style={[styles.activeColorBadge, { borderColor: activeHex + '70', backgroundColor: colors.surface }]}>
            <View style={[styles.activeColorDot, { backgroundColor: activeHex }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner Pro Exclusivo */}
          {!actualIsPro && !loading ? (
            <LinearGradient
              colors={['#FFB80020', '#D9770610']}
              style={[styles.proBanner, { borderColor: '#FFB80070' }]}
            >
              <View style={styles.proBannerIconWrap}>
                <Crown size={22} color="#FFB800" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.proBannerTitle}>
                    {t('premiumColors.proExclusive', 'Exclusivo para Pro')}
                  </Text>
                  <Sparkles size={13} color="#FFB800" />
                </View>
                <Text style={[styles.proBannerDesc, { color: colors.textSecondary }]}>
                  {t(
                    'premiumColors.proDesc',
                    'Desbloquea los 11 colores premium para personalizar toda la app.'
                  )}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.upgradeBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/modals/paywall')}
              >
                <Text style={styles.upgradeBtnText}>
                  {t('premiumColors.upgrade', 'Mejorar')}
                </Text>
                <ArrowRight size={13} color="#000" />
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <View style={[styles.proActiveBanner, { backgroundColor: colors.surface, borderColor: activeHex + '40' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Crown size={16} color="#FFB800" />
                <Text style={[styles.proActiveText, { color: colors.textPrimary }]}>
                  {String(t('premiumColors.proActive', 'Membresía Pro activa • Todos los colores desbloqueados'))}
                </Text>
              </View>
            </View>
          )}

          {/* Tarjeta de Previsualización en Vivo (Live Theme Preview) */}
          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border + '60' }]}>
            <View style={styles.previewHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color={activeHex} />
                <Text style={[styles.previewTag, { color: colors.textMuted }]}>
                  {String(t('premiumColors.previewTag', 'VISTA PREVIA DEL TEMA'))}
                </Text>
              </View>
              <View style={[styles.previewColorPill, { backgroundColor: activeHex + '18', borderColor: activeHex + '50' }]}>
                <View style={[styles.previewColorMiniDot, { backgroundColor: activeHex }]} />
                <Text style={[styles.previewColorPillText, { color: activeHex }]}>
                  {t(selectedColorObj.nameKey, selectedColorObj.defaultName)}
                </Text>
              </View>
            </View>

            <View style={styles.previewMockup}>
              {/* Botón interactivo de muestra */}
              <View style={[styles.mockupBtn, { backgroundColor: activeHex }]}>
                <Text style={styles.mockupBtnText}>
                  {String(t('premiumColors.mockupBtn', 'Botón Principal & Acentos'))}
                </Text>
              </View>

              {/* Barra de progreso de muestra */}
              <View style={styles.mockupProgressWrap}>
                <View style={styles.mockupProgressLabels}>
                  <Text style={[styles.mockupProgressTitle, { color: colors.textSecondary }]}>
                    {String(t('premiumColors.dailyGoal', 'Objetivo Diario FitGO'))}
                  </Text>
                  <Text style={[styles.mockupProgressVal, { color: activeHex }]}>
                    82%
                  </Text>
                </View>
                <View style={[styles.mockupTrack, { backgroundColor: colors.surfaceAlt }]}>
                  <LinearGradient
                    colors={[activeHex, activeHex + 'AA']}
                    style={[styles.mockupBar, { width: '82%' }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Título de la sección de paleta */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {String(t('premiumColors.paletteTitle', 'Paleta de Acentos'))}
          </Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {t(
              'premiumColors.description',
              'Personaliza el aspecto de toda la aplicación eligiendo tu color de acento favorito.'
            )}
          </Text>

          {/* Cuadrícula de 2 columnas con tarjetas de color */}
          <View style={styles.colorGrid}>
            {PREMIUM_COLORS.map((c) => {
              const isSelected = premiumColor === c.id;
              const isLocked = c.isPro && !actualIsPro && !loading;

              return (
                <TouchableOpacity
                  key={c.id || 'default'}
                  style={[
                    styles.colorCard,
                    {
                      backgroundColor: isSelected ? colors.surfaceAlt : colors.surface,
                      borderColor: isSelected ? c.hex : colors.border + '45',
                      borderWidth: isSelected ? 2 : 1.5,
                    },
                  ]}
                  activeOpacity={0.82}
                  onPress={() => handleSelect(c)}
                >
                  {/* Swatch circular con glow */}
                  <View
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: c.hex,
                        shadowColor: c.hex,
                      },
                    ]}
                  >
                    {isSelected ? (
                      <View style={styles.checkInner}>
                        <Check size={18} color="#FFF" strokeWidth={3} />
                      </View>
                    ) : isLocked ? (
                      <View style={styles.swatchLock}>
                        <Lock size={12} color="#FFF" />
                      </View>
                    ) : null}
                  </View>

                  {/* Nombre del color */}
                  <Text
                    style={[
                      styles.colorName,
                      { color: isSelected ? colors.textPrimary : colors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {t(c.nameKey, c.defaultName)}
                  </Text>

                  {/* Subtítulo o Tag */}
                  {c.id === null ? (
                    <Text style={[styles.colorSubtitle, { color: colors.textMuted }]}>
                      {t('profile.colors.defaultSubtitle', 'Por defecto')}
                    </Text>
                  ) : c.isPro ? (
                    <View style={styles.proTagRow}>
                      <Crown size={10} color={isLocked ? colors.textMuted : '#FFB800'} />
                      <Text
                        style={[
                          styles.colorSubtitle,
                          { color: isLocked ? colors.textMuted : '#FFB800' },
                        ]}
                      >
                        {isLocked
                          ? String(t('premiumColors.requiresPro', 'Requiere Pro'))
                          : String(t('premiumColors.exclusivePro', 'Exclusivo Pro'))}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 320,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  activeColorBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeColorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  // Contenido
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // Banner Pro
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  proBannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFB80025',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proBannerTitle: {
    color: '#FFB800',
    fontWeight: '900',
    fontSize: 14,
  },
  proBannerDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFB800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  upgradeBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
  },
  proActiveBanner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  proActiveText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Tarjeta Preview
  previewCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  previewColorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  previewColorMiniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewColorPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  previewMockup: {
    gap: 12,
  },
  mockupBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  mockupBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  mockupProgressWrap: {
    gap: 4,
  },
  mockupProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mockupProgressTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  mockupProgressVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  mockupTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  mockupBar: {
    height: 6,
    borderRadius: 3,
  },

  // Sección Título
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },

  // Cuadrícula de 2 columnas
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  colorCard: {
    width: '48.5%',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  checkInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchLock: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0F172A',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  colorName: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
  },
  colorSubtitle: {
    fontSize: 10,
    fontWeight: '600',
  },
  proTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
