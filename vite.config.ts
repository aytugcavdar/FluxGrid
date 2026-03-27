import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Generate build-time version for service worker cache busting
    const buildVersion = new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).slice(2,6);
    
    return {
      base: '/FluxGrid/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        viteStaticCopy({
          targets: [
            {
              src: 'public/firebase-messaging-sw.js',
              dest: '',
              transform: (content) => {
                // Replace placeholders with environment variables
                return content
                  .toString()
                  .replace('YOUR_API_KEY', env.VITE_FIREBASE_API_KEY || '')
                  .replace('YOUR_AUTH_DOMAIN', env.VITE_FIREBASE_AUTH_DOMAIN || '')
                  .replace('YOUR_PROJECT_ID', env.VITE_FIREBASE_PROJECT_ID || '')
                  .replace('YOUR_STORAGE_BUCKET', env.VITE_FIREBASE_STORAGE_BUCKET || '')
                  .replace('YOUR_MESSAGING_SENDER_ID', env.VITE_FIREBASE_MESSAGING_SENDER_ID || '')
                  .replace('YOUR_APP_ID', env.VITE_FIREBASE_APP_ID || '');
              }
            },
            {
              src: 'public/sw.js',
              dest: '',
              transform: (content) => {
                // Inject build version into service worker
                return content
                  .toString()
                  .replace('{{BUILD_VERSION}}', buildVersion);
              }
            }
          ]
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@app':      path.resolve(__dirname, './src/app'),
          '@features': path.resolve(__dirname, './src/features'),
          '@shared':   path.resolve(__dirname, './src/shared'),
          '@utils':    path.resolve(__dirname, './src/utils'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'babylon': ['babylonjs'],
              'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
              'vendor': ['react', 'react-dom', 'framer-motion', 'zustand']
            }
          }
        }
      }
    };
});
