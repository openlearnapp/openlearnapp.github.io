<template>
  <div class="flex flex-col h-[calc(100vh-12rem)]">
    <!-- No coach configured -->
    <div v-if="!coachApi" class="text-center py-8">
      <div class="text-xl text-muted-foreground">
        {{ $t('coachView.noCoach') }}
      </div>
    </div>

    <template v-else>
      <!-- Chat messages -->
      <div ref="chatContainer" class="flex-1 overflow-y-auto space-y-4 mb-4">
        <!-- Welcome message -->
        <div v-if="messages.length === 0" class="text-center py-8">
          <div class="text-lg text-muted-foreground mb-2">
            {{ coachName || $t('coachView.defaultName') }}
          </div>
          <p class="text-sm text-muted-foreground">
            {{ $t('coachView.description') }}
          </p>
          <div class="flex flex-wrap gap-2 justify-center mt-4">
            <Button
              v-for="suggestion in suggestions"
              :key="suggestion"
              variant="outline"
              size="sm"
              @click="sendSuggestion(suggestion)">
              {{ suggestion }}
            </Button>
          </div>
        </div>

        <!-- Messages -->
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="[
            'p-3 rounded-lg max-w-[85%]',
            msg.role === 'user'
              ? 'ml-auto bg-primary text-primary-foreground'
              : msg.role === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                : 'bg-muted text-foreground'
          ]">
          <div class="text-sm whitespace-pre-wrap">{{ msg.content }}</div>
          <div class="text-xs opacity-60 mt-1">
            {{ formatTime(msg.timestamp) }}
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="bg-muted text-foreground p-3 rounded-lg max-w-[85%]">
          <div class="text-sm text-muted-foreground animate-pulse">{{ $t('coachView.thinking') }}</div>
        </div>
      </div>

      <!-- Input area -->
      <div class="flex gap-2">
        <Input
          v-model="inputMessage"
          :placeholder="$t('coachView.placeholder')"
          @keyup.enter="send"
          :disabled="isLoading"
          class="flex-1" />
        <Button @click="send" :disabled="isLoading || !inputMessage.trim()">
          {{ $t('coachView.send') }}
        </Button>
      </div>

      <!-- Clear chat -->
      <div v-if="messages.length > 0" class="mt-2 text-right">
        <Button variant="ghost" size="sm" class="text-muted-foreground" @click="handleClear">
          {{ $t('coachView.clearChat') }}
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

const route = useRoute()
const { t } = useI18n()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForWorkshop, getWorkshopMeta } = useLessons()
const { isLoading, getMessages, sendMessage, clearChat, loadChatHistory } = useCoach()

const lessons = ref([])
const inputMessage = ref('')
const chatContainer = ref(null)

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
