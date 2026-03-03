import { ref, watch } from 'vue'
import { useGun } from './useGun'

// Shared progress state (singleton pattern)
// Structure: { "learning:workshop": { "itemId": true, ... } }
const progress = ref({})

let isInitialized = false

// Get the storage key for a specific workshop
function getWorkshopKey(learning, workshop) {
  return `${learning}:${workshop}`
}

// Save progress to localStorage and sync to Gun
function saveProgress() {
  localStorage.setItem('progress', JSON.stringify(progress.value))
  const { isLoggedIn, syncToGun } = useGun()
  if (isLoggedIn.value) {
    syncToGun('progress', progress.value)
  }
}

// Load progress from localStorage
function loadProgress() {
  const saved = localStorage.getItem('progress')
  if (saved) {
    try {
      progress.value = JSON.parse(saved)
    } catch (e) {
      console.error('Error loading progress:', e)
      progress.value = {}
    }
  }
}

// Check if an item is learned
function isItemLearned(learning, workshop, itemId) {
  const workshopKey = getWorkshopKey(learning, workshop)
  return progress.value[workshopKey]?.[itemId] === true
}

// Toggle learned status for an item
function toggleItemLearned(learning, workshop, itemId) {
  const workshopKey = getWorkshopKey(learning, workshop)

  if (!progress.value[workshopKey]) {
    progress.value[workshopKey] = {}
  }

  if (progress.value[workshopKey][itemId]) {
    delete progress.value[workshopKey][itemId]
  } else {
    progress.value[workshopKey][itemId] = true
  }

  saveProgress()
}

// Check if all items in an example are learned
function areAllItemsLearned(learning, workshop, items) {
  if (!items || items.length === 0) {
    return false
  }

  return items.every(item => {
    const itemId = item[0] // First element is the unique identifier
    return isItemLearned(learning, workshop, itemId)
  })
}

// Initialize watchers only once
function initializeWatchers() {
  if (isInitialized) return

  isInitialized = true

  // Watch for progress changes and save to localStorage
  watch(progress, () => {
    saveProgress()
  }, { deep: true })

  // Listen for real-time Gun sync events from other devices/tabs
  window.addEventListener('gun-sync', (e) => {
    if (e.detail.key === 'progress' && e.detail.data) {
      mergeProgress(e.detail.data)
    }
  })
}

// Return raw progress object
function getProgress() {
  return progress.value
}

// Merge imported progress into existing (additive)
function mergeProgress(imported) {
  for (const [workshopKey, items] of Object.entries(imported)) {
    if (!progress.value[workshopKey]) {
      progress.value[workshopKey] = {}
    }
    Object.assign(progress.value[workshopKey], items)
  }
  saveProgress()
}

export function useProgress() {
  // Initialize watchers on first use
  initializeWatchers()

  return {
    progress,
    loadProgress,
    isItemLearned,
    toggleItemLearned,
    areAllItemsLearned,
    getProgress,
    mergeProgress
  }
}
