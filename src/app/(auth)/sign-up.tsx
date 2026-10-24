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
    if (!displayName.trim()) return Alert.alert('Unesi ime');
    if (!USERNAME_RE.test(u)) return Alert.alert('Korisničko ime', '3–20 karaktera: mala slova, brojevi, _ i .');
    if (!email.includes('@')) return Alert.alert('Unesi ispravan email');
    if (password.length < 6) return Alert.alert('Lozinka mora imati bar 6 karaktera');

    setLoading(true);
    try {
      if (!(await isUsernameAvailable(u))) return Alert.alert('Korisničko ime je zauzeto', 'Probaj neko drugo.');
      const { needsConfirmation } = await signUpWithEmail({ email, password, displayName, username: u });
      if (needsConfirmation) {
        Alert.alert('Proveri email', 'Poslali smo ti link za potvrdu naloga. Nakon potvrde se prijavi.');
        router.back();
      }
    } catch (e) {
      Alert.alert('Registracija nije uspela', authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Napravi nalog" subtitle="Takmiči se sa prijateljima i prati svoj napredak.">
      <View style={{ gap: spacing.md }}>
        <TextField icon="person-outline" placeholder="Ime i prezime" autoCapitalize="words" value={displayName} onChangeText={setDisplayName} />
        <TextField icon="at" placeholder="Korisničko ime" value={username} onChangeText={(t) => setUsername(t.toLowerCase())} />
        <TextField icon="mail-outline" placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} textContentType="emailAddress" />
        <TextField icon="lock-closed-outline" placeholder="Lozinka (min. 6 karaktera)" secure value={password} onChangeText={setPassword} textContentType="newPassword" />
      </View>
      <Button title="Registruj se" onPress={submit} loading={loading} />
      <SocialButtons />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 'auto' }}>
        <Txt muted>Već imaš nalog?</Txt>
        <Txt weight="700" color={colors.primary} onPress={() => router.back()}>Prijavi se</Txt>
      </View>
    </AuthShell>
  );
}
