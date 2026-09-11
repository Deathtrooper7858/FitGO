import { useMemo } from 'react';
import { useSettingsStore } from '../store';
import { Colors } from '../constants/Colors';
import { getSafeColor, lightenColor, darkenColor, hexToRgba } from '../utils/styles';

export function useTheme() {
  const theme = useSettingsStore((state) => state.theme);
  const premiumColor = useSettingsStore((state) => state.premiumColor);

  return useMemo(() => {
    const colors = Colors[theme] || Colors.dark;
    if (premiumColor) {
      const safeColor = getSafeColor(premiumColor);
      const light = lightenColor(safeColor, 0.25);
      const dark = darkenColor(safeColor, 0.25);

      return {
        ...colors,
        theme,
        primary: safeColor,
        accent: safeColor,
        tabActive: safeColor,
        primaryLight: light,
        primaryDark: dark,
        protein: safeColor,
        gradientPrimary: [safeColor, dark] as const,
        gradientBurn: [safeColor, colors.secondary || '#06B6D4'] as const,
        gradientGlass: [
          hexToRgba(safeColor, theme === 'dark' ? 0.15 : 0.08),
          colors.gradientGlass[1],
        ] as const,
        musclePulse: hexToRgba(safeColor, theme === 'dark' ? 0.25 : 0.15),
      };
    }
    return { ...colors, theme };
  }, [theme, premiumColor]);
}
