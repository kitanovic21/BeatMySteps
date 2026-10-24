import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, useTheme } from '@/theme';
import { Txt } from './Txt';

interface Props extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  onRefresh?: () => Promise<unknown>;
}

export function Screen({ title, subtitle, right, onRefresh, children }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = onRefresh
    ? async () => {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    : undefined;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        handleRefresh && (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        )
      }
    >
      {(title || right) && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {subtitle && <Txt variant="label" muted>{subtitle}</Txt>}
            {title && <Txt variant="title">{title}</Txt>}
          </View>
          {right}
        </View>
      )}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
});
