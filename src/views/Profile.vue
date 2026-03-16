<template>
  <div class="space-y-8">

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
      <!-- Avatar + name card -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center gap-6">
            <!-- SVG identicon avatar -->
            <div class="flex-shrink-0 rounded-full overflow-hidden w-20 h-20 border-2 border-primary/30">
              <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                <rect width="80" height="80" :fill="avatarBg" />
                <g v-for="(cell, i) in avatarCells" :key="i">
                  <rect
                    v-if="cell.filled"
                    :x="cell.x"
                    :y="cell.y"
                    width="16"
                    height="16"
                    :fill="avatarColor"
                  />
                </g>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-2xl font-bold truncate">{{ username }}</h2>
              <p class="text-sm text-muted-foreground mt-1">
                {{ $t('profile.memberSince') }} {{ joinDate }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ totalLearned }} {{ $t('profile.itemsLearned') }}
              </p>
            </div>
            <Button variant="secondary" size="sm" @click="handleLogout" class="flex-shrink-0">
              {{ $t('settings.logout') }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Active workshops -->
      <Card v-if="activeWorkshops.length > 0">
        <CardHeader>
          <CardTitle class="text-xl">{{ $t('profile.activeWorkshops') }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div
            v-for="ws in activeWorkshops"
            :key="ws.key"
            class="border rounded-lg p-4 space-y-2">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0">
                <p class="font-semibold truncate">{{ ws.displayName }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ ws.learnedCount }} {{ $t('profile.itemsLearned') }}
                </p>
              </div>
              <Button
                v-if="ws.lastLesson"
                size="sm"
                @click="continueWorkshop(ws)">
                {{ $t('profile.continue') }} {{ ws.lastLesson }}
              </Button>
            </div>
            <!-- Progress bar -->
            <div class="w-full bg-muted rounded-full h-2">
              <div
                class="bg-primary rounded-full h-2 transition-all"
                :style="{ width: ws.progressPercent + '%' }">
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- No workshops yet -->
      <Card v-else>
        <CardContent class="pt-6 text-center text-muted-foreground">
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
import { formatLangName } from '../utils/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const emit = defineEmits(['update-title'])
const { t } = useI18n()
const router = useRouter()

const { isLoggedIn, username, authError, isSyncing, login, register, logout, loadFromGun } = useGun()
const { progress, lastVisited, mergeProgress } = useProgress()
const { assessments, mergeAssessments } = useAssessments()

emit('update-title', t('profile.title'))

const gunUsername = ref('')
const gunPassword = ref('')
const authMessage = ref('')
const isAuthLoading = ref(false)

// --- Avatar generation ---
// Deterministic identicon: 5×5 symmetric grid based on username hash

function simpleHash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i)
    h = h & 0xffffffff
  }
  return Math.abs(h)
}

const avatarColor = computed(() => {
  if (!username.value) return '#6366f1'
  const h = simpleHash(username.value)
  const hue = h % 360
  return `hsl(${hue}, 65%, 50%)`
})

const avatarBg = computed(() => {
  if (!username.value) return '#e0e7ff'
  const h = simpleHash(username.value)
  const hue = h % 360
  return `hsl(${hue}, 30%, 92%)`
})

// 5×5 grid, mirrored left-right for symmetry. 80px / 5 = 16px per cell.
const avatarCells = computed(() => {
  const name = username.value || ''
  const hash = simpleHash(name)
  const cells = []
  // 5 rows × 3 unique columns (mirrored to 5)
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
const totalLearned = computed(() => {
  let count = 0
  for (const items of Object.values(progress.value)) {
    count += Object.values(items).filter(v => v === true).length
  }
  return count
})

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
    const lastLesson = lastVisited.value[key] || null

    result.push({
      key,
      learning,
      workshop,
      displayName: formatLangName(workshop),
      learnedCount,
      lastLesson,
      progressPercent: Math.min(100, learnedCount * 2) // rough bar fill
    })
  }

  return result.sort((a, b) => b.learnedCount - a.learnedCount)
})

function continueWorkshop(ws) {
  if (ws.lastLesson) {
    router.push({
      name: 'lesson-detail',
      params: { learning: ws.learning, workshop: ws.workshop, number: ws.lastLesson }
    })
  } else {
    router.push({
      name: 'lessons-overview',
      params: { learning: ws.learning, workshop: ws.workshop }
    })
  }
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
}
</script>
