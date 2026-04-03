import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fluxgrid.app',
  appName: 'FluxGrid',
  webDir: 'dist',
  appendUserAgent: 'FluxGrid/1.0 Android',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    StatusBar: {
      style: 'dark',
      navigationBarColor: '#0d1117'
    }
  },
  android: {
    backgroundColor: '#0d1117',
    scrollEnabled: false,
    // Optimize WebView rendering for better performance
    webContentsDebuggingEnabled: false,
    allowMixedContent: false
  }
};

export default config;
