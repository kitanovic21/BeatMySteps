import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LeaderboardRow } from '@/components/LeaderboardRow';
import { HeaderActions, NotificationBell } from '@/components/NotificationBell';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { Txt } from '@/components/Txt';
import {
  useAcceptFriend,
  useFriendships,
  useLeaderboard,
  useRemoveFriendship,
  useSearchUsers,
  useSendFriendRequest,
  type FriendRequestResult,
} from '@/hooks/useFriends';
import { useProfile } from '@/hooks/useProfile';
import type { LeaderboardEntry, PublicProfile } from '@/lib/supabase';
import { radius, spacing, useTheme } from '@/theme';

type BoardPeriod = 'day' | 'week' | 'month';
const BOARD_PERIODS: { value: BoardPeriod; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const RESULT_TEXT: Record<FriendRequestResult, string> = {
  sent: 'Friend request sent!',
  accepted: "You're now friends! 🎉",
  already_friends: "You're already friends.",
  already_sent: 'Request already sent.',
};

function errorText(e: unknown) {
  const msg = (e as { message?: string })?.message ?? '';
  if (msg.includes('user_not_found')) return 'User not found.';
  if (msg.includes('cannot_add_self')) return "You can't add yourself 🙂";
  return msg || 'Something went wrong. Please try again.';
}

// Shared row animations: fade in staggered, slide neighbours smoothly when a row leaves.
const rowEntering = (i: number) => FadeInDown.delay(i * 50).duration(300);
const rowExiting = FadeOut.duration(180);
const rowLayout = LinearTransition.springify().damping(18);

export default function Friends() {
  const { colors } = useTheme();
  const [period, setPeriod] = useState<BoardPeriod>('day');
  const [search, setSearch] = useState('');
  const board = useLeaderboard(period);
  const friendships = useFriendships();
  const profile = useProfile();
  const results = useSearchUsers(search);
  const send = useSendFriendRequest();
  const accept = useAcceptFriend();
  const remove = useRemoveFriendship();

  const entries = board.data ?? [];
  const knownIds = new Set(
    [...friendships.friends, ...friendships.incoming, ...friendships.outgoing].map((f) => f.profile.id),
  );

  const add = (p: PublicProfile) =>
    send.mutate(p.username, {
      onSuccess: (r) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        Alert.alert(RESULT_TEXT[r]);
        setSearch('');
      },
      onError: (e) => Alert.alert("Couldn't send request", errorText(e)),
    });

  const confirmRemove = (id: number, name: string) =>
    Alert.alert('Remove friend', `Remove ${name} from your friends?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(id) },
    ]);

  const invite = () =>
    Share.share({
      message: `Let's compete on steps in BeatMySteps! Add me: @${profile.data?.username ?? ''}`,
    });

  return (
    <Screen
      title="Friends"
      right={
        <HeaderActions>
          <Pressable
            onPress={invite}
            hitSlop={8}
            accessibilityLabel="Invite friends"
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </Pressable>
          <NotificationBell />
        </HeaderActions>
      }
      onRefresh={() => Promise.all([board.refetch(), friendships.refetch()])}
    >
      {/* Leaderboard */}
      <Card style={{ gap: spacing.md }}>
        <View style={styles.rowBetween}>
          <Txt variant="heading">🏆 Leaderboard</Txt>
          {board.isFetching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
        <SegmentedControl options={BOARD_PERIODS} value={period} onChange={setPeriod} />
        {/* Keyed by period so the board replays its entrance when the period changes. */}
        <View key={period} style={{ gap: spacing.md }}>
          {entries.length > 1 && <Podium entries={entries.slice(0, 3)} />}
          <View style={{ gap: 4 }}>
            {entries.map((e, i) => (
              <Animated.View key={e.user_id} entering={rowEntering(i)} layout={rowLayout}>
                <LeaderboardRow entry={e} rank={i + 1} leader={entries[0].steps} />
              </Animated.View>
            ))}
          </View>
        </View>
        {!board.isLoading && entries.length <= 1 && (
          <Txt muted center>No friends yet. Find them below by name or username.</Txt>
        )}
      </Card>

      {/* Incoming requests */}
      {friendships.incoming.length > 0 && (
        <Animated.View entering={FadeInDown.duration(300)} exiting={rowExiting} layout={rowLayout}>
          <Card style={{ gap: spacing.md }}>
            <Txt variant="heading">Friend requests ({friendships.incoming.length})</Txt>
            {friendships.incoming.map(({ friendship, profile: p }, i) => (
              <Animated.View key={friendship.id} entering={rowEntering(i)} exiting={rowExiting} layout={rowLayout}>
                <PersonRow profile={p}>
                  <Button title="Accept" small onPress={() => accept.mutate(friendship.id)} />
                  <Pressable onPress={() => remove.mutate(friendship.id)} hitSlop={8} accessibilityLabel="Decline">
                    <Ionicons name="close-circle" size={28} color={colors.textMuted} />
                  </Pressable>
                </PersonRow>
              </Animated.View>
            ))}
          </Card>
        </Animated.View>
      )}

      {/* Add friends */}
      <Animated.View layout={rowLayout}>
        <Card style={{ gap: spacing.md }}>
          <Txt variant="heading">Add a friend</Txt>
          <TextField icon="search" placeholder="Search by name or @username" value={search} onChangeText={setSearch} />
          {results.isFetching && <ActivityIndicator color={colors.primary} />}
          {search.trim().length >= 2 && results.data?.length === 0 && <Txt muted center>No users found.</Txt>}
          {results.data?.map((p, i) => (
            <Animated.View key={p.id} entering={rowEntering(i)} exiting={rowExiting} layout={rowLayout}>
              <PersonRow profile={p}>
                {knownIds.has(p.id) ? (
                  <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
                ) : (
                  <Button
                    title="Add"
                    icon="person-add"
                    small
                    variant="secondary"
                    loading={send.isPending && send.variables === p.username}
                    onPress={() => add(p)}
                  />
                )}
              </PersonRow>
            </Animated.View>
          ))}
          {profile.data && (
            <Txt variant="caption" muted center>
              Your username: <Txt variant="caption" weight="800" color={colors.primary}>@{profile.data.username}</Txt>
            </Txt>
          )}
        </Card>
      </Animated.View>

      {/* Friends & pending */}
      {(friendships.friends.length > 0 || friendships.outgoing.length > 0) && (
        <Animated.View entering={FadeIn.duration(300)} layout={rowLayout}>
          <Card style={{ gap: spacing.md }}>
            <Txt variant="heading">My friends ({friendships.friends.length})</Txt>
            {friendships.friends.map(({ friendship, profile: p }, i) => (
              <Animated.View key={friendship.id} entering={rowEntering(i)} exiting={rowExiting} layout={rowLayout}>
                <PersonRow profile={p}>
                  <Pressable
                    onPress={() => confirmRemove(friendship.id, p.display_name)}
                    hitSlop={8}
                    accessibilityLabel={`Options for ${p.display_name}`}
                  >
                    <Ionicons name="ellipsis-horizontal" size={22} color={colors.textMuted} />
                  </Pressable>
                </PersonRow>
              </Animated.View>
            ))}
            {friendships.outgoing.map(({ friendship, profile: p }, i) => (
              <Animated.View key={friendship.id} entering={rowEntering(i)} exiting={rowExiting} layout={rowLayout}>
                <PersonRow profile={p} note="Request pending">
                  <Button title="Cancel" small variant="ghost" onPress={() => remove.mutate(friendship.id)} />
                </PersonRow>
              </Animated.View>
            ))}
          </Card>
        </Animated.View>
      )}
    </Screen>
  );
}

function PersonRow({ profile, note, children }: { profile: PublicProfile; note?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.person}>
      <Avatar name={profile.display_name} url={profile.avatar_url} size={42} />
      <View style={{ flex: 1 }}>
        <Txt weight="700" numberOfLines={1}>{profile.display_name}</Txt>
        <Txt variant="caption" muted numberOfLines={1}>{note ?? `@${profile.username}`}</Txt>
      </View>
      {children}
    </View>
  );
}

const PODIUM_HEIGHTS = [70, 96, 54];

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const { colors } = useTheme();
  // Visual order: 2nd, 1st, 3rd
  const order = [entries[1], entries[0], entries[2]];
  const medals = [colors.silver, colors.gold, colors.bronze];
  const places = [2, 1, 3];
  // Blocks rise in podium order: 3rd, 2nd, then 1st.
  const riseOrder = [1, 2, 0];

  return (
    <View style={styles.podium}>
      {order.map((e, i) =>
        e ? (
          <View key={e.user_id} style={styles.podiumCol}>
            <Animated.View entering={FadeInDown.delay(riseOrder[i] * 120 + 200).duration(300)} style={styles.podiumPerson}>
              <Avatar name={e.display_name} url={e.avatar_url} size={i === 1 ? 56 : 46} />
              <Txt variant="caption" weight="700" numberOfLines={1} style={{ maxWidth: 90 }}>
                {e.display_name.split(' ')[0]}
              </Txt>
            </Animated.View>
            <PodiumBlock height={PODIUM_HEIGHTS[i]} color={medals[i]} place={places[i]} delay={riseOrder[i] * 120} />
          </View>
        ) : (
          <View key={i} style={styles.podiumCol} />
        ),
      )}
    </View>
  );
}

function PodiumBlock({ height, color, place, delay }: { height: number; color: string; place: number; delay: number }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(delay, withTiming(height, { duration: 500, easing: Easing.out(Easing.back(1.4)) }));
  }, [delay, h, height]);
  const style = useAnimatedStyle(() => ({ height: h.value }));

  return (
    <View style={[styles.podiumSlot, { height }]}>
      <Animated.View style={[styles.podiumBlock, { backgroundColor: color + '30', borderColor: color }, style]}>
        <Txt variant="title" color={color}>{place}</Txt>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing.md, paddingTop: spacing.sm },
  podiumCol: { flex: 1, alignItems: 'center', gap: 6 },
  podiumPerson: { alignItems: 'center', gap: 6 },
  podiumSlot: { width: '100%', justifyContent: 'flex-end' },
  podiumBlock: {
    width: '100%',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderTopWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
