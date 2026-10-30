import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { SocialButtons } from '@/components/SocialButtons';
import { TextField } from '@/components/TextField';
import { Txt } from '@/components/Txt';
import { authErrorMessage, isUsernameAvailable, signUpWithEmail } from '@/lib/auth';
import { spacing, useTheme } from '@/theme';

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

export default function SignUp() {
  const { colors } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const u = username.trim().toLowerCase();
    if (!displayName.trim()) return Alert.alert('Enter your name');
    if (!USERNAME_RE.test(u)) return Alert.alert('Username', '3–20 characters: lowercase letters, numbers, _ and .');
    if (!email.includes('@')) return Alert.alert('Enter a valid email');
    if (password.length < 6) return Alert.alert('Password must be at least 6 characters');

    setLoading(true);
    try {
      if (!(await isUsernameAvailable(u))) return Alert.alert('Username taken', 'Please try another one.');
      const { needsConfirmation } = await signUpWithEmail({ email, password, displayName, username: u });
      if (needsConfirmation) {
        Alert.alert('Check your email', 'We sent you a confirmation link. Confirm your account, then sign in.');
        router.back();
      }
    } catch (e) {
      Alert.alert('Sign-up failed', authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Compete with friends and track your progress.">
      <View style={{ gap: spacing.md }}>
        <TextField icon="person-outline" placeholder="Full name" autoCapitalize="words" value={displayName} onChangeText={setDisplayName} />
        <TextField icon="at" placeholder="Username" value={username} onChangeText={(t) => setUsername(t.toLowerCase())} />
        <TextField icon="mail-outline" placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} textContentType="emailAddress" />
        <TextField icon="lock-closed-outline" placeholder="Password (min. 6 characters)" secure value={password} onChangeText={setPassword} textContentType="newPassword" />
      </View>
      <Button title="Sign up" onPress={submit} loading={loading} />
      <SocialButtons />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 'auto' }}>
        <Txt muted>Already have an account?</Txt>
        <Txt weight="700" color={colors.primary} onPress={() => router.back()}>Sign in</Txt>
      </View>
    </AuthShell>
  );
}
