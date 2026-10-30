import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { SocialButtons } from '@/components/SocialButtons';
import { TextField } from '@/components/TextField';
import { Txt } from '@/components/Txt';
import { authErrorMessage, isUsernameAvailable, signUpWithEmail } from '@/lib/auth';
import { useDialog } from '@/providers/DialogProvider';
import { spacing, useTheme } from '@/theme';

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

export default function SignUp() {
  const { colors } = useTheme();
  const dialog = useDialog();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const u = username.trim().toLowerCase();
    if (!displayName.trim()) return dialog.alert('Enter your name', 'Your friends will see this on the leaderboard.', 'warning');
    if (!USERNAME_RE.test(u)) return dialog.alert('Check your username', 'Use 3–20 characters: lowercase letters, numbers, _ and .', 'warning');
    if (!email.includes('@')) return dialog.alert('Enter a valid email', undefined, 'warning');
    if (password.length < 6) return dialog.alert('Password too short', 'Use at least 6 characters.', 'warning');

    setLoading(true);
    try {
      if (!(await isUsernameAvailable(u))) return dialog.alert('Username taken', 'Please try another one.', 'warning');
      const { needsConfirmation } = await signUpWithEmail({ email, password, displayName, username: u });
      if (needsConfirmation) {
        dialog.alert('Check your email', 'We sent you a confirmation link. Confirm your account, then sign in.', 'success');
        router.back();
      }
    } catch (e) {
      dialog.alert('Sign-up failed', authErrorMessage(e), 'error');
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
