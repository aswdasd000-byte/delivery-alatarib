import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deliveryalatarib.test',
  appName: 'ديليفري الأتارب تجريبي',
  webDir: 'www',
  server: {
    url: 'https://aswdasd000-byte.github.io/delivery-alatarib/',
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
