import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quizmanna.app',
  appName: 'QuizManna',
  webDir: 'dist',
  backgroundColor: '#080B11',
  android: {
    backgroundColor: '#080B11',
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
