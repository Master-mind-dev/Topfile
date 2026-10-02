import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ownly.app',
  appName: 'Ownly',
  webDir: 'dist',
  // Load the live server so the app always has the latest version
  // and login/auth works correctly against the real backend
  server: {
    url: 'https://topfile.onrender.com',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#000000',
  },
};

export default config;
