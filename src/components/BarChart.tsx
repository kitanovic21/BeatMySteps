import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { radius, useTheme } from '@/theme';
import { formatCompact } from '@/utils/format';
import { Txt } from './Txt';

export interface Bar {
  key: string;
  label: string;
  value: number;
  highlight?: boolean;
}

interface Props {
  data: Bar[];
  height?: number;
  /** Draws a dashed reference line (e.g. daily goal) */
  goal?: number;
  onPressBar?: (bar: Bar) => void;
  /** Show only every n-th label (for dense charts) */
  labelEvery?: number;
}

export function BarChart({ data, height = 160, goal, onPressBar, labelEvery = 1 }: Props) {
  const { colors } = useTheme();
  const max = Math.max(goal ?? 0, ...data.map((d) => d.value), 1) * 1.1;
  const gap = data.length > 14 ? 2 : data.length > 7 ? 4 : 8;

  return (
    <View>
      <View style={[styles.plot, { height, gap }]}>
        {goal != null && goal > 0 && (
          <View style={[styles.goalLine, { bottom: (goal / max) * height, borderColor: colors.textMuted }]}>
            <Txt variant="caption" muted style={styles.goalLabel}>
              {formatCompact(goal)}
            </Txt>
          </View>
        )}
        {data.map((bar, i) => (
          <BarColumn
            key={bar.key}
            bar={bar}
            index={i}
            ratio={bar.value / max}
            height={height}
            reachedGoal={goal != null && bar.value >= goal}
            onPress={onPressBar}
          />
        ))}
      </View>
      <View style={[styles.labels, { gap }]}>
        {data.map((bar, i) => (
          <Txt
            key={bar.key}
            variant="caption"
            muted={!bar.highlight}
            weight={bar.highlight ? '800' : undefined}
            style={styles.label}
            numberOfLines={1}
          >
            {i % labelEvery === 0 ? bar.label : ''}
          </Txt>
        ))}
      </View>
    </View>
  );
}

function BarColumn({
  bar,
  index,
  ratio,
  height,
  reachedGoal,
  onPress,
}: {
  bar: Bar;
  index: number;
  ratio: number;
  height: number;
  reachedGoal: boolean;
  onPress?: (bar: Bar) => void;
}) {
  const { colors } = useTheme();
  const h = useSharedValue(0);

  useEffect(() => {
    h.value = withDelay(index * 25, withTiming(ratio, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [ratio, index, h]);

  const style = useAnimatedStyle(() => ({ height: Math.max(h.value * height, 4) }));
  const gradient = reachedGoal ? colors.gradient : bar.highlight ? colors.warm : ([colors.track, colors.track] as const);

  return (
    <Pressable style={styles.column} onPress={onPress && (() => onPress(bar))} disabled={!onPress}>
      <Animated.View style={[styles.bar, style]}>
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end' },
  column: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: radius.sm, overflow: 'hidden' },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.5,
    zIndex: 1,
  },
  goalLabel: { position: 'absolute', right: 0, top: -16 },
  labels: { flexDirection: 'row', marginTop: 8 },
  label: { flex: 1, textAlign: 'center', fontSize: 11 },
});
