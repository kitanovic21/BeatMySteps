import { registerWidgetTaskHandler, requestWidgetUpdate, type WidgetTaskHandler } from 'react-native-android-widget';

import { fetchSnapshot, loadSnapshot } from './data';
import { LEADERBOARD_WIDGET, renderFallbackWidget, renderWidget, STEPS_WIDGET } from './widgets';

const handler: WidgetTaskHandler = async ({ widgetInfo, widgetAction, renderWidget: draw }) => {
  // Taps open the app through the widget's OPEN_URI action; nothing to redraw.
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  try {
    // Show the last known numbers right away, then replace them with fresh ones.
    draw(renderWidget(widgetInfo.widgetName, await loadSnapshot(), widgetInfo.width));
    const fresh = await fetchSnapshot().catch(() => null);
    if (fresh) draw(renderWidget(widgetInfo.widgetName, fresh, widgetInfo.width));
  } catch (e) {
    console.error('Widget render failed', e);
    draw(renderFallbackWidget());
  }
};

/** Called once from the app entry so Android can draw widgets without opening the app. */
export function registerWidgets() {
  registerWidgetTaskHandler(handler);
}

/** Fetches fresh numbers and redraws every BeatMySteps widget on the home screen. */
export async function refreshWidgets() {
  const data = await fetchSnapshot();
  await Promise.all(
    [STEPS_WIDGET, LEADERBOARD_WIDGET].map((widgetName) =>
      requestWidgetUpdate({ widgetName, renderWidget: (info) => renderWidget(widgetName, data, info.width) }),
    ),
  );
}
