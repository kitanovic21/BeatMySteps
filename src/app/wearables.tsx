import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HealthNotice } from '@/components/HealthNotice';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { health, HealthPermissionError, type StepSource } from '@/health';
import { isWearableSource, wearables, type Wearable } from '@/health/wearables';
import { SOURCE_DAYS, useStepSources } from '@/hooks/useStepSources';
import { useDialog } from '@/providers/DialogProvider';
import { radius, spacing, useTheme } from '@/theme';
import { formatSteps } from '@/utils/format';
import { openPlayStore } from '@/utils/store';

export default function WearablesScreen() {
  const { colors } = useTheme();
  const dialog = useDialog();
  const sources = useStepSources();
  const connected = sources.data ?? [];
  const hasWearable = connected.some((s) => isWearableSource(s.id, s.name));

  const setUp = (w: Wearable) => {
    const message =
      w.hint ??
      `Open ${w.app}, go to its settings and turn on ${health.name} sync. Allow it to share Steps, then come back here.`;
    const store = Platform.OS === 'android' && w.androidPackage;
    dialog.show({
      title: `Connect ${w.name}`,
      message,
      icon: 'watch-outline',
      actions: [
        ...(store ? [{ label: `Get ${w.app}`, style: 'primary' as const, onPress: () => openPlayStore(store) }] : []),
        { label: `Open ${health.name}`, style: store ? ('secondary' as const) : ('primary' as const), onPress: health.openSettings },
        { label: 'Cancel', style: 'secondary', value: false },
      ],
    });
  };

  return (
    <Screen
      title="Wearables"
      right={
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
      }
      onRefresh={() => sources.refetch()}
    >
      <Txt muted>
        BeatMySteps counts the steps saved in {health.name}. A watch, band or ring adds its steps there through its own
        app, and they show up here automatically.
      </Txt>

      {sources.error instanceof HealthPermissionError ? (
        <HealthNotice error={sources.error} />
      ) : (
        <Card style={{ gap: spacing.md }}>
          <View>
            <Txt variant="heading">Sending steps now</Txt>
            <Txt variant="caption" muted>Last {SOURCE_DAYS} days</Txt>
          </View>
          {sources.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : sources.error ? (
            <Txt muted>Couldn&apos;t read sources from {health.name}. Pull down to try again.</Txt>
          ) : connected.length === 0 ? (
            <Txt muted>Nothing yet. Walk a little or connect a device below.</Txt>
          ) : (
            connected.map((s, i) => <SourceRow key={s.id} source={s} index={i} />)
          )}
          {!sources.isLoading && !sources.error && !hasWearable && (
            <View style={[styles.tip, { backgroundColor: colors.cardAlt }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
              <Txt variant="caption" muted style={{ flex: 1 }}>
                No watch or band is sending steps yet. Pick yours below to connect it.
              </Txt>
            </View>
          )}
        </Card>
      )}

      <Card style={styles.list}>
        <Txt variant="heading" style={styles.listTitle}>Connect a device</Txt>
        {wearables.map((w, i) => (
          <View key={w.name}>
            {i > 0 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
            <Pressable style={styles.device} onPress={() => setUp(w)} accessibilityLabel={`Connect ${w.name}`}>
              <View style={[styles.deviceIcon, { backgroundColor: colors.primary + '1A' }]}>
                <Ionicons name="watch-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="700">{w.name}</Txt>
                <Txt variant="caption" muted>via {w.app}</Txt>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}
      </Card>

      {Platform.OS !== 'web' && (
        <Button title={`Open ${health.name}`} variant="secondary" icon="heart-outline" onPress={health.openSettings} />
      )}
    </Screen>
  );
}

function SourceRow({ source, index }: { source: StepSource; index: number }) {
  const { colors } = useTheme();
  const wearable = isWearableSource(source.id, source.name);
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)} style={styles.source}>
      <View style={[styles.deviceIcon, { backgroundColor: (wearable ? colors.secondary : colors.textMuted) + '22' }]}>
        <Ionicons
          name={wearable ? 'watch-outline' : source.id === 'android' ? 'phone-portrait-outline' : 'apps-outline'}
          size={20}
          color={wearable ? colors.secondary : colors.textMuted}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Txt weight="700" numberOfLines={1}>{source.name}</Txt>
        <Txt variant="caption" muted>{formatSteps(source.steps)} steps</Txt>
      </View>
      <Ionicons name="checkmark-circle" size={22} color={colors.secondary} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  source: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  list: { paddingVertical: spacing.sm },
  listTitle: { paddingTop: spacing.sm, paddingBottom: spacing.xs },
  device: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  deviceIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 40 + spacing.md },
});
