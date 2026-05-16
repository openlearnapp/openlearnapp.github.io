<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-muted-foreground">{{ $t('home.loading') }}</p>
    </div>

    <div v-else>
      <!-- ══ CINEMATIC HERO ══ -->
      <div class="hero-wrap relative w-full overflow-hidden rounded-2xl mb-8" style="height: 420px;">

        <!-- Animated SVG Background -->
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="hSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#060d24" />
              <stop offset="0.55" stop-color="#131040" />
              <stop offset="1" stop-color="#1e1b4b" />
            </linearGradient>
            <linearGradient id="hAurora1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#10b981" stop-opacity="0" />
              <stop offset="0.5" stop-color="#10b981" stop-opacity="0.3" />
              <stop offset="1" stop-color="#06b6d4" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="hAurora2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#a855f7" stop-opacity="0" />
              <stop offset="0.5" stop-color="#818cf8" stop-opacity="0.25" />
              <stop offset="1" stop-color="#3b82f6" stop-opacity="0" />
            </linearGradient>
            <radialGradient id="hGlow" cx="50%" cy="55%">
              <stop offset="0" stop-color="#6366f1" stop-opacity="0.18" />
              <stop offset="1" stop-color="#6366f1" stop-opacity="0" />
            </radialGradient>
          </defs>

          <!-- ── Layer 1: Background (slowest, drifts down) ── -->
          <g :transform="`translate(0, ${parallax.back})`">
            <rect width="800" height="420" fill="url(#hSky)" />
            <circle v-for="(s, i) in stars" :key="i"
              :cx="s.x" :cy="s.y" :r="s.r"
              fill="#fff"
              :opacity="0.2 + Math.sin(animFrame * 0.05 + s.phase) * 0.35 + 0.3" />
          </g>

          <!-- ── Layer 2: Mid (aurora + glow, medium drift) ── -->
          <g :transform="`translate(0, ${parallax.mid})`">
            <path
              :d="`M 0 ${130 + Math.sin(animFrame * 0.018) * 18}
                   Q 200 ${165 + Math.sin(animFrame * 0.02 + 1) * 22}
                     400 ${140 + Math.sin(animFrame * 0.02 + 2) * 18}
                   T 800 ${150 + Math.sin(animFrame * 0.018 + 3) * 15}
                   L 800 260 L 0 260 Z`"
              fill="url(#hAurora1)" opacity="0.75"
            />
            <path
              :d="`M 0 ${160 + Math.sin(animFrame * 0.022 + 2) * 20}
                   Q 300 ${210 + Math.sin(animFrame * 0.022 + 3) * 24}
                     600 ${175 + Math.sin(animFrame * 0.022 + 4) * 16}
                   T 800 ${190 + Math.sin(animFrame * 0.022 + 5) * 20}
                   L 800 300 L 0 300 Z`"
              fill="url(#hAurora2)" opacity="0.55"
            />
            <ellipse cx="400" cy="230" rx="320" ry="160" fill="url(#hGlow)" />
          </g>

          <!-- ── Layer 3: Foreground (lang words, fastest, opposite direction) ── -->
          <g :transform="`translate(0, ${parallax.front})`">
            <text v-for="(p, i) in langParticles" :key="'lp' + i"
              :x="p.x + Math.sin(animFrame * 0.02 + p.phase) * 10"
              :y="p.y + Math.cos(animFrame * 0.025 + p.phase) * 8"
              :font-size="p.size"
              :fill="p.color"
              :opacity="0.18 + Math.sin(animFrame * 0.03 + p.phase) * 0.1"
              font-family="system-ui, sans-serif"
              font-weight="700"
            >{{ p.word }}</text>
          </g>
        </svg>

        <!-- Hero content overlay -->
        <div class="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <!-- Badge -->
          <span class="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full mb-4">
            Open Learn
          </span>

          <!-- Headline -->
          <h1 class="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-3 drop-shadow-xl">
            {{ $t('home.title') }}
          </h1>
          <p class="text-sm sm:text-base text-slate-300/80 mb-8 max-w-sm leading-relaxed">
            {{ $t('home.subtitle') }}
          </p>

          <!-- Language Selector — Primary CTA -->
          <div class="relative">
            <button
              @click.stop="showLanguageMenu = !showLanguageMenu"
              class="lang-cta flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base shadow-xl transition-all"
            >
              <span class="text-xl leading-none">{{ getFlag(currentLanguage) }}</span>
              <span>{{ formatLangName(currentLanguage) }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-70 transition-transform" :class="showLanguageMenu ? 'rotate-180' : ''"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <!-- Dropdown -->
            <Transition name="dropdown">
              <div
                v-if="showLanguageMenu"
                class="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl overflow-hidden min-w-[200px] z-[100]"
              >
                <button
                  v-for="lang in learningLanguages"
                  :key="lang"
                  @click="selectLanguage(lang)"
                  :class="[
                    'flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left hover:bg-accent transition',
                    currentLanguage === lang ? 'bg-accent font-semibold' : ''
                  ]"
                >
                  <span class="text-lg leading-none">{{ getFlag(lang) }}</span>
                  <span>{{ formatLangName(lang) }}</span>
                </button>
              </div>
            </Transition>
          </div>

          <!-- Secondary CTA -->
          <a
            :href="'#/' + currentLanguage"
            class="mt-4 text-xs text-slate-300/60 hover:text-white transition underline underline-offset-4"
          >
            {{ $t('home.browseWorkshops') }} →
          </a>
        </div>

        <!-- Bottom gradient fade -->
        <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>

      <!-- ══ FEATURES — 4 Premium-Karten mit Custom-SVG-Icons und Glow ══ -->
      <div class="feat-grid grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <div
          v-for="feature in features"
          :key="feature.key"
          class="feat-card group relative overflow-hidden"
          @mousemove="onFeatMove($event, feature.key)"
          @mouseleave="featActive = ''"
          :data-active="featActive === feature.key"
        >
          <!-- Color-themed glow behind card -->
          <span class="feat-glow" :style="{ '--c': featureColor(feature.key) }" aria-hidden="true"></span>

          <!-- Card content -->
          <div class="relative z-10 flex items-start gap-4 p-5">
            <!-- Icon block with gradient -->
            <div class="feat-icon flex-shrink-0" :style="{ '--c': featureColor(feature.key) }">
              <component :is="featureIcon(feature.key)" class="w-7 h-7" />
            </div>

            <div class="flex-1 min-w-0">
              <h4 class="text-base font-bold text-foreground mb-1 tracking-tight">{{ feature.title }}</h4>
              <p class="text-sm text-muted-foreground leading-relaxed">{{ feature.desc }}</p>
            </div>
          </div>

          <!-- Hover-Streifen unten -->
          <span class="feat-underline" :style="{ '--c': featureColor(feature.key) }" aria-hidden="true"></span>
        </div>
      </div>

      <!-- ══ HOW IT WORKS ══ -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-4">{{ $t('home.howItWorks') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="text-center p-4">
            <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">1</div>
            <div class="text-sm font-medium text-foreground mb-3">{{ steps[0].title }}</div>
            <div class="relative inline-block mb-3">
              <button
                @click="showLanguageMenu = !showLanguageMenu"
                class="flex items-center gap-1.5 bg-primary text-white font-medium text-sm rounded-full px-4 py-2 cursor-pointer hover:bg-primary/90 transition">
                <span class="text-base leading-none">{{ getFlag(currentLanguage) }}</span>
                <span>{{ formatLangName(currentLanguage) }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-70"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
            <div class="text-xs text-muted-foreground">{{ steps[0].desc }}</div>
          </div>
          <div class="text-center p-4">
            <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">2</div>
            <div class="text-sm font-medium text-foreground mb-3">{{ steps[1].title }}</div>
            <a :href="'#/' + currentLanguage" class="inline-flex items-center gap-1.5 bg-primary text-white font-medium text-sm rounded-full px-4 py-2 cursor-pointer hover:bg-primary/90 transition mb-3">
              {{ $t('home.browseWorkshops') }} →
            </a>
            <div class="text-xs text-muted-foreground">{{ steps[1].desc }}</div>
          </div>
          <div class="text-center p-4">
            <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">3</div>
            <div class="text-sm font-medium text-foreground mb-1">{{ steps[2].title }}</div>
            <div class="text-xs text-muted-foreground">{{ steps[2].desc }}</div>
          </div>
        </div>
      </div>

      <!-- ══ WHAT YOU CAN LEARN — Premium-Panel, 2 Reihen, glühende Icons, Maus-Parallax ══ -->
      <div class="mb-12">
        <h3 class="text-lg font-semibold text-foreground mb-1">{{ $t('home.whatYouCanLearn') }}</h3>
        <p class="text-sm text-muted-foreground mb-5">{{ $t('home.whatYouCanLearnDesc') }}</p>

        <div
          class="uc-panel relative overflow-hidden rounded-2xl"
          @mousemove="onUcPanelMove"
          @mouseleave="ucPanelX = 0"
        >
          <!-- Animated dark gradient backdrop -->
          <div class="uc-bg" aria-hidden="true"></div>

          <!-- Subtle particles -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <circle v-for="(p, i) in ucParticles" :key="i"
              :cx="p.x + Math.sin(animFrame * 0.02 + p.phase) * 20"
              :cy="p.y + Math.cos(animFrame * 0.025 + p.phase) * 12"
              :r="p.r"
              :fill="p.color"
              :opacity="0.15 + Math.sin(animFrame * 0.04 + p.phase) * 0.12" />
          </svg>

          <!-- Edge-Fades -->
          <div class="absolute inset-y-0 left-0 w-20 z-20 pointer-events-none uc-fade-l"></div>
          <div class="absolute inset-y-0 right-0 w-20 z-20 pointer-events-none uc-fade-r"></div>

          <!-- Row 1: scroll left -->
          <div class="uc-row-wrap" :style="{ transform: `translateX(${ucPanelX * -8}px)` }">
            <div class="uc-track uc-track--left">
              <div
                v-for="(example, i) in [...useCaseExamples, ...useCaseExamples]"
                :key="'r1' + i + example.key"
                class="uc-chip group"
              >
                <span class="uc-chip-glow" :style="{ '--glow': iconColor(example.key) }" aria-hidden="true"></span>
                <span class="uc-chip-icon" :style="{ color: iconColor(example.key) }">
                  <component :is="useCaseIcon(example.key)" class="w-7 h-7 transition-transform group-hover:scale-110" />
                </span>
                <span class="uc-chip-label">{{ example.label }}</span>
              </div>
            </div>
          </div>

          <!-- Row 2: scroll right (reversed order for variety) -->
          <div class="uc-row-wrap" :style="{ transform: `translateX(${ucPanelX * 8}px)` }">
            <div class="uc-track uc-track--right">
              <div
                v-for="(example, i) in [...useCaseExamples].reverse().concat([...useCaseExamples].reverse())"
                :key="'r2' + i + example.key"
                class="uc-chip group"
              >
                <span class="uc-chip-glow" :style="{ '--glow': iconColor(example.key) }" aria-hidden="true"></span>
                <span class="uc-chip-icon" :style="{ color: iconColor(example.key) }">
                  <component :is="useCaseIcon(example.key)" class="w-7 h-7 transition-transform group-hover:scale-110" />
                </span>
                <span class="uc-chip-label">{{ example.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ BUILT-IN TOOLS ══ -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-3">{{ $t('home.builtInTools') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="tool in tools" :key="tool.key" class="p-3 rounded-lg border border-border">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-base">{{ tool.icon }}</span>
              <span class="text-sm font-medium text-foreground">{{ tool.title }}</span>
            </div>
            <p class="text-xs text-muted-foreground">{{ tool.desc }}</p>
          </div>
        </div>
      </div>

      <!-- ══ FOR CREATORS ══ -->
      <div class="mb-8 p-5 rounded-xl border border-border bg-accent/10">
        <div class="flex items-start gap-4">
          <span class="text-3xl flex-shrink-0">✏️</span>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-1">{{ $t('home.forCreators') }}</h3>
            <p class="text-sm text-muted-foreground mb-3">{{ $t('home.forCreatorsDesc') }}</p>
            <a href="#/creators" class="text-sm font-medium text-primary hover:underline">{{ $t('home.forCreatorsLink') }} →</a>
          </div>
        </div>
      </div>

      <!-- ══ PRIVACY ══ -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-3">{{ $t('home.privacyTitle') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div v-for="item in privacyPoints" :key="item.key" class="p-3 rounded-lg bg-accent/20">
            <div class="text-sm font-medium text-foreground mb-1">{{ item.title }}</div>
            <p class="text-xs text-muted-foreground">{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <!-- ══ ROADMAP ══ -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-3">{{ $t('home.roadmapTitle') }}</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ $t('home.roadmapDesc') }}</p>
        <div class="space-y-2">
          <div v-for="item in roadmapItems" :key="item.key"
            :class="['flex items-start gap-3 p-3 rounded-lg border', item.done ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-border']">
            <span class="text-base mt-0.5">{{ item.icon }}</span>
            <div class="flex-grow">
              <div :class="['text-sm font-medium', item.done ? 'text-green-700 dark:text-green-400 line-through' : 'text-foreground']">{{ item.title }}</div>
              <p class="text-xs text-muted-foreground">{{ item.desc }}</p>
            </div>
            <a v-if="item.issue" :href="'https://github.com/openlearnapp/openlearnapp.github.io/issues/' + item.issue" target="_blank" rel="noopener" class="text-xs text-primary hover:underline flex-shrink-0" @click.stop>#{{ item.issue }}</a>
          </div>
        </div>
      </div>

      <!-- ══ OPEN SOURCE ══ -->
      <div class="mb-8 p-5 rounded-xl border border-primary/20 bg-primary/5 text-center">
        <h3 class="text-lg font-semibold text-foreground mb-2">{{ $t('home.openSourceTitle') }}</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ $t('home.openSourceDesc') }}</p>
        <a href="https://github.com/openlearnapp/openlearnapp.github.io" target="_blank" rel="noopener"
          class="inline-block px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition">
          {{ $t('home.viewOnGitHub') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, h, onMounted, onUnmounted } from 'vue'
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
const animFrame = ref(0)
const scrollY = ref(0)
let rafId = null

// Parallax-Tiefe: 3 Layer.
// Scroll + kontinuierliche Drift (sin) — dadurch immer sichtbar Bewegung, auch ohne Scrollen.
// back = treibt nach unten (weit weg), mid = subtil, front = wandert nach oben (nah dran)
const parallax = computed(() => ({
  back:  scrollY.value *  0.55 + Math.sin(animFrame.value * 0.008)      * 12,
  mid:   scrollY.value *  0.25 + Math.sin(animFrame.value * 0.012 + 1)  * 8,
  front: scrollY.value * -0.40 + Math.sin(animFrame.value * 0.015 + 2)  * 14,
}))

function onScroll() {
  scrollY.value = Math.min(window.scrollY, 800)
}

const learningLanguages = computed(() => [...new Set(Object.keys(availableContent.value))])
const currentLanguage = computed(() => selectedLanguage.value || learningLanguages.value[0] || 'english')

// Seeded stars
const stars = Array.from({ length: 55 }, (_, i) => ({
  x: (i * 139.5 + 31) % 800,
  y: (i * 79.3 + 11) % 280,
  r: 0.6 + (i % 4) * 0.45,
  phase: i * 0.31,
}))

// Floating language words
const langWords = ['Hola', 'Hello', 'مرحبا', 'سلام', 'Bonjour', 'Ciao', 'Olá', 'こんにちは', 'Привет', 'Linux', '学ぶ', 'Lernen']
const wordColors = ['#10b981', '#818cf8', '#a78bfa', '#60a5fa', '#34d399', '#f472b6']
const langParticles = Array.from({ length: 14 }, (_, i) => ({
  x: 30 + (i * 57) % 740,
  y: 30 + (i % 6) * 56,
  size: 11 + (i % 3) * 5,
  color: wordColors[i % wordColors.length],
  word: langWords[i % langWords.length],
  phase: i * 0.44,
}))

function handleClickOutside(e) {
  if (showLanguageMenu.value && !e.target.closest('.relative')) {
    showLanguageMenu.value = false
  }
}

const features = computed(() => [
  { key: 'any',   icon: '🎯', title: t('home.features.anySubject'),    desc: t('home.features.anySubjectDesc') },
  { key: 'rich',  icon: '🎬', title: t('home.features.richExperience'), desc: t('home.features.richExperienceDesc') },
  { key: 'create',icon: '✏️', title: t('home.features.yourContent'),   desc: t('home.features.yourContentDesc') },
  { key: 'infra', icon: '🔒', title: t('home.features.zeroInfra'),     desc: t('home.features.zeroInfraDesc') },
])

const steps = computed(() => [
  { title: t('home.steps.pickLang'),     desc: t('home.steps.pickLangDesc') },
  { title: t('home.steps.startWorkshop'),desc: t('home.steps.startWorkshopDesc') },
  { title: t('home.steps.learnTrack'),   desc: t('home.steps.learnTrackDesc') },
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

const tools = computed(() => [
  { key: 'quiz',    icon: '✅', title: t('home.tools.assessments'), desc: t('home.tools.assessmentsDesc') },
  { key: 'audio',   icon: '🔊', title: t('home.tools.audio'),       desc: t('home.tools.audioDesc') },
  { key: 'video',   icon: '🎬', title: t('home.tools.video'),       desc: t('home.tools.videoDesc') },
  { key: 'progress',icon: '📊', title: t('home.tools.progress'),    desc: t('home.tools.progressDesc') },
  { key: 'coach',   icon: '🎓', title: t('home.tools.coach'),       desc: t('home.tools.coachDesc') },
  { key: 'sync',    icon: '🔄', title: t('home.tools.sync'),        desc: t('home.tools.syncDesc') },
])

const privacyPoints = computed(() => [
  { key: 'local',   title: t('home.privacy.local'),     desc: t('home.privacy.localDesc') },
  { key: 'notrack', title: t('home.privacy.noTracking'),desc: t('home.privacy.noTrackingDesc') },
  { key: 'export',  title: t('home.privacy.yourData'),  desc: t('home.privacy.yourDataDesc') },
])

const roadmapItems = computed(() => [
  { key: 'coach',  icon: '🤖', title: t('home.roadmap.aiCoach'),  desc: t('home.roadmap.aiCoachDesc'),  issue: 45 },
  { key: 'kids',   icon: '🧒', title: t('home.roadmap.kidsMode'), desc: t('home.roadmap.kidsModeDesc'), issue: 46 },
  { key: 'images', icon: '🖼️', title: t('home.roadmap.images'),  desc: t('home.roadmap.imagesDesc'),   issue: 47 },
  { key: 'i18n',   icon: '✅', title: t('home.roadmap.i18n'),     desc: t('home.roadmap.i18nDesc'),     issue: 44, done: true },
  { key: 'upload', icon: '📄', title: t('home.roadmap.uploads'),  desc: t('home.roadmap.uploadsDesc'),  issue: 51 },
])

function selectLanguage(lang) {
  showLanguageMenu.value = false
  setLanguage(lang)
}

// ── Custom SVG icons für „What you can learn" ──
// Linien-Stil, farblich passend zum Hero (emerald, indigo, violet, sky, rose)
const ICON_BASE = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.6',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}
const makeIcon = (color, paths) => () =>
  h('svg', { viewBox: '0 0 24 24', ...ICON_BASE, style: { color } },
    paths.map(d => h('path', { d })))
const IconGlobe   = makeIcon('#10b981', ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M3 12h18', 'M12 3a13 13 0 0 1 0 18', 'M12 3a13 13 0 0 0 0 18'])
const IconMath    = makeIcon('#818cf8', ['M5 7h6', 'M8 4v6', 'M5 17l6 0', 'M5 14l6 6', 'M5 20l6-6', 'M16 6h4', 'M16 9h4', 'M18 15v4', 'M16 17h4'])
const IconCar     = makeIcon('#f472b6', ['M5 15h14l-1.5-5a2 2 0 0 0-1.9-1.4H8.4A2 2 0 0 0 6.5 10L5 15z', 'M5 15v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1', 'M16 15v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1', 'M8 12h.01', 'M16 12h.01'])
const IconMusic   = makeIcon('#a78bfa', ['M9 18V5l12-2v13', 'M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3z', 'M21 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z'])
const IconCode    = makeIcon('#60a5fa', ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6', 'M14 4l-4 16'])
const IconScience = makeIcon('#34d399', ['M9 3h6', 'M10 3v6l-5 8a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-8V3', 'M7.5 14h9'])
const IconHistory = makeIcon('#fbbf24', ['M4 7V5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v2', 'M4 7h15v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z', 'M8 11h7', 'M8 15h7'])
const IconMedical = makeIcon('#f87171', ['M12 5v14', 'M5 12h14', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'])
const IconLaw     = makeIcon('#c084fc', ['M12 3v18', 'M5 8l7-3 7 3', 'M5 8l-2 7a4 4 0 0 0 8 0L9 8', 'M19 8l2 7a4 4 0 0 1-8 0L15 8'])

const USE_CASE_ICONS = {
  lang: IconGlobe, math: IconMath, drive: IconCar, music: IconMusic, code: IconCode,
  science: IconScience, history: IconHistory, med: IconMedical, law: IconLaw,
}
const USE_CASE_COLORS = {
  lang: '#10b981', math: '#818cf8', drive: '#f472b6', music: '#a78bfa', code: '#60a5fa',
  science: '#34d399', history: '#fbbf24', med: '#f87171', law: '#c084fc',
}
function useCaseIcon(key) { return USE_CASE_ICONS[key] || IconGlobe }
function iconColor(key)   { return USE_CASE_COLORS[key] || '#10b981' }

// ── Feature Cards: Custom Icons + Themen-Farben + Cursor-Tracking ──
const IconTarget = makeIcon('#f97316', [
  'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  'M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
])
const IconFilm = makeIcon('#06b6d4', [
  'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z',
  'M3 8h4 M3 12h4 M3 16h4 M17 8h4 M17 12h4 M17 16h4',
  'M10 9l5 3-5 3V9z',
])
const IconPencil = makeIcon('#10b981', [
  'M16.4 3.6a2.1 2.1 0 0 1 3 3L7.5 18.5l-4 1 1-4L16.4 3.6z',
  'M14 6l4 4',
])
const IconShield = makeIcon('#a855f7', [
  'M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z',
  'M9 12l2 2 4-4',
])

const FEATURE_ICONS = { any: IconTarget, rich: IconFilm, create: IconPencil, infra: IconShield }
const FEATURE_COLORS = { any: '#f97316', rich: '#06b6d4', create: '#10b981', infra: '#a855f7' }
function featureIcon(key)  { return FEATURE_ICONS[key]  || IconTarget }
function featureColor(key) { return FEATURE_COLORS[key] || '#10b981' }

const featActive = ref('')
function onFeatMove(e, key) {
  const card = e.currentTarget
  const rect = card.getBoundingClientRect()
  card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width  * 100) + '%')
  card.style.setProperty('--my', ((e.clientY - rect.top)  / rect.height * 100) + '%')
  featActive.value = key
}

// ── Use-Case Panel: Maus-Parallax + Partikel ──
const ucPanelX = ref(0)
function onUcPanelMove(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5  // -0.5 .. +0.5
  ucPanelX.value = x
}
const ucParticles = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 71.7 + 20) % 800,
  y: (i * 43.1 + 15) % 280,
  r: 1 + (i % 3) * 0.8,
  color: ['#10b981', '#818cf8', '#a78bfa', '#60a5fa', '#34d399', '#f472b6'][i % 6],
  phase: i * 0.37,
}))

function tick() {
  animFrame.value += 1
  rafId = requestAnimationFrame(tick)
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', onScroll, { passive: true })
  rafId = requestAnimationFrame(tick)

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  if (isStandalone) {
    const lang = selectedLanguage.value || localStorage.getItem('lastLearningLanguage') || 'deutsch'
    router.replace({ name: 'workshop-overview', params: { learning: lang } })
    return
  }

  if (Object.keys(availableContent.value).length === 0) {
    await loadAvailableContent()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', onScroll)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.hero-wrap {
  background: linear-gradient(180deg, #060d24 0%, #1e1b4b 100%);
}

/* Cinema bars */
.hero-wrap::before,
.hero-wrap::after {
  content: '';
  position: absolute;
  left: 0; right: 0; height: 6px;
  z-index: 2; pointer-events: none;
}
.hero-wrap::before { top: 0;    background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent); }
.hero-wrap::after  { bottom: 0; background: linear-gradient(to top,   rgba(0,0,0,0.3), transparent); }

/* Primary language CTA button */
.lang-cta {
  background: rgba(255,255,255,0.12);
  border: 1.5px solid rgba(255,255,255,0.3);
  backdrop-filter: blur(8px);
  color: #fff;
  box-shadow: 0 0 40px rgba(99,102,241,0.3), 0 4px 20px rgba(0,0,0,0.4);
  transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
}
.lang-cta:hover {
  transform: scale(1.04);
  background: rgba(99,102,241,0.25);
  border-color: rgba(99,102,241,0.6);
  box-shadow: 0 0 60px rgba(99,102,241,0.4), 0 4px 24px rgba(0,0,0,0.5);
}

/* Dropdown transition */
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) translateX(-50%); }
.dropdown-enter-to, .dropdown-leave-from { transform: translateY(0) translateX(-50%); }

/* ── Feature Cards (Sektion A) ── */
.feat-card {
  position: relative;
  border-radius: 18px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.35s,
              box-shadow 0.35s;
  isolation: isolate;
}
.feat-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--c, #10b981) 50%, transparent);
  box-shadow: 0 16px 40px -8px rgba(0,0,0,0.12),
              0 0 0 1px color-mix(in srgb, var(--c, #10b981) 25%, transparent);
}
:global(.dark) .feat-card:hover {
  box-shadow: 0 20px 50px -8px rgba(0,0,0,0.5),
              0 0 0 1px color-mix(in srgb, var(--c, #10b981) 35%, transparent);
}

/* Spotlight that follows cursor */
.feat-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%),
              color-mix(in srgb, var(--c) 22%, transparent) 0%,
              transparent 55%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 1;
}
.feat-card:hover .feat-glow { opacity: 1; }

/* Themed icon box */
.feat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c);
  background: linear-gradient(135deg,
              color-mix(in srgb, var(--c) 15%, transparent),
              color-mix(in srgb, var(--c) 5%, transparent));
  border: 1px solid color-mix(in srgb, var(--c) 25%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--c) 20%, transparent),
              0 4px 14px -4px color-mix(in srgb, var(--c) 40%, transparent);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.35s;
}
.feat-card:hover .feat-icon {
  transform: scale(1.08) rotate(-3deg);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--c) 30%, transparent),
              0 8px 24px -4px color-mix(in srgb, var(--c) 60%, transparent);
}

/* Animated bottom underline */
.feat-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--c, #10b981), transparent);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 2;
}
.feat-card:hover .feat-underline { transform: scaleX(1); }

@media (prefers-reduced-motion: reduce) {
  .feat-card, .feat-icon, .feat-underline, .feat-glow { transition: none; }
  .feat-card:hover { transform: none; }
  .feat-card:hover .feat-icon { transform: none; }
}

/* ── Use-Case Premium Panel ── */
.uc-panel {
  padding: 22px 0;
  background: linear-gradient(180deg, #060d24 0%, #131040 50%, #1e1b4b 100%);
  border: 1px solid rgba(99,102,241,0.18);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.05),
    0 12px 40px rgba(0,0,0,0.25),
    0 0 60px rgba(99,102,241,0.12);
  transition: box-shadow 0.4s;
}
.uc-panel:hover {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),
    0 12px 50px rgba(0,0,0,0.35),
    0 0 100px rgba(99,102,241,0.25);
}
.uc-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(16,185,129,0.18), transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(168,85,247,0.18), transparent 50%);
  pointer-events: none;
  z-index: 0;
}
.uc-fade-l { background: linear-gradient(to right, #060d24 0%, transparent 100%); }
.uc-fade-r { background: linear-gradient(to left,  #1e1b4b 0%, transparent 100%); }

.uc-row-wrap {
  position: relative;
  z-index: 5;
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.uc-row-wrap + .uc-row-wrap { margin-top: 12px; }

.uc-track {
  display: flex;
  gap: 14px;
  width: max-content;
  padding: 0 8px;
}
.uc-track--left  { animation: uc-marquee-l 42s linear infinite; }
.uc-track--right { animation: uc-marquee-r 48s linear infinite; }
@keyframes uc-marquee-l { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
@keyframes uc-marquee-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }

.uc-panel:hover .uc-track { animation-play-state: paused; }

.uc-chip {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
  transition: transform 0.3s, background 0.3s, border-color 0.3s;
  isolation: isolate;
}
.uc-chip:hover {
  transform: translateY(-3px) scale(1.04);
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
}
.uc-chip-glow {
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  background: radial-gradient(circle at center, var(--glow, #10b981) 0%, transparent 60%);
  opacity: 0;
  z-index: -1;
  filter: blur(14px);
  transition: opacity 0.3s;
}
.uc-chip:hover .uc-chip-glow { opacity: 0.55; }
.uc-chip-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 0 8px currentColor);
}
.uc-chip-label {
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  color: #f1f5f9;
  letter-spacing: 0.01em;
}

@media (prefers-reduced-motion: reduce) {
  .uc-track { animation: none; }
}
</style>
