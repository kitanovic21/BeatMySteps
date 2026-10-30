import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { Card } from '@/components/Card';
import { cellStyle, DayCell, levelColor } from '@/components/DayCell';
import { DaySheet } from '@/components/DaySheet';
import { HealthNotice } from '@/components/HealthNotice';
import { NavButton } from '@/components/NavButton';
import { PeriodTransition } from '@/components/PeriodTransition';
import { Screen } from '@/components/Screen';
import { StatCard, StatRow } from '@/components/StatCard';
import { Txt } from '@/components/Txt';
import { usePeriodSwipe, type SlideDirection } from '@/hooks/usePeriodSwipe';
import { useGoal } from '@/hooks/useProfile';
import { computeStats, stepsOn, useDailySteps } from '@/hooks/useSteps';
import { spacing, useTheme } from '@/theme';
import { eachDay, formatRange, isSameDay, periodRange, startOfDay, toKey, weekdayIndex, WEEKDAYS_LETTER } from '@/utils/dates';
import { formatCompact, formatSteps } from '@/utils/format';

export default function CalendarScreen() {
  const { colors } = useTheme();
  const goal = useGoal();
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState<SlideDirection>('switch');
  const [selected, setSelected] = useState<Date | null>(null);

  const month = useMemo(() => periodRange('month', offset), [offset]);
  const steps = useDailySteps(month);
  const stats = computeStats(steps.data, month, goal);

  // Monday-first grid padded to whole weeks.
  const cells = useMemo(() => {
    const lead = weekdayIndex(month.start);
    const days: (Date | null)[] = [...Array(lead).fill(null), ...eachDay(month.start, month.end)];
    while (days.length % 7) days.push(null);
    return days;
  }, [month]);

  // Functional updates: the swipe gesture may hold an older copy of these callbacks.
  const prev = () => {
    setDirection('prev');
    setOffset((o) => o - 1);
  };
  const next = () => {
    setDirection('next');
    setOffset((o) => Math.min(0, o + 1));
  };
  const thisMonth = () => {
    if (offset === 0) return;
    setDirection('next');
    setOffset(0);
  };
  const swipe = usePeriodSwipe(prev, next);

  const today = startOfDay(new Date());

  return (
    <Screen title="Calendar" onRefresh={() => steps.refetch()}>
      <View style={styles.nav}>
        <NavButton icon="chevron-back" onPress={prev} />
        <Pressable style={{ flex: 1 }} onPress={thisMonth}>
          <PeriodTransition transitionKey={String(offset)} direction={direction}>
            <Txt variant="heading" center>{formatRange('month', month)}</Txt>
          </PeriodTransition>
          {offset !== 0 && <Txt variant="caption" color={colors.primary} center>Back to this month</Txt>}
        </Pressable>
        <NavButton icon="chevron-forward" onPress={next} disabled={offset >= 0} />
      </View>

      {steps.error ? (
        <HealthNotice error={steps.error} />
      ) : (
        <GestureDetector gesture={swipe}>
          <Card style={styles.calendar}>
            <View style={styles.week}>
              {WEEKDAYS_LETTER.map((d, i) => (
                <Txt key={i} variant="caption" muted weight="700" style={styles.weekday}>{d}</Txt>
              ))}
            </View>
            {steps.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ height: 300 }} />
            ) : (
              <PeriodTransition transitionKey={String(offset)} direction={direction} style={styles.grid}>
                {cells.map((d, i) =>
                  d ? (
                    <DayCell
                      key={toKey(d)}
                      date={d}
                      steps={stepsOn(steps.data, d)}
                      goal={goal}
                      index={i}
                      future={d > today}
                      today={isSameDay(d, today)}
                      selected={selected != null && isSameDay(d, selected)}
                      onPress={setSelected}
                    />
                  ) : (
                    <View key={`empty-${i}`} style={cellStyle} />
                  ),
                )}
              </PeriodTransition>
            )}
            <Legend goal={goal} />
          </Card>
        </GestureDetector>
      )}

      <PeriodTransition transitionKey={String(offset)} direction={direction}>
        <StatRow>
          <StatCard icon="footsteps" label="Month total" value={formatSteps(stats.total)} />
          <StatCard icon="speedometer" label="Daily average" value={formatSteps(stats.average)} tint={colors.secondary} />
        </StatRow>
      </PeriodTransition>

      <DaySheet day={selected} steps={selected ? stepsOn(steps.data, selected) : 0} goal={goal} onClose={() => setSelected(null)} />
    </Screen>
  );
}

function Legend({ goal }: { goal: number }) {
  const { colors } = useTheme();
  const swatches = [0.1, 0.4, 0.6, 0.9].map((r) => levelColor(r, colors));
  return (
    <View style={styles.legend}>
      <Txt variant="caption" muted>Less</Txt>
      {swatches.map((c) => (
        <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
      ))}
      <LinearGradient colors={colors.gradient} style={styles.swatch} />
      <Txt variant="caption" muted>Goal {formatCompact(goal)}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  calendar: { paddingHorizontal: spacing.sm, gap: spacing.sm },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  swatch: { width: 14, height: 14, borderRadius: 4 },
});
