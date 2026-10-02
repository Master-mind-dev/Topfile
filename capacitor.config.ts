import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ownly.app',
  appName: 'Ownly',
  webDir: 'dist',
  // Load the live server so the app always has the latest version
  server: {
    url: 'https://topfile.onrender.com',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#000000',
    // Allow mixed content for embedded media
    allowMixedContent: false,
    // Capture input for smooth scrolling
    captureInput: true,
    // Use WebView debugger in debug builds
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    // Camera plugin permissions
    Camera: {
      permissions: ['camera', 'microphone', 'photos'],
    },
    // Keyboard handling for proper viewport
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
