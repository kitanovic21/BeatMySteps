import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { useNotifications } from '@/hooks/useNotifications';
import { radius, useTheme } from '@/theme';
import { Txt } from './Txt';

/** Bell button that opens the inbox, with a badge for unread notifications. */
export function NotificationBell() {
  const { colors } = useTheme();
  const { unread } = useNotifications();

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      hitSlop={8}
      accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Ionicons name={unread ? 'notifications' : 'notifications-outline'} size={21} color={colors.text} />
      {unread > 0 && (
        <Animated.View
          entering={ZoomIn.springify()}
          exiting={ZoomOut}
          style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.background }]}
        >
          <Txt variant="caption" color={colors.white} weight="800" style={styles.badgeText}>
            {unread > 9 ? '9+' : unread}
          </Txt>
        </Animated.View>
      )}
    </Pressable>
  );
}

export function HeaderActions({ children }: { children: React.ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, lineHeight: 13 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
