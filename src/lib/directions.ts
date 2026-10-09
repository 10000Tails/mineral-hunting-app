import { Linking, Platform } from 'react-native';

/** Opens turn-by-turn directions to a point in the phone's maps app. */
export function openDirections(latitude: number, longitude: number, label: string) {
  const url =
    Platform.OS === 'ios'
      ? `maps://?daddr=${latitude},${longitude}&q=${encodeURIComponent(label)}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(label)})`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`)
  );
}
