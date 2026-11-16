import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { authErrorMessage, startRecoverySession, updatePassword } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useDialog } from '@/providers/DialogProvider';
import { spacing, useTheme } from '@/theme';

const MIN_LENGTH = 6;

type Status = 'checking' | 'ready' | 'invalid';

/** Opened from the password reset email (beatmysteps://reset-password#access_token=…). */
export default function ResetPassword() {
  const { colors } = useTheme();
  const dialog = useDialog();
  // The full URL, including the #fragment that holds the one-time tokens.
  const url = Linking.useURL();
  const handled = useRef<string | null>(null);
  const [status, setStatus] = useState<Status>('checking');
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  // useURL starts as null and then reports the link, so this runs twice for the same
  // link. Each link is handled once, and that run always finishes by setting the status.
  useEffect(() => {
    (async () => {
      const link = url ?? (await Linking.getInitialURL());
      if (link && handled.current === link) return;
      handled.current = link;
      try {
        const fromLink = link ? await startRecoverySession(link) : false;
        // Without tokens, a signed-in user can still set a new password here.
        const ok = fromLink || (await supabase.auth.getSession()).data.session != null;
        setStatus(ok ? 'ready' : 'invalid');
      } catch (e) {
        setError(authErrorMessage(e));
        setStatus('invalid');
      }
    })();
  }, [url]);

  const save = async () => {
    if (password.length < MIN_LENGTH) {
      return dialog.alert('Password too short', `Use at least ${MIN_LENGTH} characters.`, 'warning');
    }
    if (password !== confirm) return dialog.alert("Passwords don't match", 'Type the same password twice.', 'warning');
    setSaving(true);
    try {
      await updatePassword(password);
      dialog.show({
        title: 'Password changed',
        message: "You're signed in. Use the new password next time.",
        tone: 'success',
        actions: [{ label: 'Continue', style: 'primary', onPress: () => router.replace('/') }],
      });
    } catch (e) {
      dialog.alert("Couldn't change password", authErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'checking') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (status === 'invalid') {
    return (
      <AuthShell
        title="This link doesn't work"
        subtitle={error ?? 'The reset link has expired or was already used. Request a new one.'}
      >
        <Button title="Request a new link" onPress={() => router.replace('/forgot-password')} />
        <Button title="Back to sign in" variant="secondary" onPress={() => router.replace('/sign-in')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a password you'll remember.">
      <View style={{ gap: spacing.md }}>
        <TextField
          icon="lock-closed-outline"
          placeholder="New password"
          secure
          value={password}
          onChangeText={setPassword}
          textContentType="newPassword"
          autoFocus
        />
        <TextField
          icon="lock-closed-outline"
          placeholder="Repeat new password"
          secure
          value={confirm}
          onChangeText={setConfirm}
          textContentType="newPassword"
          onSubmitEditing={save}
        />
      </View>
      <Button title="Save password" onPress={save} loading={saving} />
    </AuthShell>
  );
}
