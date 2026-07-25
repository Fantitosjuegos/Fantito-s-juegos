import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'app.fantitosjuegos.fun',
  appName: "Fantito's Juegos",
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: 'ionic',
      scrollAssist: true,
      hideFormAccessoryBar: false,
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 0,       // Show splash for 0ms — let app control dismissal
      launchAutoHide: false,        // We hide it manually after React mounts
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
    // iPad support
    preferredContentMode: 'mobile',
    backgroundColor: '#0a0a0a',
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: isDev,
    backgroundColor: '#0a0a0a',
  },
  server: {
    iosScheme: 'app.fantitosjuegos.fun',
    androidScheme: 'https',
  },
};

export default config;