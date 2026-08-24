import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

export default function AuthLayout() {
  const colors = useTheme();

  // NOTE: premiumColor is intentionally NOT reset here.
  // The root _layout.tsx already clears it in the auth state listener
  // whenever the session is null (logout) or the user ID changes (account switch).
  // Resetting it here was causing a race condition: expo-router mounts this layout
  // transiently during startup before redirecting authenticated users to the tabs,
  // which wiped the persisted premium color before fetchProfile could restore it.

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
