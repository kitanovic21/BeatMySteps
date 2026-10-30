import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { radius, useTheme, type Colors } from '@/theme';
import { formatCompact } from '@/utils/format';
import { Txt } from './Txt';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SPRING = { damping: 15, stiffness: 300 };

/** Background tint by share of the daily goal reached. */
export function levelColor(ratio: number, colors: Colors): string {
  if (ratio <= 0) return colors.cardAlt;
  if (ratio < 0.25) return colors.primary + '1A';
  if (ratio < 0.5) return colors.primary + '33';
  if (ratio < 0.75) return colors.primary + '55';
  return colors.primary + '88';
}

interface Props {
  date: Date;
  steps: number;
  goal: number;
  /** Position in the grid, used to stagger the entrance. */
  index: number;
  future: boolean;
  today: boolean;
  selected: boolean;
  onPress: (date: Date) => void;
}

export function DayCell({ date, steps, goal, index, future, today, selected, onPress }: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const reached = steps >= goal;
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeIn.delay(index * 12).duration(260)} style={styles.cell}>
      <AnimatedPressable
        disabled={future}
        onPressIn={() => {
          scale.set(withSpring(0.88, PRESS_SPRING));
        }}
        onPressOut={() => {
          scale.set(withSpring(1, PRESS_SPRING));
        }}
        onPress={() => {
          Haptics.selectionAsync().catch(() => undefined);
          onPress(date);
        }}
        accessibilityLabel={`${date.toDateString()}, ${steps} steps`}
        style={[
          styles.day,
          { backgroundColor: future ? 'transparent' : levelColor(steps / goal, colors) },
          (today || selected) && { borderColor: selected ? colors.secondary : colors.primary, borderWidth: 2 },
          animatedStyle,
        ]}
      >
        {reached && (
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.sm }]}
          />
        )}
        <Txt
          variant="label"
          weight="800"
          color={reached ? '#fff' : future ? colors.textMuted : colors.text}
          style={{ opacity: future ? 0.5 : 1 }}
        >
          {date.getDate()}
        </Txt>
        {!future && (
          <Txt variant="caption" color={reached ? '#ffffffdd' : colors.textMuted} style={styles.steps} numberOfLines={1}>
            {steps > 0 ? formatCompact(steps) : '–'}
          </Txt>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

export const cellStyle = { width: `${100 / 7}%`, aspectRatio: 0.82, padding: 2.5 } as const;

const styles = StyleSheet.create({
  cell: cellStyle,
  day: {
    flex: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    overflow: 'hidden',
  },
  steps: { fontSize: 10, fontWeight: '700' },
});
