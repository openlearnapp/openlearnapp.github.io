<template>
  <Teleport to="body">
    <Transition name="tour-fade">
      <div v-if="visible && currentStep" class="tour-root">

        <!-- Spotlight box (box-shadow trick: dims everything outside the target) -->
        <div
          v-if="spotlight"
          class="tour-spotlight"
          :style="spotlightStyle"
        />
        <!-- Plain dim overlay when no target element -->
        <div
          v-else
          class="fixed inset-0 bg-black/60 backdrop-blur-sm"
          style="z-index: 9990;"
        />

        <!-- Step card -->
        <Transition name="tour-card-slide" mode="out-in">
          <div
            :key="stepIndex"
            class="tour-card"
            :style="cardStyle"
          >
            <!-- Gradient header strip -->
            <div class="tour-card-header">
              <span class="tour-emoji">{{ currentStep.emoji }}</span>
              <div class="tour-dots-row">
                <span
                  v-for="(_, i) in steps"
                  :key="i"
                  class="tour-dot"
                  :class="{ active: i === stepIndex, done: i < stepIndex }"
                />
              </div>
              <span class="tour-counter">{{ stepIndex + 1 }}/{{ steps.length }}</span>
            </div>

            <!-- Content -->
            <div class="tour-card-body">
              <h3 class="tour-title">{{ currentStep.title }}</h3>
              <p class="tour-desc">{{ currentStep.desc }}</p>
            </div>

            <!-- Actions -->
            <div class="tour-card-footer">
              <button class="tour-next-btn" @click="nextStep">
                <span>{{ isLast ? t('tour.done') : t('tour.next') }}</span>
                <span class="tour-next-icon">{{ isLast ? '🎉' : '→' }}</span>
              </button>
              <button class="tour-skip-btn" @click="skip">
                {{ t('tour.skip') }}
              </button>
            </div>
          </div>
        </Transition>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  steps: { type: Array, default: () => [] },
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['done', 'skip'])

const stepIndex = ref(0)
const spotlight = ref(null) // { top, left, width, height }
const cardPosition = ref({ top: null, bottom: null, left: null })

const currentStep = computed(() => props.steps[stepIndex.value] || null)
const isLast = computed(() => stepIndex.value === props.steps.length - 1)

const spotlightStyle = computed(() => {
  if (!spotlight.value) return {}
  const { top, left, width, height } = spotlight.value
  const pad = 8
  return {
    position: 'fixed',
    top: `${top - pad}px`,
    left: `${left - pad}px`,
    width: `${width + pad * 2}px`,
    height: `${height + pad * 2}px`,
    borderRadius: '12px',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.62), 0 0 0 3px hsl(var(--primary)), 0 0 20px 6px hsl(var(--primary) / 0.4)',
    zIndex: 9990,
    pointerEvents: 'none',
  }
})

const cardStyle = computed(() => {
  const pos = cardPosition.value
  const style = {
    zIndex: 9999,
  }
  if (pos.top !== null) style.top = `${pos.top}px`
  if (pos.bottom !== null) style.bottom = `${pos.bottom}px`
  if (pos.left !== null) {
    style.left = `${pos.left}px`
    style.transform = 'none'
  } else {
    style.left = '50%'
    style.transform = 'translateX(-50%)'
  }
  return style
})

// Compute spotlight + card position from element rect (called on every frame)
function applyRect(el) {
  const rect = el.getBoundingClientRect()
  const pad = 8

  spotlight.value = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }

  const cardHeight = 300
  const cardWidth = Math.min(320, window.innerWidth - 32)
  const spaceBelow = window.innerHeight - rect.bottom - 20
  const spaceAbove = rect.top - 20

  let top = null
  let left = null

  if (spaceBelow >= cardHeight || spaceBelow >= spaceAbove) {
    top = rect.bottom + pad + 12
    // If card would go off screen bottom, clamp it
    if (top + cardHeight > window.innerHeight - 16) {
      top = Math.max(16, window.innerHeight - cardHeight - 16)
    }
  } else {
    top = Math.max(16, rect.top - cardHeight - pad - 12)
  }

  const preferredLeft = rect.left + rect.width / 2 - cardWidth / 2
  left = Math.max(16, Math.min(preferredLeft, window.innerWidth - cardWidth - 16))

  cardPosition.value = { top, bottom: null, left }
}

// rAF loop — keeps spotlight glued to element while user scrolls
let rafId = null
let currentEl = null

function startTracking() {
  stopTracking()
  function loop() {
    if (currentEl) applyRect(currentEl)
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
}

function stopTracking() {
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
  currentEl = null
}

async function updateSpotlight() {
  await nextTick()
  const step = currentStep.value
  if (!step?.element) {
    stopTracking()
    spotlight.value = null
    cardPosition.value = { top: null, bottom: null, left: null }
    return
  }

  const el = document.querySelector(step.element)
  if (!el) {
    stopTracking()
    spotlight.value = null
    cardPosition.value = { top: null, bottom: null, left: null }
    return
  }

  // Scroll element into view, then start live tracking
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  await new Promise(r => setTimeout(r, 380))

  currentEl = el
  startTracking()
}

watch([() => props.visible, stepIndex], async ([vis]) => {
  if (vis) {
    await updateSpotlight()
  } else {
    stopTracking()
    spotlight.value = null
    stepIndex.value = 0
  }
}, { immediate: true })

onUnmounted(() => stopTracking())

function nextStep() {
  if (isLast.value) {
    emit('done')
    stepIndex.value = 0
  } else {
    stepIndex.value++
  }
}

function skip() {
  emit('skip')
  stepIndex.value = 0
}
</script>

<style scoped>
.tour-root {
  position: fixed;
  inset: 0;
  z-index: 9988;
  pointer-events: none;
}

/* Spotlight */
.tour-spotlight {
  animation: tour-pulse 2.2s ease-in-out infinite;
}

@keyframes tour-pulse {
  0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.62), 0 0 0 3px hsl(var(--primary)), 0 0 16px 4px hsl(var(--primary) / 0.35); }
  50%       { box-shadow: 0 0 0 9999px rgba(0,0,0,0.62), 0 0 0 4px hsl(var(--primary)), 0 0 28px 8px hsl(var(--primary) / 0.55); }
}

/* Card */
.tour-card {
  position: fixed;
  width: min(320px, calc(100vw - 32px));
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0,0,0,0.32), 0 4px 16px rgba(0,0,0,0.18);
  pointer-events: all;
  background: white;
}

:global(.dark) .tour-card {
  background: hsl(222.2, 50%, 10%);
  color: hsl(210, 40%, 95%);
}

/* Gradient header */
.tour-card-header {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary, var(--primary))));
  padding: 18px 20px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tour-emoji {
  font-size: 32px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.tour-dots-row {
  display: flex;
  gap: 6px;
  flex: 1;
  justify-content: center;
}

.tour-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.35);
  transition: all 0.3s ease;
}

.tour-dot.active {
  background: white;
  width: 22px;
  border-radius: 4px;
}

.tour-dot.done {
  background: rgba(255,255,255,0.7);
}

.tour-counter {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.8);
  white-space: nowrap;
}

/* Body */
.tour-card-body {
  padding: 20px 20px 8px;
}

.tour-title {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 8px;
  line-height: 1.3;
  color: hsl(222.2, 84%, 8%);
}

:global(.dark) .tour-title {
  color: hsl(210, 40%, 95%);
}

.tour-desc {
  font-size: 13.5px;
  line-height: 1.55;
  margin: 0;
  color: hsl(215.4, 16.3%, 38%);
}

:global(.dark) .tour-desc {
  color: hsl(215, 20%, 68%);
}

/* Footer */
.tour-card-footer {
  padding: 12px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tour-next-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 13px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary, var(--primary))));
  color: white;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  box-shadow: 0 4px 14px hsl(var(--primary) / 0.4);
  font-family: inherit;
}

.tour-next-btn:hover  { opacity: 0.92; }
.tour-next-btn:active { transform: scale(0.97); }

.tour-next-icon {
  font-size: 18px;
}

.tour-skip-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12.5px;
  color: hsl(215.4, 16.3%, 55%);
  text-align: center;
  padding: 2px;
  font-family: inherit;
  transition: color 0.15s;
}

.tour-skip-btn:hover {
  color: hsl(215.4, 16.3%, 35%);
}

/* Transitions */
.tour-fade-enter-active,
.tour-fade-leave-active {
  transition: opacity 0.3s ease;
}
.tour-fade-enter-from,
.tour-fade-leave-to {
  opacity: 0;
}

.tour-card-slide-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.tour-card-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tour-card-slide-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.97);
}
.tour-card-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
