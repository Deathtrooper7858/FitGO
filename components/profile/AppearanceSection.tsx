import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Moon, Palette, Globe, Scale, Droplets, Ruler, Zap, Thermometer } from 'lucide-react-native';
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

  return (
    <View style={{ backgroundColor: colors.surfaceAlt + '10', borderBottomWidth: 1, borderBottomColor: colors.border + '10' }}>
      <SettingsItem
        icon={Moon}
        label={t('profile.appearance', 'Apariencia')}
        value={theme === 'dark' ? t('profile.dark', 'Oscuro') : t('profile.lightMode', 'Claro')}
        indent
        onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        iconColor="#8B5CF6"
      />
      <SettingsItem
        icon={Palette}
        label={t('profile.premiumColor', 'Color Premium (Pro)')}
        value={premiumColor ? '●' : t('common.default', 'Predeterminado')}
        valueStyle={premiumColor ? { color: safePremiumColor, fontSize: 18 } : {}}
        indent
        onPress={onPremiumColorPress}
        iconColor={premiumColor || '#FFD700'}
      />
      <SettingsItem
        icon={Globe}
        label={t('profile.language', 'Idioma')}
        value={language.toUpperCase()}
        indent
        onPress={onLanguagePress}
        iconColor="#3B82F6"
      />
      <SettingsItem
        icon={Scale}
        label={t('profile.massUnit', 'Unidad de masa')}
        value={massUnit.toUpperCase()}
        indent
        onPress={onMassUnitPress}
        iconColor="#10B981"
      />
      <SettingsItem
        icon={Droplets}
        label={t('profile.volumeUnit', 'Unidad de volumen')}
        value={volumeUnit.toUpperCase()}
        indent
        onPress={onVolumeUnitPress}
        iconColor="#3B82F6"
      />
      <SettingsItem
        icon={Ruler}
        label={t('profile.lengthUnit', 'Unidad de longitud')}
        value={lengthUnit.toUpperCase()}
        indent
        onPress={onLengthUnitPress}
        iconColor="#6366F1"
      />
      <SettingsItem
        icon={Zap}
        label={t('profile.energyUnit', 'Unidad de energía')}
        value={energyUnit.toUpperCase()}
        indent
        onPress={onEnergyUnitPress}
        iconColor="#F59E0B"
      />
      <SettingsItem
        icon={Thermometer}
        label={t('profile.tempUnit', 'Unidad de temperatura')}
        value={tempUnit === 'c' ? '°C' : '°F'}
        indent
        onPress={onTempUnitPress}
        iconColor="#3B82F6"
      />
    </View>
  );
}
