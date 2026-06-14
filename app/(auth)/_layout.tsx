import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../store';

export default function AuthLayout() {
  const colors = useTheme();
  const { setPremiumColor } = useSettingsStore();

  // Garantizar que las pantallas de autenticación siempre muestren
  // el color clásico, sin importar lo que haya en el store persistido.
  useEffect(() => {
    setPremiumColor(null);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
