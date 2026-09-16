import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Ensure the service worker is injected into index.html
      injectRegister: 'auto',
      // Dev mode: also enable SW in development for testing
      devOptions: {
        enabled: false,
        type: 'module'
      },
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'favicon.png',
        'logo.png',
        'logo-3d-tight.png',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'icons.svg',
        'indianFoodDatabase.json'
      ],
      manifest: {
        name: 'Jawan Fitness - 3D Workout & Diet Tracker',
        short_name: 'Jawan Fitness',
        description: 'Elite commercial-grade fitness training with 3D animated exercises, active workout set logger, and Indian macro & calorie counter. Built for Salem\'s top gym.',
        theme_color: '#07090e',
        background_color: '#07090e',
        // display_override gives the browser a priority list:
        // window-controls-overlay = desktop PWA with title bar (Edge/Chrome on Win/Mac/Linux)
        // standalone = installed app without browser chrome (most mobile + desktop)
        // minimal-ui = fallback with minimal browser chrome
        // browser = plain browser tab last resort
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui', 'browser'],
        orientation: 'any',
        start_url: '/?utm_source=pwa&utm_medium=homescreen',
        scope: '/',
        id: 'com.jawanfitness.app',
        lang: 'en-IN',
        dir: 'ltr',
        categories: ['fitness', 'health', 'sports', 'lifestyle'],
        // Icons: comprehensive set for all platforms
        icons: [
          // Standard PWA icons
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          // Maskable icon for Android adaptive icons (removes white border on home screen)
          {
            src: '/logo-3d-tight.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          // Apple touch icon (iOS/macOS Safari)
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          },
          // Favicon fallback
          {
            src: '/favicon.png',
            sizes: '48x48',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        // App shortcuts — long-press on Android home screen icon or right-click on Windows taskbar
        shortcuts: [
          {
            name: 'Start Workout',
            short_name: 'Workout',
            description: 'Jump straight into your assigned workout',
            url: '/?tab=home&action=workout&utm_source=shortcut',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Log Meal',
            short_name: 'Diet',
            description: 'Quickly log a meal or track macros',
            url: '/?tab=diet&utm_source=shortcut',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'View Progress',
            short_name: 'Progress',
            description: 'Check your weight loss and fitness progress',
            url: '/?tab=progress&utm_source=shortcut',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          }
        ],
        // Screenshots for app stores / install dialog (Chrome 119+ on desktop shows these)
        screenshots: [
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Jawan Fitness Dashboard - Desktop'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Jawan Fitness Member Portal - Mobile'
          }
        ],
        // Share Target: allows the app to receive shared content from other apps
        share_target: {
          action: '/?share-target=1',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        },
        // Related native apps so OS can suggest the APK on Android
        related_applications: [
          {
            platform: 'play',
            url: 'https://play.google.com/store/apps/details?id=com.jawanfitness.app',
            id: 'com.jawanfitness.app'
          }
        ],
        prefer_related_applications: false
      },
      workbox: {
        // Immediately take control without waiting for page reload
        skipWaiting: true,
        clientsClaim: true,
        // Allow large assets like exercise JSON and fonts
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        // Precache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,json}'],
        // Exclude large non-essential items from precache
        globIgnores: ['**/node_modules/**', '**/test_*', '**/*.map'],
        // Clean old caches on activation
        cleanupOutdatedCaches: true,
        // Offline fallback: serve cached index.html for navigation requests.
        // If the main shell is also not cached (first visit, no internet) serve /offline.html.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/offline\.html$/],
        // Precache the offline fallback page itself so it's always available
        additionalManifestEntries: [
          { url: '/offline.html', revision: '1' }
        ],
        runtimeCaching: [
          // Google Fonts stylesheets — CacheFirst 1 year
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jawan-google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // Google Fonts files (woff2 etc.) — CacheFirst 1 year
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jawan-google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // Cloudflare Pages API — NetworkFirst with 5s timeout fallback to cache
          {
            urlPattern: /^https:\/\/jawan-fitness.*\.pages\.dev\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'jawan-api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // App images (logo, avatars, icons) — CacheFirst 30 days
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jawan-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // JSON data (exercise DB, food DB) — StaleWhileRevalidate
          {
            urlPattern: /\.(?:json)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'jawan-data-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  // Ensure proper base for Capacitor APK (file:// protocol)
  base: '/',
  build: {
    // Increase chunk warning limit for the large exercise/food data
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Manual code splitting for better caching
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
        }
      }
    }
  }
})
