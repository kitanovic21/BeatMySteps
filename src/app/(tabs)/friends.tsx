import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LeaderboardRow } from '@/components/LeaderboardRow';
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
import type { PublicProfile } from '@/lib/supabase';
import { radius, spacing, useTheme } from '@/theme';

type BoardPeriod = 'day' | 'week' | 'month';
const BOARD_PERIODS: { value: BoardPeriod; label: string }[] = [
  { value: 'day', label: 'Danas' },
  { value: 'week', label: 'Nedelja' },
  { value: 'month', label: 'Mesec' },
];

const RESULT_TEXT: Record<FriendRequestResult, string> = {
  sent: 'Zahtev je poslat!',
  accepted: 'Sada ste prijatelji! 🎉',
  already_friends: 'Već ste prijatelji.',
  already_sent: 'Zahtev je već poslat.',
};

function errorText(e: unknown) {
  const msg = (e as { message?: string })?.message ?? '';
  if (msg.includes('user_not_found')) return 'Korisnik nije pronađen.';
  if (msg.includes('cannot_add_self')) return 'Ne možeš dodati sebe 🙂';
  return msg || 'Nešto nije u redu.';
}

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
      onError: (e) => Alert.alert('Greška', errorText(e)),
    });

  const confirmRemove = (id: number, name: string) =>
    Alert.alert('Ukloni prijatelja', `Da li želiš da ukloniš ${name}?`, [
      { text: 'Otkaži', style: 'cancel' },
      { text: 'Ukloni', style: 'destructive', onPress: () => remove.mutate(id) },
    ]);

  const invite = () =>
    Share.share({
      message: `Takmičimo se u koracima na BeatMySteps! Dodaj me: @${profile.data?.username ?? ''}`,
    });

  return (
    <Screen
      title="Prijatelji"
      right={
        <Pressable onPress={invite} hitSlop={8} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="share-outline" size={20} color={colors.text} />
        </Pressable>
      }
      onRefresh={() => Promise.all([board.refetch(), friendships.refetch()])}
    >
      {/* Leaderboard */}
      <Card style={{ gap: spacing.md }}>
        <View style={styles.rowBetween}>
          <Txt variant="heading">🏆 Rang lista</Txt>
          {board.isFetching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
        <SegmentedControl options={BOARD_PERIODS} value={period} onChange={setPeriod} />
        {entries.length > 1 && <Podium entries={entries.slice(0, 3)} />}
        <View style={{ gap: 4 }}>
          {entries.map((e, i) => (
            <LeaderboardRow key={e.user_id} entry={e} rank={i + 1} leader={entries[0].steps} />
          ))}
        </View>
        {!board.isLoading && entries.length <= 1 && (
          <Txt muted center>Još nemaš prijatelje. Pronađi ih ispod po imenu ili korisničkom imenu.</Txt>
        )}
      </Card>

      {/* Incoming requests */}
      {friendships.incoming.length > 0 && (
        <Card style={{ gap: spacing.md }}>
          <Txt variant="heading">Zahtevi ({friendships.incoming.length})</Txt>
          {friendships.incoming.map(({ friendship, profile: p }) => (
            <PersonRow key={friendship.id} profile={p}>
              <Button title="Prihvati" small onPress={() => accept.mutate(friendship.id)} />
              <Pressable onPress={() => remove.mutate(friendship.id)} hitSlop={8}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </Pressable>
            </PersonRow>
          ))}
        </Card>
      )}

      {/* Add friends */}
      <Card style={{ gap: spacing.md }}>
        <Txt variant="heading">Dodaj prijatelja</Txt>
        <TextField icon="search" placeholder="Pretraži ime ili @korisničko ime" value={search} onChangeText={setSearch} />
        {results.isFetching && <ActivityIndicator color={colors.primary} />}
        {search.trim().length >= 2 && results.data?.length === 0 && <Txt muted center>Nema rezultata.</Txt>}
        {results.data?.map((p) => (
          <PersonRow key={p.id} profile={p}>
            {knownIds.has(p.id) ? (
              <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
            ) : (
              <Button title="Dodaj" icon="person-add" small variant="secondary" loading={send.isPending && send.variables === p.username} onPress={() => add(p)} />
            )}
          </PersonRow>
        ))}
        {profile.data && (
          <Txt variant="caption" muted center>
            Tvoje korisničko ime: <Txt variant="caption" weight="800" color={colors.primary}>@{profile.data.username}</Txt>
          </Txt>
        )}
      </Card>

      {/* Friends & pending */}
      {(friendships.friends.length > 0 || friendships.outgoing.length > 0) && (
        <Card style={{ gap: spacing.md }}>
          <Txt variant="heading">Moji prijatelji ({friendships.friends.length})</Txt>
          {friendships.friends.map(({ friendship, profile: p }) => (
            <PersonRow key={friendship.id} profile={p}>
              <Pressable onPress={() => confirmRemove(friendship.id, p.display_name)} hitSlop={8}>
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.textMuted} />
              </Pressable>
            </PersonRow>
          ))}
          {friendships.outgoing.map(({ friendship, profile: p }) => (
            <PersonRow key={friendship.id} profile={p} note="Čeka potvrdu">
              <Button title="Otkaži" small variant="ghost" onPress={() => remove.mutate(friendship.id)} />
            </PersonRow>
          ))}
        </Card>
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

function Podium({ entries }: { entries: { user_id: string; display_name: string; avatar_url: string | null; steps: number }[] }) {
  const { colors } = useTheme();
  // Visual order: 2nd, 1st, 3rd
  const order = [entries[1], entries[0], entries[2]];
  const heights = [70, 96, 54];
  const medals = [colors.silver, colors.gold, colors.bronze];
  const places = [2, 1, 3];

  return (
    <View style={styles.podium}>
      {order.map((e, i) =>
        e ? (
          <View key={e.user_id} style={styles.podiumCol}>
            <Avatar name={e.display_name} url={e.avatar_url} size={i === 1 ? 56 : 46} />
            <Txt variant="caption" weight="700" numberOfLines={1} style={{ maxWidth: 90 }}>
              {e.display_name.split(' ')[0]}
            </Txt>
            <View style={[styles.podiumBlock, { height: heights[i], backgroundColor: medals[i] + '30', borderColor: medals[i] }]}>
              <Txt variant="title" color={medals[i]}>{places[i]}</Txt>
            </View>
          </View>
        ) : (
          <View key={i} style={styles.podiumCol} />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing.md, paddingTop: spacing.sm },
  podiumCol: { flex: 1, alignItems: 'center', gap: 6 },
  podiumBlock: {
    width: '100%',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderTopWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
