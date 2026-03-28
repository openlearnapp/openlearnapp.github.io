import { ref } from 'vue'
import yaml from 'js-yaml'

// Helper function to resolve IPFS URLs to HTTP gateway URLs
function resolveUrl(urlOrPath) {
  if (typeof urlOrPath === 'string' && urlOrPath.startsWith('ipfs://')) {
    // Convert IPFS URL to HTTP gateway URL
    const ipfsHash = urlOrPath.replace('ipfs://', '')
    return `https://ipfs.io/ipfs/${ipfsHash}`
  }
  return urlOrPath
}

// Helper function to parse source (string, folder object, or url object)
function parseSource(source) {
  if (typeof source === 'string') {
    // Backward compatible: string is treated as folder
    return { type: 'folder', path: source }
  }
  if (typeof source === 'object') {
    if (source.folder) {
      return { type: 'folder', path: source.folder, code: source.code, title: source.title || null, description: source.description || null, coach: source.coach || null, color: source.color || null, primaryColor: source.primaryColor || null, image: source.image || null, labels: source.labels || [] }
    }
    if (source.url) {
      return { type: 'url', path: resolveUrl(source.url), code: source.code, title: source.title || null, description: source.description || null, coach: source.coach || null, color: source.color || null, primaryColor: source.primaryColor || null, image: source.image || null, labels: source.labels || [] }
    }
  }
  return null
}

// Default content sources loaded from default-sources.yaml
let defaultContentSources = []

// Module-level singleton state (shared across all useLessons() calls)
const workshopSlugMap = ref({}) // lang → { slug → URL } mapping for remote workshops

async function loadDefaultSources() {
  if (defaultContentSources.length > 0) return defaultContentSources
  try {
    const response = await fetch('default-sources.yaml')
    if (!response.ok) return []
    const text = await response.text()
    const data = yaml.load(text)
    defaultContentSources = data?.sources || []
    console.log(`📋 Loaded ${defaultContentSources.length} default sources`)
  } catch (error) {
    console.warn('⚠️ Failed to load default-sources.yaml:', error)
  }
  return defaultContentSources
}

export function useLessons() {
  const availableContent = ref({})
  const languageCodes = ref({}) // Store language codes
  const workshopCodes = ref({}) // Store workshop codes
  const workshopMeta = ref({}) // { lang: { workshop: { title, description } } }
  const isLoading = ref(false)

  // Get content sources from localStorage
  function getContentSources() {
    try {
      return JSON.parse(localStorage.getItem('contentSources') || '[]')
    } catch {
      return []
    }
  }

  // Get all content sources (default + user-added), deduplicated
  function getAllContentSources() {
    const userSources = getContentSources()
    const all = [...defaultContentSources]
    for (const s of userSources) {
      if (!all.includes(s)) all.push(s)
    }
    return all
  }

  // Check if a source is a default (non-removable) source
  function isDefaultSource(url) {
    return defaultContentSources.includes(url)
  }

  // Save content sources to localStorage
  function saveContentSources(sources) {
    localStorage.setItem('contentSources', JSON.stringify(sources))
  }

  // Add a content source
  function addContentSource(url) {
    const sources = getContentSources()
    if (!sources.includes(url)) {
      sources.push(url)
      saveContentSources(sources)
    }
  }

  // Remove a content source
  function removeContentSource(url) {
    const sources = getContentSources().filter(s => s !== url)
    saveContentSources(sources)
  }

  // Check if a workshop key is from a remote content source
  function isRemoteWorkshop(lang, workshopKey) {
    return !!(workshopSlugMap.value[lang]?.[workshopKey])
  }

  // Resolve a workshop key: if it's a slug, return the URL; otherwise return as-is
  function resolveWorkshopKey(lang, workshopKey) {
    return workshopSlugMap.value[lang]?.[workshopKey] || workshopKey
  }

  // Get the source URL for a remote workshop slug (for removing sources)
  function getSourceForSlug(lang, slug) {
    const url = workshopSlugMap.value[lang]?.[slug]
    if (!url) return null
    const sources = getAllContentSources()
    // Sources include index.yaml filename, strip it for prefix matching
    return sources.find(s => {
      const base = s.replace(/\/[^/]+\.yaml$/, '')
      return url.startsWith(base)
    }) || null
  }

  // Get metadata (title, description) for a workshop
  function getWorkshopMeta(langFolder, workshopFolder) {
    return workshopMeta.value[langFolder]?.[workshopFolder] || { title: null, description: null }
  }

  // Get share URL for a remote workshop
  function getShareUrl(lang, workshopSlug) {
    const sourceUrl = getSourceForSlug(lang, workshopSlug)
    if (!sourceUrl) return null
    return `https://open-learn.app/#/add?source=${encodeURIComponent(sourceUrl)}`
  }

  // Load a remote content source's languages and workshops
  // sourceUrl is the full URL to index.yaml (e.g. https://user.github.io/repo/index.yaml)
  // targetLang: if set, only load workshop details for this language (others just discovered)
  async function loadContentSource(sourceUrl, content, codes, targetLang) {
    try {
      // If URL doesn't end with .yaml, append /index.yaml
      let fetchUrl = sourceUrl
      if (!sourceUrl.endsWith('.yaml')) {
        fetchUrl = sourceUrl.replace(/\/$/, '') + '/index.yaml'
      }

      console.log(`📡 Loading content source: ${fetchUrl}${targetLang ? ` (lang: ${targetLang})` : ''}`)
      const response = await fetch(fetchUrl)
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch ${fetchUrl}: ${response.status}`)
        return
      }

      const text = await response.text()
      const data = yaml.load(text)

      // Derive base URL by stripping the yaml filename
      const baseUrl = fetchUrl.replace(/\/[^/]+\.yaml$/, '')

      for (const lang of data.languages) {
        const source = parseSource(lang)
        if (!source) continue

        // For remote sources, the language key is the folder name (e.g. "deutsch")
        // so it merges with local languages
        const langKey = source.path
        if (!content[langKey]) {
          content[langKey] = {}
        }
        if (!codes[langKey]) {
          codes[langKey] = source.code || null
        }

        // Only load workshop details for the target language
        // If no targetLang, skip all workshop details (language discovery only)
        if (!targetLang || langKey !== targetLang) continue

        // Load workshops for this language from the remote source
        // Try workshops.yaml first, fallback to topics.yaml for backwards compatibility
        let workshopsData = null
        for (const filename of ['workshops.yaml', 'topics.yaml']) {
          const workshopsUrl = `${baseUrl}/${langKey}/${filename}`
          try {
            const workshopsResponse = await fetch(workshopsUrl)
            if (!workshopsResponse.ok) continue
            const workshopsText = await workshopsResponse.text()
            workshopsData = yaml.load(workshopsText)
            break
          } catch (e) {
            continue
          }
        }

        if (!workshopsData) {
          console.warn(`⚠️ No workshops found for ${langKey}`)
          continue
        }

        try {
          const entries = workshopsData.workshops || workshopsData.topics || []
          for (const entry of entries) {
            const workshopSource = parseSource(entry)
            if (!workshopSource) continue

            // Use the workshop folder name as the slug for clean URLs
            const slug = workshopSource.path
            const workshopUrl = `${baseUrl}/${langKey}/${workshopSource.path}`
            content[langKey][slug] = []

            // Map slug → full URL for resolving later (scoped by language)
            if (!workshopSlugMap.value[langKey]) {
              workshopSlugMap.value[langKey] = {}
            }
            workshopSlugMap.value[langKey][slug] = workshopUrl

            // Store workshop code and metadata
            if (!workshopCodes.value[langKey]) {
              workshopCodes.value[langKey] = {}
            }
            workshopCodes.value[langKey][slug] = workshopSource.code || null

            if (!workshopMeta.value[langKey]) {
              workshopMeta.value[langKey] = {}
            }
            // Resolve relative image path to full URL using the lang folder as base
            const imageUrl = workshopSource.image
              ? `${baseUrl}/${langKey}/${workshopSource.image}`
              : null
            workshopMeta.value[langKey][slug] = {
              title: workshopSource.title || null,
              description: workshopSource.description || null,
              coach: workshopSource.coach || null,
              color: workshopSource.color || null,
              primaryColor: workshopSource.primaryColor || null,
              image: imageUrl,
              labels: workshopSource.labels || []
            }

            console.log(`  ✓ Remote workshop: ${slug} → ${workshopUrl} (${workshopSource.code || 'no code'})`)
          }
        } catch (e) {
          console.warn(`⚠️ Failed to load workshops for ${langKey}:`, e)
        }
      }

      console.log(`✅ Content source loaded: ${sourceUrl}`)
    } catch (error) {
      console.warn(`⚠️ Error loading content source ${sourceUrl}:`, error)
    }
  }

  // Dev mode: load workshops from sibling directories (served by Vite plugin)
  // Uses a "local-dev:" prefix on slugs so local and remote versions both appear
  async function loadLocalWorkshops(content, codes, targetLang) {
    try {
      const res = await fetch('/__local-workshops.json')
      if (!res.ok) return
      const { workshops } = await res.json()
      if (!workshops?.length) return

      console.log(`🔧 Loading ${workshops.length} local workshop(s)...`)

      for (const workshopName of workshops) {
        const baseUrl = `/__local/${workshopName}`
        const fetchUrl = `${baseUrl}/index.yaml`

        try {
          const response = await fetch(fetchUrl)
          if (!response.ok) continue
          const text = await response.text()
          const data = yaml.load(text)

          for (const lang of data.languages) {
            const source = parseSource(lang)
            if (!source) continue
            const langKey = source.path
            if (!content[langKey]) {
              content[langKey] = {}
            }

            // Only load workshop details for the target language
            if (!targetLang || langKey !== targetLang) continue

            // Load workshops for this language
            let workshopsData = null
            for (const filename of ['workshops.yaml', 'topics.yaml']) {
              try {
                const wsRes = await fetch(`${baseUrl}/${langKey}/${filename}`)
                if (!wsRes.ok) continue
                workshopsData = yaml.load(await wsRes.text())
                break
              } catch { continue }
            }
            if (!workshopsData) continue

            const entries = workshopsData.workshops || workshopsData.topics || []
            for (const entry of entries) {
              const ws = parseSource(entry)
              if (!ws) continue

              // Prefix slug with "local-dev:" so it doesn't collide with remote
              const localSlug = `local-dev:${ws.path}`
              const workshopUrl = `${baseUrl}/${langKey}/${ws.path}`
              content[langKey][localSlug] = []

              if (!workshopSlugMap.value[langKey]) workshopSlugMap.value[langKey] = {}
              workshopSlugMap.value[langKey][localSlug] = workshopUrl

              if (!workshopCodes.value[langKey]) workshopCodes.value[langKey] = {}
              workshopCodes.value[langKey][localSlug] = ws.code || null

              if (!workshopMeta.value[langKey]) workshopMeta.value[langKey] = {}
              const imageUrl = ws.image ? `${baseUrl}/${langKey}/${ws.image}` : null
              workshopMeta.value[langKey][localSlug] = {
                title: `🔧 ${ws.title || ws.path}`,
                description: ws.description || null,
                coach: ws.coach || null,
                color: ws.color || null,
                primaryColor: ws.primaryColor || null,
                image: imageUrl,
                labels: [...(ws.labels || []), 'local-dev']
              }

              console.log(`  🔧 Local: ${langKey}/${localSlug} → ${workshopUrl}`)
            }
          }
        } catch (e) {
          console.warn(`⚠️ Error loading local workshop ${workshopName}:`, e)
        }
      }
    } catch {
      // Not in dev mode or no local workshops
    }
  }

  // targetLang: if set, only load workshop details for this language
  let loadingPromise = null
  async function loadAvailableContent(targetLang) {
    // Prevent duplicate concurrent calls
    if (loadingPromise) return loadingPromise
    loadingPromise = doLoadAvailableContent(targetLang)
    try {
      await loadingPromise
    } finally {
      loadingPromise = null
    }
  }

  async function doLoadAvailableContent(targetLang) {
    try {
      console.log(`📚 Loading available content${targetLang ? ` (lang: ${targetLang})` : ''}...`)
      isLoading.value = true
      const response = await fetch('languages.yaml')

      if (!response.ok) {
        throw new Error(`Failed to fetch index.yaml: ${response.status}`)
      }

      const text = await response.text()
      const data = yaml.load(text)
      console.log('📖 Loaded languages data:', data)

      const content = {}
      const codes = {}

      for (const lang of data.languages) {
        const source = parseSource(lang)
        if (!source) {
          console.warn(`⚠️ Invalid language source:`, lang)
          continue
        }

        // Use path as the key (for folders, it's the folder name; for URLs, it's the full URL)
        const key = source.path
        content[key] = {}
        codes[key] = source.code || null
        console.log(`  ✓ Language: ${key} (${source.type}) (${source.code || 'no code'})`)
      }

      // Only load workshop sources if a target language is selected
      // Home page (no language) just needs the language list from index.yaml
      if (targetLang) {
        await loadDefaultSources()
        const contentSources = getAllContentSources()

        // Load all content sources in parallel (#118)
        await Promise.all(
          contentSources.map(sourceUrl => loadContentSource(sourceUrl, content, codes, targetLang))
        )

        // In dev mode, load local workshop directories as additional sources
        if (import.meta.env.DEV) {
          await loadLocalWorkshops(content, codes, targetLang)
        }
      }

      availableContent.value = content
      languageCodes.value = codes
      if (targetLang) loadedSourceLangs.add(targetLang)
      isLoading.value = false
      console.log('✅ Content loaded successfully')
    } catch (error) {
      console.error('❌ Error loading available content:', error)
      isLoading.value = false
    }
  }

  // Load workshop details for a new language from already-known sources
  const loadedSourceLangs = new Set()
  async function loadSourcesForLanguage(lang) {
    if (loadedSourceLangs.has(lang)) return
    console.log(`📡 Loading source workshop details for language: ${lang}`)
    const contentSources = getAllContentSources()
    await Promise.all(
      contentSources.map(sourceUrl =>
        loadContentSource(sourceUrl, availableContent.value, languageCodes.value, lang)
      )
    )
    if (import.meta.env.DEV) {
      await loadLocalWorkshops(availableContent.value, languageCodes.value, lang)
    }
    loadedSourceLangs.add(lang)
  }

  async function loadWorkshopsForLanguage(lang) {
    try {
      console.log(`📚 Loading workshops for language: ${lang}`)

      // Ensure languages are loaded first
      if (!availableContent.value[lang]) {
        console.log('⚠️ Languages not loaded yet, loading now...')
        await loadAvailableContent(lang)

        if (!availableContent.value[lang]) {
          throw new Error(`Language ${lang} not found in available content`)
        }
      }

      // Load workshop details from sources for this language (if not yet loaded)
      await loadSourcesForLanguage(lang)

      console.log(`✅ Workshops loaded for ${lang}`)
    } catch (error) {
      console.error(`❌ Error loading workshops for ${lang}:`, error)
    }
  }

  async function loadLessonsForWorkshop(lang, workshop) {
    try {
      console.log(`📚 Loading lesson list for ${lang}/${workshop}`)

      // Ensure workshops are loaded first
      if (!availableContent.value[lang] || availableContent.value[lang][workshop] === undefined) {
        console.log('⚠️ Workshops not loaded yet, loading now...')
        await loadWorkshopsForLanguage(lang)

        if (!availableContent.value[lang] || availableContent.value[lang][workshop] === undefined) {
          throw new Error(`Workshop ${workshop} not found for language ${lang}`)
        }
      }

      // Resolve slug to URL if needed
      const resolvedWorkshop = resolveWorkshopKey(lang, workshop)

      // Construct lessons.yaml URL
      let lessonsUrl
      if (resolvedWorkshop !== workshop) {
        // Workshop was resolved from slug map (remote or built-in workshop-* source)
        lessonsUrl = `${resolvedWorkshop}/lessons.yaml`
      } else if (lang.startsWith('http://') || lang.startsWith('https://')) {
        // Language is a URL, workshop is a folder
        lessonsUrl = `${lang}/${workshop}/lessons.yaml`
      } else {
        // Fallback for unresolved local workshops
        console.warn(`⚠️ Workshop ${workshop} not in slug map, trying direct path`)
        lessonsUrl = `${workshop}/lessons.yaml`
      }

      const response = await fetch(lessonsUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch lessons.yaml for ${lang}/${workshop}: ${response.status}`)
      }

      const text = await response.text()
      const data = yaml.load(text)
      console.log(`📖 Loaded lessons list for ${lang}/${workshop}:`, data.lessons)

      availableContent.value[lang][workshop] = data.lessons
      console.log(`✅ Lesson list loaded: ${data.lessons.length} lessons found`)
    } catch (error) {
      console.error(`❌ Error loading lessons for ${lang}/${workshop}:`, error)
    }
  }

  async function loadLesson(lang, workshop, filenameOrSource) {
    try {
      const sourceDisplay = typeof filenameOrSource === 'string'
        ? filenameOrSource
        : JSON.stringify(filenameOrSource)
      console.log(`📄 Loading lesson: ${lang}/${workshop}/${sourceDisplay}`)

      // Parse lesson source (can be string, folder object, or url object)
      const source = parseSource(filenameOrSource)
      if (!source) {
        console.error(`❌ Invalid lesson source:`, filenameOrSource)
        return null
      }

      // Resolve slug to URL if needed
      const resolvedWorkshop = resolveWorkshopKey(lang, workshop)

      // Construct content.yaml URL
      let lessonPath
      if (source.type === 'url') {
        // Lesson is a URL
        lessonPath = `${source.path}/content.yaml`
      } else if (resolvedWorkshop !== workshop) {
        // Workshop was resolved from slug map (remote or built-in workshop-* source)
        lessonPath = `${resolvedWorkshop}/${source.path}/content.yaml`
      } else if (lang.startsWith('http://') || lang.startsWith('https://')) {
        // Language is a URL, others are folders
        lessonPath = `${lang}/${workshop}/${source.path}/content.yaml`
      } else {
        // Fallback for unresolved local workshops
        lessonPath = `${workshop}/${source.path}/content.yaml`
      }

      const response = await fetch(lessonPath)

      if (!response.ok) {
        console.error(`❌ Failed to fetch lesson ${lessonPath}: ${response.status}`)
        return null
      }

      const text = await response.text()
      const lesson = yaml.load(text)

      if (lesson) {
        console.log(`  ✓ Lesson loaded: #${lesson.number} - ${lesson.title}`)
        // Store the source path for audio loading
        lesson._source = source
      } else {
        console.error(`  ❌ Failed to parse lesson: ${filenameOrSource}`)
      }

      return lesson
    } catch (error) {
      console.error(`❌ Error loading lesson ${filenameOrSource}:`, error)
      return null
    }
  }

  async function loadAllLessonsForWorkshop(lang, workshop) {
    try {
      console.log(`📚 Loading all lessons for ${lang}/${workshop}`)

      // Load the lesson list first (this will ensure workshops are loaded too)
      await loadLessonsForWorkshop(lang, workshop)

      const lessonFiles = availableContent.value[lang]?.[workshop]

      if (!lessonFiles || lessonFiles.length === 0) {
        console.error(`❌ No lesson files found for ${lang}/${workshop}`)
        return []
      }

      console.log(`📖 Found ${lessonFiles.length} lesson files to load`)

      // Load all lessons in parallel (#119)
      const loaded = await Promise.all(
        lessonFiles.map(async (filename) => {
          const lesson = await loadLesson(lang, workshop, filename)
          if (lesson) {
            const source = parseSource(filename)
            lesson._filename = source ? source.path.replace(/\.yaml$/, '') : filename.replace(/\.yaml$/, '')
          }
          return lesson
        })
      )
      const lessons = loaded.filter(Boolean)

      const sortedLessons = lessons.sort((a, b) => a.number - b.number)
      console.log(`✅ All lessons loaded and sorted: ${sortedLessons.length} lessons`)

      return sortedLessons
    } catch (error) {
      console.error(`❌ Error loading all lessons for ${lang}/${workshop}:`, error)
      return []
    }
  }

  // Get language code for a language folder
  function getLanguageCode(langFolder) {
    return languageCodes.value[langFolder] || null
  }

  // Get workshop code for a workshop folder
  function getWorkshopCode(langFolder, workshopFolder) {
    return workshopCodes.value[langFolder]?.[workshopFolder] || getLanguageCode(langFolder)
  }

  return {
    availableContent,
    languageCodes,
    workshopCodes,
    isLoading,
    loadAvailableContent,
    loadWorkshopsForLanguage,
    loadLessonsForWorkshop,
    loadLesson,
    loadAllLessonsForWorkshop,
    getLanguageCode,
    getWorkshopCode,
    getContentSources,
    getAllContentSources,
    addContentSource,
    removeContentSource,
    isDefaultSource,
    isRemoteWorkshop,
    resolveWorkshopKey,
    getSourceForSlug,
    getWorkshopMeta,
    workshopMeta,
    getShareUrl
  }
}
