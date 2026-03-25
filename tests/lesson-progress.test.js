import { describe, it, expect, beforeEach } from 'vitest'
import { useProgress } from '../src/composables/useProgress'

describe('Lesson Progress', () => {
  let p

  beforeEach(() => {
    localStorage.clear()
    p = useProgress()
    p.lessonProgress.value = {}
    p.loadProgress()
  })

  describe('Lesson Status', () => {
    it('should return null for unvisited lessons', () => {
      expect(p.getLessonStatus('deutsch', 'portugiesisch', 1)).toBe(null)
    })

    it('should mark lesson as visited', () => {
      p.markLessonVisited('deutsch', 'portugiesisch', 1)
      expect(p.getLessonStatus('deutsch', 'portugiesisch', 1)).toBe('visited')
    })

    it('should not downgrade completed to visited', () => {
      p.setLessonStatus('deutsch', 'portugiesisch', 1, 'completed')
      p.markLessonVisited('deutsch', 'portugiesisch', 1)
      expect(p.getLessonStatus('deutsch', 'portugiesisch', 1)).toBe('completed')
    })

    it('should toggle lesson completed', () => {
      p.toggleLessonCompleted('deutsch', 'portugiesisch', 1)
      expect(p.isLessonCompleted('deutsch', 'portugiesisch', 1)).toBe(true)

      p.toggleLessonCompleted('deutsch', 'portugiesisch', 1)
      expect(p.isLessonCompleted('deutsch', 'portugiesisch', 1)).toBe(false)
    })

    it('should persist lesson status to localStorage', () => {
      p.setLessonStatus('deutsch', 'portugiesisch', 1, 'completed')
      const saved = JSON.parse(localStorage.getItem('lessonProgress'))
      expect(saved['deutsch:portugiesisch'].status['1']).toBe('completed')
    })
  })

  describe('Favorites', () => {
    it('should return empty array for no favorites', () => {
      expect(p.getFavorites('deutsch', 'portugiesisch')).toEqual([])
    })

    it('should toggle favorite on', () => {
      p.toggleFavorite('deutsch', 'portugiesisch', 4)
      expect(p.isFavorite('deutsch', 'portugiesisch', 4)).toBe(true)
      expect(p.getFavorites('deutsch', 'portugiesisch')).toEqual([4])
    })

    it('should toggle favorite off', () => {
      p.toggleFavorite('deutsch', 'portugiesisch', 4)
      p.toggleFavorite('deutsch', 'portugiesisch', 4)
      expect(p.isFavorite('deutsch', 'portugiesisch', 4)).toBe(false)
    })

    it('should maintain favorite order', () => {
      p.toggleFavorite('deutsch', 'portugiesisch', 7)
      p.toggleFavorite('deutsch', 'portugiesisch', 4)
      p.toggleFavorite('deutsch', 'portugiesisch', 9)
      expect(p.getFavorites('deutsch', 'portugiesisch')).toEqual([7, 4, 9])
    })

    it('should reorder favorites', () => {
      p.toggleFavorite('deutsch', 'portugiesisch', 7)
      p.toggleFavorite('deutsch', 'portugiesisch', 4)
      p.toggleFavorite('deutsch', 'portugiesisch', 9)
      p.reorderFavorites('deutsch', 'portugiesisch', [4, 9, 7])
      expect(p.getFavorites('deutsch', 'portugiesisch')).toEqual([4, 9, 7])
    })

    it('should persist favorites to localStorage', () => {
      p.toggleFavorite('deutsch', 'portugiesisch', 3)
      const saved = JSON.parse(localStorage.getItem('lessonProgress'))
      expect(saved['deutsch:portugiesisch'].favorites).toEqual([3])
    })
  })

  describe('Completion Count', () => {
    it('should return 0 completed for fresh workshop', () => {
      const { completed, total } = p.getCompletionCount('deutsch', 'portugiesisch', 10)
      expect(completed).toBe(0)
      expect(total).toBe(10)
    })

    it('should count completed lessons', () => {
      p.setLessonStatus('deutsch', 'portugiesisch', 1, 'completed')
      p.setLessonStatus('deutsch', 'portugiesisch', 3, 'completed')
      p.setLessonStatus('deutsch', 'portugiesisch', 2, 'visited')
      const { completed, total } = p.getCompletionCount('deutsch', 'portugiesisch', 10)
      expect(completed).toBe(2)
      expect(total).toBe(10)
    })
  })

  describe('Next Lesson', () => {
    it('should return 1 for fresh workshop', () => {
      expect(p.getNextLesson('deutsch', 'portugiesisch', 10)).toBe(1)
    })

    it('should return first non-completed lesson', () => {
      p.setLessonStatus('deutsch', 'portugiesisch', 1, 'completed')
      p.setLessonStatus('deutsch', 'portugiesisch', 2, 'completed')
      expect(p.getNextLesson('deutsch', 'portugiesisch', 10)).toBe(3)
    })

    it('should return skipped lesson before later ones', () => {
      p.setLessonStatus('deutsch', 'portugiesisch', 1, 'completed')
      p.setLessonStatus('deutsch', 'portugiesisch', 2, 'completed')
      p.setLessonStatus('deutsch', 'portugiesisch', 3, 'completed')
      p.setLessonStatus('deutsch', 'portugiesisch', 5, 'completed')
      expect(p.getNextLesson('deutsch', 'portugiesisch', 10)).toBe(4)
    })

    it('should prefer favorites over sequential order', () => {
      p.toggleFavorite('deutsch', 'portugiesisch', 7)
      p.setLessonStatus('deutsch', 'portugiesisch', 1, 'completed')
      expect(p.getNextLesson('deutsch', 'portugiesisch', 10)).toBe(7)
    })

    it('should skip completed favorites', () => {
      p.toggleFavorite('deutsch', 'portugiesisch', 7)
      p.toggleFavorite('deutsch', 'portugiesisch', 9)
      p.setLessonStatus('deutsch', 'portugiesisch', 7, 'completed')
      expect(p.getNextLesson('deutsch', 'portugiesisch', 10)).toBe(9)
    })

    it('should return null when all completed', () => {
      for (let i = 1; i <= 3; i++) {
        p.setLessonStatus('deutsch', 'portugiesisch', i, 'completed')
      }
      expect(p.getNextLesson('deutsch', 'portugiesisch', 3)).toBe(null)
    })
  })
})
