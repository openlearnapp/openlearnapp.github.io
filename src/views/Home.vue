<template>
  <div class="home-root">

    <!-- ═══════════════════════════════════════════════════
         HERO — full-viewport, cinematic, canvas animated
    ═══════════════════════════════════════════════════ -->
    <section class="hero">

      <!-- Animated canvas background (particles + figure) -->
      <canvas ref="canvasEl" class="hero-canvas" aria-hidden="true" />

      <!-- Gradient overlay so text stays readable -->
      <div class="hero-overlay" />

      <!-- Hero content -->
      <div class="hero-content">

        <!-- Brand badge -->
        <div class="hero-badge">
          <span class="hero-badge-dot" />
          Open Learn
        </div>

        <!-- Headline -->
        <h1 class="hero-headline">
          {{ $t('home.title') }}
        </h1>
        <p class="hero-sub">{{ $t('home.subtitle') }}</p>

        <!-- Language selector = primary CTA -->
        <div class="hero-cta">
          <div class="lang-selector-wrap">
            <button
              class="lang-btn"
              @click.stop="showLanguageMenu = !showLanguageMenu"
              aria-haspopup="listbox">
              <span class="lang-flag">{{ getFlag(currentLanguage) }}</span>
              <span class="lang-name">{{ formatLangName(currentLanguage) }}</span>
              <svg class="lang-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            <Transition name="lang-drop">
              <div v-if="showLanguageMenu" class="lang-menu" role="listbox">
                <button
                  v-for="lang in learningLanguages"
                  :key="lang"
                  class="lang-option"
                  :class="{ active: currentLanguage === lang }"
                  @click="selectLanguage(lang)">
                  <span>{{ getFlag(lang) }}</span>
                  <span>{{ formatLangName(lang) }}</span>
                </button>
              </div>
            </Transition>
          </div>

          <button class="start-btn" @click="goToWorkshops(currentLanguage)">
            {{ $t('home.browseWorkshops') }}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Scroll hint -->
        <button class="scroll-hint" @click="scrollToFeatures" aria-label="Mehr erfahren">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         FEATURE PILLS — horizontal strip
    ═══════════════════════════════════════════════════ -->
    <section ref="featuresEl" class="features-strip">
      <div class="features-inner">
        <div
          v-for="f in featurePills"
          :key="f.key"
          class="feature-pill">
          <span class="pill-icon">{{ f.icon }}</span>
          <span class="pill-label">{{ f.label }}</span>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         HOW IT WORKS — 3 visual steps
    ═══════════════════════════════════════════════════ -->
    <section class="how-section">
      <h2 class="section-title">{{ $t('home.howItWorks') }}</h2>
      <div class="steps-row">
        <div v-for="(step, i) in steps" :key="i" class="step-card">
          <div class="step-number">{{ i + 1 }}</div>
          <div class="step-text">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-desc">{{ step.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         TOPIC GRID — compact icon grid
    ═══════════════════════════════════════════════════ -->
    <section class="topics-section">
      <h2 class="section-title">{{ $t('home.whatYouCanLearn') }}</h2>
      <div class="topics-grid">
        <div
          v-for="ex in useCaseExamples"
          :key="ex.key"
          class="topic-chip">
          <span>{{ ex.icon }}</span>
          <span class="topic-label">{{ ex.label }}</span>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         BOTTOM CTA
    ═══════════════════════════════════════════════════ -->
    <section class="bottom-cta">
      <h2 class="cta-headline">{{ $t('home.openSourceTitle') }}</h2>
      <p class="cta-sub">{{ $t('home.openSourceDesc') }}</p>
      <div class="cta-btns">
        <button class="start-btn" @click="goToWorkshops(currentLanguage)">
          {{ $t('home.browseWorkshops') }} →
        </button>
        <a
          href="https://github.com/openlearnapp/openlearnapp.github.io"
          target="_blank" rel="noopener"
          class="ghost-btn">
          GitHub
        </a>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLessons } from '../composables/useLessons'
import { useLanguage } from '../composables/useLanguage'
import { formatLangName } from '../utils/formatters'

const router = useRouter()
const { t } = useI18n()
const { availableContent, isLoading, loadAvailableContent } = useLessons()
const { selectedLanguage, getFlag, setLanguage } = useLanguage()

const showLanguageMenu = ref(false)
const canvasEl = ref(null)
const featuresEl = ref(null)

const learningLanguages = computed(() => [...new Set(Object.keys(availableContent.value))])
const currentLanguage = computed(() => selectedLanguage.value || learningLanguages.value[0] || 'english')

function selectLanguage(lang) {
  showLanguageMenu.value = false
  setLanguage(lang)
}

function goToWorkshops(lang) {
  setLanguage(lang)
  router.push({ name: 'workshop-overview', params: { learning: lang } })
}

function scrollToFeatures() {
  featuresEl.value?.scrollIntoView({ behavior: 'smooth' })
}

function handleClickOutside(e) {
  if (showLanguageMenu.value && !e.target.closest('.lang-selector-wrap')) {
    showLanguageMenu.value = false
  }
}

// ── Feature pills ──────────────────────────────────────────────────────
const featurePills = computed(() => [
  { key: 'topic',    icon: '🎯', label: t('home.features.anySubject') },
  { key: 'story',    icon: '🎬', label: t('home.features.richExperience') },
  { key: 'test',     icon: '✅', label: t('home.tools.assessments') },
  { key: 'audio',    icon: '🔊', label: t('home.tools.audio') },
  { key: 'offline',  icon: '📶', label: t('home.tools.sync') },
  { key: 'create',   icon: '✏️', label: t('home.features.yourContent') },
  { key: 'infra',    icon: '🔒', label: t('home.features.zeroInfra') },
])

const steps = computed(() => [
  { title: t('home.steps.pickLang'),      desc: t('home.steps.pickLangDesc') },
  { title: t('home.steps.startWorkshop'), desc: t('home.steps.startWorkshopDesc') },
  { title: t('home.steps.learnTrack'),    desc: t('home.steps.learnTrackDesc') },
])

const useCaseExamples = computed(() => [
  { key: 'lang',    icon: '🌍', label: t('home.useCases.languages') },
  { key: 'math',    icon: '🧮', label: t('home.useCases.math') },
  { key: 'drive',   icon: '🚗', label: t('home.useCases.driving') },
  { key: 'music',   icon: '🎵', label: t('home.useCases.music') },
  { key: 'code',    icon: '💻', label: t('home.useCases.coding') },
  { key: 'science', icon: '🔬', label: t('home.useCases.science') },
  { key: 'history', icon: '📜', label: t('home.useCases.history') },
  { key: 'med',     icon: '🏥', label: t('home.useCases.medicine') },
  { key: 'law',     icon: '⚖️', label: t('home.useCases.law') },
])

// ── Canvas animation ───────────────────────────────────────────────────
// Inspired by experiments/18-multi-style-quiz (local, PR #15 in plugin repo)
// Techniques: particle field, human figure with bezier curves, breathing animation
// Using local experiments only — not from any external package

let rafId = null

function startCanvas(canvas) {
  const ctx = canvas.getContext('2d')
  let W, H, particles

  function resize() {
    W = canvas.width  = canvas.offsetWidth  * window.devicePixelRatio
    H = canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    W /= window.devicePixelRatio
    H /= window.devicePixelRatio
    initParticles()
  }

  function initParticles() {
    particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.4,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      a: Math.random() * 0.55 + 0.2,
    }))
  }

  // ── Human figure system from experiments/17-18 ──────────────────
  function drawFigure(cx, cy, h, t) {
    const u = h / 160
    const breath = Math.sin(t * 1.1) * h * 0.003

    // Colors — primary glow palette
    const skin  = '#F4A070'
    const hair  = '#2D1A0E'
    const shirt = '#6366F1'   // --primary
    const pants = '#1E1B4B'
    const shoe  = '#0F0D26'

    // Pose: reading — arms slightly forward, head tilted down
    const shoulderY = cy - h * 0.24 + breath
    const hipY      = cy + h * 0.01
    const headCy    = cy - h * 0.38 + breath
    const headR     = u * 12

    // Shadow
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(cx, cy + h * 0.02, u * 22, u * 5, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fill()
    ctx.restore()

    // Torso (bezier-tapered)
    drawTapered(cx, shoulderY, cx, hipY, u * 14, u * 10, shirt)

    // Legs
    drawTapered(cx - u * 6, hipY, cx - u * 8, cy + h * 0.18, u * 8, u * 5, pants)
    drawTapered(cx + u * 6, hipY, cx + u * 8, cy + h * 0.18, u * 8, u * 5, pants)

    // Shoes
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(cx - u * 10, cy + h * 0.19, u * 8, u * 4, -0.15, 0, Math.PI * 2)
    ctx.fillStyle = shoe; ctx.fill()
    ctx.restore()
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(cx + u * 10, cy + h * 0.19, u * 8, u * 4, 0.15, 0, Math.PI * 2)
    ctx.fillStyle = shoe; ctx.fill()
    ctx.restore()

    // Arms (reading pose — both angled forward/down)
    const waveL = Math.sin(t * 0.7) * u * 3
    drawTapered(cx - u * 14, shoulderY + u * 4, cx - u * 24 + waveL, shoulderY + u * 28, u * 7, u * 4, skin)
    drawTapered(cx + u * 14, shoulderY + u * 4, cx + u * 22 + waveL, shoulderY + u * 28, u * 7, u * 4, skin)

    // Book in hands
    ctx.save()
    ctx.translate(cx, shoulderY + u * 32 + breath)
    ctx.rotate(Math.sin(t * 0.3) * 0.04)
    ctx.beginPath()
    ctx.roundRect(-u * 15, -u * 10, u * 30, u * 20, u * 2)
    ctx.fillStyle = '#E8F0FE'
    ctx.fill()
    ctx.beginPath()
    ctx.rect(-u * 1.5, -u * 9.5, u * 3, u * 19)
    ctx.fillStyle = '#C7D7FB'
    ctx.fill()
    // lines in book
    for (let l = 0; l < 4; l++) {
      ctx.beginPath()
      ctx.rect(-u * 12, -u * 7 + l * u * 5, u * 10, u * 1.5)
      ctx.fillStyle = 'rgba(99,102,241,0.25)'; ctx.fill()
      ctx.beginPath()
      ctx.rect(u * 3, -u * 7 + l * u * 5, u * 10, u * 1.5)
      ctx.fillStyle = 'rgba(99,102,241,0.25)'; ctx.fill()
    }
    ctx.restore()

    // Head
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, headCy + breath, headR, 0, Math.PI * 2)
    ctx.fillStyle = skin
    ctx.fill()
    ctx.restore()

    // Hair
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, headCy + breath - headR * 0.1, headR, Math.PI, Math.PI * 2)
    ctx.fillStyle = hair
    ctx.fill()
    ctx.restore()

    // Eyes (slightly down — reading)
    const eyeY = headCy + headR * 0.12 + breath
    const blink = Math.sin(t * 0.3) > 0.97 ? 0 : 1
    ctx.save()
    for (const ex of [cx - headR * 0.32, cx + headR * 0.32]) {
      ctx.beginPath()
      if (blink) ctx.arc(ex, eyeY, headR * 0.13, 0, Math.PI * 2)
      else ctx.ellipse(ex, eyeY, headR * 0.13, headR * 0.04, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#1A1A2E'; ctx.fill()
    }
    ctx.restore()

    // Glow around figure
    ctx.save()
    const grd = ctx.createRadialGradient(cx, cy - h * 0.1, h * 0.05, cx, cy - h * 0.1, h * 0.6)
    grd.addColorStop(0, 'rgba(99,102,241,0.18)')
    grd.addColorStop(1, 'rgba(99,102,241,0)')
    ctx.fillStyle = grd
    ctx.fillRect(cx - h, cy - h, h * 2, h * 2)
    ctx.restore()
  }

  // Tapered limb (bezier, from experiments/17 & quiz-scenes skill PR #15)
  function drawTapered(x1, y1, x2, y2, w1, w2, col) {
    const dx = x2 - x1, dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = dy / len, ny = -dx / len
    ctx.beginPath()
    ctx.moveTo(x1 + nx * w1, y1 + ny * w1)
    ctx.bezierCurveTo(
      (x1 * 2 + x2) / 3 + nx * (w1 * 0.6 + w2 * 0.4),
      (y1 * 2 + y2) / 3 + ny * (w1 * 0.6 + w2 * 0.4),
      (x1 + x2 * 2) / 3 + nx * (w1 * 0.4 + w2 * 0.6),
      (y1 + y2 * 2) / 3 + ny * (w1 * 0.4 + w2 * 0.6),
      x2 + nx * w2, y2 + ny * w2
    )
    ctx.lineTo(x2 - nx * w2, y2 - ny * w2)
    ctx.bezierCurveTo(
      (x1 + x2 * 2) / 3 - nx * (w1 * 0.4 + w2 * 0.6),
      (y1 + y2 * 2) / 3 - ny * (w1 * 0.4 + w2 * 0.6),
      (x1 * 2 + x2) / 3 - nx * (w1 * 0.6 + w2 * 0.4),
      (y1 * 2 + y2) / 3 - ny * (w1 * 0.6 + w2 * 0.4),
      x1 - nx * w1, y1 - ny * w1
    )
    ctx.closePath()
    ctx.fillStyle = col; ctx.fill()
  }

  let t0 = null
  function draw(ts) {
    rafId = requestAnimationFrame(draw)
    if (!t0) t0 = ts
    const t = (ts - t0) / 1000

    ctx.clearRect(0, 0, W, H)

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0,   '#07052A')
    sky.addColorStop(0.5, '#0E0B3D')
    sky.addColorStop(1,   '#1A0A2E')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    // Particles / stars
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
      const pulse = 0.6 + 0.4 * Math.sin(t * 1.5 + p.x)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(180,160,255,${p.a * pulse})`
      ctx.fill()
    })

    // Floating glow orbs (background atmosphere)
    for (const [ox, oy, or_, col] of [
      [W * 0.15, H * 0.3, H * 0.3, 'rgba(99,102,241,0.08)'],
      [W * 0.85, H * 0.6, H * 0.25, 'rgba(139,92,246,0.07)'],
      [W * 0.5,  H * 0.8, H * 0.2,  'rgba(99,102,241,0.05)'],
    ]) {
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, or_)
      g.addColorStop(0, col); g.addColorStop(1, 'transparent')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    }

    // Figure — right side on desktop, centered on mobile
    const figH = Math.min(H * 0.6, 280)
    const figX = W > 640 ? W * 0.78 : W * 0.5
    const figY = H * 0.55
    drawFigure(figX, figY, figH, t)

    // Ground line under figure
    ctx.save()
    const gl = ctx.createLinearGradient(figX - figH * 0.8, 0, figX + figH * 0.8, 0)
    gl.addColorStop(0, 'transparent')
    gl.addColorStop(0.5, 'rgba(99,102,241,0.35)')
    gl.addColorStop(1, 'transparent')
    ctx.strokeStyle = gl; ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(figX - figH * 0.8, figY + figH * 0.2)
    ctx.lineTo(figX + figH * 0.8, figY + figH * 0.2)
    ctx.stroke()
    ctx.restore()
  }

  resize()
  window.addEventListener('resize', resize)
  rafId = requestAnimationFrame(draw)

  return () => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)

  // PWA direct launch
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  if (isStandalone) {
    const lang = selectedLanguage.value || localStorage.getItem('lastLearningLanguage') || 'deutsch'
    router.replace({ name: 'workshop-overview', params: { learning: lang } })
    return
  }

  if (Object.keys(availableContent.value).length === 0) {
    await loadAvailableContent()
  }

  // Start canvas after DOM is ready
  if (canvasEl.value) {
    const cleanup = startCanvas(canvasEl.value)
    onUnmounted(cleanup)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
/* ── Root ────────────────────────────────────────────────── */
.home-root {
  min-height: 100vh;
  background: hsl(222.2, 84%, 4.9%);
}

/* ── Hero ────────────────────────────────────────────────── */
.hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(7, 5, 42, 0.92) 0%,
    rgba(7, 5, 42, 0.65) 55%,
    rgba(7, 5, 42, 0.15) 100%
  );
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 2;
  padding: 40px 24px 80px;
  max-width: 600px;
  width: 100%;
}

/* Badge */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(99, 102, 241, 0.18);
  border: 1px solid rgba(99, 102, 241, 0.35);
  border-radius: 100px;
  padding: 5px 14px 5px 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(180, 160, 255, 0.95);
  margin-bottom: 24px;
  text-transform: uppercase;
}

.hero-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #6366f1;
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.7); }
  50%       { box-shadow: 0 0 0 6px rgba(99,102,241,0); }
}

/* Headline */
.hero-headline {
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.08;
  color: #ffffff;
  margin-bottom: 16px;
}

.hero-sub {
  font-size: clamp(0.95rem, 2.5vw, 1.15rem);
  color: rgba(200, 190, 255, 0.72);
  line-height: 1.6;
  margin-bottom: 36px;
  max-width: 420px;
}

/* CTA row */
.hero-cta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Language selector */
.lang-selector-wrap {
  position: relative;
}

.lang-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1.5px solid rgba(99, 102, 241, 0.5);
  border-radius: 14px;
  padding: 12px 18px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  font-family: inherit;
  backdrop-filter: blur(8px);
}

.lang-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.8);
}

.lang-flag { font-size: 20px; line-height: 1; }
.lang-name { font-size: 15px; }
.lang-chevron { opacity: 0.6; flex-shrink: 0; }

.lang-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 170px;
  background: hsl(240, 20%, 10%);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  z-index: 200;
  backdrop-filter: blur(16px);
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 16px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.8);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.lang-option:hover { background: rgba(99, 102, 241, 0.2); color: #fff; }
.lang-option.active { background: rgba(99, 102, 241, 0.25); color: #fff; }

.lang-drop-enter-active, .lang-drop-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.lang-drop-enter-from, .lang-drop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

/* Start button */
.start-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 13px 22px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 6px 24px rgba(99,102,241,0.5);
  transition: opacity 0.15s, transform 0.1s;
}

.start-btn:hover  { opacity: 0.92; }
.start-btn:active { transform: scale(0.97); }

/* Scroll hint */
.scroll-hint {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: none;
  border: none;
  color: rgba(180,160,255,0.4);
  cursor: pointer;
  animation: bounce-y 2.2s ease-in-out infinite;
}

@keyframes bounce-y {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%       { transform: translateX(-50%) translateY(8px); }
}

/* ── Features strip ──────────────────────────────────────── */
.features-strip {
  background: hsl(240, 10%, 8%);
  border-top: 1px solid rgba(99,102,241,0.15);
  border-bottom: 1px solid rgba(99,102,241,0.15);
  padding: 20px 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.features-strip::-webkit-scrollbar { display: none; }

.features-inner {
  display: flex;
  gap: 10px;
  padding: 0 20px;
  width: max-content;
  min-width: 100%;
  justify-content: center;
}

@media (max-width: 640px) {
  .features-inner { justify-content: flex-start; }
}

.feature-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 100px;
  padding: 8px 16px;
  white-space: nowrap;
  color: rgba(200,185,255,0.9);
  font-size: 13px;
  font-weight: 600;
  transition: background 0.2s;
}

.feature-pill:hover {
  background: rgba(99,102,241,0.2);
}

.pill-icon { font-size: 16px; }

/* ── Sections ────────────────────────────────────────────── */
.how-section,
.topics-section {
  padding: 48px 24px;
  max-width: 720px;
  margin: 0 auto;
}

.section-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: rgba(255,255,255,0.92);
  margin-bottom: 28px;
  letter-spacing: -0.02em;
}

/* Steps */
.steps-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 500px) {
  .steps-row { grid-template-columns: 1fr; }
}

.step-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  background: rgba(99,102,241,0.07);
  border: 1px solid rgba(99,102,241,0.18);
  border-radius: 16px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99,102,241,0.4);
}

.step-title {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  margin-bottom: 4px;
}

.step-desc {
  font-size: 12px;
  color: rgba(200,185,255,0.55);
  line-height: 1.5;
}

/* Topics */
.topics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

@media (max-width: 400px) {
  .topics-grid { grid-template-columns: repeat(2, 1fr); }
}

.topic-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  font-size: 13px;
  color: rgba(200,185,255,0.75);
  font-weight: 500;
  transition: background 0.2s;
}

.topic-chip:hover { background: rgba(99,102,241,0.1); }

/* ── Bottom CTA ──────────────────────────────────────────── */
.bottom-cta {
  padding: 56px 24px 72px;
  text-align: center;
  background: linear-gradient(to top, rgba(99,102,241,0.08), transparent);
  border-top: 1px solid rgba(99,102,241,0.15);
}

.cta-headline {
  font-size: clamp(1.4rem, 4vw, 2rem);
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}

.cta-sub {
  font-size: 14px;
  color: rgba(200,185,255,0.6);
  margin-bottom: 32px;
  max-width: 420px;
  margin-inline: auto;
  line-height: 1.6;
}

.cta-btns {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.06);
  border: 1.5px solid rgba(255,255,255,0.18);
  border-radius: 14px;
  padding: 13px 22px;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  transition: background 0.2s;
  font-family: inherit;
}

.ghost-btn:hover { background: rgba(255,255,255,0.12); }
</style>
