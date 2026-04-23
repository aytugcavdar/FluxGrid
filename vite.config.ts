import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Generate build-time version for service worker cache busting
    const buildVersion = new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).slice(2,6);
    
    // Determine base path based on mode and Capacitor build flag
    const isCapacitorBuild = env.CAPACITOR_BUILD === 'true';
    const basePath = isCapacitorBuild ? '/' : (mode === 'production' ? '/FluxGrid/' : '/');
    
    return {
      base: basePath,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        visualizer({
          filename: './dist/stats.html',
          open: false, // Don't auto-open in browser
          gzipSize: true,
          brotliSize: true,
          template: 'treemap', // Use treemap visualization
        }),
        viteStaticCopy({
          targets: [
            {
              src: 'public/sw.js',
              dest: '',
              transform: (content) => {
                // Inject build version into service worker
                return content
                  .toString()
                  .replace('{{BUILD_VERSION}}', buildVersion);
              }
            },
            {
              src: 'public/manifest.json',
              dest: '',
              transform: (content) => {
                // Update manifest paths based on base path
                const manifest = JSON.parse(content.toString());
                manifest.start_url = basePath;
                manifest.scope = basePath;
                
                // Update icon paths
                manifest.icons = manifest.icons.map(icon => ({
                  ...icon,
                  src: `${basePath}${icon.src.replace(/^\/FluxGrid\//, '')}`
                }));
                
                // Update shortcut URLs and icons
                if (manifest.shortcuts) {
                  manifest.shortcuts = manifest.shortcuts.map(shortcut => ({
                    ...shortcut,
                    url: shortcut.url.replace('/FluxGrid/', basePath),
                    icons: shortcut.icons.map(icon => ({
                      ...icon,
                      src: `${basePath}${icon.src.replace(/^\/FluxGrid\//, '')}`
                    }))
                  }));
                }
                
                return JSON.stringify(manifest, null, 2);
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
          '@core':     path.resolve(__dirname, './src/core'),
          '@app':      path.resolve(__dirname, './src/app'),
          '@features': path.resolve(__dirname, './src/features'),
          '@shared':   path.resolve(__dirname, './src/shared'),
          '@utils':    path.resolve(__dirname, './src/utils'),
          '@services': path.resolve(__dirname, './src/services'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // React vendor chunk
              if (id.includes('node_modules/react') || 
                  id.includes('node_modules/react-dom') || 
                  id.includes('node_modules/scheduler')) {
                return 'react-vendor';
              }
              
              // Animation vendor chunk
              if (id.includes('node_modules/framer-motion')) {
                return 'animation-vendor';
              }
              
              // State management vendor chunk
              if (id.includes('node_modules/zustand')) {
                return 'state-vendor';
              }
              
              // i18n vendor chunk
              if (id.includes('node_modules/i18next') || 
                  id.includes('node_modules/react-i18next')) {
                return 'i18n-vendor';
              }
              
              // Babylon.js vendor chunk (if used)
              if (id.includes('node_modules/babylonjs')) {
                return 'babylon-vendor';
              }
              
              // Firebase vendor chunk
              if (id.includes('node_modules/firebase') || 
                  id.includes('node_modules/@firebase')) {
                return 'firebase-vendor';
              }
              
              // Game core chunk (game logic, stores, helpers)
              if (id.includes('/src/features/game/')) {
                return 'game-core';
              }
              
              // Visual effects chunk (animations, particles, juice)
              if (id.includes('/src/features/visual-effects/')) {
                return 'visual-effects';
              }
              
              // HUD chunk (UI components for game)
              if (id.includes('/src/features/hud/')) {
                return 'hud';
              }
              
              // Achievements chunk
              if (id.includes('/src/features/achievements/')) {
                return 'achievements';
              }
              
              // Profile chunk
              if (id.includes('/src/features/profile/')) {
                return 'profile';
              }
              
              // Other node_modules go to vendor chunk
              if (id.includes('node_modules')) {
                return 'vendor';
              }
            }
          }
        },
        // Increase chunk size warning limit for better optimization
        chunkSizeWarningLimit: 500, // 500KB limit for main chunks
        // Enable minification
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log in production
            drop_debugger: true,
          },
        },
        // Enable compression
        reportCompressedSize: true,
        // Asset optimization
        assetsInlineLimit: 4096, // Inline assets smaller than 4kb
      }
    };
});
