import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, type TextInput } from 'react-native';

import { BrandButton } from '../../components/BrandButton';
import { brandColors } from '../../config/brand';
import { createAccount, isValidEmail, MIN_PASSWORD_LENGTH } from '../../data/auth';
import { AuthField } from './AuthField';
import { AuthLayout } from './AuthLayout';
import { FormNotice } from './FormNotice';

export default function CreateAccountScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const errors = {
    name: name.trim() ? null : 'Enter your name',
    email: isValidEmail(email) ? null : 'Enter a valid email',
    password: password.length >= MIN_PASSWORD_LENGTH ? null : `At least ${MIN_PASSWORD_LENGTH} characters`,
    confirm: confirm === password && confirm ? null : "Passwords don't match",
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (e: string | null) => (showErrors ? e : null);

  const submit = async () => {
    setShowErrors(true);
    setSubmitError(null);
    if (!valid) return;
    setBusy(true);
    try {
      await createAccount({ name: name.trim(), email: email.trim(), password });
      router.replace('/map');
    } catch (e) {
      setSubmitError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      footer={
        <Pressable onPress={() => router.replace('/log-in')} style={styles.switch} hitSlop={8}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Log in</Text>
          </Text>
        </Pressable>
      }
    >
      <AuthField
        label="Name"
        value={name}
        onChangeText={setName}
        error={show(errors.name)}
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <AuthField
        ref={emailRef}
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
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <AuthField
        ref={confirmRef}
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        error={show(errors.confirm)}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <FormNotice error={submitError} />
      <BrandButton label={busy ? 'Creating…' : 'Create Account'} onPress={submit} disabled={busy} style={styles.submit} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: 6 },
  switch: { alignSelf: 'center', marginTop: 20 },
  switchText: { color: brandColors.mist, fontSize: 15 },
  switchLink: { color: brandColors.gold, fontWeight: '700' },
});
