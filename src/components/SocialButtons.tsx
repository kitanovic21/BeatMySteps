import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { authErrorMessage, signInWithApple, signInWithGoogle } from '@/lib/auth';
import { radius, spacing, useTheme } from '@/theme';
import { Button } from './Button';
import { Txt } from './Txt';

export function SocialButtons() {
  const { dark } = useTheme();
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
      Alert.alert('Google prijava nije uspela', authErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const apple = async () => {
    try {
      await signInWithApple();
    } catch (e) {
      Alert.alert('Apple prijava nije uspela', authErrorMessage(e));
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
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
      {Platform.OS !== 'web' && (
        <Button
          title="Nastavi sa Google"
          variant="secondary"
          loading={busy === 'google'}
          onPress={google}
          leading={<Txt weight="900" style={{ fontSize: 18, color: '#4285F4' }}>G</Txt>}
        />
      )}
    </View>
  );
}
