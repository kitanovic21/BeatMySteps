import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Txt } from '@/components/Txt';
import { authErrorMessage, requestPasswordReset } from '@/lib/auth';
import { useDialog } from '@/providers/DialogProvider';
import { spacing, useTheme } from '@/theme';

export default function ForgotPassword() {
  const { colors } = useTheme();
  const dialog = useDialog();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return dialog.alert('Enter your email', undefined, 'warning');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      // Same message whether or not the account exists, so emails can't be probed.
      dialog.show({
        title: 'Check your email',
        message: `If there's an account for ${email.trim()}, we sent a link to reset the password. Open it on this phone.`,
        tone: 'success',
        icon: 'mail-outline',
        actions: [{ label: 'OK', style: 'primary', onPress: () => router.back() }],
      });
    } catch (e) {
      dialog.alert("Couldn't send the email", authErrorMessage(e), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a link to set a new one.">
      <TextField
        icon="mail-outline"
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        textContentType="emailAddress"
        autoFocus
        onSubmitEditing={submit}
      />
      <Button title="Send reset link" onPress={submit} loading={loading} />
      <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Txt weight="700" color={colors.primary}>Back to sign in</Txt>
        </Pressable>
      </View>
    </AuthShell>
  );
}
