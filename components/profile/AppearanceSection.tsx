import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Palette, Globe, Scale, Droplets, Ruler, Zap, Thermometer } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode, AppLanguage, MassUnit, VolumeUnit, LengthUnit, EnergyUnit, TempUnit } from '../../store';
import { SettingsItem } from './SettingsItem';

interface AppearanceSectionProps {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  premiumColor: string | null;
  language: AppLanguage;
  massUnit: MassUnit;
  volumeUnit: VolumeUnit;
  lengthUnit: LengthUnit;
  energyUnit: EnergyUnit;
  tempUnit: TempUnit;
  safePremiumColor: string | null;
  onLanguagePress: () => void;
  onMassUnitPress: () => void;
  onVolumeUnitPress: () => void;
  onLengthUnitPress: () => void;
  onEnergyUnitPress: () => void;
  onTempUnitPress: () => void;
  onPremiumColorPress: () => void;
}

export function AppearanceSection({
  theme, setTheme, premiumColor, language, massUnit, volumeUnit, lengthUnit,
  energyUnit, tempUnit, safePremiumColor, onLanguagePress, onMassUnitPress,
  onVolumeUnitPress, onLengthUnitPress, onEnergyUnitPress, onTempUnitPress,
  onPremiumColorPress,
}: AppearanceSectionProps) {
  const colors = useTheme();
  const { t } = useTranslation();

  const isDark = theme === 'dark';

  return (
    <View style={{ backgroundColor: colors.surfaceAlt + '10', borderBottomWidth: 1, borderBottomColor: colors.border + '15' }}>
      {/* Theme Toggle */}
      <SettingsItem
        icon={isDark ? Moon : Sun}
        label={t('profile.appearance', 'Modo de Color')}
        subtitle={isDark ? t('profile.dark', 'Tema Oscuro Activo') : t('profile.lightMode', 'Tema Claro Activo')}
        value={isDark ? t('theme.dark', 'Oscuro') : t('theme.light', 'Claro')}
        indent
        onPress={() => setTheme(isDark ? 'light' : 'dark')}
        iconColor="#8B5CF6"
      />

      {/* Premium Color */}
      <SettingsItem
        icon={Palette}
        label={t('profile.premiumColor', 'Color de Acento (Pro)')}
        subtitle={t('profile.premiumColorSubtitle', 'Personaliza los brillos y botones')}
        value={premiumColor ? t('profile.customColor', '● Personalizado') : t('common.default', 'Predeterminado')}
        valueStyle={safePremiumColor ? { color: safePremiumColor, fontWeight: '800' } : {}}
        badge={premiumColor ? 'PRO' : undefined}
        badgeColor={safePremiumColor || '#F59E0B'}
        indent
        onPress={onPremiumColorPress}
        iconColor={safePremiumColor || '#F59E0B'}
      />

      {/* Language */}
      <SettingsItem
        icon={Globe}
        label={t('profile.language', 'Idioma')}
        subtitle={t('profile.languageSubtitle', 'Selecciona el idioma de la app')}
        value={language.toUpperCase()}
        indent
        onPress={onLanguagePress}
        iconColor="#3B82F6"
      />

      {/* Mass Unit */}
      <SettingsItem
        icon={Scale}
        label={t('profile.massUnit', 'Unidad de Masa')}
        value={massUnit.toUpperCase()}
        indent
        onPress={onMassUnitPress}
        iconColor="#10B981"
      />

      {/* Volume Unit */}
      <SettingsItem
        icon={Droplets}
        label={t('profile.volumeUnit', 'Unidad de Volumen')}
        value={volumeUnit.toUpperCase()}
        indent
        onPress={onVolumeUnitPress}
        iconColor="#06B6D4"
      />

      {/* Length Unit */}
      <SettingsItem
        icon={Ruler}
        label={t('profile.lengthUnit', 'Unidad de Longitud')}
        value={lengthUnit.toUpperCase()}
        indent
        onPress={onLengthUnitPress}
        iconColor="#6366F1"
      />

      {/* Energy Unit */}
      <SettingsItem
        icon={Zap}
        label={t('profile.energyUnit', 'Unidad de Energía')}
        value={energyUnit.toUpperCase()}
        indent
        onPress={onEnergyUnitPress}
        iconColor="#F59E0B"
      />

      {/* Temperature Unit */}
      <SettingsItem
        icon={Thermometer}
        label={t('profile.tempUnit', 'Unidad de Temperatura')}
        value={tempUnit === 'c' ? '°C (Celsius)' : '°F (Fahrenheit)'}
        indent
        onPress={onTempUnitPress}
        iconColor="#EC4899"
      />
    </View>
  );
}
