import { ref, readonly } from 'vue'

// Cache name for on-demand workshop content downloads
const WORKSHOP_CACHE = 'workshop-content'

// Module-level singleton state
const isOnline = ref(navigator.onLine)
const downloadingWorkshops = ref({}) // { "lang/workshop": { progress, total, status } }
const offlineWorkshops = ref(new Set()) // Set of "lang/workshop" keys

// Listen to online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })
}

// Load persisted offline workshop list from localStorage
function loadOfflineIndex() {
  try {
    const stored = JSON.parse(localStorage.getItem('offlineWorkshops') || '[]')
    offlineWorkshops.value = new Set(stored)
  } catch {
    offlineWorkshops.value = new Set()
  }
}

function saveOfflineIndex() {
  localStorage.setItem('offlineWorkshops', JSON.stringify([...offlineWorkshops.value]))
}

// Initialize on load
loadOfflineIndex()

/**
 * Collect all URLs that need to be cached for a workshop.
 * Uses useLessons to resolve paths.
 */
async function collectWorkshopUrls(lang, workshop, lessonsApi) {
  const urls = []

  // Load all lessons for the workshop
  const lessons = await lessonsApi.loadAllLessonsForWorkshop(lang, workshop)
  if (!lessons || lessons.length === 0) return urls

  const resolvedWorkshop = lessonsApi.resolveWorkshopKey(lang, workshop)
  const baseUrl = import.meta.env.BASE_URL

  for (const lesson of lessons) {
    const folder = lesson._filename || `${String(lesson.number).padStart(2, '0')}-lesson`

    // Determine lesson base path
    let lessonBase
    if (lesson._source?.type === 'url') {
      lessonBase = lesson._source.path
    } else if (resolvedWorkshop !== workshop) {
      lessonBase = `${baseUrl}${resolvedWorkshop}/${folder}`
    } else {
      lessonBase = `${baseUrl}lessons/${lang}/${workshop}/${folder}`
    }

    // content.yaml
    urls.push(`${lessonBase}/content.yaml`)

    // Collect images from lesson
    if (lesson.image) {
      urls.push(`${lessonBase}/${lesson.image}`)
    }

    // Collect images from sections and examples
    if (lesson.sections) {
      for (const section of lesson.sections) {
        if (section.image) {
          urls.push(`${lessonBase}/${section.image}`)
        }
        if (section.video && !section.video.startsWith('http')) {
          urls.push(`${lessonBase}/${section.video}`)
        }
        if (section.examples) {
          for (const example of section.examples) {
            if (example.image) {
              urls.push(`${lessonBase}/${example.image}`)
            }
            // Collect option images (story mode)
            if (example.options) {
              for (const option of example.options) {
                if (option.image) {
                  urls.push(`${lessonBase}/${option.image}`)
                }
              }
            }
          }
        }
      }
    }

    // Audio: fetch manifest then collect audio files
    const audioBase = `${lessonBase}/audio`
    try {
      const manifestResponse = await fetch(`${audioBase}/manifest.yaml`)
      if (manifestResponse.ok) {
        const manifestText = await manifestResponse.text()
        urls.push(`${audioBase}/manifest.yaml`)
        const files = manifestText.split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('- '))
          .map(line => line.slice(2))
        for (const file of files) {
          urls.push(`${audioBase}/${file}`)
        }
      }
    } catch {
      // No audio for this lesson — that's fine
    }
  }

  return urls
}

export function useOffline() {
  /**
   * Check if a workshop is available offline
   */
  function isWorkshopOffline(lang, workshop) {
    return offlineWorkshops.value.has(`${lang}/${workshop}`)
  }

  /**
   * Get download status for a workshop (null if not downloading)
   */
  function getDownloadStatus(lang, workshop) {
    return downloadingWorkshops.value[`${lang}/${workshop}`] || null
  }

  /**
   * Download a complete workshop for offline use
   */
  async function downloadWorkshop(lang, workshop, lessonsApi) {
    const key = `${lang}/${workshop}`

    if (downloadingWorkshops.value[key]?.status === 'downloading') {
      return // Already downloading
    }

    downloadingWorkshops.value[key] = { progress: 0, total: 0, status: 'downloading' }

    try {
      // Collect all URLs to cache
      const urls = await collectWorkshopUrls(lang, workshop, lessonsApi)
      if (urls.length === 0) {
        downloadingWorkshops.value[key] = { progress: 0, total: 0, status: 'error' }
        return
      }

      downloadingWorkshops.value[key].total = urls.length

      // Open the workshop cache
      const cache = await caches.open(WORKSHOP_CACHE)

      // Download in batches of 5
      const batchSize = 5
      let completed = 0

      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize)
        const results = await Promise.allSettled(
          batch.map(async (url) => {
            try {
              const response = await fetch(url)
              if (response.ok) {
                await cache.put(url, response)
              }
            } catch {
              // Skip failed individual files (e.g. optional audio)
            }
          })
        )
        completed += results.length
        downloadingWorkshops.value[key].progress = completed
      }

      // Mark as offline
      offlineWorkshops.value.add(key)
      saveOfflineIndex()
      downloadingWorkshops.value[key] = { progress: completed, total: urls.length, status: 'complete' }
      console.log(`✅ Workshop ${key} downloaded for offline use (${urls.length} files)`)
    } catch (error) {
      console.error(`❌ Failed to download workshop ${key}:`, error)
      downloadingWorkshops.value[key] = { progress: 0, total: 0, status: 'error' }
    }
  }

  /**
   * Remove a workshop from offline storage
   */
  async function removeWorkshop(lang, workshop) {
    const key = `${lang}/${workshop}`
    offlineWorkshops.value.delete(key)
    saveOfflineIndex()
    delete downloadingWorkshops.value[key]

    // Delete cached files for this workshop
    try {
      const cache = await caches.open(WORKSHOP_CACHE)
      const keys = await cache.keys()

      const resolvedWorkshop = key // Used for matching
      for (const request of keys) {
        const url = request.url
        // Match URLs belonging to this workshop
        if (url.includes(`/${workshop}/`) && url.includes(`/${lang}/`)) {
          await cache.delete(request)
        }
      }
      console.log(`🗑️ Removed offline data for ${key}`)
    } catch (error) {
      console.warn(`⚠️ Error cleaning cache for ${key}:`, error)
    }
  }

  /**
   * Get estimated storage usage for offline workshops
   */
  async function getStorageEstimate() {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      }
    }
    return { usage: 0, quota: 0 }
  }

  /**
   * List all offline workshops with their keys
   */
  function getOfflineWorkshops() {
    return [...offlineWorkshops.value]
  }

  return {
    isOnline: readonly(isOnline),
    isWorkshopOffline,
    getDownloadStatus,
    downloadWorkshop,
    removeWorkshop,
    getStorageEstimate,
    getOfflineWorkshops,
    downloadingWorkshops: readonly(downloadingWorkshops)
  }
}
