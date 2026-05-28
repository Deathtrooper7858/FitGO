import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Linking } from 'react-native';
import { router } from 'expo-router';
import { Spacing, Radius } from '../../constants';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Lock, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TERMS_DATA, PRIVACY_DATA } from '../../constants/legalData';

const { width } = Dimensions.get('window');

export default function LegalScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  
  const data = activeTab === 'terms' ? TERMS_DATA : PRIVACY_DATA;

  const renderText = (text: string) => {
    if (!text) return null;
    const linkRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    const parts = text.split(linkRegex);
    
    return parts.map((part, i) => {
      if (part.match(/https?:\/\/[^\s]+/)) {
        return (
          <Text
            key={i}
            style={{ color: colors.primary, textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        );
      } else if (part.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/)) {
        return (
          <Text
            key={i}
            style={{ color: colors.primary, textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL(`mailto:${part}`)}
          >
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary + '20', colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
      />
      
      {/* Glow Effect */}
      <View style={[s.glow, { backgroundColor: colors.primary }]} />
      
      {/* Header Section */}
      <View style={[s.headerContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
          <ChevronLeft color={colors.textPrimary} size={24} />
          <Text style={[s.backText, { color: colors.textPrimary }]}>{t('common.back', 'Volver')}</Text>
        </TouchableOpacity>
        
        <View style={s.titleRow}>
          {activeTab === 'terms' ? (
            <ShieldCheck color={colors.primary} size={32} />
          ) : (
            <Lock color={colors.primary} size={32} />
          )}
          <Text style={[s.mainTitle, { color: colors.textPrimary }]}>
            {activeTab === 'terms' ? 'Términos y Condiciones' : 'Política de Privacidad'}
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={[s.tabContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={[s.tabButton, activeTab === 'terms' && s.activeTabButton, activeTab === 'terms' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('terms')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, activeTab === 'terms' ? { color: '#fff' } : { color: colors.textSecondary }]}>
              Términos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.tabButton, activeTab === 'privacy' && s.activeTabButton, activeTab === 'privacy' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('privacy')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, activeTab === 'privacy' ? { color: '#fff' } : { color: colors.textSecondary }]}>
              Privacidad
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {data.map((item, index) => (
          <View key={index} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {item.title && (
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
                {item.title}
              </Text>
            )}
            <Text style={[s.paragraph, { color: colors.textSecondary }]}>
              {renderText(item.content)}
            </Text>
          </View>
        ))}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={s.acceptBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary + 'dd']}
            style={s.btnBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={s.btnText}>Aceptar y Entendido</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  glow: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, opacity: 0.15, filter: 'blur(50px)' },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: Spacing.base,
    paddingBottom: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    flexShrink: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  activeTabButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.base,
    paddingTop: 24,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  acceptBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnBg: {
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
  btnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
