import { useSettingsStore } from '../store';
import { Colors, ThemeColors } from '../constants/Colors';

export function useTheme() {
  const theme = useSettingsStore((state) => state.theme);
  const premiumColor = useSettingsStore((state) => state.premiumColor);
  const colors = Colors[theme] || Colors.dark;
  
  if (premiumColor) {
    return { ...colors, theme, primary: premiumColor, accent: premiumColor };
  }
  
  return { ...colors, theme };
}
