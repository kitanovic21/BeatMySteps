import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Platform, StyleSheet, View } from 'react-native';

import { health, HealthPermissionError } from '@/health';
import { spacing, useTheme } from '@/theme';
import { openPlayStore } from '@/utils/store';
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
      openPlayStore(HEALTH_CONNECT_PACKAGE);
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
        {isPermission ? `Connect ${health.name}` : `${health.name} is not available`}
      </Txt>
      <Txt muted center>
        {isPermission
          ? 'To count your steps, allow BeatMySteps to read step data.'
          : 'Install or update Health Connect from the Play Store, then try again.'}
      </Txt>
      <Button
        title={isPermission ? 'Allow access' : Platform.OS === 'android' ? 'Install Health Connect' : 'Open settings'}
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
