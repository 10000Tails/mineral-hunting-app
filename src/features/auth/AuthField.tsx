import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { brandColors } from '../../config/brand';

interface Props extends TextInputProps {
  label: string;
  error?: string | null;
}

export const AuthField = forwardRef<TextInput, Props>(function AuthField({ label, error, style, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor="rgba(255,255,255,0.35)"
        selectionColor={brandColors.gold}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[styles.input, focused && styles.focused, !!error && styles.invalid, style]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { color: brandColors.mist, fontSize: 13, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: brandColors.white,
    fontSize: 16,
    paddingHorizontal: 14,
  },
  focused: { borderColor: brandColors.gold },
  invalid: { borderColor: '#FF8A80' },
  error: { color: '#FFB4AB', fontSize: 12, marginTop: 4 },
});
