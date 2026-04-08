import { ref, computed } from 'vue'

const origin = typeof window !== 'undefined' ? window.location.origin : ''

const DEFAULT_MANIFEST = {
  name: 'Open Learn',
  short_name: 'Open Learn',
  description: 'Learn any workshop by examples — offline capable',
  start_url: `${origin}/`,
  display: 'standalone',
  background_color: '#000000',
  theme_color: '#000000',
  icons: [{ src: `${origin}/favicon.svg`, sizes: 'any', type: 'image/svg+xml' }]
}

// Current active manifest (reactive)
const currentManifest = ref({ ...DEFAULT_MANIFEST })
let blobUrl = null

function applyManifest(manifest) {
  // Clean up previous blob
  if (blobUrl) URL.revokeObjectURL(blobUrl)

  currentManifest.value = manifest
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
  blobUrl = URL.createObjectURL(blob)

  let link = document.querySelector('link[rel="manifest"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'manifest'
    document.head.appendChild(link)
  }
  link.href = blobUrl
}

/**
 * Set manifest for a single workshop install
 */
function setWorkshopManifest(workshopTitle, language, workshop) {
  applyManifest({
    name: workshopTitle,
    short_name: workshopTitle,
    description: `${workshopTitle} — Open Learn workshop`,
    start_url: `${origin}/#/${language}/${workshop}/lessons`,
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [{ src: `${origin}/favicon.svg`, sizes: 'any', type: 'image/svg+xml' }]
  })
}

/**
 * Restore the default full-app manifest
 */
function setDefaultManifest() {
  applyManifest({ ...DEFAULT_MANIFEST })
}

const isFullApp = computed(() => currentManifest.value.start_url === '/')
const manifestName = computed(() => currentManifest.value.name)

export function useManifest() {
  return {
    currentManifest,
    manifestName,
    isFullApp,
    setWorkshopManifest,
    setDefaultManifest
  }
}
