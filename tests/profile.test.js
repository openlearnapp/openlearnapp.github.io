import { describe, it, expect, beforeEach } from 'vitest'
import {
  PROFILE_KEY, STREAK_KEY, STREAK_LAST_KEY,
  loadProfileData, simpleHash, computeStreak,
  calcTotalLearned, calcTotalAssessments
} from '../src/utils/profile'

// --- loadProfileData ---
describe('loadProfileData', () => {
  beforeEach(() => localStorage.clear())

  it('returns empty defaults when nothing stored', () => {
    const data = loadProfileData()
    expect(data).toEqual({ displayName: '', nativeLanguage: '', learningGoal: '' })
  })

  it('returns stored data', () => {
    const stored = { displayName: 'Reza', nativeLanguage: 'Farsi', learningGoal: 'Deutsch lernen' }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(stored))
    expect(loadProfileData()).toEqual(stored)
  })

  it('returns defaults on invalid JSON', () => {
    localStorage.setItem(PROFILE_KEY, '{invalid}')
    const data = loadProfileData()
    expect(data.displayName).toBe('')
  })
})

// --- simpleHash ---
describe('simpleHash', () => {
  it('returns a non-negative integer', () => {
    expect(simpleHash('alice')).toBeGreaterThanOrEqual(0)
  })

  it('is deterministic', () => {
    expect(simpleHash('test')).toBe(simpleHash('test'))
  })

  it('returns different values for different inputs', () => {
    expect(simpleHash('alice')).not.toBe(simpleHash('bob'))
  })

  it('handles empty string', () => {
    expect(typeof simpleHash('')).toBe('number')
  })
})

// --- computeStreak ---
describe('computeStreak', () => {
  beforeEach(() => localStorage.clear())

  it('returns 1 on first day (no prior streak)', () => {
    expect(computeStreak('2026-03-17')).toBe(1)
  })

  it('increments streak when last was yesterday', () => {
    localStorage.setItem(STREAK_KEY, '4')
    localStorage.setItem(STREAK_LAST_KEY, '2026-03-16')
    expect(computeStreak('2026-03-17')).toBe(5)
  })

  it('resets streak to 1 when gap > 1 day', () => {
    localStorage.setItem(STREAK_KEY, '10')
    localStorage.setItem(STREAK_LAST_KEY, '2026-03-10')
    expect(computeStreak('2026-03-17')).toBe(1)
  })

  it('returns existing value when called on same day again', () => {
    localStorage.setItem(STREAK_KEY, '7')
    localStorage.setItem(STREAK_LAST_KEY, '2026-03-17')
    expect(computeStreak('2026-03-17')).toBe(7)
  })
})

// --- calcTotalLearned ---
describe('calcTotalLearned', () => {
  it('counts all true values across all keys', () => {
    const progress = {
      'deutsch:spanisch': { a: true, b: false, c: true },
      'english:farsi': { x: true, y: true }
    }
    expect(calcTotalLearned(progress)).toBe(4)
  })

  it('returns 0 for empty progress', () => {
    expect(calcTotalLearned({})).toBe(0)
  })
})

// --- calcTotalAssessments ---
describe('calcTotalAssessments', () => {
  it('counts all answered assessments', () => {
    const assessments = {
      'lesson-1': { q1: 'a', q2: 'b' },
      'lesson-2': { q1: 'c' }
    }
    expect(calcTotalAssessments(assessments)).toBe(3)
  })

  it('returns 0 for empty assessments', () => {
    expect(calcTotalAssessments({})).toBe(0)
  })
})
