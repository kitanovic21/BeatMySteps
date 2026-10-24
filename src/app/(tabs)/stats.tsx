import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BarChart, type Bar } from '@/components/BarChart';
import { Card } from '@/components/Card';
import { DaySheet } from '@/components/DaySheet';
import { HealthNotice } from '@/components/HealthNotice';
import { NavButton } from '@/components/NavButton';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StatCard, StatRow } from '@/components/StatCard';
import { Txt } from '@/components/Txt';
import { useGoal } from '@/hooks/useProfile';
import { computeStats, stepsOn, useDailySteps } from '@/hooks/useSteps';
import type { DailySteps } from '@/health';
import { spacing, useTheme } from '@/theme';
import {
  eachDay,
  formatRange,
  formatShortDate,
  fromKey,
  isSameDay,
  MONTHS_SHORT,
  periodRange,
  toKey,
  WEEKDAYS_SHORT,
  type Period,
  type Range,
} from '@/utils/dates';
import { formatCompact, formatSteps, stepsToKcal, stepsToKm } from '@/utils/format';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Dan' },
  { value: 'week', label: 'Nedelja' },
  { value: 'month', label: 'Mesec' },
  { value: 'year', label: 'Godina' },
];

function buildBars(period: Period, range: Range, data: DailySteps | undefined): Bar[] {
  const today = new Date();
  if (period === 'year') {
    return MONTHS_SHORT.map((label, m) => {
      let value = 0;
      for (const d of eachDay(new Date(range.start.getFullYear(), m, 1), new Date(range.start.getFullYear(), m + 1, 0))) {
        value += stepsOn(data, d);
      }
      const isNow = today.getFullYear() === range.start.getFullYear() && today.getMonth() === m;
      return { key: String(m), label: label[0], value, highlight: isNow };
    });
  }
  return eachDay(range.start, range.end).map((d, i) => ({
    key: toKey(d),
    label: period === 'week' ? WEEKDAYS_SHORT[i] : d.getDate() === 1 || d.getDate() % 5 === 0 ? String(d.getDate()) : '',
    value: stepsOn(data, d),
    highlight: isSameDay(d, today),
  }));
}

export default function Stats() {
  const { colors } = useTheme();
  const goal = useGoal();
  const [period, setPeriod] = useState<Period>('week');
  const [offset, setOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const range = useMemo(() => periodRange(period, offset), [period, offset]);
  const steps = useDailySteps(range);
  const stats = computeStats(steps.data, range, goal);
  const bars = useMemo(() => buildBars(period, range, steps.data), [period, range, steps.data]);

  const changePeriod = (p: Period) => {
    setPeriod(p);
    setOffset(0);
  };

  return (
    <Screen title="Statistika" onRefresh={() => steps.refetch()}>
      <SegmentedControl options={PERIODS} value={period} onChange={changePeriod} />

      <View style={styles.nav}>
        <NavButton icon="chevron-back" onPress={() => setOffset((o) => o - 1)} />
        <Pressable onPress={() => setOffset(0)} style={{ flex: 1 }}>
          <Txt variant="heading" center>{formatRange(period, range)}</Txt>
          {offset !== 0 && <Txt variant="caption" color={colors.primary} center>Nazad na danas</Txt>}
        </Pressable>
        <NavButton icon="chevron-forward" onPress={() => setOffset((o) => o + 1)} disabled={offset >= 0} />
      </View>

      {steps.error ? (
        <HealthNotice error={steps.error} />
      ) : period === 'day' ? (
        <DayView steps={stepsOn(steps.data, range.start)} goal={goal} loading={steps.isLoading} />
      ) : (
        <>
          <StatRow>
            <StatCard icon="footsteps" label="Ukupno koraka" value={formatSteps(stats.total)} hint={`${stepsToKm(stats.total)} km`} />
            <StatCard
              icon="speedometer"
              label="Prosek po danu"
              value={formatSteps(stats.average)}
              hint={`za ${stats.elapsedDays} ${stats.elapsedDays === 1 ? 'dan' : 'dana'}`}
              tint={colors.secondary}
            />
          </StatRow>
          <StatRow>
            <StatCard
              icon="trophy"
              label="Najbolji dan"
              value={stats.best ? formatSteps(stats.best.steps) : '—'}
              hint={stats.best ? formatShortDate(fromKey(stats.best.key)) : undefined}
              tint={colors.gold}
            />
            <StatCard
              icon="checkmark-circle"
              label="Dana sa ciljem"
              value={`${stats.daysAtGoal}/${stats.elapsedDays}`}
              hint={stats.elapsedDays ? `${Math.round((stats.daysAtGoal / stats.elapsedDays) * 100)}%` : undefined}
              tint="#8B5CF6"
            />
          </StatRow>

          <Card style={{ gap: spacing.lg }}>
            <View>
              <Txt variant="heading">{period === 'year' ? 'Po mesecima' : 'Po danima'}</Txt>
              <Txt variant="caption" muted>
                {period === 'year' ? 'Ukupno koraka u mesecu' : `Isprekidana linija = cilj ${formatCompact(goal)}`}
              </Txt>
            </View>
            {steps.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ height: 180 }} />
            ) : (
              <BarChart
                data={bars}
                height={180}
                goal={period === 'year' ? undefined : goal}
                onPressBar={period === 'year' ? undefined : (b) => setSelectedDay(fromKey(b.key))}
              />
            )}
          </Card>
        </>
      )}

      <DaySheet
        day={selectedDay}
        steps={selectedDay ? stepsOn(steps.data, selectedDay) : 0}
        goal={goal}
        onClose={() => setSelectedDay(null)}
      />
    </Screen>
  );
}

function DayView({ steps, goal, loading }: { steps: number; goal: number; loading: boolean }) {
  const { colors } = useTheme();
  return (
    <>
      <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
        <ProgressRing progress={steps / goal} size={220} stroke={20}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Txt variant="display" style={{ fontSize: 38 }}>{formatSteps(steps)}</Txt>
          )}
          <Txt variant="label" muted>{Math.round((steps / goal) * 100)}% cilja</Txt>
        </ProgressRing>
      </Card>
      <StatRow>
        <StatCard icon="navigate" label="Distanca" value={`${stepsToKm(steps)} km`} tint={colors.secondary} />
        <StatCard icon="flame" label="Kalorije" value={stepsToKcal(steps)} hint="kcal" tint="#F97316" />
        <StatCard icon="flag" label="Cilj" value={formatCompact(goal)} hint={steps >= goal ? 'Ostvaren ✓' : `Fali ${formatSteps(goal - steps)}`} />
      </StatRow>
    </>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
