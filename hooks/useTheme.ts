import { useMemo } from 'react';
import { useSettingsStore } from '../store';
import { Colors } from '../constants/Colors';

export function useTheme() {
  const theme = useSettingsStore((state) => state.theme);
  const premiumColor = useSettingsStore((state) => state.premiumColor);

  return useMemo(() => {
    const colors = Colors[theme] || Colors.dark;
    if (premiumColor) {
      return { ...colors, theme, primary: premiumColor, accent: premiumColor };
    }
    return { ...colors, theme };
  }, [theme, premiumColor]);
}
