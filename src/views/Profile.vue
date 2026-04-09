<template>
  <div class="space-y-6">

    <!-- Not logged in: show login/register form -->
    <template v-if="!isLoggedIn">
      <Card>
        <CardHeader>
          <CardTitle class="text-2xl">{{ $t('profile.signIn') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground mb-4">
            {{ $t('profile.signInDesc') }}
          </p>
          <div class="space-y-3">
            <div>
              <Label class="text-sm font-medium mb-1 block">{{ $t('settings.username') }}</Label>
              <Input v-model="gunUsername" :placeholder="$t('settings.username')" @keyup.enter="handleLogin" />
            </div>
            <div>
              <Label class="text-sm font-medium mb-1 block">{{ $t('settings.password') }}</Label>
              <Input v-model="gunPassword" type="password" :placeholder="$t('settings.password')" @keyup.enter="handleLogin" />
            </div>
            <div class="flex gap-3">
              <Button @click="handleLogin" :disabled="!gunUsername || !gunPassword || isAuthLoading">
                {{ isAuthLoading ? $t('settings.loggingIn') : $t('settings.login') }}
              </Button>
              <Button variant="secondary" @click="handleRegister" :disabled="!gunUsername || !gunPassword || isAuthLoading">
                {{ isAuthLoading ? $t('settings.registering') : $t('settings.register') }}
              </Button>
            </div>
          </div>
          <div v-if="authError" class="mt-3 text-sm text-red-500">{{ authError }}</div>
          <div v-if="authMessage" class="mt-3 text-sm text-green-600 dark:text-green-400">{{ authMessage }}</div>
        </CardContent>
      </Card>
    </template>

    <!-- Logged in: show profile -->
    <template v-else>

      <!-- Hero: Avatar + name -->
      <Card class="overflow-hidden">
        <!-- Colored banner -->
        <div class="h-20 w-full" :style="{ background: `linear-gradient(135deg, hsl(${avatarHue}, 60%, 55%), hsl(${(avatarHue + 40) % 360}, 55%, 65%))` }"></div>
        <CardContent class="pt-0 pb-5">
          <div class="flex items-end gap-4 -mt-10 mb-4">
            <!-- Identicon avatar -->
            <div class="flex-shrink-0 rounded-2xl overflow-hidden w-20 h-20 border-4 border-card shadow-lg">
              <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                <rect width="80" height="80" :fill="avatarBg" />
                <g v-for="(cell, i) in avatarCells" :key="i">
                  <rect v-if="cell.filled" :x="cell.x" :y="cell.y" width="16" height="16" :fill="avatarColor" />
                </g>
              </svg>
            </div>
            <div class="flex-1 min-w-0 pb-1">
              <h2 class="text-xl font-bold truncate leading-tight">
                {{ profileData.displayName || username }}
              </h2>
              <p class="text-sm text-muted-foreground truncate">@{{ username }}</p>
            </div>
            <div class="flex flex-col items-end gap-1 flex-shrink-0 mb-1">
              <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="isSyncing ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-muted text-muted-foreground'">
                {{ isSyncing ? (isDE ? '⟳ Synchronisiert…' : '⟳ Syncing…') : isConnected ? (isDE ? '● Verbunden' : '● Synced') : (isDE ? '○ Nicht verbunden' : '○ Not connected') }}
              </span>
              <Button variant="ghost" size="sm" @click="handleLogout" class="text-muted-foreground h-7 px-2 text-xs">
                {{ $t('settings.logout') }}
              </Button>
            </div>
          </div>

          <!-- Profile info pills -->
          <div class="flex flex-wrap gap-2 text-sm">
            <span v-if="profileData.nativeLanguage" class="inline-flex items-center gap-1.5 bg-muted rounded-full px-3 py-1">
              🌍 {{ profileData.nativeLanguage }}
            </span>
            <span class="inline-flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-muted-foreground">
              📅 {{ $t('profile.memberSince') }} {{ joinDate }}
            </span>
          </div>

          <!-- Learning goal -->
          <div v-if="profileData.learningGoal" class="mt-3 p-3 bg-muted/50 rounded-lg text-sm italic text-muted-foreground">
            "{{ profileData.learningGoal }}"
          </div>
        </CardContent>
      </Card>

      <!-- Stats row -->
      <div class="grid grid-cols-2 gap-3">
        <Card class="text-center">
          <CardContent class="pt-4 pb-4">
            <div class="text-3xl font-bold text-primary">{{ totalLearned }}</div>
            <div class="text-xs text-muted-foreground mt-1">{{ $t('profile.itemsLearned') }}</div>
          </CardContent>
        </Card>
        <Card class="text-center">
          <CardContent class="pt-4 pb-4">
            <div class="text-3xl font-bold text-primary">{{ totalAssessments }}</div>
            <div class="text-xs text-muted-foreground mt-1">{{ $t('profile.totalAssessments') }}</div>
          </CardContent>
        </Card>
        <Card class="text-center">
          <CardContent class="pt-4 pb-4">
            <div class="text-3xl font-bold text-primary">🔥 {{ learningStreak }}</div>
            <div class="text-xs text-muted-foreground mt-1">{{ $t('profile.streak') }}</div>
          </CardContent>
        </Card>
        <Card class="text-center">
          <CardContent class="pt-4 pb-4">
            <div class="text-3xl font-bold text-primary">{{ activeWorkshops.length }}</div>
            <div class="text-xs text-muted-foreground mt-1">{{ $t('profile.workshopsStarted') }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- Edit profile form -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base">{{ $t('profile.editProfile') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <template v-if="!isEditing">
            <Button variant="outline" size="sm" @click="startEdit" class="w-full">
              ✏️ {{ $t('profile.editProfile') }}
            </Button>
          </template>
          <template v-else>
            <div class="space-y-4">
              <div>
                <Label class="text-sm font-medium mb-1.5 block">{{ $t('profile.displayName') }}</Label>
                <Input v-model="editForm.displayName" :placeholder="$t('profile.displayNamePlaceholder')" />
              </div>
              <div>
                <Label class="text-sm font-medium mb-1.5 block">{{ $t('profile.nativeLanguage') }}</Label>
                <Input v-model="editForm.nativeLanguage" :placeholder="$t('profile.nativeLanguagePlaceholder')" />
              </div>
              <div>
                <Label class="text-sm font-medium mb-1.5 block">{{ $t('profile.learningGoal') }}</Label>
                <Input v-model="editForm.learningGoal" :placeholder="$t('profile.learningGoalPlaceholder')" />
              </div>
              <div class="flex gap-3">
                <Button @click="saveEdit" class="flex-1">{{ $t('profile.saveProfile') }}</Button>
                <Button variant="outline" @click="cancelEdit">{{ $t('profile.cancelEdit') }}</Button>
              </div>
              <div v-if="saveMessage" class="text-sm text-green-600 dark:text-green-400 text-center">{{ saveMessage }}</div>
            </div>
          </template>
        </CardContent>
      </Card>

      <!-- Active workshops -->
      <Card v-if="activeWorkshops.length > 0">
        <CardHeader>
          <CardTitle class="text-base">{{ $t('profile.activeWorkshops') }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="ws in activeWorkshops"
            :key="ws.key"
            class="border rounded-xl p-4 flex items-center justify-between gap-3 hover:border-primary/50 transition-colors">
            <div class="min-w-0">
              <p class="font-semibold truncate">{{ ws.displayName }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ ws.learnedCount }} {{ $t('profile.itemsLearned') }}
              </p>
            </div>
            <Button size="sm" @click="continueWorkshop(ws)">
              {{ $t('profile.continue') }} →
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- No workshops yet -->
      <Card v-else>
        <CardContent class="pt-6 pb-6 text-center text-muted-foreground">
          <p class="text-4xl mb-3">📚</p>
          <p>{{ $t('profile.noWorkshopsYet') }}</p>
        </CardContent>
      </Card>

    </template>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGun } from '../composables/useGun'
import { useProgress } from '../composables/useProgress'
import { useAssessments } from '../composables/useAssessments'
import { useLanguage } from '../composables/useLanguage'
import { formatLangName } from '../utils/formatters'
import {
  PROFILE_KEY, STREAK_KEY, STREAK_LAST_KEY,
  loadProfileData, simpleHash, computeStreak,
  calcTotalLearned, calcTotalAssessments
} from '../utils/profile'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const emit = defineEmits(['update-title'])
const { t } = useI18n()
const router = useRouter()

const { isLoggedIn, username, authError, isSyncing, isConnected, login, register, logout, loadFromGun } = useGun()
const { progress, lastVisited, mergeProgress } = useProgress()
const { assessments, mergeAssessments } = useAssessments()
const { selectedLanguage } = useLanguage()

emit('update-title', t('profile.title'))

const isDE = computed(() => selectedLanguage.value === 'deutsch' || navigator.language?.startsWith('de'))
const gunUsername = ref('')
const gunPassword = ref('')
const authMessage = ref('')
const isAuthLoading = ref(false)
const isEditing = ref(false)
const saveMessage = ref('')

// --- Profile data ---
const profileData = ref(loadProfileData())
const editForm = ref({ ...profileData.value })

function startEdit() {
  editForm.value = { ...profileData.value }
  isEditing.value = true
  saveMessage.value = ''
}

function saveEdit() {
  profileData.value = { ...editForm.value }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData.value))
  isEditing.value = false
  saveMessage.value = t('profile.profileSaved')
  setTimeout(() => { saveMessage.value = '' }, 3000)
}

function cancelEdit() {
  isEditing.value = false
  saveMessage.value = ''
}

// --- Avatar ---
const avatarHue = computed(() => simpleHash(username.value || '') % 360)
const avatarColor = computed(() => `hsl(${avatarHue.value}, 65%, 50%)`)
const avatarBg = computed(() => `hsl(${avatarHue.value}, 30%, 92%)`)

const avatarCells = computed(() => {
  const hash = simpleHash(username.value || '')
  const cells = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const mirrorCol = col < 3 ? col : 4 - col
      const bitIndex = row * 3 + mirrorCol
      const filled = (hash >> bitIndex) & 1
      cells.push({ x: col * 16, y: row * 16, filled: !!filled })
    }
  }
  return cells
})

// --- Learning streak (ref so UI updates immediately on write) ---
const learningStreak = ref(isLoggedIn.value ? parseInt(localStorage.getItem(STREAK_KEY) || '0', 10) : 0)

function recordTodayActivity() {
  const today = new Date().toISOString().slice(0, 10)
  if (localStorage.getItem(STREAK_LAST_KEY) === today) return
  const newStreak = computeStreak(today)
  localStorage.setItem(STREAK_KEY, String(newStreak))
  localStorage.setItem(STREAK_LAST_KEY, today)
  learningStreak.value = newStreak
}

if (isLoggedIn.value) recordTodayActivity()

// --- Join date ---
const JOIN_DATE_KEY = 'profileJoinDate'

const joinDate = computed(() => {
  if (!isLoggedIn.value) return ''
  let stored = localStorage.getItem(JOIN_DATE_KEY)
  if (!stored) {
    stored = new Date().toISOString().slice(0, 10)
    localStorage.setItem(JOIN_DATE_KEY, stored)
  }
  return stored
})

// --- Stats ---
const totalLearned = computed(() => calcTotalLearned(progress.value))
const totalAssessments = computed(() => calcTotalAssessments(assessments.value))

// --- Active workshops ---
const activeWorkshops = computed(() => {
  const seen = new Set()
  const result = []
  for (const key of Object.keys(progress.value)) {
    const items = progress.value[key]
    if (Object.keys(items).length === 0) continue
    if (seen.has(key)) continue
    seen.add(key)
    const [learning, workshop] = key.split(':')
    const learnedCount = Object.values(items).filter(v => v === true).length
    result.push({
      key, learning, workshop,
      displayName: formatLangName(workshop),
      learnedCount,
      lastLesson: lastVisited.value[key] || null
    })
  }
  return result.sort((a, b) => b.learnedCount - a.learnedCount)
})

function continueWorkshop(ws) {
  if (ws.lastLesson) {
    router.push({ name: 'lesson-detail', params: { learning: ws.learning, workshop: ws.workshop, number: ws.lastLesson } })
  } else {
    router.push({ name: 'lessons-overview', params: { learning: ws.learning, workshop: ws.workshop } })
  }
}

function goToWorkshops() {
  const lang = selectedLanguage.value || localStorage.getItem('lastLearningLanguage') || 'deutsch'
  router.push({ name: 'workshop-overview', params: { learning: lang } })
}

// --- Auth ---
async function handleLogin() {
  if (isAuthLoading.value) return
  isAuthLoading.value = true
  authMessage.value = ''
  try {
    const ok = await login(gunUsername.value, gunPassword.value)
    if (ok) {
      gunUsername.value = ''
      gunPassword.value = ''
      const remote = await loadFromGun()
      if (remote) {
        if (remote.progress) mergeProgress(remote.progress)
        if (remote.assessments) mergeAssessments(remote.assessments)
      }
      authMessage.value = t('settings.loginSuccess')
    }
  } finally {
    isAuthLoading.value = false
  }
}

async function handleRegister() {
  if (isAuthLoading.value) return
  isAuthLoading.value = true
  authMessage.value = ''
  try {
    const ok = await register(gunUsername.value, gunPassword.value)
    if (ok) {
      gunUsername.value = ''
      gunPassword.value = ''
      authMessage.value = t('settings.registerSuccess')
    }
  } finally {
    isAuthLoading.value = false
  }
}

function handleLogout() {
  logout()
  authMessage.value = ''
  isEditing.value = false
}
</script>
