import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationToast } from '@/components/NotificationToast';
import { health } from '@/health';
import { useFriendships } from '@/hooks/useFriends';
import { useNotificationsRealtime, type IncomingNotification } from '@/hooks/useNotifications';
import { registerBackgroundSync } from '@/sync/backgroundTask';
import { syncSteps } from '@/sync/syncSteps';
import { useTheme } from '@/theme';

const PERMISSION_ASKED_KEY = 'bms:healthPermissionAsked';

function useHealthSetup() {
  const qc = useQueryClient();

  useEffect(() => {
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ['steps'] });
      syncSteps()
        .then(() => qc.invalidateQueries({ queryKey: ['leaderboard'] }))
        .catch(() => undefined);
    };

    (async () => {
      try {
        if (!(await AsyncStorage.getItem(PERMISSION_ASKED_KEY)) && (await health.isAvailable())) {
          await health.requestPermissions();
          await AsyncStorage.setItem(PERMISSION_ASKED_KEY, '1');
        }
      } catch {
        // Screens show a HealthNotice if access is missing.
      }
      refresh();
      registerBackgroundSync().catch(() => undefined);
    })();

    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [qc]);
}

const TOAST_MS = 4500;

/** Live notification badges plus a banner for anything that arrives while the app is open. */
function useNotificationToast() {
  const [toast, setToast] = useState<IncomingNotification | null>(null);

  useNotificationsRealtime((n) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setToast(n);
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  return { toast, dismiss: () => setToast(null) };
}

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, color }: { name: IconName; color: ColorValue }) {
  return <Ionicons name={name} size={24} color={color as string} />;
}

const icon =
  (active: IconName, inactive: IconName) =>
  // eslint-disable-next-line react/display-name
  ({ color, focused }: { color: ColorValue; focused: boolean }) => <TabIcon name={focused ? active : inactive} color={color} />;

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  useHealthSetup();
  const { toast, dismiss } = useNotificationToast();
  const requests = useFriendships().incoming.length;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          tabBarBadgeStyle: { backgroundColor: colors.danger, color: colors.white, fontSize: 11, fontWeight: '700' },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
          tabBarIconStyle: { height: 24 },
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
            // Room for icon + label above the home indicator / gesture bar.
            height: 66 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom + 8,
          },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('footsteps', 'footsteps-outline') }} />
        <Tabs.Screen name="stats" options={{ title: 'Stats', tabBarIcon: icon('stats-chart', 'stats-chart-outline') }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: icon('calendar', 'calendar-outline') }} />
        <Tabs.Screen
          name="friends"
          options={{
            title: 'Friends',
            tabBarIcon: icon('trophy', 'trophy-outline'),
            tabBarBadge: requests > 0 ? requests : undefined,
          }}
        />
      </Tabs>
      <NotificationToast
        notification={toast}
        onDismiss={dismiss}
        onPress={() => {
          dismiss();
          router.push('/notifications');
        }}
      />
    </View>
  );
}
