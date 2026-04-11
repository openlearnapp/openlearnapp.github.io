<template>
  <!-- Debug overlay for the audio chain. Shows the queue, state snapshot,
       and an event log. Only rendered when settings.showDebugOverlay is on
       OR ?audioDebug=1 is in the URL. See src/composables/useAudioDebug.js. -->
  <div
    v-if="audioDebugEnabled"
    class="fixed bottom-20 left-2 z-50 max-w-sm max-h-[80vh] bg-black/90 text-white text-[10px] font-mono rounded-lg shadow-2xl overflow-hidden border border-yellow-400/50"
    :class="collapsed ? 'w-12' : 'w-80'">
    <!-- Header -->
    <div class="flex items-center justify-between px-2 py-1 bg-yellow-500/20 border-b border-yellow-400/30">
      <button @click="collapsed = !collapsed" class="text-yellow-300 font-bold hover:text-yellow-100" :title="collapsed ? 'Expand' : 'Collapse'">
        🐞 {{ collapsed ? '' : 'audio' }}
      </button>
      <div v-if="!collapsed" class="flex items-center gap-1">
        <button @click="copyLog" class="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded" title="Copy event log as JSON">
          {{ copied ? '✓' : 'copy' }}
        </button>
        <button @click="clearAudioEvents" class="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded" title="Clear event log">
          clear
        </button>
      </div>
    </div>

    <div v-if="!collapsed" class="overflow-y-auto max-h-[calc(80vh-30px)]">
      <!-- State snapshot -->
      <div class="p-2 border-b border-white/10 bg-slate-900/60">
        <div class="text-yellow-300 font-bold mb-1">state</div>
        <div class="grid grid-cols-2 gap-x-2 gap-y-0.5">
          <span class="text-slate-400">lesson:</span>
          <span class="truncate">{{ lessonMetadata.learning || '—' }}/{{ lessonMetadata.workshop || '—' }} #{{ lessonMetadata.number ?? '—' }}</span>
          <span class="text-slate-400">playing:</span>
          <span :class="isPlaying ? 'text-green-400' : 'text-slate-500'">{{ isPlaying ? 'YES' : 'no' }}</span>
          <span class="text-slate-400">paused:</span>
          <span>{{ isPaused ? 'YES' : 'no' }}</span>
          <span class="text-slate-400">loading:</span>
          <span>{{ isLoadingAudio ? 'YES' : 'no' }}</span>
          <span class="text-slate-400">transitioning:</span>
          <span>{{ isTransitioning ? 'YES' : 'no' }}</span>
          <span class="text-slate-400">continuous:</span>
          <span :class="continuousMode ? 'text-green-400' : 'text-slate-500'">{{ continuousMode ? 'YES' : 'no' }}</span>
          <span class="text-slate-400">index:</span>
          <span>{{ currentItemIndex }} / {{ readingQueue.length - 1 }}</span>
          <span class="text-slate-400">hasAudio:</span>
          <span>{{ hasAudio ? 'YES' : 'no' }}</span>
        </div>
      </div>

      <!-- Queue -->
      <div class="p-2 border-b border-white/10">
        <div class="text-yellow-300 font-bold mb-1">queue ({{ readingQueue.length }})</div>
        <div v-for="(item, idx) in readingQueue" :key="idx" class="flex items-start gap-1 py-0.5">
          <span class="text-slate-500 w-6 text-right">{{ idx }}</span>
          <span class="w-4" :title="statusTitle(item, idx)">{{ statusIcon(item, idx) }}</span>
          <span class="text-slate-400 w-14 truncate">{{ item.type }}</span>
          <span class="flex-1 truncate" :class="idx === currentItemIndex ? 'text-green-400 font-bold' : 'text-white/70'">
            {{ item.text ? item.text.slice(0, 32) : '—' }}
          </span>
        </div>
      </div>

      <!-- Event log -->
      <div class="p-2">
        <div class="text-yellow-300 font-bold mb-1">events ({{ audioEvents.length }})</div>
        <div v-if="audioEvents.length === 0" class="text-slate-500 italic">no events yet</div>
        <div
          v-for="(ev, idx) in reversedEvents"
          :key="idx"
          class="py-0.5 border-b border-white/5 last:border-b-0">
          <div class="flex items-start gap-1">
            <span class="text-slate-500 w-10 text-right">{{ ev.t }}</span>
            <span class="font-bold" :class="eventColor(ev.kind)">{{ ev.kind }}</span>
          </div>
          <div v-if="hasPayload(ev)" class="pl-11 text-slate-400 truncate">
            {{ formatPayload(ev) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAudio } from '../composables/useAudio'
import {
  useAudioDebug,
  serializeAudioEvents,
  clearAudioEvents as clearEventsInComposable,
} from '../composables/useAudioDebug'

const {
  isPlaying, isPaused, isLoadingAudio, isTransitioning,
  continuousMode, currentItemIndex, readingQueue, hasAudio, lessonMetadata,
  currentAudio,
} = useAudio()

const { audioEvents, audioDebugEnabled } = useAudioDebug()

const collapsed = ref(false)
const copied = ref(false)

// Show newest events first
const reversedEvents = computed(() => [...audioEvents.value].reverse())

function clearAudioEvents() {
  clearEventsInComposable()
}

async function copyLog() {
  try {
    const json = serializeAudioEvents()
    await navigator.clipboard.writeText(json)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    copied.value = false
  }
}

function statusIcon(item, idx) {
  if (idx === currentItemIndex.value) return '▶'
  if (idx < currentItemIndex.value) return '✓'
  return '·'
}

function statusTitle(item, idx) {
  if (idx === currentItemIndex.value) return 'currently playing'
  if (idx < currentItemIndex.value) return 'already played'
  return 'pending'
}

// Payload helpers — avoid rendering `{t, kind}` twice
const KNOWN_KEYS = new Set(['t', 'kind'])
function hasPayload(ev) {
  return Object.keys(ev).some(k => !KNOWN_KEYS.has(k))
}
function formatPayload(ev) {
  const parts = []
  for (const [k, v] of Object.entries(ev)) {
    if (KNOWN_KEYS.has(k)) continue
    const s = typeof v === 'string' ? v : JSON.stringify(v)
    parts.push(`${k}=${s}`)
  }
  return parts.join(' ')
}

function eventColor(kind) {
  if (kind.includes('error') || kind.includes('failed') || kind.includes('stop')) return 'text-red-400'
  if (kind.startsWith('play-') || kind.includes('play-')) return 'text-green-400'
  if (kind.startsWith('init-')) return 'text-sky-400'
  if (kind.startsWith('transition-')) return 'text-purple-400'
  if (kind.startsWith('preload-')) return 'text-amber-300'
  if (kind.startsWith('cleanup-')) return 'text-pink-400'
  return 'text-white/80'
}
</script>
