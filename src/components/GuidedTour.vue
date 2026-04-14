<template>
  <Teleport to="body">
    <Transition name="tour-fade">
      <div v-if="visible && currentStep" class="tour-root">

        <!-- Subtle backdrop -->
        <div class="tour-backdrop" />

        <!-- Cloud glow: outer soft halo -->
        <div v-if="cloud" class="tour-cloud-outer" :style="cloudOuterStyle" />

        <!-- Cloud glow: inner ring -->
        <div v-if="cloud" class="tour-cloud-ring" :style="cloudRingStyle" />

        <!-- Step card — near the highlighted element -->
        <Transition name="tour-card-slide" mode="out-in">
          <div :key="stepIndex" class="tour-card" :style="cardStyle">

            <!-- Gradient header -->
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
const cloud = ref(null)     // { top, left, width, height } of the target element
const cardPos = ref(null)   // { top, left } for the card

const currentStep = computed(() => props.steps[stepIndex.value] || null)
const isLast = computed(() => stepIndex.value === props.steps.length - 1)

const CARD_W   = 320
const PAD_RING  = 10
const PAD_OUTER = 44

const cloudRingStyle = computed(() => {
  if (!cloud.value) return {}
  const { top, left, width, height } = cloud.value
  return {
    position: 'fixed',
    top:    `${top    - PAD_RING}px`,
    left:   `${left   - PAD_RING}px`,
    width:  `${width  + PAD_RING * 2}px`,
    height: `${height + PAD_RING * 2}px`,
    borderRadius: '14px',
    zIndex: 9992,
    pointerEvents: 'none',
  }
})

const cloudOuterStyle = computed(() => {
  if (!cloud.value) return {}
  const { top, left, width, height } = cloud.value
  return {
    position: 'fixed',
    top:    `${top    - PAD_OUTER}px`,
    left:   `${left   - PAD_OUTER}px`,
    width:  `${width  + PAD_OUTER * 2}px`,
    height: `${height + PAD_OUTER * 2}px`,
    borderRadius: '32px',
    zIndex: 9991,
    pointerEvents: 'none',
  }
})

const cardStyle = computed(() => {
  if (!cardPos.value) return { bottom: '24px', left: '50%', transform: 'translateX(-50%)' }
  return {
    top:       `${cardPos.value.top}px`,
    left:      `${cardPos.value.left}px`,
    transform: 'none',
  }
})

// rAF loop — cloud glow + card follow the element while user scrolls
let rafId = null
let currentEl = null

function updatePositions() {
  if (!currentEl) return
  const rect = currentEl.getBoundingClientRect()
  cloud.value = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }

  // Position card: below element if space, else above
  const CARD_H   = 300
  const cardW    = Math.min(CARD_W, window.innerWidth - 32)
  const spaceBelow = window.innerHeight - rect.bottom - 20
  const spaceAbove = rect.top - 20

  let top
  if (spaceBelow >= CARD_H || spaceBelow >= spaceAbove) {
    top = rect.bottom + PAD_RING + 14
    if (top + CARD_H > window.innerHeight - 16) top = Math.max(16, window.innerHeight - CARD_H - 16)
  } else {
    top = Math.max(16, rect.top - CARD_H - PAD_RING - 14)
  }

  // Horizontal: center on element, keep within screen
  const rawLeft = rect.left + rect.width / 2 - cardW / 2
  const left = Math.max(16, Math.min(rawLeft, window.innerWidth - cardW - 16))

  cardPos.value = { top, left }
}

function startTracking(el) {
  stopTracking()
  currentEl = el
  const loop = () => { updatePositions(); rafId = requestAnimationFrame(loop) }
  rafId = requestAnimationFrame(loop)
}

function stopTracking() {
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
  currentEl = null
  cloud.value = null
  cardPos.value = null
}

async function showCloud() {
  await nextTick()
  const step = currentStep.value
  if (!step?.element) { stopTracking(); return }
  const el = document.querySelector(step.element)
  if (!el) { stopTracking(); return }

  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  await new Promise(r => setTimeout(r, 380))
  startTracking(el)
}

watch([() => props.visible, stepIndex], async ([vis]) => {
  if (vis) {
    await showCloud()
  } else {
    stopTracking()
    stepIndex.value = 0
  }
}, { immediate: true })

onUnmounted(stopTracking)

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

/* Very subtle backdrop — doesn't block reading */
.tour-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(1.5px);
  -webkit-backdrop-filter: blur(1.5px);
  z-index: 9989;
}

/* ─── Cloud outer: large soft radial halo ─────────────────── */
.tour-cloud-outer {
  background: radial-gradient(
    ellipse at center,
    hsl(var(--primary) / 0.45) 0%,
    hsl(var(--primary) / 0.20) 45%,
    transparent 72%
  );
  filter: blur(14px);
  animation: cloud-breathe 2.8s ease-in-out infinite;
  z-index: 9991;
}

@keyframes cloud-breathe {
  0%, 100% { opacity: 0.75; transform: scale(1);    }
  50%       { opacity: 1;    transform: scale(1.10); }
}

/* ─── Cloud ring: tight bright border around element ─────── */
.tour-cloud-ring {
  border: 2.5px solid hsl(var(--primary));
  background: hsl(var(--primary) / 0.08);
  animation: ring-pulse 2.8s ease-in-out infinite;
  z-index: 9992;
}

@keyframes ring-pulse {
  0%, 100% {
    box-shadow:
      0 0  10px  4px hsl(var(--primary) / 0.50),
      0 0  24px  8px hsl(var(--primary) / 0.25);
    border-color: hsl(var(--primary) / 0.9);
  }
  50% {
    box-shadow:
      0 0  18px  8px hsl(var(--primary) / 0.70),
      0 0  40px 16px hsl(var(--primary) / 0.35);
    border-color: hsl(var(--primary));
  }
}

/* ─── Card — follows the element ─────────────────────────── */
.tour-card {
  position: fixed;
  width: min(340px, calc(100vw - 32px));
  border-radius: 22px;
  overflow: hidden;
  box-shadow:
    0 28px 64px rgba(0,0,0,0.30),
    0  6px 20px rgba(0,0,0,0.16);
  pointer-events: all;
  background: white;
  z-index: 9999;
}

:global(.dark) .tour-card {
  background: hsl(222.2, 50%, 10%);
  color: hsl(210, 40%, 95%);
}

/* Header */
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
:global(.dark) .tour-title { color: hsl(210, 40%, 95%); }

.tour-desc {
  font-size: 13.5px;
  line-height: 1.55;
  margin: 0;
  color: hsl(215.4, 16.3%, 38%);
}
:global(.dark) .tour-desc { color: hsl(215, 20%, 68%); }

/* Footer */
.tour-card-footer {
  padding: 12px 20px 20px;
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
  padding: 14px 20px;
  border-radius: 13px;
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary, var(--primary))));
  color: white;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  box-shadow: 0 4px 16px hsl(var(--primary) / 0.45);
  font-family: inherit;
}
.tour-next-btn:hover  { opacity: 0.92; }
.tour-next-btn:active { transform: scale(0.97); }
.tour-next-icon { font-size: 18px; }

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
.tour-skip-btn:hover { color: hsl(215.4, 16.3%, 35%); }

/* Transitions */
.tour-fade-enter-active, .tour-fade-leave-active {
  transition: opacity 0.3s ease;
}
.tour-fade-enter-from, .tour-fade-leave-to { opacity: 0; }

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
