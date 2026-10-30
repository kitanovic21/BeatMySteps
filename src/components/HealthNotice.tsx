import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { health, HealthPermissionError } from '@/health';
import { spacing, useTheme } from '@/theme';
import { Button } from './Button';
import { Card } from './Card';
import { Txt } from './Txt';

const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';

/** Shown when steps can't be read: missing permission or Health Connect not installed. */
export function HealthNotice({ error }: { error: unknown }) {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const isPermission = error instanceof HealthPermissionError;

  const connect = async () => {
    // Before Android 14, Health Connect is a separate app from the Play Store.
    if (!isPermission && Platform.OS === 'android') {
      Linking.openURL(`market://details?id=${HEALTH_CONNECT_PACKAGE}`).catch(() =>
        Linking.openURL(`https://play.google.com/store/apps/details?id=${HEALTH_CONNECT_PACKAGE}`),
      );
      return;
    }
    try {
      await health.requestPermissions();
    } catch {
      health.openSettings();
    }
    qc.invalidateQueries({ queryKey: ['steps'] });
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.icon, { backgroundColor: colors.danger + '18' }]}>
        <Ionicons name="heart-dislike-outline" size={26} color={colors.danger} />
      </View>
      <Txt variant="heading" center>
        {isPermission ? `Poveži ${health.name}` : `${health.name} nije dostupan`}
      </Txt>
      <Txt muted center>
        {isPermission
          ? 'Da bismo brojali tvoje korake, dozvoli BeatMySteps aplikaciji da čita korake.'
          : 'Instaliraj ili ažuriraj Health Connect iz Play prodavnice, pa pokušaj ponovo.'}
      </Txt>
      <Button
        title={isPermission ? 'Dozvoli pristup' : Platform.OS === 'android' ? 'Instaliraj Health Connect' : 'Otvori podešavanja'}
        icon="fitness"
        onPress={connect}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'stretch', gap: spacing.md, paddingVertical: spacing.xl },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
});
