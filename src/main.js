import './style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useSettings } from './composables/useSettings'
import { useProgress } from './composables/useProgress'
import { useAssessments } from './composables/useAssessments'
import { useGun } from './composables/useGun'

// Initialize and load settings, progress, and assessments before mounting the app
useSettings().loadSettings()
useProgress().loadProgress()

const { loadAssessments, loadSentHistory } = useAssessments()
loadAssessments()
loadSentHistory()

const app = createApp(App)
app.use(router)
app.use(i18n)
app.mount('#app')

// Gun auto-login (async, after mount so UI is ready).
// On successful recall, gun.on('auth') fires → setupListeners() + autoSyncAll().
// The .on() listeners provide continuous real-time sync from remote peers.
const { initGun, autoLogin } = useGun()
initGun().then(() => autoLogin())
