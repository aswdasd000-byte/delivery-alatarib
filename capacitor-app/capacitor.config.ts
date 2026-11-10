import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deliveryalatarib.app',
  appName: 'ديليفري الأتارب',
  webDir: 'dist',
  server: {
    cleartext: false,
    allowNavigation: [
      'aswdasd000-byte.github.io',
      '*.supabase.co'
    ]
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
