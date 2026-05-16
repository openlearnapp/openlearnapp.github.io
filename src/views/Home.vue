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

          <!-- Sky -->
          <rect width="800" height="420" fill="url(#hSky)" />

          <!-- Stars -->
          <g>
            <circle v-for="(s, i) in stars" :key="i"
              :cx="s.x" :cy="s.y" :r="s.r"
              fill="#fff"
              :opacity="0.2 + Math.sin(animFrame * 0.05 + s.phase) * 0.35 + 0.3" />
          </g>

          <!-- Aurora wave 1 -->
          <path
            :d="`M 0 ${130 + Math.sin(animFrame * 0.018) * 18}
                 Q 200 ${165 + Math.sin(animFrame * 0.02 + 1) * 22}
                   400 ${140 + Math.sin(animFrame * 0.02 + 2) * 18}
                 T 800 ${150 + Math.sin(animFrame * 0.018 + 3) * 15}
                 L 800 260 L 0 260 Z`"
            fill="url(#hAurora1)" opacity="0.75"
          />
          <!-- Aurora wave 2 -->
          <path
            :d="`M 0 ${160 + Math.sin(animFrame * 0.022 + 2) * 20}
                 Q 300 ${210 + Math.sin(animFrame * 0.022 + 3) * 24}
                   600 ${175 + Math.sin(animFrame * 0.022 + 4) * 16}
                 T 800 ${190 + Math.sin(animFrame * 0.022 + 5) * 20}
                 L 800 300 L 0 300 Z`"
            fill="url(#hAurora2)" opacity="0.55"
          />

          <!-- Central glow -->
          <ellipse cx="400" cy="230" rx="320" ry="160" fill="url(#hGlow)" />

          <!-- Floating language words -->
          <text v-for="(p, i) in langParticles" :key="'lp' + i"
            :x="p.x + Math.sin(animFrame * 0.02 + p.phase) * 10"
            :y="p.y + Math.cos(animFrame * 0.025 + p.phase) * 8"
            :font-size="p.size"
            :fill="p.color"
            :opacity="0.18 + Math.sin(animFrame * 0.03 + p.phase) * 0.1"
            font-family="system-ui, sans-serif"
            font-weight="700"
          >{{ p.word }}</text>
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

      <!-- ══ FEATURES ══ -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <div v-for="feature in features" :key="feature.key"
          class="flex items-start gap-3 p-4 rounded-xl bg-accent/30 border border-border/50">
          <span class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base flex-shrink-0">
            {{ feature.icon }}
          </span>
          <div>
            <div class="text-sm font-semibold text-foreground">{{ feature.title }}</div>
            <div class="text-xs text-muted-foreground mt-0.5">{{ feature.desc }}</div>
          </div>
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

      <!-- ══ WHAT YOU CAN LEARN ══ -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-3">{{ $t('home.whatYouCanLearn') }}</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ $t('home.whatYouCanLearnDesc') }}</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div v-for="example in useCaseExamples" :key="example.key"
            class="flex items-center gap-2 p-2 rounded-md bg-accent/20 text-sm">
            <span class="text-base">{{ example.icon }}</span>
            <span class="text-foreground text-xs">{{ example.label }}</span>
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
const animFrame = ref(0)
let rafId = null

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

function tick() {
  animFrame.value += 1
  rafId = requestAnimationFrame(tick)
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
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
</style>
