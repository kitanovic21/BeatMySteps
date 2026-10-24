import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { health, HealthPermissionError } from '@/health';
import { spacing, useTheme } from '@/theme';
import { Button } from './Button';
import { Card } from './Card';
import { Txt } from './Txt';

/** Shown when steps can't be read: missing permission or Health Connect not installed. */
export function HealthNotice({ error }: { error: unknown }) {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const isPermission = error instanceof HealthPermissionError;

  const connect = async () => {
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
      <Button title={isPermission ? 'Dozvoli pristup' : 'Otvori podešavanja'} icon="fitness" onPress={connect} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'stretch', gap: spacing.md, paddingVertical: spacing.xl },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
});
