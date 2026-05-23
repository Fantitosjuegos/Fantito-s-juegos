import type { CapacitorConfig } from '@capacitor/cli';

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
    },
  },
  android: {
    allowMixedContent: true,
  },
  server: {
    iosScheme: 'app.fantitosjuegos.fun',
    androidScheme: 'app.fantitosjuegos.fun',
  },
};

export default config;