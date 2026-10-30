import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInRight } from 'react-native-reanimated';

import type { SlideDirection } from '@/hooks/usePeriodSwipe';

const DURATION = 280;

const ENTERING = {
  next: FadeInRight.duration(DURATION),
  prev: FadeInLeft.duration(DURATION),
  switch: FadeInDown.duration(DURATION),
};

interface Props {
  /** Changing the key replays the animation. */
  transitionKey: string;
  direction: SlideDirection;
  style?: StyleProp<ViewStyle>;
}

/** Slides content in from the side it came from when the selected period changes. */
export function PeriodTransition({ transitionKey, direction, style, children }: PropsWithChildren<Props>) {
  return (
    <Animated.View key={transitionKey} entering={ENTERING[direction]} style={style}>
      {children}
    </Animated.View>
  );
}
