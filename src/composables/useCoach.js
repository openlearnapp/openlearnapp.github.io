import { ref } from 'vue'
import { useAssessments } from './useAssessments'
import { useProgress } from './useProgress'
import { formatLangName } from '../utils/formatters'

// Chat history per workshop: { "learning:workshop": [{ role, content, timestamp }] }
const chatHistory = ref({})

// SA-generated lessons per workshop: { "learning:workshop": [lesson, ...] }
const coachLessons = ref({})

const isLoading = ref(false)
const error = ref('')

// Session ID per workshop for SA context continuity
const sessionIds = ref({})

function getChatKey(learning, workshop) {
  return `${learning}:${workshop}`
}

function getOrCreateSessionId(learning, workshop) {
  const key = getChatKey(learning, workshop)
  if (!sessionIds.value[key]) {
    sessionIds.value[key] = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
  return sessionIds.value[key]
}

function loadChatHistory() {
  const saved = localStorage.getItem('coachChat')
  if (saved) {
    try { chatHistory.value = JSON.parse(saved) } catch { chatHistory.value = {} }
  }
  const savedLessons = localStorage.getItem('coachLessons')
  if (savedLessons) {
    try { coachLessons.value = JSON.parse(savedLessons) } catch { coachLessons.value = {} }
  }
}

function saveChatHistory() {
  localStorage.setItem('coachChat', JSON.stringify(chatHistory.value))
}

function saveCoachLessons() {
  localStorage.setItem('coachLessons', JSON.stringify(coachLessons.value))
}

function getMessages(learning, workshop) {
  const key = getChatKey(learning, workshop)
  return chatHistory.value[key] || []
}

function getCoachLessons(learning, workshop) {
  const key = getChatKey(learning, workshop)
  return coachLessons.value[key] || []
}

function addMessage(learning, workshop, role, content) {
  const key = getChatKey(learning, workshop)
  if (!chatHistory.value[key]) chatHistory.value[key] = []
  chatHistory.value[key].push({ role, content, timestamp: new Date().toISOString() })
  saveChatHistory()
}

function clearChat(learning, workshop) {
  const key = getChatKey(learning, workshop)
  delete chatHistory.value[key]
  delete sessionIds.value[key]
  saveChatHistory()
}

function clearCoachLessons(learning, workshop) {
  const key = getChatKey(learning, workshop)
  delete coachLessons.value[key]
  saveCoachLessons()
}

// Format assessment results as plain text for the agent context
function formatResultsAsText(learning, workshop, lessons) {
  const { getAnswer } = useAssessments()
  const { isItemLearned } = useProgress()

  const lines = []
  lines.push(`Assessment Results for ${formatLangName(workshop)}`)
  lines.push('')

  for (const lesson of lessons) {
    lines.push(`Lesson ${lesson.number}: ${lesson.title}`)
    let learnedCount = 0
    let totalItems = 0
    const itemsSeen = new Set()

    lesson.sections.forEach((section, sIdx) => {
      const sectionResults = []
      section.examples.forEach((example, eIdx) => {
        if (example.rel) {
          example.rel.forEach(item => {
            const id = item[0]
            if (!itemsSeen.has(id)) {
              itemsSeen.add(id)
              totalItems++
              if (isItemLearned(learning, workshop, id)) learnedCount++
            }
          })
        }
        const type = example.type || 'qa'
        if (type === 'qa') return
        const saved = getAnswer(learning, workshop, lesson.number, sIdx, eIdx)
        if (saved) {
          const mark = saved.correct === true ? 'correct' : saved.correct === false ? 'incorrect' : 'answered'
          sectionResults.push(`  Q: ${example.q} → A: ${saved.answer} (${mark})`)
        } else {
          sectionResults.push(`  Q: ${example.q} → (not answered)`)
        }
      })
      if (sectionResults.length > 0) {
        lines.push(`  Section: ${section.title}`)
        lines.push(...sectionResults)
      }
    })

    if (totalItems > 0) lines.push(`  Learning items: ${learnedCount}/${totalItems} learned`)
    lines.push('')
  }

  return lines.join('\n')
}

// Build structured assessment payload
function buildAssessmentPayload(learning, workshop, lessons) {
  const { getAnswer } = useAssessments()
  const { isItemLearned } = useProgress()

  return lessons.map(lesson => {
    const itemsSeen = new Set()
    let learnedCount = 0
    let totalItems = 0
    const sections = lesson.sections.map((section, sIdx) => {
      const answers = []
      section.examples.forEach((example, eIdx) => {
        if (example.rel) {
          example.rel.forEach(item => {
            const id = item[0]
            if (!itemsSeen.has(id)) {
              itemsSeen.add(id)
              totalItems++
              if (isItemLearned(learning, workshop, id)) learnedCount++
            }
          })
        }
        const type = example.type || 'qa'
        if (type === 'qa') return
        const saved = getAnswer(learning, workshop, lesson.number, sIdx, eIdx)
        answers.push({
          question: example.q,
          type,
          answered: !!saved,
          correct: saved?.correct ?? null,
          answer: saved?.answer ?? null
        })
      })
      return { title: section.title, answers }
    })
    return {
      number: lesson.number,
      title: lesson.title,
      learnedItems: learnedCount,
      totalItems,
      sections
    }
  })
}

// Send a chat message to the service agent
async function sendMessage(coachUrl, learning, workshop, userMessage, lessons) {
  error.value = ''
  isLoading.value = true
  addMessage(learning, workshop, 'user', userMessage)

  try {
    const context = formatResultsAsText(learning, workshop, lessons)
    const sessionId = getOrCreateSessionId(learning, workshop)

    const response = await fetch(coachUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'chat',
        session_id: sessionId,
        message: userMessage,
        context
      })
    })

    if (!response.ok) throw new Error(`Coach responded with ${response.status}`)

    const data = await response.json()
    const reply = data.response || data.message || data.text || JSON.stringify(data)
    addMessage(learning, workshop, 'assistant', reply)
    return reply
  } catch (e) {
    error.value = e.message
    addMessage(learning, workshop, 'error', e.message)
    return null
  } finally {
    isLoading.value = false
  }
}

// Request assessment feedback from coach
async function requestFeedback(coachUrl, learning, workshop, lessons) {
  error.value = ''
  isLoading.value = true
  addMessage(learning, workshop, 'user', '📊 Requesting feedback on my assessment results...')

  try {
    const sessionId = getOrCreateSessionId(learning, workshop)
    const assessmentData = buildAssessmentPayload(learning, workshop, lessons)

    const response = await fetch(coachUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'assessment',
        session_id: sessionId,
        payload: { lessons: assessmentData }
      })
    })

    if (!response.ok) throw new Error(`Coach responded with ${response.status}`)

    const data = await response.json()
    const reply = data.response || data.feedback || data.message || JSON.stringify(data)
    addMessage(learning, workshop, 'assistant', reply)
    return reply
  } catch (e) {
    error.value = e.message
    addMessage(learning, workshop, 'error', e.message)
    return null
  } finally {
    isLoading.value = false
  }
}

// Request a custom practice lesson from coach
async function requestCustomLesson(coachUrl, learning, workshop, lessons) {
  error.value = ''
  isLoading.value = true
  addMessage(learning, workshop, 'user', '📚 Requesting a custom practice lesson for my weak areas...')

  try {
    const sessionId = getOrCreateSessionId(learning, workshop)
    const assessmentData = buildAssessmentPayload(learning, workshop, lessons)

    const response = await fetch(coachUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'generate_lesson',
        session_id: sessionId,
        payload: { lessons: assessmentData }
      })
    })

    if (!response.ok) throw new Error(`Coach responded with ${response.status}`)

    const data = await response.json()

    if (data.type === 'custom_lesson' && data.lesson) {
      const key = getChatKey(learning, workshop)
      if (!coachLessons.value[key]) coachLessons.value[key] = []
      coachLessons.value[key].push({
        ...data.lesson,
        _generatedAt: new Date().toISOString(),
        _coachGenerated: true
      })
      saveCoachLessons()
      addMessage(learning, workshop, 'assistant', `✅ I generated a custom lesson: "${data.lesson.title}". You can find it in your Coach Lessons.`)
      return data.lesson
    }

    const reply = data.response || data.message || 'Lesson generated.'
    addMessage(learning, workshop, 'assistant', reply)
    return null
  } catch (e) {
    error.value = e.message
    addMessage(learning, workshop, 'error', e.message)
    return null
  } finally {
    isLoading.value = false
  }
}

export function useCoach() {
  return {
    chatHistory,
    coachLessons,
    isLoading,
    error,
    loadChatHistory,
    getMessages,
    getCoachLessons,
    sendMessage,
    requestFeedback,
    requestCustomLesson,
    clearChat,
    clearCoachLessons,
    formatResultsAsText
  }
}
