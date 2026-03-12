<template>
  <div class="space-y-8">
    <!-- Not logged in state -->
    <template v-if="!isLoggedIn">
      <!-- Sign-in card -->
      <Card>
        <CardHeader>
          <div class="flex flex-col items-center gap-3 py-4">
            <div class="text-6xl">👤</div>
            <CardTitle class="text-2xl text-center">{{ $t('profile.notLoggedIn') }}</CardTitle>
            <p class="text-sm text-muted-foreground text-center">{{ $t('profile.notLoggedInDesc') }}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-3 max-w-sm mx-auto">
            <div>
              <Label class="text-sm font-medium mb-1 block">{{ $t('settings.username') }}</Label>
              <Input v-model="gunUsername" :placeholder="$t('settings.username')" />
            </div>
            <div>
              <Label class="text-sm font-medium mb-1 block">{{ $t('settings.password') }}</Label>
              <Input v-model="gunPassword" type="password" :placeholder="$t('settings.password')" />
            </div>
            <div class="flex gap-3">
              <Button @click="handleLogin" :disabled="!gunUsername || !gunPassword || isAuthLoading">
                {{ isAuthLoading ? $t('settings.loggingIn') : $t('settings.login') }}
              </Button>
              <Button variant="secondary" @click="handleRegister" :disabled="!gunUsername || !gunPassword || isAuthLoading">
                {{ isAuthLoading ? $t('settings.registering') : $t('settings.register') }}
              </Button>
            </div>
            <div v-if="authError" class="text-sm text-red-500">{{ authError }}</div>
          </div>
        </CardContent>
      </Card>

      <!-- Local progress (not synced) -->
      <template v-if="activeWorkshops.length > 0">
        <div class="text-sm text-muted-foreground text-center">— {{ $t('profile.notLoggedIn') }} —</div>
        <WorkshopsGrid :workshops="activeWorkshops" :lastVisited="lastVisited" />
      </template>
    </template>

    <!-- Logged in state -->
    <template v-else>
      <!-- Profile header -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center gap-4">
            <!-- Avatar circle -->
            <div
              class="rounded-full w-16 h-16 text-lg font-bold text-white flex-shrink-0 flex items-center justify-center"
              :style="{ backgroundColor: getAvatarColor(gunUser) }">
              {{ getInitials(gunUser) }}
            </div>
            <div>
              <h2 class="text-2xl font-bold">{{ gunUser }}</h2>
              <p v-if="memberSince" class="text-sm text-muted-foreground">
                {{ $t('profile.memberSince') }}: {{ memberSince }}
              </p>
            </div>
          </div>

          <!-- Stats row -->
          <div class="flex gap-6 mt-6 flex-wrap">
            <div class="text-center">
              <div class="text-2xl font-bold">{{ userStats.totalLearned }}</div>
              <div class="text-xs text-muted-foreground">{{ $t('profile.stats.learned') }}</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold">{{ userStats.workshopCount }}</div>
              <div class="text-xs text-muted-foreground">{{ $t('profile.stats.workshops') }}</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold">{{ userStats.totalAssessments }}</div>
              <div class="text-xs text-muted-foreground">{{ $t('profile.stats.assessments') }}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Your Workshops -->
      <div>
        <h3 class="text-xl font-semibold mb-4">{{ $t('profile.yourWorkshops') }}</h3>

        <template v-if="activeWorkshops.length > 0">
          <WorkshopsGrid :workshops="activeWorkshops" :lastVisited="lastVisited" />
        </template>

        <Card v-else>
          <CardContent class="py-12 text-center text-muted-foreground">
            {{ $t('profile.noWorkshops') }}
          </CardContent>
        </Card>
      </div>

      <!-- Logout -->
      <div class="flex justify-center">
        <Button variant="secondary" @click="handleLogout">{{ $t('profile.logout') }}</Button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGun } from '../composables/useGun'
import { useProgress } from '../composables/useProgress'
import { useAssessments } from '../composables/useAssessments'
import { useProfile } from '../composables/useProfile'
import { formatLangName } from '../utils/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const router = useRouter()
const { t } = useI18n()
const { isLoggedIn, username: gunUser, authError, login, register, logout, loadFromGun } = useGun()
const { progress, mergeProgress } = useProgress()
const { assessments, mergeAssessments } = useAssessments()
const { lastVisited, getAvatarColor, getInitials, getActiveWorkshops, getUserStats, loadLastVisited } = useProfile()
const gunUsername = ref('')
const gunPassword = ref('')
const isAuthLoading = ref(false)
const memberSince = ref('')

const emit = defineEmits(['update-title'])

onMounted(() => {
  emit('update-title', t('profile.title'))
  loadLastVisited()

  // Try to load member since date
  const stored = localStorage.getItem('memberSince')
  if (stored) {
    memberSince.value = new Date(parseInt(stored)).toLocaleDateString()
  }
})

const activeWorkshops = computed(() => getActiveWorkshops(progress.value))
const userStats = computed(() => getUserStats(progress.value, assessments.value))

async function handleLogin() {
  if (isAuthLoading.value) return
  isAuthLoading.value = true
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
      // Store member since if not already set
      if (!localStorage.getItem('memberSince')) {
        const ts = Date.now()
        localStorage.setItem('memberSince', ts.toString())
        memberSince.value = new Date(ts).toLocaleDateString()
      } else {
        memberSince.value = new Date(parseInt(localStorage.getItem('memberSince'))).toLocaleDateString()
      }
    }
  } finally {
    isAuthLoading.value = false
  }
}

async function handleRegister() {
  if (isAuthLoading.value) return
  isAuthLoading.value = true
  try {
    const ok = await register(gunUsername.value, gunPassword.value)
    if (ok) {
      gunUsername.value = ''
      gunPassword.value = ''
      const ts = Date.now()
      localStorage.setItem('memberSince', ts.toString())
      memberSince.value = new Date(ts).toLocaleDateString()
    }
  } finally {
    isAuthLoading.value = false
  }
}

function handleLogout() {
  logout()
}

// WorkshopsGrid sub-component
const WorkshopsGrid = defineComponent({
  name: 'WorkshopsGrid',
  props: {
    workshops: Array,
    lastVisited: Object
  },
  setup(props) {
    return () => h('div', { class: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
      props.workshops.map(ws => {
        const key = `${ws.learning}:${ws.workshop}`
        const lastLesson = props.lastVisited?.[key] || null
        const displayName = formatLangName(ws.workshop)

        return h('div', { key, class: 'bg-card border rounded-xl p-4 space-y-3' }, [
          h('div', { class: 'flex items-start justify-between' }, [
            h('div', [
              h('h4', { class: 'font-semibold text-base' }, displayName),
              h('p', { class: 'text-xs text-muted-foreground' }, ws.learning)
            ]),
            h('span', {
              class: 'text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary'
            }, `${ws.learnedCount}`)
          ]),
          // Progress bar
          h('div', { class: 'w-full bg-muted rounded-full h-2' }, [
            h('div', {
              class: 'bg-primary h-2 rounded-full transition-all',
              style: { width: `${Math.min(100, (ws.learnedCount / Math.max(ws.learnedCount, 1)) * 100)}%` }
            })
          ]),
          h('p', { class: 'text-xs text-muted-foreground' }, `${ws.learnedCount} items learned`),
          lastLesson
            ? h('p', { class: 'text-xs text-muted-foreground' }, `Last: Lesson ${lastLesson.lessonNumber}`)
            : null,
          h('a', {
            href: lastLesson
              ? `#/${ws.learning}/${ws.workshop}/lesson/${lastLesson.lessonNumber}`
              : `#/${ws.learning}/${ws.workshop}/lessons`,
            class: 'inline-flex items-center text-sm font-medium text-primary hover:underline'
          }, 'Continue →')
        ])
      })
    )
  }
})
</script>
