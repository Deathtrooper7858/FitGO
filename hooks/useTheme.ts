import { useMemo } from 'react';
import { useSettingsStore } from '../store';
import { Colors } from '../constants/Colors';
import { getSafeColor } from '../utils/styles';

export function useTheme() {
  const theme = useSettingsStore((state) => state.theme);
  const premiumColor = useSettingsStore((state) => state.premiumColor);

  return useMemo(() => {
    const colors = Colors[theme] || Colors.dark;
    if (premiumColor) {
      const safeColor = getSafeColor(premiumColor);
      return { ...colors, theme, primary: safeColor, accent: safeColor };
    }
    return { ...colors, theme };
  }, [theme, premiumColor]);
}
