import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { radius, spacing, useTheme } from '@/theme';
import { formatLongDate } from '@/utils/dates';
import { formatSteps, stepsToKcal, stepsToKm, stepsToMinutes } from '@/utils/format';
import { ProgressRing } from './ProgressRing';
import { StatCard, StatRow } from './StatCard';
import { Txt } from './Txt';

const SHEET_TRAVEL = 520;
const DISMISS_DISTANCE = 120;

interface Props {
  day: Date | null;
  steps: number;
  goal: number;
  /** Called after the close animation finishes; the parent should then clear `day`. */
  onClose: () => void;
}

export function DaySheet({ day, steps, goal, onClose }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pct = goal ? steps / goal : 0;
  // 0 = hidden, 1 = fully open; drag follows the finger while pulling down.
  const progress = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (!day) return;
    drag.set(0);
    progress.set(withSpring(1, { damping: 22, stiffness: 200 }));
  }, [day, drag, progress]);

  const close = () => {
    progress.set(
      withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) scheduleOnRN(onClose);
      }),
    );
  };

  const pan = usePanGesture({
    activeOffsetY: [-10, 10],
    onUpdate: (e) => {
      drag.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > 900) {
        scheduleOnRN(close);
      } else {
        drag.set(withSpring(0, { damping: 20, stiffness: 220 }));
      }
    },
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * Math.max(0, 1 - drag.value / SHEET_TRAVEL),
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * SHEET_TRAVEL + drag.value }],
  }));

  return (
    <Modal visible={day != null} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing.lg },
              sheetStyle,
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            {day && (
              <>
                <Txt variant="heading" center>{formatLongDate(day)}</Txt>
                <View style={styles.ring}>
                  <ProgressRing progress={pct} size={170} stroke={14}>
                    <Txt variant="title" style={{ fontVariant: ['tabular-nums'] }}>{formatSteps(steps)}</Txt>
                    <Txt variant="caption" muted>{Math.round(pct * 100)}% of goal</Txt>
                  </ProgressRing>
                </View>
                <StatRow>
                  <StatCard icon="navigate" label="Distance" value={`${stepsToKm(steps)} km`} tint={colors.secondary} />
                  <StatCard icon="flame" label="Calories" value={stepsToKcal(steps)} hint="kcal" tint="#F97316" />
                  <StatCard icon="time" label="Active" value={stepsToMinutes(steps)} hint="min" tint="#8B5CF6" />
                </StatRow>
              </>
            )}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center' },
  ring: { alignItems: 'center' },
});
