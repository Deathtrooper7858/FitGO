import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, X, Globe } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';

interface LanguageModalProps {
  visible: boolean;
  currentLang: string;
  onSelect: (lang: any) => void;
  onClose: () => void;
}

interface LanguageOption {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
  { id: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
  { id: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { id: 'pt', name: 'Português', nativeName: 'Português (BR)', flag: '🇧🇷' },
  { id: 'it', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
  { id: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
  { id: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺' },
];

export default function LanguageModal({
  visible,
  currentLang,
  onSelect,
  onClose,
}: LanguageModalProps) {
  const { t } = useTranslation();
  const colors = useTheme();

  const handleSelectLanguage = (langId: string) => {
    Haptics.selectionAsync();
    onSelect(langId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable
          style={[
            s.box,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border + '60',
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Ambient Glow */}
          <LinearGradient
            colors={['#3B82F620', 'transparent']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Cabecera */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={s.iconWrap}>
                <Globe size={18} color="#FFF" />
              </LinearGradient>
              <View>
                <Text style={[s.title, { color: colors.textPrimary }]}>
                  {t('profile.language', 'Idioma de la App')}
                </Text>
                <Text style={[s.subtitle, { color: colors.textMuted }]}>
                  {t('profile.languageSubtitle', 'Selecciona tu idioma preferido')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[s.closeBtn, { backgroundColor: colors.surfaceAlt }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Lista de Idiomas */}
          <ScrollView
            style={s.scrollView}
            contentContainerStyle={s.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {LANGUAGES.map((item) => {
              const isSelected = currentLang === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.78}
                  style={[
                    s.itemCard,
                    {
                      backgroundColor: isSelected ? colors.surfaceAlt : colors.surfaceAlt + '40',
                      borderColor: isSelected ? colors.primary : colors.border + '40',
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => handleSelectLanguage(item.id)}
                >
                  {/* Bandera */}
                  <View style={s.flagBox}>
                    <Text style={{ fontSize: 24 }}>{item.flag}</Text>
                  </View>

                  {/* Textos */}
                  <View style={s.textCol}>
                    <Text
                      style={[
                        s.itemName,
                        {
                          color: isSelected ? colors.textPrimary : colors.textPrimary,
                          fontWeight: isSelected ? '800' : '700',
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={[s.itemNative, { color: colors.textMuted }]}>
                      {item.nativeName}
                    </Text>
                  </View>

                  {/* Checkmark */}
                  {isSelected ? (
                    <View style={[s.checkCircle, { backgroundColor: colors.primary }]}>
                      <Check size={14} color="#FFF" strokeWidth={3} />
                    </View>
                  ) : (
                    <View style={[s.uncheckCircle, { borderColor: colors.border + '70' }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    maxHeight: 380,
  },
  listContainer: {
    gap: 10,
    paddingBottom: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  flagBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
  },
  itemNative: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
});
