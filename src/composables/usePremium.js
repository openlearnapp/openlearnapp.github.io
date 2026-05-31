import { ref } from 'vue'

const STORAGE_KEY = 'paidWorkshops:unlocked'

function readMap() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeMap(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

const unlocked = ref(readMap())

function workshopKey(lang, workshop) {
  return `${lang}/${workshop}`
}

export function usePremium() {
  function isUnlocked(lang, workshop) {
    return unlocked.value[workshopKey(lang, workshop)] === true
  }

  function unlock(lang, workshop) {
    const map = readMap()
    map[workshopKey(lang, workshop)] = true
    writeMap(map)
    unlocked.value = map
  }

  function lock(lang, workshop) {
    const map = readMap()
    delete map[workshopKey(lang, workshop)]
    writeMap(map)
    unlocked.value = map
  }

  function isLessonFree(meta, lessonIndex, lessonNumber) {
    if (!meta?.premium) return true
    if (Array.isArray(meta.free_lesson_numbers) && meta.free_lesson_numbers.length > 0) {
      return meta.free_lesson_numbers.includes(lessonNumber) ||
             meta.free_lesson_numbers.includes(lessonIndex)
    }
    const n = Number(meta.free_lessons)
    if (!Number.isFinite(n) || n <= 0) return false
    return lessonIndex < n
  }

  function isLessonAccessible(meta, lessonIndex, lessonNumber, lang, workshop) {
    if (!meta?.premium) return true
    if (isUnlocked(lang, workshop)) return true
    return isLessonFree(meta, lessonIndex, lessonNumber)
  }

  return {
    unlocked,
    isUnlocked,
    unlock,
    lock,
    isLessonFree,
    isLessonAccessible
  }
}
