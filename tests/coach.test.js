import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCoach } from '../src/composables/useCoach'

// Mock useAssessments and useProgress
vi.mock('../src/composables/useAssessments', () => ({
  useAssessments: () => ({ getAnswer: vi.fn().mockReturnValue(null) })
}))

vi.mock('../src/composables/useProgress', () => ({
  useProgress: () => ({ isItemLearned: vi.fn().mockReturnValue(false) })
}))

vi.mock('../src/utils/formatters', () => ({
  formatLangName: (name) => name
}))

describe('useCoach', () => {
  let coach

  beforeEach(() => {
    localStorage.clear()
    // Reset module-level state by re-importing
    vi.resetModules()
    coach = useCoach()
    coach.chatHistory.value = {}
    coach.coachLessons.value = {}
    coach.error.value = ''
  })

  describe('chat history', () => {
    it('returns empty messages for new workshop', () => {
      const messages = coach.getMessages('english', 'open-learn-guide')
      expect(messages).toEqual([])
    })

    it('persists and loads chat history', () => {
      localStorage.setItem('coachChat', JSON.stringify({
        'english:myworkshop': [{ role: 'user', content: 'Hello', timestamp: '2026-01-01T00:00:00Z' }]
      }))
      coach.loadChatHistory()
      const messages = coach.getMessages('english', 'myworkshop')
      expect(messages).toHaveLength(1)
      expect(messages[0].content).toBe('Hello')
    })

    it('clears chat for a workshop', () => {
      coach.chatHistory.value['english:myworkshop'] = [{ role: 'user', content: 'Hi', timestamp: '' }]
      coach.clearChat('english', 'myworkshop')
      expect(coach.getMessages('english', 'myworkshop')).toEqual([])
    })

    it('handles invalid localStorage JSON gracefully', () => {
      localStorage.setItem('coachChat', 'not-valid-json')
      expect(() => coach.loadChatHistory()).not.toThrow()
      expect(coach.chatHistory.value).toEqual({})
    })
  })

  describe('coach lessons', () => {
    it('returns empty lessons for new workshop', () => {
      const lessons = coach.getCoachLessons('english', 'open-learn-guide')
      expect(lessons).toEqual([])
    })

    it('persists coach lessons', () => {
      const lesson = { title: 'Test Lesson', sections: [], _generatedAt: '2026-01-01T00:00:00Z', _coachGenerated: true }
      localStorage.setItem('coachLessons', JSON.stringify({ 'english:myworkshop': [lesson] }))
      coach.loadChatHistory()
      const lessons = coach.getCoachLessons('english', 'myworkshop')
      expect(lessons).toHaveLength(1)
      expect(lessons[0].title).toBe('Test Lesson')
    })

    it('clears coach lessons for a workshop', () => {
      coach.coachLessons.value['english:myworkshop'] = [{ title: 'Test', sections: [] }]
      coach.clearCoachLessons('english', 'myworkshop')
      expect(coach.getCoachLessons('english', 'myworkshop')).toEqual([])
    })
  })

  describe('formatResultsAsText', () => {
    it('returns formatted text for a workshop', () => {
      const lessons = [
        {
          number: 1,
          title: 'Lesson One',
          sections: [{ title: 'Section A', examples: [] }]
        }
      ]
      const text = coach.formatResultsAsText('english', 'myworkshop', lessons)
      expect(text).toContain('Assessment Results for myworkshop')
      expect(text).toContain('Lesson 1: Lesson One')
    })

    it('returns empty result for no lessons', () => {
      const text = coach.formatResultsAsText('english', 'myworkshop', [])
      expect(text).toContain('Assessment Results for myworkshop')
    })
  })

  describe('sendMessage', () => {
    it('adds user and assistant messages on success', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Hello from coach!' })
      })

      await coach.sendMessage('https://coach.example.com', 'english', 'myworkshop', 'How am I doing?', [])

      const messages = coach.getMessages('english', 'myworkshop')
      expect(messages.some(m => m.role === 'user' && m.content === 'How am I doing?')).toBe(true)
      expect(messages.some(m => m.role === 'assistant' && m.content === 'Hello from coach!')).toBe(true)
    })

    it('sends type:chat in the request body', async () => {
      let capturedBody = null
      global.fetch = vi.fn().mockImplementationOnce(async (url, opts) => {
        capturedBody = JSON.parse(opts.body)
        return { ok: true, json: async () => ({ response: 'ok' }) }
      })

      await coach.sendMessage('https://coach.example.com', 'english', 'myworkshop', 'test', [])

      expect(capturedBody.type).toBe('chat')
      expect(capturedBody.message).toBe('test')
      expect(capturedBody.session_id).toBeTruthy()
    })

    it('adds error message on failed fetch', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 })

      await coach.sendMessage('https://coach.example.com', 'english', 'myworkshop', 'test', [])

      const messages = coach.getMessages('english', 'myworkshop')
      expect(messages.some(m => m.role === 'error')).toBe(true)
    })

    it('includes session_id consistently across messages', async () => {
      const sessionIds = []
      global.fetch = vi.fn().mockImplementation(async (url, opts) => {
        sessionIds.push(JSON.parse(opts.body).session_id)
        return { ok: true, json: async () => ({ response: 'ok' }) }
      })

      await coach.sendMessage('https://coach.example.com', 'english', 'same-workshop', 'msg1', [])
      await coach.sendMessage('https://coach.example.com', 'english', 'same-workshop', 'msg2', [])

      expect(sessionIds[0]).toBe(sessionIds[1])
    })
  })

  describe('requestFeedback', () => {
    it('sends type:assessment payload', async () => {
      let capturedBody = null
      global.fetch = vi.fn().mockImplementationOnce(async (url, opts) => {
        capturedBody = JSON.parse(opts.body)
        return { ok: true, json: async () => ({ response: 'Great progress!' }) }
      })

      const lessons = [{ number: 1, title: 'L1', sections: [] }]
      await coach.requestFeedback('https://coach.example.com', 'english', 'myworkshop', lessons)

      expect(capturedBody.type).toBe('assessment')
      expect(capturedBody.payload.lessons).toHaveLength(1)
    })
  })

  describe('requestCustomLesson', () => {
    it('saves generated lesson to coachLessons', async () => {
      const generatedLesson = { title: 'Custom Practice', sections: [], description: 'Focus on weak areas' }
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: 'custom_lesson', lesson: generatedLesson })
      })

      await coach.requestCustomLesson('https://coach.example.com', 'english', 'myworkshop', [])

      const saved = coach.getCoachLessons('english', 'myworkshop')
      expect(saved).toHaveLength(1)
      expect(saved[0].title).toBe('Custom Practice')
      expect(saved[0]._coachGenerated).toBe(true)
    })

    it('sends type:generate_lesson payload', async () => {
      let capturedBody = null
      global.fetch = vi.fn().mockImplementationOnce(async (url, opts) => {
        capturedBody = JSON.parse(opts.body)
        return { ok: true, json: async () => ({ type: 'custom_lesson', lesson: { title: 'T', sections: [] } }) }
      })

      await coach.requestCustomLesson('https://coach.example.com', 'english', 'myworkshop', [])

      expect(capturedBody.type).toBe('generate_lesson')
    })
  })
})
