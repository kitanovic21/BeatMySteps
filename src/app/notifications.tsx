import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { notificationText } from '@/components/NotificationToast';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useAcceptFriend, useRemoveFriendship } from '@/hooks/useFriends';
import { useMarkNotificationsRead, useNotifications } from '@/hooks/useNotifications';
import type { AppNotification } from '@/lib/supabase';
import { radius, spacing, useTheme } from '@/theme';
import { formatTimeAgo } from '@/utils/dates';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const notifications = useNotifications();
  const markRead = useMarkNotificationsRead();
  const marked = useRef(false);

  // Opening the inbox counts as reading everything in it.
  useEffect(() => {
    if (marked.current || !notifications.unread) return;
    marked.current = true;
    markRead.mutate();
  }, [notifications.unread, markRead]);

  const items = notifications.data ?? [];

  return (
    <Screen
      title="Notifications"
      right={
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
      }
      onRefresh={() => notifications.refetch()}
    >
      {notifications.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '1A' }]}>
              <Ionicons name="notifications-outline" size={28} color={colors.primary} />
            </View>
            <Txt variant="heading" center>You&apos;re all caught up</Txt>
            <Txt muted center>Friend requests and accepted invites will show up here.</Txt>
          </Card>
        </Animated.View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {items.map((n, i) => (
            <Animated.View
              key={n.id}
              entering={FadeInDown.delay(i * 40).duration(300)}
              exiting={FadeOut.duration(200)}
              layout={LinearTransition.springify()}
            >
              <NotificationRow notification={n} />
            </Animated.View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function NotificationRow({ notification: n }: { notification: AppNotification }) {
  const { colors } = useTheme();
  const accept = useAcceptFriend();
  const decline = useRemoveFriendship();
  const pendingRequest = n.type === 'friend_request' && n.friendship?.status === 'pending' && n.friendship_id != null;
  const unread = !n.read_at;

  return (
    <Card style={[styles.row, unread && { borderColor: colors.primary + '66', backgroundColor: colors.primary + '0D' }]}>
      <View>
        <Avatar name={n.actor.display_name} url={n.actor.avatar_url} size={46} />
        <View style={[styles.typeIcon, { backgroundColor: n.type === 'friend_request' ? colors.secondary : colors.primary, borderColor: colors.card }]}>
          <Ionicons name={n.type === 'friend_request' ? 'person-add' : 'checkmark'} size={11} color={colors.white} />
        </View>
      </View>
      <View style={{ flex: 1, gap: spacing.sm }}>
        <Txt>
          <Txt weight="700">{n.actor.display_name}</Txt> {notificationText(n.type)}
        </Txt>
        <Txt variant="caption" muted>{formatTimeAgo(n.created_at)}</Txt>
        {pendingRequest && (
          <View style={styles.actions}>
            <Button title="Accept" small onPress={() => accept.mutate(n.friendship_id!)} loading={accept.isPending} />
            <Button title="Decline" small variant="secondary" onPress={() => decline.mutate(n.friendship_id!)} loading={decline.isPending} />
          </View>
        )}
      </View>
      {unread && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md },
  typeIcon: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
