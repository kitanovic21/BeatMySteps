import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { Txt } from '@/components/Txt';
import { useProfile, useSetAvatar, useUpdateProfile } from '@/hooks/useProfile';
import { health } from '@/health';
import { authErrorMessage, signOut } from '@/lib/auth';
import { pickAvatarImage } from '@/lib/avatar';
import type { Profile } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useDialog } from '@/providers/DialogProvider';
import { radius, setThemePreference, spacing, useTheme, useThemePreference, type ThemePreference } from '@/theme';
import { formatSteps } from '@/utils/format';

const GOAL_STEP = 500;

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

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
  const setAvatar = useSetAvatar();
  const dialog = useDialog();

  const [name, setName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [goal, setGoal] = useState(profile.daily_goal);

  const dirty = name.trim() !== profile.display_name || username !== profile.username || goal !== profile.daily_goal;

  const save = () => {
    if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
      return dialog.alert('Check your username', 'Use 3–20 characters: lowercase letters, numbers, _ and .', 'warning');
    }
    update.mutate(
      { display_name: name.trim(), username, daily_goal: goal },
      {
        onSuccess: () => router.back(),
        onError: (e) => dialog.alert("Couldn't save changes", authErrorMessage(e), 'error'),
      },
    );
  };

  const chooseNewPhoto = async () => {
    try {
      const image = await pickAvatarImage();
      if (!image) return;
      router.push({
        pathname: '/avatar-crop',
        params: { uri: image.uri, width: String(image.width), height: String(image.height) },
      });
    } catch (e) {
      dialog.alert("Couldn't open photo", authErrorMessage(e), 'error');
    }
  };

  const changePhoto = () => {
    if (!profile.avatar_url) return chooseNewPhoto();
    dialog.show({
      title: 'Profile photo',
      icon: 'image-outline',
      actions: [
        { label: 'Choose new photo', style: 'primary', onPress: chooseNewPhoto },
        {
          label: 'Remove photo',
          style: 'destructive',
          onPress: () =>
            setAvatar.mutate(null, {
              onError: (e) => dialog.alert("Couldn't remove photo", authErrorMessage(e), 'error'),
            }),
        },
        { label: 'Cancel', style: 'secondary', value: false },
      ],
    });
  };

  const logout = async () => {
    const ok = await dialog.confirm({
      title: 'Sign out?',
      message: 'You can sign back in any time. Your steps stay saved.',
      confirmLabel: 'Sign out',
      destructive: true,
      icon: 'log-out-outline',
    });
    if (ok) signOut();
  };

  return (
    <>
      <View style={styles.header}>
        <Pressable onPress={changePhoto} disabled={setAvatar.isPending} accessibilityLabel="Change profile photo">
          <Avatar name={name || '?'} url={profile.avatar_url} size={88} />
          <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            {setAvatar.isPending ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Ionicons name="camera" size={16} color={colors.onPrimary} />
            )}
          </View>
        </Pressable>
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

      {dirty ? (
        <Button title="Save" onPress={save} loading={update.isPending} />
      ) : (
        <Button title="Saved" variant="tonal" onPress={save} disabled />
      )}

      <AppearanceCard />

      {/* Account actions sit apart from Save so Sign out is never tapped by mistake. */}
      <Card style={styles.list}>
        <Pressable style={styles.link} onPress={() => router.push('/wearables')}>
          <Ionicons name="watch-outline" size={22} color={colors.primary} />
          <Txt style={{ flex: 1 }}>Connect a wearable</Txt>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        {Platform.OS !== 'web' && (
          <>
            <Pressable style={styles.link} onPress={() => health.openSettings()}>
              <Ionicons name="heart-outline" size={22} color={colors.danger} />
              <Txt style={{ flex: 1 }}>{health.name} permissions</Txt>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          </>
        )}
        <Pressable style={styles.link} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Txt weight="600" color={colors.danger} style={{ flex: 1 }}>Sign out</Txt>
        </Pressable>
      </Card>
    </>
  );
}

/** Applies right away and is remembered on this device; it doesn't wait for Save. */
function AppearanceCard() {
  const preference = useThemePreference();
  return (
    <Card style={{ gap: spacing.md, marginTop: spacing.xl }}>
      <Txt variant="label" muted>APPEARANCE</Txt>
      <SegmentedControl options={THEME_OPTIONS} value={preference} onChange={setThemePreference} />
      <Txt variant="caption" muted>
        {preference === 'system' ? 'Matches your phone’s light or dark mode.' : 'Always uses this theme, whatever your phone is set to.'}
      </Txt>
    </Card>
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
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalBtn: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  list: { paddingVertical: spacing.xs },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 22 + spacing.md },
});
