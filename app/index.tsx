import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

/**
 * Root index component.
 * Redirection logic is primarily handled by the NavigationGuard in app/_layout.tsx,
 * but this file must exist for Expo Router to have a valid "/" route.
 * Shows a loading indicator during transition to prevent a blank black screen.
 */
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0D0F14', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#7C5CFC" />
      <Redirect href="/(tabs)/tracker" />
    </View>
  );
}
