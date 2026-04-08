import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'

// Auto-detect sibling workshop directories (../workshop-*) and built-in workshops (public/workshop-*)
// In dev mode, serves local workshop files and provides a manifest
function localWorkshopsPlugin() {
  const parentDir = path.resolve(__dirname, '..')
  const publicDir = path.resolve(__dirname, 'public')
  const localWorkshops = new Map()

  // Scan for sibling workshop directories that have index.yaml
  try {
    for (const entry of fs.readdirSync(parentDir)) {
      const fullPath = path.join(parentDir, entry)
      if (entry.startsWith('workshop-') && fs.statSync(fullPath).isDirectory()) {
        if (fs.existsSync(path.join(fullPath, 'index.yaml'))) {
          localWorkshops.set(entry, fullPath)
        }
      }
    }
  } catch { /* ignore */ }

  // Also scan built-in workshops in public/ so they appear as local-dev too
  try {
    for (const entry of fs.readdirSync(publicDir)) {
      const fullPath = path.join(publicDir, entry)
      if (entry.startsWith('workshop-') && fs.statSync(fullPath).isDirectory()) {
        if (fs.existsSync(path.join(fullPath, 'index.yaml')) && !localWorkshops.has(entry)) {
          localWorkshops.set(entry, fullPath)
        }
      }
    }
  } catch { /* ignore */ }

  if (localWorkshops.size > 0) {
    console.log(`\n🔧 Local workshops (shown alongside remote):`)
    for (const [name, dir] of localWorkshops) {
      const isBuiltIn = dir.startsWith(publicDir)
      console.log(`   ${name}/${isBuiltIn ? ' (built-in)' : ''}`)
    }
    console.log('')
  }

  return {
    name: 'local-workshops',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Serve manifest of available local workshops
        if (req.url === '/__local-workshops.json') {
          const list = [...localWorkshops.keys()]
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ workshops: list }))
          return
        }

        // Serve files from local workshop directories
        const match = req.url?.match(/^\/__local\/(workshop-[^/]+)\/(.*)/)
        if (match) {
          const [, workshopName, filePath] = match
          if (localWorkshops.has(workshopName)) {
            const localPath = path.join(localWorkshops.get(workshopName), filePath)
            if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
              const ext = path.extname(localPath)
              const mimeTypes = {
                '.yaml': 'text/yaml', '.yml': 'text/yaml',
                '.json': 'application/json', '.svg': 'image/svg+xml',
                '.png': 'image/png', '.jpg': 'image/jpeg',
                '.mp3': 'audio/mpeg', '.mp4': 'video/mp4',
              }
              res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
              res.setHeader('Access-Control-Allow-Origin', '*')
              fs.createReadStream(localPath).pipe(res)
              return
            }
          }
        }
        next()
      })
    }
  }
}

export default defineConfig(({ command }) => ({
  plugins: [
    vue(),
    // Local workshop dev: auto-detect sibling workshop-* directories
    ...(command === 'serve' ? [localWorkshopsPlugin()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      // Include workshop metadata YAML in precache alongside app shell
      includeAssets: [
        'favicon.svg',
        'lessons/index.yaml',
        'default-sources.yaml'
      ],
      workbox: {
        // Precache built app assets
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Don't intercept navigation to workshop landing pages or 404
        navigateFallbackDenylist: [/^\/workshop-/, /^\/404\.html/],
        // Runtime caching for workshop metadata (always cached, stale-while-revalidate)
        runtimeCaching: [
          {
            // Workshop index + metadata YAML files (small, cache aggressively)
            urlPattern: /\/(workshop-[^/]+\/(?:index\.yaml|[^/]+\/workshops\.yaml|[^/]+\/[^/]+\/lessons\.yaml))/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'workshop-metadata',
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }
            }
          },
          {
            // Workshop thumbnails (SVG/PNG on the overview pages)
            urlPattern: /\/(workshop-[^/]+\/[^/]+\/[^/]+\/thumbnail\.(svg|png|jpg))/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'workshop-metadata',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }
            }
          },
          {
            // External workshop metadata from open-learn.app
            urlPattern: /^https:\/\/open-learn\.app\/workshop-[^/]+\/(index\.yaml|[^/]+\/workshops\.yaml|[^/]+\/[^/]+\/lessons\.yaml)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'workshop-metadata-external',
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }
            }
          },
          {
            // External workshop thumbnails
            urlPattern: /^https:\/\/open-learn\.app\/workshop-[^/]+\/[^/]+\/[^/]+\/thumbnail\.(svg|png|jpg)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'workshop-metadata-external',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }
            }
          },
          {
            // On-demand workshop content (lesson YAML, images, audio)
            // Pre-populated by useOffline.downloadWorkshop(), served cache-first when offline
            urlPattern: /\/(workshop-[^/]+\/[^/]+\/[^/]+\/[^/]+\/(content\.yaml|images\/|audio\/))/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'workshop-content',
              expiration: { maxEntries: 5000, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          },
          {
            // External workshop content from open-learn.app
            urlPattern: /^https:\/\/open-learn\.app\/workshop-[^/]+\/[^/]+\/[^/]+\/[^/]+\/(content\.yaml|images\/|audio\/)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'workshop-content',
              expiration: { maxEntries: 5000, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          }
        ]
      },
      manifest: {
        name: 'Open Learn',
        short_name: 'Open Learn',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      }
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version),
    __APP_LAST_PR__: JSON.stringify(JSON.parse(fs.readFileSync('./package.json', 'utf-8'))._lastPR || ''),
  },
  base: '/',
  server: {
    cors: true  // Enable CORS for cross-origin requests
  },
  preview: {
    port: 5173
  },
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js',
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**']
  }
}))
