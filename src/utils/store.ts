import { Linking } from 'react-native';

/** Opens an app's Play Store page; the page shows "Open" when it's already installed. */
export function openPlayStore(pkg: string) {
  Linking.openURL(`market://details?id=${pkg}`).catch(() =>
    Linking.openURL(`https://play.google.com/store/apps/details?id=${pkg}`),
  );
}
