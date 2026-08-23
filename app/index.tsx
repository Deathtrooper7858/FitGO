import { View, ActivityIndicator } from 'react-native';

/**
 * Root index component.
 * Redirection logic is handled by the NavigationGuard in app/_layout.tsx.
 */
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#060212', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#7C5CFC" />
    </View>
  );
}
