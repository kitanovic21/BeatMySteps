import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { authErrorMessage, signInWithApple, signInWithGoogle } from '@/lib/auth';
import { useDialog } from '@/providers/DialogProvider';
import { radius, spacing, useTheme } from '@/theme';
import { Divider } from './AuthShell';
import { Button } from './Button';
import { Txt } from './Txt';

export function SocialButtons() {
  const { dark } = useTheme();
  const dialog = useDialog();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<'google' | null>(null);

  useEffect(() => {
    if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const google = async () => {
    setBusy('google');
    try {
      await signInWithGoogle();
    } catch (e) {
      dialog.alert('Google sign-in failed', authErrorMessage(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const apple = async () => {
    try {
      await signInWithApple();
    } catch (e) {
      dialog.alert('Apple sign-in failed', authErrorMessage(e), 'error');
    }
  };

  // Native Google/Apple sign-in is not available on web.
  if (Platform.OS === 'web') return null;

  return (
    <View style={{ gap: spacing.md }}>
      <Divider label="or" />
      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            dark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={radius.pill}
          style={{ height: 52 }}
          onPress={apple}
        />
      )}
      <Button
        title="Continue with Google"
        variant="secondary"
        loading={busy === 'google'}
        onPress={google}
        leading={<Txt weight="900" style={{ fontSize: 18, color: '#4285F4' }}>G</Txt>}
      />
    </View>
  );
}
