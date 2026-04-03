import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

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
            manualChunks: {
              'babylon': ['babylonjs'],
              'vendor': ['react', 'react-dom', 'framer-motion', 'zustand']
            }
          }
        }
      }
    };
});
