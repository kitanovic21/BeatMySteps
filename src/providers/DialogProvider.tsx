import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { radius, spacing, useTheme } from '@/theme';

type Tone = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'destructive';
type IconName = keyof typeof Ionicons.glyphMap;

interface DialogAction {
  label: string;
  style?: 'primary' | 'secondary' | 'destructive';
  /** Runs after the dialog has finished closing. */
  onPress?: () => void;
  /** Value a `confirm()` promise resolves with when this action is chosen. */
  value?: boolean;
}

interface DialogOptions {
  title: string;
  message?: string;
  tone?: Tone;
  icon?: IconName;
  actions?: DialogAction[];
}

interface DialogApi {
  show: (options: DialogOptions) => void;
  alert: (title: string, message?: string, tone?: Exclude<Tone, 'confirm' | 'destructive'>) => void;
  /** Resolves true when the confirm button is pressed, false on cancel or dismiss. */
  confirm: (options: { title: string; message?: string; confirmLabel: string; destructive?: boolean; icon?: IconName }) => Promise<boolean>;
}

const DialogContext = createContext<DialogApi | null>(null);

const TONE_ICON: Record<Tone, IconName> = {
  info: 'information-circle',
  success: 'checkmark-circle',
  warning: 'alert-circle',
  error: 'close-circle',
  confirm: 'help-circle',
  destructive: 'alert-circle',
};

const TONE_HAPTIC: Partial<Record<Tone, Haptics.NotificationFeedbackType>> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
  destructive: Haptics.NotificationFeedbackType.Warning,
};

export function DialogProvider({ children }: PropsWithChildren) {
  const { colors, dark } = useTheme();
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const progress = useSharedValue(0);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const pending = useRef<DialogAction | null>(null);

  const show = useCallback((options: DialogOptions) => {
    // A new dialog replaces the current one; an unanswered confirm counts as cancelled.
    resolver.current?.(false);
    resolver.current = null;
    pending.current = null;
    const haptic = TONE_HAPTIC[options.tone ?? 'info'];
    if (haptic) Haptics.notificationAsync(haptic).catch(() => undefined);
    setDialog(options);
  }, []);

  useEffect(() => {
    if (!dialog) return;
    progress.set(0);
    progress.set(withSpring(1, { damping: 18, stiffness: 260, mass: 0.7 }));
  }, [dialog, progress]);

  const finish = useCallback(() => {
    const action = pending.current;
    pending.current = null;
    setDialog(null);
    resolver.current?.(action?.value ?? false);
    resolver.current = null;
    action?.onPress?.();
  }, []);

  const close = (action: DialogAction | null) => {
    pending.current = action;
    progress.set(
      withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) }, (done) => {
        if (done) scheduleOnRN(finish);
      }),
    );
  };

  const api = useMemo<DialogApi>(
    () => ({
      show,
      alert: (title, message, tone = 'info') => show({ title, message, tone }),
      confirm: ({ title, message, confirmLabel, destructive, icon }) =>
        new Promise<boolean>((resolve) => {
          show({
            title,
            message,
            tone: destructive ? 'destructive' : 'confirm',
            icon,
            actions: [
              { label: 'Cancel', style: 'secondary', value: false },
              { label: confirmLabel, style: destructive ? 'destructive' : 'primary', value: true },
            ],
          });
          resolver.current = resolve;
        }),
    }),
    [show],
  );

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 1.5),
    transform: [{ scale: 0.88 + progress.value * 0.12 }, { translateY: (1 - progress.value) * 24 }],
  }));

  const tone = dialog?.tone ?? 'info';
  const tint = {
    info: colors.secondary,
    success: colors.primary,
    warning: colors.gold,
    error: colors.danger,
    confirm: colors.secondary,
    destructive: colors.danger,
  }[tone];
  const actions = dialog?.actions ?? [{ label: 'OK', style: 'primary' as const }];
  const cancelAction = actions.find((a) => a.value === false) ?? null;

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal visible={dialog != null} transparent animationType="none" statusBarTranslucent onRequestClose={() => close(cancelAction)}>
        <View style={styles.root}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => close(cancelAction)} accessibilityLabel="Close" />
          </Animated.View>
          {dialog && (
            <Animated.View
              accessibilityRole="alert"
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                !dark && styles.shadow,
                cardStyle,
              ]}
            >
              <View style={[styles.icon, { backgroundColor: tint + '1F' }]}>
                <Ionicons name={dialog.icon ?? TONE_ICON[tone]} size={30} color={tint} />
              </View>
              <View style={styles.text}>
                <Txt variant="heading" center>{dialog.title}</Txt>
                {dialog.message ? <Txt muted center>{dialog.message}</Txt> : null}
              </View>
              <View style={[styles.actions, actions.length > 2 && styles.actionsStacked]}>
                {actions.map((a) => (
                  <Button
                    key={a.label}
                    title={a.label}
                    variant={a.style === 'secondary' ? 'secondary' : a.style === 'destructive' ? 'danger' : 'primary'}
                    onPress={() => close(a)}
                    style={actions.length <= 2 ? styles.actionFlex : undefined}
                  />
                ))}
              </View>
            </Animated.View>
          )}
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside DialogProvider');
  return ctx;
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  backdrop: { backgroundColor: 'rgba(6, 10, 20, 0.55)' },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  shadow: {
    shadowColor: '#0B1220',
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  icon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  text: { gap: spacing.sm, alignSelf: 'stretch' },
  actions: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  actionsStacked: { flexDirection: 'column' },
  actionFlex: { flex: 1 },
});
