import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/Appear';
import { Avatar } from '@/components/Avatar';
import { BarChart } from '@/components/BarChart';
import { Card } from '@/components/Card';
import { HealthNotice } from '@/components/HealthNotice';
import { LeaderboardRow } from '@/components/LeaderboardRow';
import { HeaderActions, NotificationBell } from '@/components/NotificationBell';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { StatCard, StatRow } from '@/components/StatCard';
import { Txt } from '@/components/Txt';
import { useLeaderboard } from '@/hooks/useFriends';
import { useProfile } from '@/hooks/useProfile';
import { computeStats, stepsOn, useDailySteps } from '@/hooks/useSteps';
import { spacing, useTheme } from '@/theme';
import { eachDay, formatLongDate, isSameDay, periodRange, toKey, WEEKDAYS_SHORT } from '@/utils/dates';
import { formatSteps, stepsToKcal, stepsToKm, stepsToMinutes } from '@/utils/format';

function useGoalCelebration(steps: number, goal: number) {
  useEffect(() => {
    if (steps < goal) return;
    const key = `bms:celebrated:${toKey(new Date())}`;
    AsyncStorage.getItem(key).then((v) => {
      if (v) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      AsyncStorage.setItem(key, '1');
    });
  }, [steps, goal]);
}

function greeting(now: Date) {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Today() {
  const { colors } = useTheme();
  const profile = useProfile();
  const goal = profile.data?.daily_goal ?? 10_000;
  const week = useMemo(() => periodRange('week'), []);
  const steps = useDailySteps(week);
  const leaderboard = useLeaderboard('day');

  const today = new Date();
  const todaySteps = stepsOn(steps.data, today);
  const weekStats = computeStats(steps.data, week, goal);
  const progress = todaySteps / goal;
  const remaining = Math.max(goal - todaySteps, 0);
  useGoalCelebration(todaySteps, goal);

  const bars = eachDay(week.start, week.end).map((d, i) => ({
    key: toKey(d),
    label: WEEKDAYS_SHORT[i],
    value: stepsOn(steps.data, d),
    highlight: isSameDay(d, today),
  }));

  const board = leaderboard.data ?? [];
  const myRank = board.findIndex((e) => e.is_me) + 1;
  const firstName = profile.data?.display_name.split(' ')[0] ?? '';

  return (
    <Screen
      subtitle={formatLongDate(today)}
      title={firstName ? `${greeting(today)}, ${firstName}` : greeting(today)}
      right={
        <HeaderActions>
          <NotificationBell />
          <Pressable onPress={() => router.push('/profile')} hitSlop={8} accessibilityLabel="Profile">
            <Avatar name={profile.data?.display_name ?? '?'} url={profile.data?.avatar_url} size={44} />
          </Pressable>
        </HeaderActions>
      }
      onRefresh={() => Promise.all([steps.refetch(), leaderboard.refetch()])}
    >
      <Appear index={0}>
        {steps.error ? (
          <HealthNotice error={steps.error} />
        ) : (
          <Card style={styles.hero}>
            <ProgressRing progress={progress} size={250} stroke={22}>
              <Ionicons name="footsteps" size={26} color={colors.primary} />
              {steps.isLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 14 }} />
              ) : (
                <Txt variant="display">{formatSteps(todaySteps)}</Txt>
              )}
              <Txt muted variant="label">of {formatSteps(goal)} steps</Txt>
            </ProgressRing>
            <View style={[styles.pill, { backgroundColor: (progress >= 1 ? colors.primary : colors.secondary) + '1F' }]}>
              <Txt variant="label" weight="700" color={progress >= 1 ? colors.primary : colors.secondary}>
                {progress >= 1
                  ? '🎉 Daily goal reached!'
                  : `${formatSteps(remaining)} steps to go · ${Math.round(progress * 100)}%`}
              </Txt>
            </View>
          </Card>
        )}
      </Appear>

      <Appear index={1}>
        <StatRow>
          <StatCard icon="navigate" label="Distance" value={`${stepsToKm(todaySteps)} km`} tint={colors.secondary} />
          <StatCard icon="flame" label="Calories" value={stepsToKcal(todaySteps)} hint="kcal" tint="#F97316" />
          <StatCard icon="time" label="Active" value={stepsToMinutes(todaySteps)} hint="min" tint="#8B5CF6" />
        </StatRow>
      </Appear>

      <Appear index={2}>
        <Card style={{ gap: spacing.lg }}>
          <View style={styles.cardHeader}>
            <View>
              <Txt variant="heading">This week</Txt>
              <Txt variant="caption" muted>
                {formatSteps(weekStats.total)} total · {formatSteps(weekStats.average)}/day average
              </Txt>
            </View>
            <Pressable onPress={() => router.push('/stats')} hitSlop={8} accessibilityLabel="Open stats">
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          <BarChart data={bars} goal={goal} height={130} />
        </Card>
      </Appear>

      <Appear index={3}>
        <Card style={{ gap: spacing.md }}>
          <View style={styles.cardHeader}>
            <View>
              <Txt variant="heading">Today with friends</Txt>
              {myRank > 0 && board.length > 1 && (
                <Txt variant="caption" muted>You&apos;re #{myRank} of {board.length}</Txt>
              )}
            </View>
            <Pressable onPress={() => router.push('/friends')} hitSlop={8}>
              <Txt variant="label" color={colors.primary}>See all</Txt>
            </Pressable>
          </View>
          {leaderboard.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : board.length <= 1 ? (
            <Pressable onPress={() => router.push('/friends')} style={styles.emptyFriends}>
              <Ionicons name="people-outline" size={22} color={colors.primary} />
              <Txt muted style={{ flex: 1 }}>Add friends and see who walks the most each day.</Txt>
            </Pressable>
          ) : (
            <>
              {board.slice(0, 3).map((e, i) => (
                <LeaderboardRow key={e.user_id} entry={e} rank={i + 1} leader={board[0].steps} />
              ))}
              {myRank > 3 && <LeaderboardRow entry={board[myRank - 1]} rank={myRank} leader={board[0].steps} />}
            </>
          )}
        </Card>
      </Appear>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  pill: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 999 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyFriends: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
