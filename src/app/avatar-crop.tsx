import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { useSetAvatar } from '@/hooks/useProfile';
import { cropAvatar, type CropRect } from '@/lib/avatar';
import { authErrorMessage } from '@/lib/auth';
import { useDialog } from '@/providers/DialogProvider';
import { spacing } from '@/theme';

const MAX_SCALE = 5;
const SIDE_GAP = 24;
const SPRING = { damping: 22, stiffness: 220 };
/** Overlay border thick enough to cover the screen around the circle. */
const MASK = 2000;

/** Largest offset that still keeps the image covering the circle. */
function limit(displayed: number, circle: number) {
  'worklet';
  return Math.max(0, (displayed - circle) / 2);
}

function clamp(v: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(-max, v));
}

/** Moves by `delta`, with resistance once past the limit, like a scroll edge. */
function drag(v: number, delta: number, max: number) {
  'worklet';
  const outward = Math.sign(delta) === Math.sign(v) || v === 0;
  return v + (Math.abs(v) > max && outward ? delta * 0.35 : delta);
}

export default function AvatarCrop() {
  const params = useLocalSearchParams<{ uri: string; width: string; height: string }>();
  const imgW = Number(params.width);
  const imgH = Number(params.height);
  const dialog = useDialog();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const setAvatar = useSetAvatar();
  const [saving, setSaving] = useState(false);

  const circle = Math.min(screenW - SIDE_GAP * 2, 420);
  // At scale 1 the photo just covers the circle, like "cover".
  const base = Math.max(circle / imgW, circle / imgH);
  const baseW = imgW * base;
  const baseH = imgH * base;

  const scale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  // Springs scale and position back inside the allowed range after a gesture.
  const settle = () => {
    'worklet';
    const s = Math.min(MAX_SCALE, Math.max(1, scale.value));
    scale.set(withSpring(s, SPRING));
    x.set(withSpring(clamp(x.value, limit(baseW * s, circle)), SPRING));
    y.set(withSpring(clamp(y.value, limit(baseH * s, circle)), SPRING));
  };

  // Both gestures apply small per-frame changes, so pinching and dragging at once don't fight.
  const pinch = usePinchGesture({
    onUpdate: (e) => {
      const before = scale.value;
      // Past the limits the zoom slows down, then springs back on release.
      const outside = before < 1 || before > MAX_SCALE;
      const after = before * (outside ? 1 + (e.scaleChange - 1) * 0.3 : e.scaleChange);
      scale.set(after);
      // Scale the offset too, so the spot in the middle of the circle stays put.
      x.set(x.value * (after / before));
      y.set(y.value * (after / before));
    },
    onDeactivate: () => settle(),
  });

  const pan = usePanGesture({
    onUpdate: (e) => {
      x.set(drag(x.value, e.changeX, limit(baseW * scale.value, circle)));
      y.set(drag(y.value, e.changeY, limit(baseH * scale.value, circle)));
    },
    onDeactivate: () => settle(),
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onDeactivate: () => {
      const zoomed = scale.value > 1.05;
      scale.set(withTiming(zoomed ? 1 : 2));
      x.set(withTiming(zoomed ? 0 : clamp(x.value * 2, limit(baseW * 2, circle))));
      y.set(withTiming(zoomed ? 0 : clamp(y.value * 2, limit(baseH * 2, circle))));
    },
  });

  const gesture = useSimultaneousGestures(pinch, pan, doubleTap);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  const done = async () => {
    // Convert the circle's square from screen points to image pixels.
    const k = base * scale.get();
    const size = Math.min(Math.round(circle / k), imgW, imgH);
    const rect: CropRect = {
      originX: Math.round(Math.min(imgW - size, Math.max(0, imgW / 2 + (-circle / 2 - x.get()) / k))),
      originY: Math.round(Math.min(imgH - size, Math.max(0, imgH / 2 + (-circle / 2 - y.get()) / k))),
      size,
    };
    setSaving(true);
    try {
      await setAvatar.mutateAsync(await cropAvatar(params.uri, rect));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.back();
    } catch (e) {
      setSaving(false);
      dialog.alert("Couldn't update photo", authErrorMessage(e), 'error');
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={gesture}>
        <View style={styles.stage}>
          <View style={{ width: circle, height: circle, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.Image
              source={{ uri: params.uri }}
              style={[{ width: baseW, height: baseH }, imageStyle]}
              accessibilityIgnoresInvertColors
            />
          </View>
          {/* Dim everything outside the circle; a hole of exactly `circle` stays clear. */}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
            <View
              style={{
                width: circle + MASK * 2,
                height: circle + MASK * 2,
                borderRadius: circle / 2 + MASK,
                borderWidth: MASK,
                borderColor: 'rgba(0,0,0,0.62)',
              }}
            />
          </View>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
            <View style={[styles.ring, { width: circle, height: circle, borderRadius: circle / 2 }]} />
          </View>
        </View>
      </GestureDetector>

      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} hitSlop={10} disabled={saving}>
          <Txt weight="600" color="#fff">Cancel</Txt>
        </Pressable>
        <Txt variant="heading" color="#fff">Move and scale</Txt>
        <View style={{ width: 52 }} />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Txt variant="caption" color="#ffffffaa" center>
          Pinch to zoom, drag to move. Double-tap to zoom in or reset.
        </Txt>
        <Button title="Use photo" onPress={done} loading={saving} />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  footer: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingTop: spacing.lg },
});
