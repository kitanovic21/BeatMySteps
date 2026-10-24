import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AuthShell, Divider } from '@/components/AuthShell';
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
    if (!email || !password) return Alert.alert('Unesi email i lozinku');
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (e) {
      Alert.alert('Prijava nije uspela', authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Dobrodošao nazad 👋" subtitle="Prijavi se i nastavi da pobeđuješ svoje korake.">
      {!isSupabaseConfigured && (
        <Txt variant="caption" color={colors.danger}>
          Supabase nije podešen: dodaj EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_ANON_KEY u .env
        </Txt>
      )}
      <View style={{ gap: spacing.md }}>
        <TextField icon="mail-outline" placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} textContentType="emailAddress" />
        <TextField icon="lock-closed-outline" placeholder="Lozinka" secure value={password} onChangeText={setPassword} textContentType="password" onSubmitEditing={submit} />
      </View>
      <Button title="Prijavi se" onPress={submit} loading={loading} />
      <Divider label="ili" />
      <SocialButtons />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 'auto' }}>
        <Txt muted>Nemaš nalog?</Txt>
        <Link href="/sign-up">
          <Txt weight="700" color={colors.primary}>Registruj se</Txt>
        </Link>
      </View>
    </AuthShell>
  );
}
