import { ref, watch } from 'vue'
import { useGun } from './useGun'

// Shared progress state (singleton pattern)
// Structure: { "learning:workshop": { "itemId": timestamp, ... } }
// Positive timestamp = learned, negative = unlearned. Merge: highest absolute wins.
// Legacy format (itemId: true) is supported for reads and migrated on write.
const progress = ref({})

// Last visited lesson per workshop: { "learning:workshop": "lesson-number" }
const lastVisited = ref({})

// Lesson-level progress (separate from item-level progress)
// Structure: { "learning:workshop": { status: { "1": "completed", "2": "visited" }, favorites: [4, 7, 9] } }
const lessonProgress = ref({})

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

// Save lesson progress to localStorage
function saveLessonProgress() {
  localStorage.setItem('lessonProgress', JSON.stringify(lessonProgress.value))
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
  const savedVisited = localStorage.getItem('lastVisited')
  if (savedVisited) {
    try {
      lastVisited.value = JSON.parse(savedVisited)
    } catch {
      lastVisited.value = {}
    }
  }
  const savedLessonProgress = localStorage.getItem('lessonProgress')
  if (savedLessonProgress) {
    try {
      lessonProgress.value = JSON.parse(savedLessonProgress)
    } catch {
      lessonProgress.value = {}
    }
  }
}

// Track the last visited lesson for a workshop
function setLastVisited(learning, workshop, number) {
  const key = getWorkshopKey(learning, workshop)
  lastVisited.value[key] = String(number)
  localStorage.setItem('lastVisited', JSON.stringify(lastVisited.value))
}

function getLastVisited(learning, workshop) {
  return lastVisited.value[getWorkshopKey(learning, workshop)] || null
}

// Check if an item is learned (positive timestamp or legacy true)
function isItemLearned(learning, workshop, itemId) {
  const workshopKey = getWorkshopKey(learning, workshop)
  const val = progress.value[workshopKey]?.[itemId]
  return val === true || (typeof val === 'number' && val > 0)
}

// Toggle learned status for an item
function toggleItemLearned(learning, workshop, itemId) {
  const workshopKey = getWorkshopKey(learning, workshop)

  if (!progress.value[workshopKey]) {
    progress.value[workshopKey] = {}
  }

  if (isItemLearned(learning, workshop, itemId)) {
    progress.value[workshopKey][itemId] = -Date.now()
  } else {
    progress.value[workshopKey][itemId] = Date.now()
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

// --- Lesson-level progress ---

function ensureLessonEntry(learning, workshop) {
  const key = getWorkshopKey(learning, workshop)
  if (!lessonProgress.value[key]) {
    lessonProgress.value[key] = { status: {}, favorites: [] }
  }
  return key
}

// Set lesson status: 'visited' or 'completed'
function setLessonStatus(learning, workshop, lessonNumber, status) {
  const key = ensureLessonEntry(learning, workshop)
  lessonProgress.value[key].status[String(lessonNumber)] = status
  saveLessonProgress()
}

// Get lesson status: 'visited', 'completed', or null (open)
function getLessonStatus(learning, workshop, lessonNumber) {
  const key = getWorkshopKey(learning, workshop)
  return lessonProgress.value[key]?.status?.[String(lessonNumber)] || null
}

// Check if a lesson is completed
function isLessonCompleted(learning, workshop, lessonNumber) {
  return getLessonStatus(learning, workshop, lessonNumber) === 'completed'
}

// Toggle lesson completed status
function toggleLessonCompleted(learning, workshop, lessonNumber) {
  if (isLessonCompleted(learning, workshop, lessonNumber)) {
    const key = ensureLessonEntry(learning, workshop)
    delete lessonProgress.value[key].status[String(lessonNumber)]
  } else {
    setLessonStatus(learning, workshop, lessonNumber, 'completed')
  }
  saveLessonProgress()
}

// Mark lesson as visited (only upgrades from null, never downgrades from completed)
function markLessonVisited(learning, workshop, lessonNumber) {
  const current = getLessonStatus(learning, workshop, lessonNumber)
  if (!current) {
    setLessonStatus(learning, workshop, lessonNumber, 'visited')
  }
}

// --- Favorites ---

// Toggle favorite for a lesson
function toggleFavorite(learning, workshop, lessonNumber) {
  const key = ensureLessonEntry(learning, workshop)
  const favorites = lessonProgress.value[key].favorites
  const num = Number(lessonNumber)
  const index = favorites.indexOf(num)
  if (index >= 0) {
    favorites.splice(index, 1)
  } else {
    favorites.push(num)
  }
  saveLessonProgress()
}

// Get favorites for a workshop (ordered array of lesson numbers)
function getFavorites(learning, workshop) {
  const key = getWorkshopKey(learning, workshop)
  return lessonProgress.value[key]?.favorites || []
}

// Check if a lesson is a favorite
function isFavorite(learning, workshop, lessonNumber) {
  return getFavorites(learning, workshop).includes(Number(lessonNumber))
}

// Reorder favorites (after drag & drop)
function reorderFavorites(learning, workshop, orderedNumbers) {
  const key = ensureLessonEntry(learning, workshop)
  lessonProgress.value[key].favorites = orderedNumbers.map(Number)
  saveLessonProgress()
}

// --- Completion count ---

// Get number of completed lessons and total
function getCompletionCount(learning, workshop, totalLessons) {
  const key = getWorkshopKey(learning, workshop)
  const statuses = lessonProgress.value[key]?.status || {}
  const completed = Object.values(statuses).filter(s => s === 'completed').length
  return { completed, total: totalLessons }
}

// Get the next recommended lesson number (lowest non-completed, favorites first)
function getNextLesson(learning, workshop, totalLessons) {
  const favorites = getFavorites(learning, workshop)
  // Check favorites first
  for (const num of favorites) {
    if (!isLessonCompleted(learning, workshop, num)) {
      return num
    }
  }
  // Then check all lessons in order
  for (let i = 1; i <= totalLessons; i++) {
    if (!isLessonCompleted(learning, workshop, i)) {
      return i
    }
  }
  return null // all completed
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

// Merge imported progress — timestamp-aware, highest absolute value wins.
// Supports legacy format (true) by treating it as a low positive timestamp.
function mergeProgress(imported) {
  for (const [workshopKey, items] of Object.entries(imported)) {
    if (!progress.value[workshopKey]) {
      progress.value[workshopKey] = {}
    }
    for (const [itemId, val] of Object.entries(items)) {
      const remoteTs = val === true ? 1 : (typeof val === 'number' ? val : 0)
      const localVal = progress.value[workshopKey][itemId]
      const localTs = localVal === true ? 1 : (typeof localVal === 'number' ? localVal : 0)
      if (Math.abs(remoteTs) > Math.abs(localTs)) {
        progress.value[workshopKey][itemId] = remoteTs
      }
    }
  }
  // Persist immediately — the watcher also saves, but callers may read
  // localStorage synchronously after merge (e.g. import flow, tests).
  localStorage.setItem('progress', JSON.stringify(progress.value))
}

export function useProgress() {
  // Initialize watchers on first use
  initializeWatchers()

  return {
    progress,
    lastVisited,
    lessonProgress,
    loadProgress,
    isItemLearned,
    toggleItemLearned,
    areAllItemsLearned,
    getProgress,
    mergeProgress,
    setLastVisited,
    getLastVisited,
    setLessonStatus,
    getLessonStatus,
    isLessonCompleted,
    toggleLessonCompleted,
    markLessonVisited,
    toggleFavorite,
    getFavorites,
    isFavorite,
    reorderFavorites,
    getCompletionCount,
    getNextLesson
  }
}
