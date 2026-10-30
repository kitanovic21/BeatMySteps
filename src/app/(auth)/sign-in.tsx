import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { SocialButtons } from '@/components/SocialButtons';
import { TextField } from '@/components/TextField';
import { Txt } from '@/components/Txt';
import { authErrorMessage, signInWithEmail } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { spacing, useTheme } from '@/theme';

export default function SignIn() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return Alert.alert('Enter your email and password');
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (e) {
      Alert.alert('Sign-in failed', authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back 👋" subtitle="Sign in and keep beating your steps.">
      {!isSupabaseConfigured && (
        <Txt variant="caption" color={colors.danger}>
          Supabase is not configured: add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env
        </Txt>
      )}
      <View style={{ gap: spacing.md }}>
        <TextField icon="mail-outline" placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} textContentType="emailAddress" />
        <TextField icon="lock-closed-outline" placeholder="Password" secure value={password} onChangeText={setPassword} textContentType="password" onSubmitEditing={submit} />
      </View>
      <Button title="Sign in" onPress={submit} loading={loading} />
      <SocialButtons />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 'auto' }}>
        <Txt muted>Don&apos;t have an account?</Txt>
        <Link href="/sign-up">
          <Txt weight="700" color={colors.primary}>Sign up</Txt>
        </Link>
      </View>
    </AuthShell>
  );
}
