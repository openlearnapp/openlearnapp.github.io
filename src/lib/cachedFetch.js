const CACHE_NAME = 'workshop-content'

/**
 * Fetch with cache strategy.
 *
 * 'network-first'         — Try network → on success update cache → on failure use cache.
 *                           Best for YAML files that may change.
 *
 * 'cache-first'           — Serve from cache immediately if available, always revalidate
 *                           in the background (stale-while-revalidate).
 *                           Best for audio and images that rarely change.
 *
 * Local/relative URLs (/__local/…) are never cached — they come from the Vite
 * dev plugin and are already instant.
 */
export async function cachedFetch(url, strategy = 'network-first') {
  // Skip caching for local dev and data URLs
  if (url.startsWith('/__') || url.startsWith('data:')) {
    return fetch(url)
  }

  // Skip if Cache API is unavailable (e.g. non-secure context)
  if (typeof caches === 'undefined') {
    return fetch(url)
  }

  if (strategy === 'cache-first') {
    return cacheFirst(url)
  }
  return networkFirst(url)
}

async function networkFirst(url) {
  try {
    const response = await fetch(url)
    if (response.ok) {
      // Update cache in the background — don't block the caller
      updateCache(url, response.clone()).catch(() => {})
    }
    return response
  } catch {
    // Network failed — try cache as fallback
    const cached = await fromCache(url)
    if (cached) return cached
    throw new Error(`Network request failed and no cache available for ${url}`)
  }
}

async function cacheFirst(url) {
  const cached = await fromCache(url)
  if (cached) {
    // Serve from cache immediately, revalidate in the background
    fetch(url).then(r => { if (r.ok) updateCache(url, r).catch(() => {}) }).catch(() => {})
    return cached
  }
  // Nothing cached yet — fetch from network and populate cache
  const response = await fetch(url)
  if (response.ok) {
    updateCache(url, response.clone()).catch(() => {})
  }
  return response
}

async function fromCache(url) {
  try {
    const cache = await caches.open(CACHE_NAME)
    return await cache.match(url) || null
  } catch {
    return null
  }
}

async function updateCache(url, response) {
  const cache = await caches.open(CACHE_NAME)
  await cache.put(url, response)
}
