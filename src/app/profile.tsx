import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { Txt } from '@/components/Txt';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { health } from '@/health';
import { authErrorMessage, signOut } from '@/lib/auth';
import type { Profile } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { radius, spacing, useTheme } from '@/theme';
import { formatSteps } from '@/utils/format';

const GOAL_STEP = 500;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const profile = useProfile();

  return (
    <Screen
      title="Profile"
      right={
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
      }
    >
      {profile.data ? <ProfileForm profile={profile.data} /> : <ActivityIndicator color={colors.primary} />}
    </Screen>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const update = useUpdateProfile();

  const [name, setName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [goal, setGoal] = useState(profile.daily_goal);

  const dirty = name.trim() !== profile.display_name || username !== profile.username || goal !== profile.daily_goal;

  const save = () => {
    if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
      return Alert.alert('Username', '3–20 characters: lowercase letters, numbers, _ and .');
    }
    update.mutate(
      { display_name: name.trim(), username, daily_goal: goal },
      {
        onSuccess: () => router.back(),
        onError: (e) => Alert.alert("Couldn't save changes", authErrorMessage(e)),
      },
    );
  };

  const logout = () =>
    Alert.alert('Sign out', 'Do you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <>
      <View style={styles.header}>
        <Avatar name={name || '?'} url={profile.avatar_url} size={88} />
        <Txt variant="heading">{name}</Txt>
        <Txt muted>{session?.user.email}</Txt>
      </View>

      <Card style={{ gap: spacing.md }}>
        <Txt variant="label" muted>NAME</Txt>
        <TextField icon="person-outline" value={name} onChangeText={setName} autoCapitalize="words" />
        <Txt variant="label" muted>USERNAME</Txt>
        <TextField icon="at" value={username} onChangeText={(t) => setUsername(t.toLowerCase())} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Txt variant="label" muted>DAILY GOAL</Txt>
        <View style={styles.goalRow}>
          <GoalButton icon="remove" onPress={() => setGoal((g) => Math.max(1000, g - GOAL_STEP))} />
          <View style={{ alignItems: 'center' }}>
            <Txt variant="title" style={{ fontVariant: ['tabular-nums'] }}>{formatSteps(goal)}</Txt>
            <Txt variant="caption" muted>steps per day</Txt>
          </View>
          <GoalButton icon="add" onPress={() => setGoal((g) => Math.min(100_000, g + GOAL_STEP))} />
        </View>
      </Card>

      <Button title="Save" onPress={save} loading={update.isPending} disabled={!dirty} />

      {Platform.OS !== 'web' && (
        <Card style={{ gap: spacing.sm }}>
          <Pressable style={styles.link} onPress={() => health.openSettings()}>
            <Ionicons name="heart-outline" size={22} color={colors.danger} />
            <Txt style={{ flex: 1 }}>{health.name} permissions</Txt>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </Card>
      )}

      <Button title="Sign out" variant="danger" icon="log-out-outline" onPress={logout} />
    </>
  );
}

function GoalButton({ icon, onPress }: { icon: 'add' | 'remove'; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.goalBtn, { backgroundColor: colors.primary + '1F' }]}>
      <Ionicons name={icon} size={24} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.xs },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalBtn: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
});
