/**
 * Open Learn — Shared Components for Workshop Pages
 *
 * Loads Vue 3 + dependencies, registers reusable components.
 * Workshop authors compose their landing page using building blocks.
 *
 * Usage — Default full page:
 *
 *   <script src="https://open-learn.app/shared/open-learn.js"></script>
 *   <div id="app">
 *     <ol-workshop-page />
 *   </div>
 *   <script>
 *     OpenLearn.mount('#app')
 *   </script>
 *
 * Usage — Custom composition:
 *
 *   <script src="https://open-learn.app/shared/open-learn.js"></script>
 *   <div id="app">
 *     <div style="display:flex;align-items:center;gap:12px">
 *       <ol-language-picker />
 *       <h1>{{ workshop.title }}</h1>
 *     </div>
 *     <p>{{ workshop.description }}</p>
 *     <ol-labels />
 *     <ol-add-button />
 *     <ol-lesson-list />
 *     <ol-changelog />
 *     <ol-footer />
 *   </div>
 *   <script>
 *     OpenLearn.mount('#app')
 *   </script>
 */

// Expose API immediately so OpenLearn.mount() can be called before deps load
let _resolve
const _ready = new Promise(r => { _resolve = r })
window.OpenLearn = {
  mount(selector = '#app') {
    _ready.then(fn => fn(selector))
  }
};

(async function () {
  'use strict'
  console.log('[open-learn.js] v0.1.0')

  // --- Load dependencies ---
  const cdn = 'https://cdn.jsdelivr.net/npm'
  await Promise.all([
    load(`${cdn}/vue@3/dist/vue.global.prod.min.js`),
    load(`${cdn}/marked@15/lib/marked.umd.min.js`),
    load(`${cdn}/js-yaml@4/dist/js-yaml.min.js`),
  ])

  // --- Inject styles ---
  injectStyles()

  // --- Constants ---
  const FLAGS = {
    'deutsch':'🇩🇪','english':'🇬🇧','farsi':'🇮🇷','فارسی':'🇮🇷',
    'français':'🇫🇷','español':'🇪🇸','italiano':'🇮🇹','português':'🇵🇹',
    'polski':'🇵🇱','türkçe':'🇹🇷','العربية':'🇸🇦','中文':'🇨🇳',
    '日本語':'🇯🇵','한국어':'🇰🇷','हिन्दी':'🇮🇳','українська':'🇺🇦',
    'arabic':'🇸🇦'
  }

  const pathname = location.pathname.replace(/\/$/, '')
  const workshopName = pathname.split('/').pop() || 'workshop'
  const sourceUrl = location.origin + pathname + '/index.yaml'
  const ghUrl = `https://github.com/openlearnapp/${workshopName}`

  // --- Shared state (provided to all components) ---
  const { ref, computed, reactive, provide, inject, createApp } = Vue

  const STATE_KEY = Symbol('open-learn')

  function useOpenLearn() {
    return inject(STATE_KEY)
  }

  function createStore() {
    const loaded = ref(false)
    const selectedLang = ref(null)
    const languages = ref([])
    const langData = ref({})
    const changelogHtml = ref('')

    const ws = computed(() => langData.value[selectedLang.value]?.ws || {})
    const title = computed(() => ws.value.title || workshopName)
    const description = computed(() => ws.value.description || '')
    const labels = computed(() => ws.value.labels || [])
    const lessons = computed(() => langData.value[selectedLang.value]?.lessons || [])
    const addUrl = computed(() =>
      `https://open-learn.app/#/add?source=${encodeURIComponent(sourceUrl)}&lang=${encodeURIComponent(selectedLang.value || '')}`
    )

    function selectLanguage(lang) {
      selectedLang.value = lang
      document.title = (langData.value[lang]?.ws?.title || workshopName) + ' – Open Learn Workshop'
    }

    async function init() {
      const [indexData, changelogText] = await Promise.all([
        fetchYaml('index.yaml'),
        fetch('CHANGELOG.md').then(r => r.ok ? r.text() : null).catch(() => null)
      ])
      const langs = (indexData?.languages || []).map(l => typeof l === 'string' ? l : l.folder)
      languages.value = langs

      const data = {}
      await Promise.all(langs.map(async lang => {
        const wsYaml = await fetchYaml(`${lang}/workshops.yaml`) || await fetchYaml(`${lang}/topics.yaml`)
        const wsEntry = (wsYaml?.workshops || wsYaml?.topics || [])[0] || {}
        const wsFolder = wsEntry.folder || workshopName
        const lessonsYaml = await fetchYaml(`${lang}/${wsFolder}/lessons.yaml`)
        const folders = lessonsYaml?.lessons || []
        const lessonList = await Promise.all(folders.map(async f => {
          const c = await fetchYaml(`${lang}/${wsFolder}/${f}/content.yaml`)
          return { title: c?.title || f, number: c?.number || 0, description: c?.description || '' }
        }))
        data[lang] = { ws: wsEntry, lessons: lessonList.sort((a, b) => a.number - b.number) }
      }))
      langData.value = data
      if (langs.length > 0) selectLanguage(langs[0])
      if (changelogText) changelogHtml.value = marked.parse(changelogText)
      loaded.value = true
    }

    return reactive({
      loaded, selectedLang, languages, langData,
      workshop: ws, title, description, labels, lessons,
      addUrl, ghUrl, workshopName, sourceUrl,
      selectLanguage, init
    })
  }

  // ============================================================
  // Components
  // ============================================================

  /** <ol-language-picker /> — Dropdown with flags, matches platform style */
  const OlLanguagePicker = {
    setup() {
      const store = useOpenLearn()
      const open = ref(false)
      function flag(l) { return FLAGS[l] || '🌐' }
      function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '…' }
      function pick(l) { open.value = false; store.selectLanguage(l) }
      function outside(e) { if (!document.querySelector('.ol-lang')?.contains(e.target)) open.value = false }
      Vue.onMounted(() => document.addEventListener('click', outside))
      Vue.onUnmounted(() => document.removeEventListener('click', outside))
      return { store, open, flag, cap, pick }
    },
    template: `
      <div class="ol-lang">
        <button class="ol-lang-btn" @click.stop="open = !open">
          <span>{{ flag(store.selectedLang) }}</span>
          <span>{{ cap(store.selectedLang) }}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div v-if="open" class="ol-lang-menu">
          <button v-for="l in store.languages" :key="l" :class="{ active: l === store.selectedLang }" @click="pick(l)">
            <span>{{ flag(l) }}</span><span>{{ cap(l) }}</span>
          </button>
        </div>
      </div>
    `
  }

  /** <ol-labels /> — Label badges from workshop metadata */
  const OlLabels = {
    setup() { return { store: useOpenLearn() } },
    template: `
      <div v-if="store.labels.length" class="ol-labels">
        <span class="ol-badge" v-for="l in store.labels" :key="l">{{ l }}</span>
      </div>
    `
  }

  /** <ol-add-button /> — CTA to add workshop to Open Learn */
  const OlAddButton = {
    props: { text: { type: String, default: 'Add Workshop to Open Learn' } },
    setup() { return { store: useOpenLearn() } },
    template: `
      <div class="ol-cta">
        <a :href="store.addUrl" target="_blank" rel="noopener">{{ text }}</a>
      </div>
    `
  }

  /** <ol-lesson-list /> — Numbered lesson list from content.yaml */
  const OlLessonList = {
    setup() { return { store: useOpenLearn() } },
    template: `
      <div v-if="store.lessons.length">
        <h2>{{ store.lessons.length }} Lessons</h2>
        <ol>
          <li v-for="l in store.lessons" :key="l.number">
            <strong>{{ l.title }}</strong>
            <span v-if="l.description" style="color:var(--ol-muted)"> — {{ l.description }}</span>
          </li>
        </ol>
      </div>
    `
  }

  /** <ol-changelog /> — Rendered from CHANGELOG.md */
  const OlChangelog = {
    setup() { return { store: useOpenLearn() } },
    template: `<div v-if="store.changelogHtml" class="ol-changelog" v-html="store.changelogHtml"></div>`
  }

  /** <ol-footer /> — GitHub link + Open Learn branding */
  const OlFooter = {
    setup() { return { store: useOpenLearn() } },
    template: `
      <div class="ol-footer">
        <a :href="store.ghUrl">GitHub</a> · Powered by <a href="https://open-learn.app">Open Learn</a>
      </div>
    `
  }

  /** <ol-workshop-page /> — Full default landing page composing all components */
  const OlWorkshopPage = {
    setup() { return { store: useOpenLearn() } },
    template: `
      <div class="ol-top-bar">
        <ol-language-picker />
        <h1>{{ store.title }}</h1>
      </div>
      <p v-if="store.description" class="ol-description">{{ store.description }}</p>
      <ol-labels />
      <ol-add-button />
      <ol-lesson-list />
      <p v-if="!store.loaded" class="ol-loading">Loading…</p>
      <ol-changelog />
      <ol-footer />
    `
  }

  // ============================================================
  // Public API: OpenLearn.mount(selector)
  // ============================================================

  // Resolve the ready promise with the actual mount function
  _resolve(function doMount(selector = '#app') {
    const store = createStore()
    const app = createApp({
      setup() {
        provide(STATE_KEY, store)
        store.init()
        return { workshop: store.workshop, store }
      }
    })
    app.component('ol-language-picker', OlLanguagePicker)
    app.component('ol-labels', OlLabels)
    app.component('ol-add-button', OlAddButton)
    app.component('ol-lesson-list', OlLessonList)
    app.component('ol-changelog', OlChangelog)
    app.component('ol-footer', OlFooter)
    app.component('ol-workshop-page', OlWorkshopPage)
    app.mount(selector)
    return app
  })

  // --- Helpers ---
  function load(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src; s.onload = resolve; s.onerror = reject
      document.head.appendChild(s)
    })
  }

  async function fetchYaml(url) {
    try { const r = await fetch(url); return r.ok ? jsyaml.load(await r.text()) : null }
    catch { return null }
  }

  function injectStyles() {
    const s = document.createElement('style')
    s.textContent = `
      :root { --ol-accent: #2563eb; --ol-accent-hover: #1d4ed8; --ol-text: #1e293b; --ol-muted: #64748b; --ol-border: #e2e8f0; }
      #app { font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 40px 20px 60px; color: var(--ol-text); line-height: 1.6; }
      #app * { box-sizing: border-box; }
      .ol-top-bar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
      .ol-top-bar h1 { font-size: 1.5rem; margin: 0; }
      .ol-description { color: var(--ol-muted); margin: 0.5rem 0 0.75rem; }
      .ol-labels { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem; }
      .ol-badge { display: inline-block; font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: #eff6ff; color: var(--ol-accent); }
      .ol-cta { margin-bottom: 2rem; }
      .ol-cta a { display: inline-block; padding: 10px 28px; background: var(--ol-accent); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
      .ol-cta a:hover { background: var(--ol-accent-hover); }
      #app h2 { font-size: 1.1rem; margin: 1.75rem 0 0.5rem; padding-bottom: 0.35rem; border-bottom: 1px solid var(--ol-border); }
      #app ol, #app ul { padding-left: 1.5rem; margin: 0.5rem 0; }
      #app li { margin: 0.25rem 0; }
      .ol-changelog h1, .ol-changelog h2 { font-size: 1.05rem; margin: 1.5rem 0 0.4rem; padding-bottom: 0.3rem; border-bottom: 1px solid var(--ol-border); }
      .ol-changelog ul { padding-left: 1.25rem; }
      .ol-changelog li { font-size: 0.85rem; color: #475569; }
      .ol-footer { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--ol-border); text-align: center; font-size: 0.8rem; color: #94a3b8; }
      .ol-footer a { color: var(--ol-muted); }
      .ol-loading { text-align: center; padding: 2rem; color: var(--ol-muted); }
      .ol-lang { position: relative; flex-shrink: 0; }
      .ol-lang-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--ol-accent); color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.85rem; font-weight: 500; white-space: nowrap; }
      .ol-lang-btn:hover { background: var(--ol-accent-hover); }
      .ol-lang-btn svg { opacity: 0.7; }
      .ol-lang-menu { position: absolute; top: 100%; left: 0; margin-top: 4px; background: white; border: 1px solid var(--ol-border); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; min-width: 160px; z-index: 10; }
      .ol-lang-menu button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; border: none; background: white; cursor: pointer; font-size: 0.85rem; text-align: left; color: var(--ol-text); }
      .ol-lang-menu button:hover { background: #f1f5f9; }
      .ol-lang-menu button.active { background: #f1f5f9; font-weight: 600; }
    `
    document.head.appendChild(s)
  }
})()
