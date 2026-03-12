<template>
  <div class="flex flex-col h-[calc(100vh-12rem)]">

    <!-- No coach configured — beautiful placeholder -->
    <div v-if="!coachApi" class="flex flex-col items-center justify-center flex-1 text-center px-4">
      <div class="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-4xl mb-4">
        🤖
      </div>
      <h2 class="text-xl font-semibold mb-2">{{ $t('coachView.noCoachTitle') }}</h2>
      <p class="text-sm text-muted-foreground max-w-sm mb-6">
        {{ $t('coachView.noCoachDesc') }}
      </p>

      <!-- What the coach can do -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mb-6 text-left">
        <div class="bg-muted/50 rounded-lg p-3">
          <div class="text-lg mb-1">💬</div>
          <div class="text-sm font-medium">{{ $t('coachView.featureChat') }}</div>
          <div class="text-xs text-muted-foreground mt-1">{{ $t('coachView.featureChatDesc') }}</div>
        </div>
        <div class="bg-muted/50 rounded-lg p-3">
          <div class="text-lg mb-1">📊</div>
          <div class="text-sm font-medium">{{ $t('coachView.featureFeedback') }}</div>
          <div class="text-xs text-muted-foreground mt-1">{{ $t('coachView.featureFeedbackDesc') }}</div>
        </div>
        <div class="bg-muted/50 rounded-lg p-3">
          <div class="text-lg mb-1">📚</div>
          <div class="text-sm font-medium">{{ $t('coachView.featureLessons') }}</div>
          <div class="text-xs text-muted-foreground mt-1">{{ $t('coachView.featureLessonsDesc') }}</div>
        </div>
      </div>

      <p class="text-xs text-muted-foreground max-w-xs">
        {{ $t('coachView.noCoachHint') }}
      </p>
    </div>

    <!-- Coach chat interface -->
    <template v-else>

      <!-- Coach header bar -->
      <div class="flex items-center gap-3 pb-3 border-b mb-3">
        <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
          🤖
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm truncate">{{ coachName || $t('coachView.defaultName') }}</div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            <span class="text-xs text-muted-foreground">{{ $t('coachView.online') }}</span>
          </div>
        </div>
        <div class="flex gap-1 flex-shrink-0">
          <router-link :to="{ name: 'coach-lessons', params: { learning, workshop } }">
            <Button variant="ghost" size="sm" class="h-8 px-2 text-xs">
              📚 {{ $t('coachView.myLessons') }}
            </Button>
          </router-link>
          <Button v-if="messages.length > 0" variant="ghost" size="sm" class="h-8 px-2 text-xs text-muted-foreground" @click="handleClear">
            {{ $t('coachView.clearChat') }}
          </Button>
        </div>
      </div>

      <!-- Chat messages -->
      <div ref="chatContainer" class="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">

        <!-- Welcome screen (empty state) -->
        <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-center px-4">
          <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl mb-3">
            🤖
          </div>
          <p class="text-sm text-muted-foreground mb-4 max-w-xs">
            {{ $t('coachView.description') }}
          </p>
          <div class="flex flex-wrap gap-2 justify-center">
            <Button
              v-for="suggestion in suggestions"
              :key="suggestion"
              variant="outline"
              size="sm"
              class="text-xs"
              @click="sendSuggestion(suggestion)">
              {{ suggestion }}
            </Button>
          </div>
        </div>

        <!-- Message bubbles -->
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="[
            'flex gap-2',
            msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
          ]">

          <!-- Avatar (assistant/error only) -->
          <div
            v-if="msg.role !== 'user'"
            class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm mt-0.5"
            :class="msg.role === 'error' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary/10'">
            {{ msg.role === 'error' ? '⚠️' : '🤖' }}
          </div>

          <!-- Bubble -->
          <div
            :class="[
              'max-w-[82%] rounded-2xl px-3.5 py-2.5',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : msg.role === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-tl-sm'
                  : 'bg-muted text-foreground rounded-tl-sm'
            ]">
            <div class="text-sm leading-relaxed whitespace-pre-wrap">{{ msg.content }}</div>
            <div class="text-xs opacity-50 mt-1 text-right">
              {{ formatTime(msg.timestamp) }}
            </div>
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="isLoading" class="flex gap-2">
          <div class="w-7 h-7 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-sm">🤖</div>
          <div class="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
            <div class="flex gap-1 items-center h-4">
              <span class="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style="animation-delay:0ms"></span>
              <span class="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style="animation-delay:150ms"></span>
              <span class="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style="animation-delay:300ms"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Practice quick action (above input) -->
      <div class="mb-2">
        <Button
          variant="outline"
          size="sm"
          class="w-full text-xs h-8 border-dashed"
          :disabled="isLoading"
          @click="handlePractice">
          📚 {{ $t('coachView.requestPractice') }}
        </Button>
      </div>

      <!-- Input area -->
      <div class="flex gap-2">
        <Input
          ref="inputRef"
          v-model="inputMessage"
          :placeholder="$t('coachView.placeholder')"
          @keyup.enter="send"
          :disabled="isLoading"
          class="flex-1" />
        <Button @click="send" :disabled="isLoading || !inputMessage.trim()" class="px-4">
          {{ $t('coachView.send') }}
        </Button>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLessons } from '../composables/useLessons'
import { useCoach } from '../composables/useCoach'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RouterLink } from 'vue-router'

const route = useRoute()
const { t } = useI18n()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForWorkshop, getWorkshopMeta } = useLessons()
const { isLoading, getMessages, sendMessage, requestCustomLesson, clearChat, loadChatHistory } = useCoach()

const lessons = ref([])
const inputMessage = ref('')
const chatContainer = ref(null)
const inputRef = ref(null)

const learning = computed(() => route.params.learning)
const workshop = computed(() => route.params.workshop)

const coachApi = computed(() => {
  const meta = getWorkshopMeta(learning.value, workshop.value)
  return meta.coach?.api || null
})

const coachName = computed(() => {
  const meta = getWorkshopMeta(learning.value, workshop.value)
  return meta.coach?.name || null
})

const messages = computed(() => getMessages(learning.value, workshop.value))

const suggestions = computed(() => [
  t('coachView.suggestion1'),
  t('coachView.suggestion2'),
  t('coachView.suggestion3')
])

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

async function send() {
  const text = inputMessage.value.trim()
  if (!text || !coachApi.value) return

  inputMessage.value = ''
  await sendMessage(coachApi.value, learning.value, workshop.value, text, lessons.value)
  scrollToBottom()
}

function sendSuggestion(text) {
  inputMessage.value = text
  send()
}

function handleClear() {
  clearChat(learning.value, workshop.value)
}

async function handlePractice() {
  if (!coachApi.value) return
  await requestCustomLesson(coachApi.value, learning.value, workshop.value, lessons.value)
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

// Watch for new messages to auto-scroll
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

// Load data
loadChatHistory()

watch([learning, workshop], async () => {
  if (!learning.value || !workshop.value) return
  lessons.value = await loadAllLessonsForWorkshop(learning.value, workshop.value)
  emit('update-title', coachName.value || t('nav.coach'))
}, { immediate: true })
</script>
