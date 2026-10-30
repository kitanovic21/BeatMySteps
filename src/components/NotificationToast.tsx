import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeOutUp, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IncomingNotification } from '@/hooks/useNotifications';
import { radius, spacing, useTheme } from '@/theme';
import { Avatar } from './Avatar';
import { Txt } from './Txt';

export function notificationText(type: IncomingNotification['type']) {
  return type === 'friend_request' ? 'sent you a friend request' : 'accepted your friend request';
}

interface Props {
  notification: IncomingNotification | null;
  onPress: () => void;
  onDismiss: () => void;
}

/** A banner that slides in from the top when a notification arrives while the app is open. */
export function NotificationToast({ notification, onPress, onDismiss }: Props) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  if (!notification) return null;

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(18)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.wrap, { top: insets.top + spacing.sm }]}
    >
      <Pressable
        onPress={onPress}
        style={[
          styles.toast,
          { backgroundColor: colors.card, borderColor: colors.border },
          !dark && styles.shadow,
        ]}
      >
        <Avatar name={notification.actor.display_name} url={notification.actor.avatar_url} size={40} />
        <View style={{ flex: 1 }}>
          <Txt weight="700" numberOfLines={1}>{notification.actor.display_name}</Txt>
          <Txt variant="caption" muted numberOfLines={1}>{notificationText(notification.type)}</Txt>
        </View>
        <Pressable onPress={onDismiss} hitSlop={10}>
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shadow: {
    shadowColor: '#0B1220',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
