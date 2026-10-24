import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { DaySheet } from '@/components/DaySheet';
import { HealthNotice } from '@/components/HealthNotice';
import { NavButton } from '@/components/NavButton';
import { Screen } from '@/components/Screen';
import { StatCard, StatRow } from '@/components/StatCard';
import { Txt } from '@/components/Txt';
import { useGoal } from '@/hooks/useProfile';
import { computeStats, stepsOn, useDailySteps } from '@/hooks/useSteps';
import { radius, spacing, useTheme, type Colors } from '@/theme';
import { eachDay, formatRange, isSameDay, periodRange, startOfDay, toKey, weekdayIndex, WEEKDAYS_LETTER } from '@/utils/dates';
import { formatCompact, formatSteps } from '@/utils/format';

function levelColor(ratio: number, colors: Colors): string {
  if (ratio <= 0) return colors.cardAlt;
  if (ratio < 0.25) return colors.primary + '1A';
  if (ratio < 0.5) return colors.primary + '33';
  if (ratio < 0.75) return colors.primary + '55';
  return colors.primary + '88';
}

export default function CalendarScreen() {
  const { colors } = useTheme();
  const goal = useGoal();
  const [offset, setOffset] = useState(0);
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

  const today = startOfDay(new Date());

  return (
    <Screen title="Kalendar" onRefresh={() => steps.refetch()}>
      <View style={styles.nav}>
        <NavButton icon="chevron-back" onPress={() => setOffset((o) => o - 1)} />
        <Pressable style={{ flex: 1 }} onPress={() => setOffset(0)}>
          <Txt variant="heading" center>{formatRange('month', month)}</Txt>
          {offset !== 0 && <Txt variant="caption" color={colors.primary} center>Ovaj mesec</Txt>}
        </Pressable>
        <NavButton icon="chevron-forward" onPress={() => setOffset((o) => o + 1)} disabled={offset >= 0} />
      </View>

      {steps.error ? (
        <HealthNotice error={steps.error} />
      ) : (
        <Card style={styles.calendar}>
          <View style={styles.week}>
            {WEEKDAYS_LETTER.map((d, i) => (
              <Txt key={i} variant="caption" muted weight="700" style={styles.weekday}>{d}</Txt>
            ))}
          </View>
          {steps.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ height: 300 }} />
          ) : (
            <View style={styles.grid}>
              {cells.map((d, i) => {
                if (!d) return <View key={`empty-${i}`} style={styles.cell} />;
                const value = stepsOn(steps.data, d);
                const future = d > today;
                const reached = value >= goal;
                const isToday = isSameDay(d, today);
                return (
                  <Pressable key={toKey(d)} style={styles.cell} disabled={future} onPress={() => setSelected(d)}>
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.day,
                          { backgroundColor: future ? 'transparent' : levelColor(value / goal, colors) },
                          isToday && { borderColor: colors.primary, borderWidth: 2 },
                          pressed && { transform: [{ scale: 0.94 }] },
                        ]}
                      >
                        {reached && (
                          <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: radius.sm }]} />
                        )}
                        <Txt variant="label" weight="800" color={reached ? '#fff' : future ? colors.textMuted : colors.text} style={{ opacity: future ? 0.5 : 1 }}>
                          {d.getDate()}
                        </Txt>
                        {!future && (
                          <Txt variant="caption" color={reached ? '#ffffffdd' : colors.textMuted} style={styles.cellSteps} numberOfLines={1}>
                            {value > 0 ? formatCompact(value) : '–'}
                          </Txt>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
          <Legend goal={goal} />
        </Card>
      )}

      <StatRow>
        <StatCard icon="footsteps" label="Ukupno u mesecu" value={formatSteps(stats.total)} />
        <StatCard icon="speedometer" label="Prosek po danu" value={formatSteps(stats.average)} tint={colors.secondary} />
      </StatRow>

      <DaySheet day={selected} steps={selected ? stepsOn(steps.data, selected) : 0} goal={goal} onClose={() => setSelected(null)} />
    </Screen>
  );
}

function Legend({ goal }: { goal: number }) {
  const { colors } = useTheme();
  const swatches = [0.1, 0.4, 0.6, 0.9].map((r) => levelColor(r, colors));
  return (
    <View style={styles.legend}>
      <Txt variant="caption" muted>Manje</Txt>
      {swatches.map((c) => (
        <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
      ))}
      <LinearGradient colors={colors.gradient} style={styles.swatch} />
      <Txt variant="caption" muted>Cilj {formatCompact(goal)}</Txt>
    </View>
  );
}


const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  calendar: { paddingHorizontal: spacing.sm, gap: spacing.sm },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 0.82, padding: 2.5 },
  day: {
    flex: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    overflow: 'hidden',
  },
  cellSteps: { fontSize: 10, fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  swatch: { width: 14, height: 14, borderRadius: 4 },
});
