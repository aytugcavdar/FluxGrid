import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fluxgrid.app',
  appName: 'FluxGrid',
  webDir: 'dist',
  appendUserAgent: 'FluxGrid/1.0.0 Android',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0f0e17',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0d1117', // matches splash screen to prevent flash on launch
      overlaysWebView: true
    }
  },
  android: {
    // Optimize WebView rendering for better performance
    webContentsDebuggingEnabled: false,
    allowMixedContent: false
  }
};

export default config;
