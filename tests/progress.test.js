import { describe, it, expect, beforeEach } from 'vitest'
import { useProgress } from '../src/composables/useProgress'

describe('useProgress', () => {
  let progress

  beforeEach(() => {
    localStorage.clear()
    progress = useProgress()
    progress.progress.value = {}
  })

  describe('isItemLearned', () => {
    it('returns false for unlearned item', () => {
      expect(progress.isItemLearned('de', 'pt', 'sei')).toBe(false)
    })

    it('returns true for learned item', () => {
      progress.progress.value = { 'de:pt': { 'sei': true } }
      expect(progress.isItemLearned('de', 'pt', 'sei')).toBe(true)
    })

    it('returns false for unknown workshop', () => {
      expect(progress.isItemLearned('de', 'unknown', 'sei')).toBe(false)
    })
  })

  describe('toggleItemLearned', () => {
    it('marks item as learned', () => {
      progress.toggleItemLearned('de', 'pt', 'sei')
      expect(progress.isItemLearned('de', 'pt', 'sei')).toBe(true)
    })

    it('unmarks learned item', () => {
      progress.toggleItemLearned('de', 'pt', 'sei')
      progress.toggleItemLearned('de', 'pt', 'sei')
      expect(progress.isItemLearned('de', 'pt', 'sei')).toBe(false)
    })

    it('persists to localStorage', () => {
      progress.toggleItemLearned('de', 'pt', 'sei')
      const stored = JSON.parse(localStorage.getItem('progress'))
      expect(stored['de:pt']['sei']).toBeGreaterThan(0)
    })

    it('creates workshop key if missing', () => {
      progress.toggleItemLearned('en', 'de', 'hello')
      expect(progress.progress.value['en:de']).toBeDefined()
      expect(progress.progress.value['en:de']['hello']).toBeGreaterThan(0)
    })

    it('handles multiple items in same workshop', () => {
      progress.toggleItemLearned('de', 'pt', 'sei')
      progress.toggleItemLearned('de', 'pt', 'estar')
      expect(progress.isItemLearned('de', 'pt', 'sei')).toBe(true)
      expect(progress.isItemLearned('de', 'pt', 'estar')).toBe(true)
    })

    it('handles multiple workshops independently', () => {
      progress.toggleItemLearned('de', 'pt', 'sei')
      progress.toggleItemLearned('de', 'es', 'ser')
      expect(progress.isItemLearned('de', 'pt', 'sei')).toBe(true)
      expect(progress.isItemLearned('de', 'es', 'ser')).toBe(true)
      expect(progress.isItemLearned('de', 'pt', 'ser')).toBe(false)
    })
  })

  describe('areAllItemsLearned', () => {
    it('returns false for empty items', () => {
      expect(progress.areAllItemsLearned('de', 'pt', [])).toBe(false)
    })

    it('returns false for null items', () => {
      expect(progress.areAllItemsLearned('de', 'pt', null)).toBe(false)
    })

    it('returns false when no items are learned', () => {
      const items = [['sei', 'weiß'], ['estar', 'sein']]
      expect(progress.areAllItemsLearned('de', 'pt', items)).toBe(false)
    })

    it('returns false when only some items are learned', () => {
      progress.toggleItemLearned('de', 'pt', 'sei')
      const items = [['sei', 'weiß'], ['estar', 'sein']]
      expect(progress.areAllItemsLearned('de', 'pt', items)).toBe(false)
    })

    it('returns true when all items are learned', () => {
      progress.toggleItemLearned('de', 'pt', 'sei')
      progress.toggleItemLearned('de', 'pt', 'estar')
      const items = [['sei', 'weiß'], ['estar', 'sein']]
      expect(progress.areAllItemsLearned('de', 'pt', items)).toBe(true)
    })

    it('uses first element as item ID', () => {
      progress.toggleItemLearned('de', 'pt', 'sei')
      const items = [['sei', 'weiß', 'saber - ich weiß']]
      expect(progress.areAllItemsLearned('de', 'pt', items)).toBe(true)
    })
  })

  describe('loadProgress', () => {
    it('loads from localStorage', () => {
      localStorage.setItem('progress', JSON.stringify({
        'de:pt': { 'sei': true, 'estar': true }
      }))

      progress.loadProgress()

      expect(progress.isItemLearned('de', 'pt', 'sei')).toBe(true)
      expect(progress.isItemLearned('de', 'pt', 'estar')).toBe(true)
    })

    it('handles invalid JSON gracefully', () => {
      localStorage.setItem('progress', 'invalid json')
      progress.loadProgress()
      expect(progress.progress.value).toEqual({})
    })

    it('handles missing localStorage key', () => {
      progress.loadProgress()
      expect(progress.progress.value).toEqual({})
    })
  })

  describe('getProgress', () => {
    it('returns raw progress object', () => {
      progress.toggleItemLearned('de', 'pt', 'sei')
      const raw = progress.getProgress()
      expect(raw['de:pt']['sei']).toBeGreaterThan(0)
    })
  })

  describe('mergeProgress', () => {
    it('merges imported progress into existing', () => {
      progress.toggleItemLearned('de', 'pt', 'sei')

      progress.mergeProgress({
        'de:pt': { 'estar': true },
        'en:de': { 'hello': true }
      })

      expect(progress.isItemLearned('de', 'pt', 'sei')).toBe(true)
      expect(progress.isItemLearned('de', 'pt', 'estar')).toBe(true)
      expect(progress.isItemLearned('en', 'de', 'hello')).toBe(true)
    })

    it('does not overwrite existing items', () => {
      progress.toggleItemLearned('de', 'pt', 'sei')
      progress.mergeProgress({ 'de:pt': { 'estar': true } })
      expect(progress.isItemLearned('de', 'pt', 'sei')).toBe(true)
    })

    it('persists merged progress to localStorage', () => {
      progress.mergeProgress({ 'de:pt': { 'sei': true } })
      const stored = JSON.parse(localStorage.getItem('progress'))
      // Legacy true is treated as timestamp 1 during merge
      expect(stored['de:pt']['sei']).toBeGreaterThan(0)
    })
  })
})
