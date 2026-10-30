import { usePanGesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 500;

/**
 * Horizontal swipe to move between periods: swipe left for the next one,
 * right for the previous one. Vertical scrolling is left alone.
 */
export function usePeriodSwipe(onPrev: () => void, onNext: () => void) {
  return usePanGesture({
    activeOffsetX: [-20, 20],
    failOffsetY: [-15, 15],
    onDeactivate: (e) => {
      if (e.translationX < -SWIPE_DISTANCE || e.velocityX < -SWIPE_VELOCITY) scheduleOnRN(onNext);
      else if (e.translationX > SWIPE_DISTANCE || e.velocityX > SWIPE_VELOCITY) scheduleOnRN(onPrev);
    },
  });
}

export type SlideDirection = 'prev' | 'next' | 'switch';
