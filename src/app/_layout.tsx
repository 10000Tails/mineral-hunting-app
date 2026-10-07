import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { FiltersProvider } from '../state/filters';
import { theme } from '../config/theme';

export default function RootLayout() {
  return (
    <FiltersProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerTintColor: theme.accent }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="site/[id]" options={{ title: 'Site' }} />
        <Stack.Screen name="filters" options={{ title: 'Filters', presentation: 'modal' }} />
      </Stack>
    </FiltersProvider>
  );
}
