import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import type { LeaderboardEntry } from '@/lib/supabase';
import { radius, spacing, useTheme } from '@/theme';
import { formatSteps } from '@/utils/format';
import { Avatar } from './Avatar';
import { Txt } from './Txt';

export function LeaderboardRow({ entry, rank, leader }: { entry: LeaderboardEntry; rank: number; leader: number }) {
  const { colors } = useTheme();
  const medal = rank === 1 ? colors.gold : rank === 2 ? colors.silver : rank === 3 ? colors.bronze : null;
  const pct = leader > 0 ? entry.steps / leader : 0;

  return (
    <View
      style={[
        styles.row,
        entry.is_me && { backgroundColor: colors.primary + '14', borderColor: colors.primary + '55' },
        !entry.is_me && { borderColor: 'transparent' },
      ]}
    >
      <View style={styles.rank}>
        {medal ? <Ionicons name="medal" size={22} color={medal} /> : <Txt variant="label" muted>{rank}</Txt>}
      </View>
      <Avatar name={entry.display_name} url={entry.avatar_url} size={40} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Txt variant="body" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>
            {entry.display_name}
          </Txt>
          {entry.is_me && (
            <View style={[styles.meBadge, { backgroundColor: colors.primary }]}>
              <Txt variant="caption" color="#fff" weight="800" style={{ fontSize: 10 }}>YOU</Txt>
            </View>
          )}
        </View>
        <View style={[styles.track, { backgroundColor: colors.track }]}>
          <View style={[styles.fill, { width: `${Math.max(pct * 100, 2)}%`, backgroundColor: medal ?? colors.primary }]} />
        </View>
      </View>
      <Txt variant="body" weight="800" style={styles.steps}>
        {formatSteps(entry.steps)}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rank: { width: 26, alignItems: 'center' },
  body: { flex: 1, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  steps: { fontVariant: ['tabular-nums'] },
});
