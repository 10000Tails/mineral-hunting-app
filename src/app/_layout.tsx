import { Cinzel_600SemiBold } from '@expo-google-fonts/cinzel/600SemiBold';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { brandColors } from '../config/brand';
import { theme } from '../config/theme';
import { FavoritesProvider } from '../state/favorites';
import { FiltersProvider } from '../state/filters';

// Keep the native splash (the same mountain artwork) up until fonts are ready,
// then cross-fade into the welcome screen so the background looks continuous.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Cinzel_600SemiBold, Cinzel_700Bold });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <FavoritesProvider>
    <FiltersProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerTintColor: theme.accent, contentStyle: { backgroundColor: brandColors.navy } }}>
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="create-account" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="log-in" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="site/[id]" options={{ title: 'Site', contentStyle: { backgroundColor: theme.background } }} />
        <Stack.Screen name="filters" options={{ title: 'Filters', presentation: 'modal', contentStyle: { backgroundColor: theme.background } }} />
      </Stack>
    </FiltersProvider>
    </FavoritesProvider>
  );
}
