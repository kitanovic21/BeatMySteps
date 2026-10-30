import type { ExpoConfig } from 'expo/config';

// Reversed iOS client ID from Google Cloud, e.g. com.googleusercontent.apps.1234-abcd
const googleIosUrlScheme =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ?? 'com.googleusercontent.apps.placeholder';

const config: ExpoConfig = {
  name: 'BeatMySteps',
  slug: 'beatmysteps',
  owner: 'kitanovicdj',
  scheme: 'beatmysteps',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.beatmysteps.app',
    supportsTablet: false,
    usesAppleSignIn: true,
    infoPlist: {
      UIBackgroundModes: ['processing', 'fetch'],
    },
  },
  android: {
    package: 'com.beatmysteps.app',
    adaptiveIcon: {
      backgroundColor: '#0B1220',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: [
      'android.permission.health.READ_STEPS',
      'android.permission.health.READ_HEALTH_DATA_HISTORY',
      'android.permission.health.READ_HEALTH_DATA_IN_BACKGROUND',
    ],
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-background-task',
    'expo-apple-authentication',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        backgroundColor: '#F4F7FB',
        dark: { backgroundColor: '#0B1220' },
      },
    ],
    [
      '@kingstinct/react-native-healthkit',
      {
        NSHealthShareUsageDescription:
          'BeatMySteps reads your step count to show your stats and compete with friends.',
        NSHealthUpdateUsageDescription: false,
        background: true,
      },
    ],
    'react-native-health-connect',
    ['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }],
    [
      'expo-build-properties',
      {
        android: {
          // compile/target SDK come from the Expo SDK defaults. The Health Connect app
          // itself only runs on Android 9 (API 28) and newer.
          minSdkVersion: 28,
          // R8 strips WorkManager's Room database (used by expo-background-task),
          // which crashes release builds on launch.
          enableMinifyInReleaseBuilds: false,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: { projectId: '1f60064a-ab00-49b2-b001-9f4754c33b5f' },
  },
};

export default config;
