<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-muted-foreground">{{ $t('home.loading') }}</p>
    </div>

    <div v-else>
      <!-- Hero section -->
      <div class="mb-8">
        <p class="text-sm font-semibold text-primary mb-1 tracking-wide uppercase">Open Learn</p>
        <h2 class="text-3xl font-bold mb-2 text-foreground">
          {{ $t('home.title') }}
        </h2>
        <p class="text-muted-foreground mb-5 leading-relaxed">
          {{ $t('home.subtitle') }}
        </p>

        <!-- Feature highlights -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div v-for="feature in features" :key="feature.key"
            class="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
            <span class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base flex-shrink-0">
              {{ feature.icon }}
            </span>
            <div>
              <div class="text-sm font-medium text-foreground">{{ feature.title }}</div>
              <div class="text-xs text-muted-foreground">{{ feature.desc }}</div>
            </div>
          </div>
        </div>

      </div>

      <!-- How it works (with integrated language selector as step 1) -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-4">{{ $t('home.howItWorks') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Step 1: Pick a language (interactive dropdown) -->
          <div class="text-center p-4">
            <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
              1
            </div>
            <div class="text-sm font-medium text-foreground mb-3">{{ steps[0].title }}</div>
            <div class="relative inline-block mb-3">
              <button
                @click="showLanguageMenu = !showLanguageMenu"
                class="flex items-center gap-1.5 bg-primary text-white font-medium text-sm rounded-full px-4 py-2 cursor-pointer hover:bg-primary/90 transition">
                <span class="text-base leading-none">{{ getFlag(currentLanguage) }}</span>
                <span>{{ formatLangName(currentLanguage) }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-70"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div
                v-if="showLanguageMenu"
                class="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-popover text-popover-foreground border rounded-lg shadow-lg overflow-hidden min-w-[160px] z-[100]">
                <button
                  v-for="lang in learningLanguages"
                  :key="lang"
                  @click="selectLanguage(lang)"
                  :class="[
                    'flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent transition',
                    currentLanguage === lang ? 'bg-accent font-medium' : ''
                  ]">
                  <span class="text-base leading-none">{{ getFlag(lang) }}</span>
                  <span>{{ formatLangName(lang) }}</span>
                </button>
              </div>
            </div>
            <div class="text-xs text-muted-foreground">{{ steps[0].desc }}</div>
          </div>

          <!-- Step 2: Start a Workshop (links to workshop overview) -->
          <div class="text-center p-4">
            <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
              2
            </div>
            <div class="text-sm font-medium text-foreground mb-3">{{ steps[1].title }}</div>
            <a
              :href="'#/' + currentLanguage"
              class="inline-flex items-center gap-1.5 bg-primary text-white font-medium text-sm rounded-full px-4 py-2 cursor-pointer hover:bg-primary/90 transition mb-3">
              {{ $t('home.browseWorkshops') }} →
            </a>
            <div class="text-xs text-muted-foreground">{{ steps[1].desc }}</div>
          </div>

          <!-- Step 3: Learn & Track -->
          <div class="text-center p-4">
            <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
              3
            </div>
            <div class="text-sm font-medium text-foreground mb-1">{{ steps[2].title }}</div>
            <div class="text-xs text-muted-foreground">{{ steps[2].desc }}</div>
          </div>
        </div>
      </div>

      <!-- What you can learn -->
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

      <!-- Built-in tools -->
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

      <!-- For creators (teaser) -->
      <div class="mb-8 p-5 rounded-lg border border-border bg-accent/10">
        <div class="flex items-start gap-4">
          <span class="text-3xl flex-shrink-0">✏️</span>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-1">{{ $t('home.forCreators') }}</h3>
            <p class="text-sm text-muted-foreground mb-3">{{ $t('home.forCreatorsDesc') }}</p>
            <a href="#/creators" class="text-sm font-medium text-primary hover:underline">
              {{ $t('home.forCreatorsLink') }} →
            </a>
          </div>
        </div>
      </div>

      <!-- Privacy & ownership -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-3">{{ $t('home.privacyTitle') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div v-for="item in privacyPoints" :key="item.key" class="p-3 rounded-lg bg-accent/20">
            <div class="text-sm font-medium text-foreground mb-1">{{ item.title }}</div>
            <p class="text-xs text-muted-foreground">{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Roadmap -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-3">{{ $t('home.roadmapTitle') }}</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ $t('home.roadmapDesc') }}</p>
        <div class="space-y-2">
          <div v-for="item in roadmapItems" :key="item.key"
            :class="[
              'flex items-start gap-3 p-3 rounded-lg border',
              item.done ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-border'
            ]">
            <span class="text-base mt-0.5">{{ item.icon }}</span>
            <div class="flex-grow">
              <div :class="['text-sm font-medium', item.done ? 'text-green-700 dark:text-green-400 line-through' : 'text-foreground']">{{ item.title }}</div>
              <p class="text-xs text-muted-foreground">{{ item.desc }}</p>
            </div>
            <a v-if="item.issue"
              :href="'https://github.com/felixboehm/open-learn/issues/' + item.issue"
              target="_blank" rel="noopener"
              class="text-xs text-primary hover:underline flex-shrink-0"
              @click.stop>
              #{{ item.issue }}
            </a>
          </div>
        </div>
      </div>

      <!-- Open source CTA -->
      <div class="mb-8 p-5 rounded-lg border border-primary/20 bg-primary/5 text-center">
        <h3 class="text-lg font-semibold text-foreground mb-2">{{ $t('home.openSourceTitle') }}</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ $t('home.openSourceDesc') }}</p>
        <a href="https://github.com/felixboehm/open-learn"
          target="_blank" rel="noopener"
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

const learningLanguages = computed(() => {
  return [...new Set(Object.keys(availableContent.value))]
})

const currentLanguage = computed(() => {
  return selectedLanguage.value || learningLanguages.value[0] || 'english'
})

function handleClickOutside(e) {
  if (showLanguageMenu.value && !e.target.closest('.relative')) {
    showLanguageMenu.value = false
  }
}

const features = computed(() => [
  { key: 'any', icon: '🎯', title: t('home.features.anySubject'), desc: t('home.features.anySubjectDesc') },
  { key: 'rich', icon: '🎬', title: t('home.features.richExperience'), desc: t('home.features.richExperienceDesc') },
  { key: 'create', icon: '✏️', title: t('home.features.yourContent'), desc: t('home.features.yourContentDesc') },
  { key: 'infra', icon: '🔒', title: t('home.features.zeroInfra'), desc: t('home.features.zeroInfraDesc') },
])

const steps = computed(() => [
  { title: t('home.steps.pickLang'), desc: t('home.steps.pickLangDesc') },
  { title: t('home.steps.startWorkshop'), desc: t('home.steps.startWorkshopDesc') },
  { title: t('home.steps.learnTrack'), desc: t('home.steps.learnTrackDesc') },
])

const useCaseExamples = computed(() => [
  { key: 'lang', icon: '🌍', label: t('home.useCases.languages') },
  { key: 'math', icon: '🧮', label: t('home.useCases.math') },
  { key: 'drive', icon: '🚗', label: t('home.useCases.driving') },
  { key: 'music', icon: '🎵', label: t('home.useCases.music') },
  { key: 'code', icon: '💻', label: t('home.useCases.coding') },
  { key: 'science', icon: '🔬', label: t('home.useCases.science') },
  { key: 'history', icon: '📜', label: t('home.useCases.history') },
  { key: 'med', icon: '🏥', label: t('home.useCases.medicine') },
  { key: 'law', icon: '⚖️', label: t('home.useCases.law') },
])

const tools = computed(() => [
  { key: 'quiz', icon: '✅', title: t('home.tools.assessments'), desc: t('home.tools.assessmentsDesc') },
  { key: 'audio', icon: '🔊', title: t('home.tools.audio'), desc: t('home.tools.audioDesc') },
  { key: 'video', icon: '🎬', title: t('home.tools.video'), desc: t('home.tools.videoDesc') },
  { key: 'progress', icon: '📊', title: t('home.tools.progress'), desc: t('home.tools.progressDesc') },
  { key: 'coach', icon: '🎓', title: t('home.tools.coach'), desc: t('home.tools.coachDesc') },
  { key: 'sync', icon: '🔄', title: t('home.tools.sync'), desc: t('home.tools.syncDesc') },
])

const privacyPoints = computed(() => [
  { key: 'local', title: t('home.privacy.local'), desc: t('home.privacy.localDesc') },
  { key: 'notrack', title: t('home.privacy.noTracking'), desc: t('home.privacy.noTrackingDesc') },
  { key: 'export', title: t('home.privacy.yourData'), desc: t('home.privacy.yourDataDesc') },
])

const roadmapItems = computed(() => [
  { key: 'coach', icon: '🤖', title: t('home.roadmap.aiCoach'), desc: t('home.roadmap.aiCoachDesc'), issue: 45 },
  { key: 'kids', icon: '🧒', title: t('home.roadmap.kidsMode'), desc: t('home.roadmap.kidsModeDesc'), issue: 46 },
  { key: 'images', icon: '🖼️', title: t('home.roadmap.images'), desc: t('home.roadmap.imagesDesc'), issue: 47 },
  { key: 'i18n', icon: '✅', title: t('home.roadmap.i18n'), desc: t('home.roadmap.i18nDesc'), issue: 44, done: true },
  { key: 'upload', icon: '📄', title: t('home.roadmap.uploads'), desc: t('home.roadmap.uploadsDesc'), issue: 51 },
])

function selectLanguage(lang) {
  showLanguageMenu.value = false
  setLanguage(lang)
}

function goToWorkshops(lang) {
  setLanguage(lang)
  router.push({ name: 'workshop-overview', params: { learning: lang } })
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  if (Object.keys(availableContent.value).length === 0) {
    await loadAvailableContent()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
