import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { radius, useTheme } from '@/theme';
import { Txt } from './Txt';

const PADDING = 4;
const SPRING = { damping: 20, stiffness: 220, mass: 0.8 };

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = width > 0 ? (width - PADDING * 2) / options.length : 0;
  const x = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    if (!segment) return;
    // Jump into place on first layout, slide afterwards.
    if (placed.current) {
      x.value = withSpring(index * segment, SPRING);
    } else {
      x.value = index * segment;
      placed.current = true;
    }
  }, [index, segment, x]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      style={[styles.wrap, { backgroundColor: colors.cardAlt }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {segment > 0 && (
        <Animated.View
          style={[styles.thumb, styles.activeShadow, { width: segment, backgroundColor: colors.card }, thumbStyle]}
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            style={styles.item}
            onPress={() => {
              if (!active) Haptics.selectionAsync().catch(() => undefined);
              onChange(o.value);
            }}
          >
            <Txt variant="label" muted={!active} weight={active ? '700' : '600'}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: radius.pill, padding: PADDING },
  thumb: { position: 'absolute', top: PADDING, bottom: PADDING, left: PADDING, borderRadius: radius.pill },
  item: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radius.pill },
  activeShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
