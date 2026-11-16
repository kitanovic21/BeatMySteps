// App entry: Expo Router, plus the Android home screen widget handler, which must be
// registered here so Android can update widgets while the app is closed.
import 'expo-router/entry';

import { registerWidgets } from './src/widgets';

registerWidgets();
