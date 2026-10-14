import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Builds on app.json. The Google Sign-In build plugin needs your iOS client ID's URL scheme,
 * so it's only added once EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is set (see .env.example).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const plugins = [...(config.plugins ?? [])];

  if (iosClientId) {
    // "1234-abc.apps.googleusercontent.com" → "com.googleusercontent.apps.1234-abc"
    const iosUrlScheme = `com.googleusercontent.apps.${iosClientId.replace(/\.apps\.googleusercontent\.com$/, '')}`;
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  }

  return { ...config, name: config.name ?? 'Mineral Hunter', slug: config.slug ?? 'mineral-hunting-app', plugins };
};
