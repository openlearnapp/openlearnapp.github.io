<template>
  <div
    ref="heroEl"
    @mouseenter="onHover(true)"
    @mouseleave="onHover(false)"
    class="hero-video-container relative w-full overflow-hidden rounded-2xl shadow-2xl cursor-pointer group"
    :style="{
      height: heroHeight + 'px',
      transform: `scale(${heroScale})`,
      transformOrigin: 'top center',
      transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    }"
    @click="onTap"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend.passive="onTouchEnd"
  >
    <!-- Animierter SVG-Hintergrund: Berg + Himmel + Aurora -->
    <svg
      class="absolute inset-0 w-full h-full"
      viewBox="0 0 1280 720"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <!-- Nachthimmel-Gradient -->
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0c1b3a" />
          <stop offset="0.5" stop-color="#1e1b4b" />
          <stop offset="1" stop-color="#312e81" />
        </linearGradient>
        <!-- Aurora-Gradient -->
        <linearGradient id="auroraGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#10b981" stop-opacity="0" />
          <stop offset="0.5" stop-color="#10b981" stop-opacity="0.4" />
          <stop offset="1" stop-color="#06b6d4" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="auroraGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a855f7" stop-opacity="0" />
          <stop offset="0.5" stop-color="#a855f7" stop-opacity="0.35" />
          <stop offset="1" stop-color="#3b82f6" stop-opacity="0" />
        </linearGradient>
        <!-- Schneeboden -->
        <linearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#dbeafe" />
          <stop offset="1" stop-color="#94a3b8" />
        </linearGradient>
        <!-- Berg-Gradient -->
        <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3730a3" />
          <stop offset="0.5" stop-color="#1e1b4b" />
          <stop offset="1" stop-color="#0f172a" />
        </linearGradient>
        <!-- Terminal-Glow -->
        <radialGradient id="terminalGlow">
          <stop offset="0" stop-color="#10b981" stop-opacity="0.6" />
          <stop offset="1" stop-color="#10b981" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Himmel -->
      <rect width="1280" height="720" fill="url(#skyGrad)" />

      <!-- Sterne (statisch geseedet, twinkle via opacity) -->
      <g class="stars">
        <circle v-for="(s, i) in stars" :key="'s' + i"
          :cx="s.x" :cy="s.y" :r="s.r"
          :fill="'#ffffff'"
          :opacity="0.3 + Math.sin(animFrame * 0.05 + s.phase) * 0.4 + 0.4" />
      </g>

      <!-- Mond -->
      <g>
        <circle cx="1050" cy="140" r="50" fill="#fef3c7" />
        <circle cx="1050" cy="140" r="80" fill="#fef3c7" opacity="0.15" />
        <circle cx="1080" cy="125" r="6" fill="#cbd5e1" opacity="0.4" />
        <circle cx="1035" cy="155" r="4" fill="#cbd5e1" opacity="0.4" />
      </g>

      <!-- Aurora-Wellen (animiert) -->
      <path
        :d="`M 0 ${180 + Math.sin(animFrame * 0.02) * 20}
             Q 320 ${230 + Math.sin(animFrame * 0.02 + 1) * 30}
               640 ${190 + Math.sin(animFrame * 0.02 + 2) * 25}
             T 1280 ${200 + Math.sin(animFrame * 0.02 + 3) * 20}
             L 1280 360 L 0 360 Z`"
        fill="url(#auroraGrad)"
        opacity="0.7"
      />
      <path
        :d="`M 0 ${220 + Math.sin(animFrame * 0.025 + 2) * 25}
             Q 400 ${280 + Math.sin(animFrame * 0.025 + 3) * 30}
               800 ${240 + Math.sin(animFrame * 0.025 + 4) * 20}
             T 1280 ${260 + Math.sin(animFrame * 0.025 + 5) * 30}
             L 1280 400 L 0 400 Z`"
        fill="url(#auroraGrad2)"
        opacity="0.6"
      />

      <!-- Hintergrund-Berge -->
      <polygon
        points="0,500 180,320 360,400 540,280 720,360 900,250 1080,330 1280,290 1280,720 0,720"
        fill="url(#mountainGrad)"
        opacity="0.7"
      />
      <!-- Vordere Berge -->
      <polygon
        points="0,560 220,400 440,460 640,360 840,440 1040,380 1280,420 1280,720 0,720"
        fill="#0f172a"
        opacity="0.85"
      />
      <!-- Schnee-Spitzen -->
      <polygon points="200,420 220,400 240,420" fill="#fff" opacity="0.8" />
      <polygon points="620,380 640,360 660,380" fill="#fff" opacity="0.8" />
      <polygon points="1020,400 1040,380 1060,400" fill="#fff" opacity="0.8" />

      <!-- Schneeboden -->
      <ellipse cx="640" cy="720" rx="900" ry="120" fill="url(#snowGrad)" />

      <!-- Schwebende Code-Snippets als Particles (Linux-Vibe) -->
      <g class="code-particles">
        <text
          v-for="(p, i) in codeParticles" :key="'cp' + i"
          :x="p.x"
          :y="p.y + Math.sin(animFrame * 0.03 + p.phase) * 8"
          :font-size="p.size"
          :fill="p.color"
          :opacity="p.opacity"
          font-family="monospace"
        >{{ p.text }}</text>
      </g>

      <!-- Terminal-Glow Bereich -->
      <ellipse cx="640" cy="560" rx="400" ry="120" fill="url(#terminalGlow)" />

      <!-- Großer Pinguin (Tux-inspiriert) — nur für Linux -->
      <g v-if="showPenguin" :transform="`translate(580, 460) scale(${1 + Math.sin(animFrame * 0.04) * 0.015})`">
        <!-- Schatten -->
        <ellipse cx="60" cy="220" rx="80" ry="10" fill="#000" opacity="0.4" />

        <!-- Körper (rundlich) -->
        <ellipse cx="60" cy="135" rx="65" ry="85" fill="#1e293b" />

        <!-- Weißer Bauch -->
        <ellipse cx="60" cy="150" rx="48" ry="68" fill="#fff" />

        <!-- Kopf (rund, etwas oben aufgesetzt) -->
        <ellipse cx="60" cy="55" rx="55" ry="50" fill="#1e293b" />

        <!-- Augen -->
        <ellipse cx="40" cy="50" rx="14" ry="16" fill="#fff" />
        <ellipse cx="80" cy="50" rx="14" ry="16" fill="#fff" />
        <!-- Pupillen — Animation: schauen leicht hin und her -->
        <circle
          :cx="40 + Math.sin(animFrame * 0.015) * 3"
          :cy="52"
          r="6"
          fill="#0f172a"
        />
        <circle
          :cx="80 + Math.sin(animFrame * 0.015) * 3"
          :cy="52"
          r="6"
          fill="#0f172a"
        />
        <!-- Augen-Glanz -->
        <circle cx="42" cy="48" r="2" fill="#fff" />
        <circle cx="82" cy="48" r="2" fill="#fff" />
        <!-- Augen-Blinzeln Overlay -->
        <rect
          v-if="isBlinking"
          x="26" y="48" width="68" height="6"
          fill="#1e293b"
        />

        <!-- Gelber Schnabel -->
        <polygon points="50,75 60,82 70,75 60,68" fill="#fbbf24" />
        <polygon points="50,75 60,82 70,75" fill="#f59e0b" />

        <!-- Linker Arm/Flosse (winkt) -->
        <g :transform="`rotate(${Math.sin(animFrame * 0.08) * 12 - 5} 8 95)`">
          <ellipse cx="-2" cy="125" rx="14" ry="38" fill="#1e293b" />
        </g>

        <!-- Rechter Arm/Flosse -->
        <g :transform="`rotate(${Math.sin(animFrame * 0.08 + 1) * 8 + 3} 112 95)`">
          <ellipse cx="122" cy="125" rx="14" ry="38" fill="#1e293b" />
        </g>

        <!-- Füße (gelb-orange) -->
        <ellipse cx="30" cy="215" rx="22" ry="9" fill="#fbbf24" />
        <ellipse cx="90" cy="215" rx="22" ry="9" fill="#fbbf24" />
      </g>

      <!-- Floating Linux-Symbole (subtil) -->
      <g class="floating-symbols">
        <text
          v-for="(s, i) in symbols" :key="'sym' + i"
          :x="s.x + Math.sin(animFrame * 0.02 + s.phase) * 12"
          :y="s.y + Math.cos(animFrame * 0.02 + s.phase) * 8"
          :font-size="s.size"
          :fill="s.color"
          :opacity="0.4 + Math.sin(animFrame * 0.03 + s.phase) * 0.2"
          font-family="monospace"
          font-weight="700"
        >{{ s.char }}</text>
      </g>
    </svg>

    <!-- Title-Overlay -->
    <div class="absolute inset-x-0 bottom-0 p-6 sm:p-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
      <div class="max-w-4xl">
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-block px-3 py-1 text-xs font-bold tracking-widest text-emerald-400 bg-emerald-400/10 rounded-full uppercase">
            {{ workshopLabel }}
          </span>
          <span class="text-xs text-slate-300/70">{{ lessonCountLabel }}</span>
        </div>
        <h1 class="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-2xl mb-2 leading-tight">
          {{ title }}
        </h1>
        <p class="text-base sm:text-lg text-slate-200/90 mb-4 max-w-2xl">
          {{ description }}
        </p>
        <div class="flex items-center gap-3 flex-wrap">
          <button
            @click.stop="$emit('start')"
            class="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            {{ playLabel }}
          </button>
          <div class="text-sm text-slate-300/80">
            {{ durationLabel }}
          </div>
        </div>
      </div>
    </div>

    <!-- Hover-Glow Border -->
    <div
      class="absolute inset-0 rounded-2xl ring-2 ring-emerald-400/0 group-hover:ring-emerald-400/60 transition-all pointer-events-none"
      :style="{
        boxShadow: hovered ? '0 0 80px rgba(16,185,129,0.4)' : 'none',
      }"
    />

    <!-- Scroll-Hint unten -->
    <div
      v-if="scrollY < 50 && !controlsVisible"
      class="absolute bottom-2 right-4 text-xs text-slate-300/60 flex items-center gap-1 animate-bounce"
    >
      <span>{{ scrollLabel }}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>

    <!-- Touch Controls Overlay -->
    <Transition name="ctrl">
      <div v-if="controlsVisible" class="ctrl-overlay absolute inset-0 flex flex-col justify-between" @click.stop>
        <!-- Center controls -->
        <div class="flex-1 flex items-center justify-center gap-6 sm:gap-10">
          <button class="ctrl-btn ctrl-btn--skip" @click.stop="skip(-15)">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="50%" y="68%" text-anchor="middle" font-size="6" font-family="monospace" fill="currentColor">15</text></svg>
          </button>
          <button class="ctrl-btn ctrl-btn--play" @click.stop="$emit('start')">
            <svg v-if="!isPlaying" width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <svg v-else width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          </button>
          <button class="ctrl-btn ctrl-btn--skip" @click.stop="skip(+15)">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="50%" y="68%" text-anchor="middle" font-size="6" font-family="monospace" fill="currentColor">15</text></svg>
          </button>
        </div>
        <!-- Progress / scrub bar -->
        <div class="ctrl-progress" @click.stop>
          <div class="ctrl-progress-track"
            @click.stop="onProgressClick"
            @touchstart.prevent.stop="onScrubStart"
            @touchmove.prevent.stop="onScrubMove">
            <div class="ctrl-progress-fill" :style="{ width: scrubProgress + '%' }"></div>
            <div class="ctrl-progress-thumb" :style="{ left: scrubProgress + '%' }"></div>
          </div>
          <div class="ctrl-time">
            <span>{{ formatTime(currentSec) }}</span>
            <span>{{ formatTime(totalSec) }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  title:        { type: String,  default: 'Workshop' },
  description:  { type: String,  default: '' },
  lessonCount:  { type: Number,  default: 10 },
  totalMinutes: { type: Number,  default: 12 },
  workshopLabel:{ type: String,  default: 'Workshop' },
  playLabel:    { type: String,  default: '▶  Starten' },
  durationLabel:{ type: String,  default: '' },
  scrollLabel:  { type: String,  default: 'Lektionen entdecken' },
  showPenguin:  { type: Boolean, default: false },
})

defineEmits(['start'])

// ── Touch Controls ────────────────────────────────────────────────────────────
const controlsVisible = ref(false)
const isPlaying = ref(false)
const scrubProgress = ref(0)
const totalSec = computed(() => props.totalMinutes * 60)
const currentSec = computed(() => Math.round(scrubProgress.value / 100 * totalSec.value))
let hideTimer = null

function showControls() {
  controlsVisible.value = true
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { controlsVisible.value = false }, 3500)
}

function onTap() {
  if (!controlsVisible.value) {
    showControls()
  } else {
    // Second tap = toggle play (for placeholder: just emit start)
    controlsVisible.value = false
  }
}

function skip(seconds) {
  const pct = (seconds / totalSec.value) * 100
  scrubProgress.value = Math.max(0, Math.min(100, scrubProgress.value + pct))
  showControls()
}

// Swipe-to-scrub on the video body
let touchStartX = 0
let touchStartProgress = 0
function onTouchStart(e) {
  touchStartX = e.touches[0].clientX
  touchStartProgress = scrubProgress.value
}
function onTouchMove(e) {
  const dx = e.touches[0].clientX - touchStartX
  const width = heroEl.value?.offsetWidth || 300
  const pctDelta = (dx / width) * 100
  scrubProgress.value = Math.max(0, Math.min(100, touchStartProgress + pctDelta))
  showControls()
}
function onTouchEnd() {}

// Click on progress bar
function onProgressClick(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  scrubProgress.value = ((e.clientX - rect.left) / rect.width) * 100
  showControls()
}
function onScrubStart(e) {
  touchStartX = e.touches[0].clientX
  touchStartProgress = scrubProgress.value
}
function onScrubMove(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  scrubProgress.value = Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100))
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const heroEl = ref(null)
const scrollY = ref(0)
const hovered = ref(false)
const animFrame = ref(0)

// Sterne, Code-Particles, Symbole — beim Mount einmal generieren
const stars = ref(
  Array.from({ length: 60 }, (_, i) => ({
    x: (i * 137.5 + 23) % 1280,
    y: (i * 83.7 + 17) % 400,
    r: 0.8 + (i % 4) * 0.5,
    phase: i * 0.3,
  }))
)

const codeColors = ['#10b981', '#06b6d4', '#a855f7', '#fbbf24']
const codeSnippets = ['ls', 'cd ~', 'sudo', 'apt', 'grep', 'mkdir', 'rm -rf', 'echo', 'cat', '|', 'chmod', 'ssh', 'top', 'kill', 'tar', 'curl', 'vim']
const codeParticles = ref(
  Array.from({ length: 16 }, (_, i) => ({
    x: ((i * 79) % 1180) + 50,
    y: 480 + (i % 5) * 30,
    size: 12 + (i % 3) * 4,
    color: codeColors[i % codeColors.length],
    opacity: 0.25 + (i % 4) * 0.1,
    phase: i * 0.5,
    text: codeSnippets[i % codeSnippets.length],
  }))
)

const symbols = ref(
  ['$', '~', '/', '#', '>', '_', '|'].map((char, i) => ({
    x: 80 + i * 170,
    y: 80 + (i % 3) * 60,
    size: 24 + (i % 3) * 10,
    color: codeColors[i % codeColors.length],
    char,
    phase: i * 0.4,
  }))
)

// Blink-Cycle
const isBlinking = computed(() => {
  const c = animFrame.value % 100
  return c > 95 && c < 100
})

// Feste Höhe — kein Sticky mehr
const heroHeight = computed(() => 460)
const heroScale = computed(() => (hovered.value ? 1.01 : 1))

// Lessons-Count-Label
const lessonCountLabel = computed(() => `${props.lessonCount} Lektionen`)

function onHover(state) {
  hovered.value = state
}

function onScroll() {
  scrollY.value = window.scrollY
}

let rafId = null
function tick() {
  animFrame.value += 1
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  rafId = requestAnimationFrame(tick)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.hero-video-container {
  background: linear-gradient(180deg, #0c1b3a 0%, #1e1b4b 100%);
  will-change: transform;
}

/* Cinema bars */
.hero-video-container::before,
.hero-video-container::after {
  content: '';
  position: absolute;
  left: 0; right: 0; height: 8px;
  z-index: 10; pointer-events: none;
}
.hero-video-container::before { top: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent); }
.hero-video-container::after  { bottom: 0; background: linear-gradient(to top, rgba(0,0,0,0.4), transparent); }

/* ── Controls overlay ── */
.ctrl-overlay {
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(2px);
  z-index: 20;
  padding: 20px 16px 16px;
}

/* Transition */
.ctrl-enter-active, .ctrl-leave-active { transition: opacity .25s ease; }
.ctrl-enter-from, .ctrl-leave-to { opacity: 0; }

/* Buttons */
.ctrl-btn {
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer; border-radius: 50%;
  color: #fff; transition: transform .15s, background .15s;
}
.ctrl-btn--play {
  width: 72px; height: 72px;
  background: rgba(255,255,255,0.18);
  box-shadow: 0 0 0 2px rgba(255,255,255,.3), 0 8px 32px rgba(0,0,0,.4);
}
.ctrl-btn--play:active { transform: scale(0.92); }
.ctrl-btn--skip {
  width: 52px; height: 52px;
  background: rgba(255,255,255,0.1);
}
.ctrl-btn--skip:active { transform: scale(0.9); }
.ctrl-btn--skip svg text { font-size: 5px; }

/* Progress bar */
.ctrl-progress { padding: 0 4px 4px; }
.ctrl-progress-track {
  position: relative; height: 4px; border-radius: 4px;
  background: rgba(255,255,255,.25); cursor: pointer; touch-action: none;
}
.ctrl-progress-fill {
  position: absolute; top: 0; left: 0; height: 100%;
  background: #10b981; border-radius: 4px;
  pointer-events: none;
}
.ctrl-progress-thumb {
  position: absolute; top: 50%; transform: translate(-50%, -50%);
  width: 14px; height: 14px; border-radius: 50%;
  background: #fff; box-shadow: 0 0 6px rgba(0,0,0,.4);
  pointer-events: none;
}
.ctrl-time {
  display: flex; justify-content: space-between;
  font-size: 11px; color: rgba(255,255,255,.7);
  margin-top: 6px; font-family: monospace; letter-spacing: .04em;
}
</style>
