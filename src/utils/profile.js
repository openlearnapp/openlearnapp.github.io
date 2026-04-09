export const PROFILE_KEY = 'profileData'
export const STREAK_KEY = 'profileStreak'
export const STREAK_LAST_KEY = 'profileStreakLastDate'

export function loadProfileData() {
  try {
    const stored = localStorage.getItem(PROFILE_KEY)
    return stored ? JSON.parse(stored) : { displayName: '', nativeLanguage: '', learningGoal: '' }
  } catch {
    return { displayName: '', nativeLanguage: '', learningGoal: '' }
  }
}

export function simpleHash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i)
    h = h & 0xffffffff
  }
  return Math.abs(h)
}

/**
 * Compute the new streak value for a given today date string (YYYY-MM-DD).
 * Pure function — reads localStorage but does not write.
 */
export function computeStreak(today) {
  const last = localStorage.getItem(STREAK_LAST_KEY)
  if (last === today) return parseInt(localStorage.getItem(STREAK_KEY) || '0', 10)
  const yesterday = new Date(new Date(today + 'T00:00:00Z').getTime() - 86400000)
    .toISOString().slice(0, 10)
  const current = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10)
  return last === yesterday ? current + 1 : 1
}

export function calcTotalLearned(progressObj) {
  let count = 0
  for (const items of Object.values(progressObj)) {
    count += Object.values(items).filter(v => v === true || (typeof v === 'number' && v > 0)).length
  }
  return count
}

export function calcTotalAssessments(assessmentsObj) {
  let count = 0
  for (const lesson of Object.values(assessmentsObj)) {
    count += Object.values(lesson).filter(v => v && !v._cleared).length
  }
  return count
}
