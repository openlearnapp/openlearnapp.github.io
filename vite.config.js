import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'

// Auto-detect sibling workshop directories (../workshop-*)
// In dev mode, serves local workshop files and provides a manifest
function localWorkshopsPlugin() {
  const parentDir = path.resolve(__dirname, '..')
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

  if (localWorkshops.size > 0) {
    console.log(`\n🔧 Local workshops (shown alongside remote):`)
    for (const [name] of localWorkshops) {
      console.log(`   ${name}/`)
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
    ...(command === 'serve' ? [localWorkshopsPlugin()] : [])
  ],
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
