import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'Iron Vault',
        short_name: 'Iron Vault',
        description: 'A house of craft, character, and carefully considered sporting pieces.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f5f1e9',
        theme_color: '#f5f1e9',
        icons: [
          { src: '/iron-vault.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        runtimeCaching: [{
          urlPattern: ({ request }) => request.destination === 'image',
          handler: 'CacheFirst',
          options: {
            cacheName: 'iron-vault-images',
            expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] },
          },
        }],
      },
    }),
  ],
})
