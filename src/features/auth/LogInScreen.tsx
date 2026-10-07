import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, type TextInput } from 'react-native';

import { BrandButton } from '../../components/BrandButton';
import { brandColors } from '../../config/brand';
import { isValidEmail, logIn } from '../../data/auth';
import { AuthField } from './AuthField';
import { AuthLayout } from './AuthLayout';
import { FormNotice } from './FormNotice';

export default function LogInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const passwordRef = useRef<TextInput>(null);

  const errors = {
    email: isValidEmail(email) ? null : 'Enter a valid email',
    password: password ? null : 'Enter your password',
  };
  const valid = !errors.email && !errors.password;
  const show = (e: string | null) => (showErrors ? e : null);

  const submit = async () => {
    setShowErrors(true);
    setSubmitError(null);
    if (!valid) return;
    setBusy(true);
    try {
      await logIn(email.trim(), password);
      router.replace('/map');
    } catch (e) {
      setSubmitError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      footer={
        <Pressable onPress={() => router.replace('/create-account')} style={styles.switch} hitSlop={8}>
          <Text style={styles.switchText}>
            New here? <Text style={styles.switchLink}>Create an account</Text>
          </Text>
        </Pressable>
      }
    >
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={show(errors.email)}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthField
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={show(errors.password)}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <FormNotice error={submitError} />
      <BrandButton label={busy ? 'Logging in…' : 'Log In'} onPress={submit} disabled={busy} style={styles.submit} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: 6 },
  switch: { alignSelf: 'center', marginTop: 20 },
  switchText: { color: brandColors.mist, fontSize: 15 },
  switchLink: { color: brandColors.gold, fontWeight: '700' },
});
