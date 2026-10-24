import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, useTheme } from '@/theme';
import { Txt } from './Txt';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.cardAlt }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            style={[styles.item, active && { backgroundColor: colors.card }, active && styles.activeShadow]}
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
  wrap: { flexDirection: 'row', borderRadius: radius.pill, padding: 4 },
  item: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radius.pill },
  activeShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
