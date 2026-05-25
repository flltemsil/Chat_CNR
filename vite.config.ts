import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/', // Changed from ./ to / for better Express integration
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: false,
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt',
          manifest: {
            name: 'Chat CNR Bilgi Merkezi',
            short_name: 'Chat CNR',
            description: 'Profesyonel Bilgi ve Chat Platformu - Doruk Ali Arslan tarafından geliştirildi.',
            theme_color: '#0a0a0a',
            background_color: '#0a0a0a',
            display: 'standalone',
            id: 'com.dorukaliarslan.chatcnr.v2',
            iarc_rating_id: 'e5c6a1e3-1b2c-3d4e-5f6a-1b2c3d4e5f6a',
            prefer_related_applications: false,
            related_applications: [
              {
                platform: 'play',
                url: 'https://play.google.com/store/apps/details?id=com.dorukaliarslan.chatcnr',
                id: 'com.dorukaliarslan.chatcnr'
              }
            ],
            lang: 'tr-TR',
            icons: [
              {
                src: 'https://cdn-icons-png.flaticon.com/512/1698/1698535.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'https://cdn-icons-png.flaticon.com/512/1698/1698535.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'https://cdn-icons-png.flaticon.com/512/1698/1698535.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            screenshots: [
              {
                src: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1920&h=1080',
                sizes: '1920x1080',
                type: 'image/jpeg',
                form_factor: 'wide',
                label: 'Professional AI Interface'
              },
              {
                src: 'https://images.unsplash.com/photo-1675271591211-126ad94e495d?auto=format&fit=crop&q=80&w=750&h=1334',
                sizes: '750x1334',
                type: 'image/jpeg',
                form_factor: 'narrow',
                label: 'Mobile Experience'
              }
            ],
            shortcuts: [
              {
                name: 'Yeni Sohbet',
                url: '/?new=true',
                icons: [{ src: 'https://cdn-icons-png.flaticon.com/512/1698/1698535.png', sizes: '192x192' }]
              }
            ],
            categories: ["productivity", "utilities", "education"],
            dir: "ltr",
            orientation: "portrait"
          },
          workbox: {
            cleanupOutdatedCaches: true,
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            navigateFallbackDenylist: [/^\/api/],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/img\.icons8\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'icons-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module',
          }
        })
      ],
      build: {
        chunkSizeWarningLimit: 1600
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.env.CHAT_CNR_API_KEY': JSON.stringify(env.CHAT_CNR_API_KEY || ''),
        'process.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
