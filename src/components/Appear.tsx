import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const STAGGER_MS = 70;

/** Fades and lifts its children in when first shown; `index` staggers siblings. */
export function Appear({ index = 0, style, children }: PropsWithChildren<{ index?: number; style?: StyleProp<ViewStyle> }>) {
  return (
    <Animated.View entering={FadeInDown.delay(index * STAGGER_MS).duration(420)} style={style}>
      {children}
    </Animated.View>
  );
}
