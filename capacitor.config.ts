import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fluxgrid.app',
  appName: 'FluxGrid',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    StatusBar: {
      style: 'dark'
    }
  },
  android: {
    backgroundColor: '#0d1117',
    // Optimize WebView rendering for better performance
    webContentsDebuggingEnabled: false,
    allowMixedContent: false
  }
};

export default config;
