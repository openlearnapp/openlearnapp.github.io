import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLessons } from '../src/composables/useLessons'

describe('useLessons', () => {
  let lessons

  beforeEach(() => {
    localStorage.clear()
    lessons = useLessons()
    // Reset state
    lessons.availableContent.value = {}
    lessons.languageCodes.value = {}
    lessons.workshopCodes.value = {}
  })

  describe('content sources (localStorage)', () => {
    it('returns empty array when no sources', () => {
      expect(lessons.getContentSources()).toEqual([])
    })

    it('returns saved content sources', () => {
      localStorage.setItem('contentSources', JSON.stringify(['https://example.com/workshop']))
      expect(lessons.getContentSources()).toEqual(['https://example.com/workshop'])
    })

    it('handles invalid JSON in contentSources', () => {
      localStorage.setItem('contentSources', 'invalid')
      expect(lessons.getContentSources()).toEqual([])
    })

    it('adds a content source', () => {
      lessons.addContentSource('https://example.com/workshop')
      const sources = lessons.getContentSources()
      expect(sources).toContain('https://example.com/workshop')
    })

    it('does not add duplicate sources', () => {
      lessons.addContentSource('https://example.com/workshop')
      lessons.addContentSource('https://example.com/workshop')
      const sources = lessons.getContentSources()
      expect(sources.length).toBe(1)
    })

    it('removes a content source', () => {
      lessons.addContentSource('https://a.com')
      lessons.addContentSource('https://b.com')
      lessons.removeContentSource('https://a.com')
      const sources = lessons.getContentSources()
      expect(sources).toEqual(['https://b.com'])
    })
  })

  describe('workshop resolution', () => {
    it('returns workshop key as-is when not remote', () => {
      expect(lessons.resolveWorkshopKey('deutsch', 'portugiesisch')).toBe('portugiesisch')
    })

    it('returns false for non-remote workshops', () => {
      expect(lessons.isRemoteWorkshop('deutsch', 'portugiesisch')).toBe(false)
    })

    it('returns null for unknown slug', () => {
      expect(lessons.getSourceForSlug('deutsch', 'unknown')).toBeNull()
    })
  })

  describe('workshop metadata', () => {
    it('returns empty metadata for unknown workshop', () => {
      const meta = lessons.getWorkshopMeta('de', 'unknown')
      expect(meta.title).toBeNull()
      expect(meta.description).toBeNull()
    })
  })

  describe('share URL', () => {
    it('returns null for non-remote workshop', () => {
      expect(lessons.getShareUrl('portugiesisch')).toBeNull()
    })
  })

  describe('language and workshop codes', () => {
    it('returns null for unknown language code', () => {
      expect(lessons.getLanguageCode('unknown')).toBeNull()
    })

    it('returns stored language code', () => {
      lessons.languageCodes.value = { 'deutsch': 'de-DE' }
      expect(lessons.getLanguageCode('deutsch')).toBe('de-DE')
    })

    it('returns null for unknown workshop code', () => {
      expect(lessons.getWorkshopCode('de', 'unknown')).toBeNull()
    })

    it('returns workshop code when available', () => {
      lessons.workshopCodes.value = { 'deutsch': { 'portugiesisch': 'pt-PT' } }
      expect(lessons.getWorkshopCode('deutsch', 'portugiesisch')).toBe('pt-PT')
    })

    it('falls back to language code when workshop code missing', () => {
      lessons.languageCodes.value = { 'deutsch': 'de-DE' }
      lessons.workshopCodes.value = { 'deutsch': {} }
      expect(lessons.getWorkshopCode('deutsch', 'unknown')).toBe('de-DE')
    })
  })

  describe('loading state', () => {
    it('starts not loading', () => {
      expect(lessons.isLoading.value).toBe(false)
    })
  })

  describe('loadAvailableContent', () => {
    it('handles fetch failure gracefully', async () => {
      // Mock fetch to fail
      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await lessons.loadAvailableContent()

      expect(lessons.isLoading.value).toBe(false)
      globalThis.fetch = originalFetch
    })

    it('handles non-ok response', async () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })

      await lessons.loadAvailableContent()

      expect(lessons.isLoading.value).toBe(false)
      globalThis.fetch = originalFetch
    })

    it('parses index.yaml and populates content', async () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('languages:\n  - folder: deutsch\n    code: de-DE\n  - folder: english\n    code: en-US')
      })

      await lessons.loadAvailableContent()

      expect(lessons.availableContent.value).toHaveProperty('deutsch')
      expect(lessons.availableContent.value).toHaveProperty('english')
      expect(lessons.languageCodes.value['deutsch']).toBe('de-DE')
      expect(lessons.languageCodes.value['english']).toBe('en-US')
      expect(lessons.isLoading.value).toBe(false)

      globalThis.fetch = originalFetch
    })

    it('handles backward-compatible string format', async () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('languages:\n  - deutsch')
      })

      await lessons.loadAvailableContent()

      expect(lessons.availableContent.value).toHaveProperty('deutsch')

      globalThis.fetch = originalFetch
    })
  })


  describe('loadLesson', () => {
    it('parses lesson content.yaml', async () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('number: 1\ntitle: Test Lesson\nsections:\n  - title: Section 1\n    examples:\n      - q: Question\n        a: Answer')
      })

      const lesson = await lessons.loadLesson('deutsch', 'portugiesisch', '01-test')

      expect(lesson).not.toBeNull()
      expect(lesson.number).toBe(1)
      expect(lesson.title).toBe('Test Lesson')
      expect(lesson.sections).toHaveLength(1)
      expect(lesson.sections[0].examples[0].q).toBe('Question')

      globalThis.fetch = originalFetch
    })

    it('returns null on fetch failure', async () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })

      const lesson = await lessons.loadLesson('deutsch', 'portugiesisch', '01-test')
      expect(lesson).toBeNull()

      globalThis.fetch = originalFetch
    })

  })
})
