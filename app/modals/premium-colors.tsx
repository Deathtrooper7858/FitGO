import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Check, X, Crown, Lock, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore, useAuthStore } from '../../store';
import { usePurchaseStore } from '../../store/purchaseStore';
import { useIsPro } from '../../hooks/useIsPro';
import { supabase } from '../../services/supabase';

const PREMIUM_COLORS = [
  { id: null,       nameKey: 'profile.colors.default', defaultName: 'Morado Clásico', hex: '#7C5CFC', isPro: false },
  { id: '#FFB800',  nameKey: 'profile.colors.gold',    defaultName: 'Dorado Élite', hex: '#FFB800', isPro: true },
  { id: '#00F0FF',  nameKey: 'profile.colors.blue',    defaultName: 'Azul Eléctrico', hex: '#00F0FF', isPro: true },
  { id: '#00E676',  nameKey: 'profile.colors.green',   defaultName: 'Verde Neón', hex: '#00E676', isPro: true },
  { id: '#FF2A54',  nameKey: 'profile.colors.red',     defaultName: 'Rojo Rubí', hex: '#FF2A54', isPro: true },
  { id: '#FF5722',  nameKey: 'profile.colors.orange',  defaultName: 'Naranja Fuego', hex: '#FF5722', isPro: true },
  { id: '#FF00FF',  nameKey: 'profile.colors.magenta', defaultName: 'Magenta Oscuro', hex: '#FF00FF', isPro: true },
  { id: '#FF4081',  nameKey: 'profile.colors.pink',    defaultName: 'Rosa Atardecer', hex: '#FF4081', isPro: true },
  { id: '#10B981',  nameKey: 'profile.colors.emerald', defaultName: 'Verde Esmeralda', hex: '#10B981', isPro: true },
  { id: '#06B6D4',  nameKey: 'profile.colors.turquoise',defaultName: 'Turquesa Profundo', hex: '#06B6D4', isPro: true },
  { id: '#4C1D95',  nameKey: 'profile.colors.purple',  defaultName: 'Púrpura Imperial', hex: '#4C1D95', isPro: true },
  { id: '#94A3B8',  nameKey: 'profile.colors.silver',  defaultName: 'Plata Cromo', hex: '#94A3B8', isPro: true },
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
    verifyProStatus().then(status => {
      setActualIsPro(status);
      setLoading(false);
    });
  }, [hasProRole]);

  const handleSelect = async (color: typeof PREMIUM_COLORS[0]) => {
    Haptics.selectionAsync();
    
    if (loading) return;
    
    if (color.isPro && !actualIsPro) {
      router.push('/modals/paywall');
      return;
    }

    setPremiumColor(color.id);
    
    // Save to database if user is logged in
    if (profile?.id) {
      // Update local profile state
      setProfile({ ...profile, premiumColor: color.id || undefined });
      
      // Update database silently in background
      supabase
        .from('users')
        .update({ premium_color: color.id })
        .eq('id', profile.id)
        .then(({ error }) => {
          if (error) console.error('[PremiumColors] Failed to save to DB:', error);
        });
    }
  };

  const safePremiumColor = premiumColor === 'admin_glow' ? '#00F0FF' : premiumColor;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[safePremiumColor || colors.primary, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
      />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Sparkles size={20} color={premiumColor || colors.primary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('premiumColors.title')}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {!actualIsPro && !loading && (
          <View style={[styles.proBanner, { backgroundColor: '#FFB80015', borderColor: '#FFB800' }]}>
            <Crown size={24} color="#FFB800" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16 }}>{t('premiumColors.proExclusive')}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                {t('premiumColors.proDesc')}
              </Text>
            </View>
            <TouchableOpacity 
              style={{ backgroundColor: '#FFB800', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
              onPress={() => router.push('/modals/paywall')}
            >
              <Text style={{ color: '#000', fontWeight: '800', fontSize: 13 }}>{t('premiumColors.upgrade')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t('premiumColors.description')}
        </Text>

        <View style={styles.colorGrid}>
          {PREMIUM_COLORS.map((c) => {
            const isSelected = premiumColor === c.id;
            const isLocked = c.isPro && !actualIsPro && !loading;
            
            return (
              <TouchableOpacity
                key={c.id || 'default'}
                style={[
                  styles.colorItem, 
                  { backgroundColor: colors.surfaceAlt, borderColor: isSelected ? c.hex : colors.border },
                  isSelected && { backgroundColor: c.hex + '15' }
                ]}
                activeOpacity={0.8}
                onPress={() => handleSelect(c)}
              >
                <View style={[styles.colorCircle, { backgroundColor: c.hex, shadowColor: c.hex }]}>
                  {isSelected && <Check size={20} color="#000" strokeWidth={3} />}
                </View>
                
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.colorName, { color: colors.textPrimary }]}>
                    {t(c.nameKey, c.defaultName)}
                  </Text>
                  {c.id === null && (
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      {t('profile.colors.defaultSubtitle')}
                    </Text>
                  )}
                </View>

                {isLocked && (
                  <View style={{ backgroundColor: colors.surface, padding: 8, borderRadius: 12 }}>
                    <Lock size={18} color={colors.textMuted} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  colorGrid: {
    gap: 12,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  colorName: {
    fontSize: 16,
    fontWeight: '700',
  },
});
