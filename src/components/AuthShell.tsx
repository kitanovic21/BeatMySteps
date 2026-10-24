import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing, useTheme } from '@/theme';
import { Txt } from './Txt';

export function AuthShell({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
            <Ionicons name="footsteps" size={36} color="#fff" />
          </LinearGradient>
          <Txt variant="title">BeatMySteps</Txt>
        </View>
        <View style={{ gap: spacing.xs }}>
          <Txt variant="heading">{title}</Txt>
          <Txt muted>{subtitle}</Txt>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Divider({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.divider}>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <Txt variant="caption" muted>{label}</Txt>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, gap: spacing.lg },
  brand: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  logo: { width: 76, height: 76, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xs },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
