import { ref } from 'vue'

// Module-level singleton state
const lastVisited = ref({})

// Generate a deterministic HSL color from username char codes
function getAvatarColor(username) {
  if (!username) return 'hsl(228, 60%, 55%)'
  let sum = 0
  for (let i = 0; i < username.length; i++) {
    sum += username.charCodeAt(i)
  }
  const hue = sum % 360
  return `hsl(${hue}, 60%, 55%)`
}

// Get 1-2 uppercase initials from username
function getInitials(username) {
  if (!username) return '?'
  const trimmed = username.trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase()
}

// Save last visited lesson to localStorage
function trackLastLesson(learning, workshop, lessonNumber) {
  const key = `${learning}:${workshop}`
  lastVisited.value[key] = {
    lessonNumber,
    timestamp: Date.now()
  }
  try {
    localStorage.setItem('lastVisited', JSON.stringify(lastVisited.value))
  } catch (e) {
    console.error('Error saving lastVisited:', e)
  }
}

// Get last visited lesson for a workshop
function getLastLesson(learning, workshop) {
  const key = `${learning}:${workshop}`
  return lastVisited.value[key] || null
}

// Load lastVisited from localStorage
function loadLastVisited() {
  try {
    const saved = localStorage.getItem('lastVisited')
    if (saved) {
      lastVisited.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('Error loading lastVisited:', e)
    lastVisited.value = {}
  }
}

// Get active workshops from progress object, sorted by most items learned
function getActiveWorkshops(progress) {
  if (!progress) return []
  return Object.keys(progress)
    .map(key => {
      const parts = key.split(':')
      if (parts.length < 2) return null
      const learning = parts[0]
      const workshop = parts.slice(1).join(':')
      const learnedCount = Object.keys(progress[key] || {}).length
      return { learning, workshop, learnedCount }
    })
    .filter(Boolean)
    .sort((a, b) => b.learnedCount - a.learnedCount)
}

// Get overall user stats from progress and assessments
function getUserStats(progress, assessments) {
  let totalLearned = 0
  let workshopCount = 0
  let totalAssessments = 0

  if (progress) {
    const keys = Object.keys(progress)
    workshopCount = keys.length
    for (const key of keys) {
      totalLearned += Object.keys(progress[key] || {}).length
    }
  }

  if (assessments) {
    for (const lessonKey of Object.keys(assessments)) {
      const lessonAnswers = assessments[lessonKey]
      if (lessonAnswers) {
        totalAssessments += Object.keys(lessonAnswers).length
      }
    }
  }

  return { totalLearned, totalAssessments, workshopCount }
}

export function useProfile() {
  return {
    lastVisited,
    getAvatarColor,
    getInitials,
    trackLastLesson,
    getLastLesson,
    loadLastVisited,
    getActiveWorkshops,
    getUserStats
  }
}
