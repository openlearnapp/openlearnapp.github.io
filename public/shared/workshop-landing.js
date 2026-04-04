/**
 * Open Learn — Workshop Landing Page
 *
 * Drop-in script that renders a complete workshop landing page.
 * Reads content from YAML files in the current directory.
 *
 * Usage (entire index.html):
 *
 *   <!DOCTYPE html>
 *   <html><head>
 *     <meta charset="UTF-8">
 *     <meta name="viewport" content="width=device-width, initial-scale=1.0">
 *   </head><body>
 *     <div id="app"></div>
 *     <script src="https://open-learn.app/shared/workshop-landing.js"><\/script>
 *   </body></html>
 *
 * What it does:
 * - Loads Vue 3, marked.js, js-yaml from CDN
 * - Fetches index.yaml, workshops.yaml, lessons, CHANGELOG.md
 * - Renders language picker, title, description, labels, lesson list, changelog
 * - CTA passes ?lang= to Open Learn for seamless language handoff
 */

(async function () {
  // --- Load dependencies from CDN ---
  const cdnBase = 'https://cdn.jsdelivr.net/npm'
  await Promise.all([
    loadScript(`${cdnBase}/vue@3/dist/vue.global.prod.min.js`),
    loadScript(`${cdnBase}/marked@15/lib/marked.umd.min.js`),
    loadScript(`${cdnBase}/js-yaml@4/dist/js-yaml.min.js`),
  ])

  // --- Inject styles ---
  const style = document.createElement('style')
  style.textContent = `
    :root { --ol-accent: #2563eb; --ol-accent-hover: #1d4ed8; --ol-text: #1e293b; --ol-muted: #64748b; --ol-border: #e2e8f0; }
    #app { font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 40px 20px 60px; color: var(--ol-text); line-height: 1.6; }
    #app * { box-sizing: border-box; margin: 0; padding: 0; }
    .ol-top-bar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .ol-top-bar h1 { font-size: 1.5rem; }
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
    /* Language picker */
    .ol-lang { position: relative; flex-shrink: 0; }
    .ol-lang-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--ol-accent); color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.85rem; font-weight: 500; white-space: nowrap; }
    .ol-lang-btn:hover { background: var(--ol-accent-hover); }
    .ol-lang-btn svg { opacity: 0.7; }
    .ol-lang-menu { position: absolute; top: 100%; left: 0; margin-top: 4px; background: white; border: 1px solid var(--ol-border); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; min-width: 160px; z-index: 10; }
    .ol-lang-menu button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; border: none; background: white; cursor: pointer; font-size: 0.85rem; text-align: left; color: var(--ol-text); }
    .ol-lang-menu button:hover { background: #f1f5f9; }
    .ol-lang-menu button.active { background: #f1f5f9; font-weight: 600; }
  `
  document.head.appendChild(style)

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

  // --- LanguagePicker component ---
  const LanguagePicker = {
    props: ['languages', 'selected'],
    emits: ['select'],
    data() { return { open: false } },
    methods: {
      flag(lang) { return FLAGS[lang] || '🌐' },
      cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '…' },
      pick(lang) { this.open = false; this.$emit('select', lang) },
      outside(e) { if (!this.$el.contains(e.target)) this.open = false }
    },
    mounted() { document.addEventListener('click', this.outside) },
    unmounted() { document.removeEventListener('click', this.outside) },
    template: `
      <div class="ol-lang">
        <button class="ol-lang-btn" @click.stop="open = !open">
          <span>{{ flag(selected) }}</span>
          <span>{{ cap(selected) }}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div v-if="open" class="ol-lang-menu">
          <button v-for="l in languages" :key="l" :class="{ active: l === selected }" @click="pick(l)">
            <span>{{ flag(l) }}</span><span>{{ cap(l) }}</span>
          </button>
        </div>
      </div>
    `
  }

  // --- Main app ---
  const { createApp, ref, computed } = Vue

  // Ensure #app exists
  if (!document.getElementById('app')) {
    const el = document.createElement('div')
    el.id = 'app'
    document.body.prepend(el)
  }

  createApp({
    components: { LanguagePicker },
    setup() {
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

      async function fetchYaml(url) {
        try { const r = await fetch(url); return r.ok ? jsyaml.load(await r.text()) : null }
        catch { return null }
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
          const lessons = await Promise.all(folders.map(async f => {
            const c = await fetchYaml(`${lang}/${wsFolder}/${f}/content.yaml`)
            return { title: c?.title || f, number: c?.number || 0 }
          }))
          data[lang] = { ws: wsEntry, lessons: lessons.sort((a, b) => a.number - b.number) }
        }))
        langData.value = data
        if (langs.length > 0) selectLanguage(langs[0])
        if (changelogText) changelogHtml.value = marked.parse(changelogText)
        loaded.value = true
      }

      init()

      return { loaded, selectedLang, languages, title, description, labels, lessons, addUrl, ghUrl, changelogHtml, selectLanguage }
    },
    template: `
      <div class="ol-top-bar">
        <language-picker :languages="languages" :selected="selectedLang" @select="selectLanguage" />
        <h1>{{ title }}</h1>
      </div>
      <p v-if="description" class="ol-description">{{ description }}</p>
      <div v-if="labels.length" class="ol-labels">
        <span class="ol-badge" v-for="l in labels" :key="l">{{ l }}</span>
      </div>
      <div class="ol-cta">
        <a :href="addUrl" target="_blank" rel="noopener">Add Workshop to Open Learn</a>
      </div>
      <div v-if="lessons.length">
        <h2>{{ lessons.length }} Lessons</h2>
        <ol><li v-for="l in lessons" :key="l.number"><strong>{{ l.title }}</strong></li></ol>
      </div>
      <p v-if="!loaded" class="ol-loading">Loading…</p>
      <div v-if="changelogHtml" class="ol-changelog" v-html="changelogHtml"></div>
      <div class="ol-footer">
        <a :href="ghUrl">GitHub</a> · Powered by <a href="https://open-learn.app">Open Learn</a>
      </div>
    `
  }).mount('#app')

  // --- Helpers ---
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src; s.onload = resolve; s.onerror = reject
      document.head.appendChild(s)
    })
  }
})()
