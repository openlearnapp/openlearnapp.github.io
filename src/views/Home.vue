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

          <!-- Split-Pille: links Sprach-Wahl, rechts Workshops-Action — eine zusammenhängende CTA -->
          <div class="relative">
            <div class="hero-split-cta">
              <!-- Linke Zone: Sprache wählen -->
              <button
                @click.stop="showLanguageMenu = !showLanguageMenu"
                class="hero-split-lang"
                :aria-label="formatLangName(currentLanguage) + ' — Sprache wechseln'"
              >
                <span class="text-xl leading-none">{{ getFlag(currentLanguage) }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-70 transition-transform" :class="showLanguageMenu ? 'rotate-180' : ''"><path d="m6 9 6 6 6-6"/></svg>
              </button>

              <!-- Trenn-Linie -->
              <span class="hero-split-divider" aria-hidden="true"></span>

              <!-- Rechte Zone: zur Workshop-Übersicht -->
              <a :href="'#/' + currentLanguage" class="hero-split-action">
                <span>{{ isDE ? 'Workshops auf' : 'Workshops in' }} {{ formatLangName(currentLanguage) }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="hero-split-arrow"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
            </div>

            <!-- Dropdown -->
            <Transition name="dropdown">
              <div
                v-if="showLanguageMenu"
                class="absolute top-full left-0 mt-2 bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl overflow-hidden min-w-[200px] z-[100]"
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

      <!-- ══ HOW IT WORKS — animierte Timeline mit Glow-Verbindung ══ -->
      <div class="mb-12">
        <h3 class="text-lg font-semibold text-foreground mb-6">{{ $t('home.howItWorks') }}</h3>

        <div class="hiw-timeline relative">
          <!-- Verbindungs-Linie (horizontal auf Desktop, vertikal auf Mobile) -->
          <div class="hiw-line" aria-hidden="true">
            <div class="hiw-line-fill"></div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 relative">
            <!-- Step 1: Pick a language — animierte Sprechblase (keine Duplizierung der Hero-Auswahl) -->
            <div class="hiw-step">
              <div class="hiw-num" data-step="1">
                <span>1</span>
                <span class="hiw-num-glow" aria-hidden="true"></span>
              </div>
              <h4 class="hiw-title">{{ steps[0].title }}</h4>
              <div class="hiw-speak" aria-hidden="true">
                <svg viewBox="0 0 100 70" width="100" height="70">
                  <!-- Sprechblase -->
                  <path d="M10 10 H 90 a 8 8 0 0 1 8 8 v 28 a 8 8 0 0 1 -8 8 H 38 l -10 10 v -10 H 10 a 8 8 0 0 1 -8 -8 V 18 a 8 8 0 0 1 8 -8 z"
                        fill="color-mix(in srgb, hsl(var(--primary)) 12%, transparent)"
                        stroke="hsl(var(--primary))" stroke-width="1.5" opacity="0.85"/>
                  <!-- Audio-Wellen drinnen -->
                  <line x1="22" y1="32" x2="22" y2="32" stroke="hsl(var(--primary))" stroke-width="3" stroke-linecap="round" class="hiw-wave hiw-wave-1"/>
                  <line x1="32" y1="32" x2="32" y2="32" stroke="hsl(var(--primary))" stroke-width="3" stroke-linecap="round" class="hiw-wave hiw-wave-2"/>
                  <line x1="42" y1="32" x2="42" y2="32" stroke="hsl(var(--primary))" stroke-width="3" stroke-linecap="round" class="hiw-wave hiw-wave-3"/>
                  <line x1="52" y1="32" x2="52" y2="32" stroke="hsl(var(--primary))" stroke-width="3" stroke-linecap="round" class="hiw-wave hiw-wave-4"/>
                  <line x1="62" y1="32" x2="62" y2="32" stroke="hsl(var(--primary))" stroke-width="3" stroke-linecap="round" class="hiw-wave hiw-wave-5"/>
                  <line x1="72" y1="32" x2="72" y2="32" stroke="hsl(var(--primary))" stroke-width="3" stroke-linecap="round" class="hiw-wave hiw-wave-6"/>
                </svg>
              </div>
              <p class="hiw-desc">{{ steps[0].desc }}</p>
            </div>

            <!-- Step 2: Start a Workshop — Workshop-Karten-Mockups + animierter Cursor -->
            <div class="hiw-step">
              <div class="hiw-num" data-step="2">
                <span>2</span>
                <span class="hiw-num-glow" aria-hidden="true"></span>
              </div>
              <h4 class="hiw-title">{{ steps[1].title }}</h4>
              <div class="hiw-tiles" aria-hidden="true">
                <span class="hiw-tile hiw-tile--1" style="--tc: #10b981;">
                  <span class="hiw-tile-bar"></span>
                  <span class="hiw-tile-line hiw-tile-line--w1"></span>
                  <span class="hiw-tile-line hiw-tile-line--w2"></span>
                </span>
                <span class="hiw-tile hiw-tile--2" style="--tc: #a855f7;">
                  <span class="hiw-tile-bar"></span>
                  <span class="hiw-tile-line hiw-tile-line--w1"></span>
                  <span class="hiw-tile-line hiw-tile-line--w2"></span>
                </span>
                <span class="hiw-tile hiw-tile--3" style="--tc: #f59e0b;">
                  <span class="hiw-tile-bar"></span>
                  <span class="hiw-tile-line hiw-tile-line--w1"></span>
                  <span class="hiw-tile-line hiw-tile-line--w2"></span>
                </span>
                <span class="hiw-cursor">
                  <svg width="14" height="16" viewBox="0 0 24 28" fill="currentColor"><path d="M2 2l8 22 3-9 9-3z"/></svg>
                </span>
              </div>
              <p class="hiw-desc">{{ steps[1].desc }}</p>
            </div>

            <!-- Step 3: Learn & Track — Progress-Bars + Completion-Check -->
            <div class="hiw-step">
              <div class="hiw-num" data-step="3">
                <span>3</span>
                <span class="hiw-num-glow" aria-hidden="true"></span>
              </div>
              <h4 class="hiw-title">{{ steps[2].title }}</h4>
              <div class="hiw-progress" aria-hidden="true">
                <span class="hiw-bar"></span>
                <span class="hiw-bar"></span>
                <span class="hiw-bar"></span>
                <span class="hiw-bar"></span>
                <span class="hiw-bar"></span>
              </div>
              <p class="hiw-desc">{{ steps[2].desc }}</p>
            </div>
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
                class="uc-chip"
              >
                <span class="uc-chip-glow" :style="{ '--glow': iconColor(example.key) }" aria-hidden="true"></span>
                <span class="uc-chip-icon" :style="{ color: iconColor(example.key) }">
                  <component :is="useCaseIcon(example.key)" class="w-7 h-7" />
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
                class="uc-chip"
              >
                <span class="uc-chip-glow" :style="{ '--glow': iconColor(example.key) }" aria-hidden="true"></span>
                <span class="uc-chip-icon" :style="{ color: iconColor(example.key) }">
                  <component :is="useCaseIcon(example.key)" class="w-7 h-7" />
                </span>
                <span class="uc-chip-label">{{ example.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ BUILT-IN TOOLS — Video-Player Showcase: zykliert durch alle Tools live ══ -->
      <div class="mb-12">
        <h3 class="text-lg font-semibold text-foreground mb-1">{{ $t('home.builtInTools') }}</h3>
        <p class="text-sm text-muted-foreground mb-5">{{ $t('home.builtInToolsDesc', 'Alles was du zum Lernen brauchst — eingebaut, kein Setup nötig.') }}</p>

        <div
          class="tvp-frame"
          @mouseenter="tvpHover = true"
          @mouseleave="tvpHover = false"
        >
          <!-- Live-Bild: aktuelles Tool -->
          <div class="tvp-screen" :style="{ '--c': toolColor(currentTool.key) }">
            <!-- Ambient color wash background -->
            <div class="tvp-wash" :style="{ '--c': toolColor(currentTool.key) }"></div>

            <!-- Floating particles per tool color -->
            <svg class="tvp-particles" viewBox="0 0 800 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <circle v-for="(p, i) in tvpParticles" :key="i"
                :cx="p.x + Math.sin(animFrame * 0.025 + p.phase) * 30"
                :cy="p.y + Math.cos(animFrame * 0.03 + p.phase) * 18"
                :r="p.r"
                :fill="toolColor(currentTool.key)"
                :opacity="0.1 + Math.sin(animFrame * 0.05 + p.phase) * 0.08" />
            </svg>

            <!-- Tool content (animated entry per change) -->
            <Transition name="tvp-fade" mode="out-in">
              <div :key="currentTool.key" class="tvp-content">
                <div class="tvp-icon" :style="{ color: toolColor(currentTool.key), '--c': toolColor(currentTool.key) }">
                  <component :is="toolIcon(currentTool.key)" class="w-16 h-16 sm:w-20 sm:h-20" />
                </div>
                <h4 class="tvp-title">{{ currentTool.title }}</h4>
                <p class="tvp-desc">{{ currentTool.desc }}</p>
              </div>
            </Transition>

            <!-- Live-Indicator -->
            <div class="tvp-live" aria-hidden="true">
              <span class="tvp-live-dot"></span>
              <span class="tvp-live-text">LIVE</span>
            </div>

            <!-- Tool counter top-right -->
            <div class="tvp-counter">{{ tvpIndex + 1 }} / {{ tools.length }}</div>

            <!-- Großer zentrierter Play/Pause-Button — click überall im Player toggelt -->
            <button
              class="tvp-center-play"
              :class="{ 'tvp-center-play--playing': tvpPlaying }"
              @click.stop="tvpPlaying = !tvpPlaying"
              :aria-label="tvpPlaying ? 'Pause' : 'Play'"
            >
              <svg v-if="tvpPlaying" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
              <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style="margin-left:3px"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>

          <!-- Controls overlay (transparent, hover-reveal) -->
          <div class="tvp-controls" :class="{ 'tvp-controls--show': tvpHover || !tvpPlaying }">
            <!-- Scrub track with tool-marker pills -->
            <div class="tvp-track" @click="onTvpScrubClick">
              <!-- Progress fill -->
              <div class="tvp-progress" :style="{ width: tvpProgress + '%' }"></div>
              <!-- Tool markers (clickable) -->
              <button
                v-for="(tool, i) in tools"
                :key="tool.key"
                class="tvp-marker"
                :class="{ 'tvp-marker--active': i === tvpIndex }"
                :style="{ left: ((i + 0.5) / tools.length * 100) + '%', '--c': toolColor(tool.key) }"
                @click.stop="tvpSeek(i)"
                :aria-label="tool.title"
              ></button>
            </div>

            <!-- Time / tool name -->
            <span class="tvp-time">{{ currentTool.title }}</span>
          </div>
        </div>
      </div>

      <!-- ══ FOR CREATORS — Gradient-Panel mit Pencil-Icon + YAML-Mockup ══ -->
      <a href="#/creators" class="creator-card group mb-12">
        <div class="creator-icon">
          <component :is="IconPencil" class="w-7 h-7" />
        </div>
        <div class="creator-text flex-1 min-w-0">
          <h3 class="creator-title">{{ $t('home.forCreators') }}</h3>
          <p class="creator-desc">{{ $t('home.forCreatorsDesc') }}</p>
          <span class="creator-link">{{ $t('home.forCreatorsLink') }} <span class="creator-arrow">→</span></span>
        </div>
        <!-- YAML-Mockup als Illustration -->
        <div class="creator-yaml" aria-hidden="true">
          <div class="creator-yaml-window">
            <div class="creator-yaml-dots">
              <span></span><span></span><span></span>
            </div>
            <div class="creator-yaml-line"><span class="creator-yaml-key">title:</span><span class="creator-yaml-val">"Lesson 1"</span></div>
            <div class="creator-yaml-line"><span class="creator-yaml-key">examples:</span></div>
            <div class="creator-yaml-line creator-yaml-indent"><span class="creator-yaml-dash">-</span><span class="creator-yaml-key">q:</span><span class="creator-yaml-val">"Frage"</span></div>
            <div class="creator-yaml-line creator-yaml-indent"><span class="creator-yaml-key">a:</span><span class="creator-yaml-val">"Antwort"</span></div>
          </div>
        </div>
      </a>

      <!-- ══ FOR PROVIDERS — Bezahlten Workshop anbieten ══ -->
      <div class="provider-card mb-12">
        <div class="provider-card__aurora" aria-hidden="true"></div>
        <div class="provider-card__grid" aria-hidden="true"></div>

        <div class="provider-card__head">
          <div class="provider-card__badge">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 2 14.5 8.5 21.5 9 16 13.5 17.5 20.5 12 17 6.5 20.5 8 13.5 2.5 9 9.5 8.5z" fill="currentColor"/>
            </svg>
            {{ isDE ? 'Für Kursanbieter' : 'For Course Providers' }}
          </div>
          <h3 class="provider-card__title">
            {{ isDE
              ? 'Deinen Kurs auf Open Learn verkaufen'
              : 'Sell your course on Open Learn' }}
          </h3>
          <p class="provider-card__lead">
            {{ isDE
              ? 'Du bringst den Inhalt — wir machen daraus einen Lernpfad mit Audio, Quiz und Fortschritt. Lege fest, welche Lektionen frei zugänglich sind und auf welcher Seite Lernende kaufen.'
              : 'You bring the content — we turn it into a learning path with audio, quiz and progress. Decide which lessons are free and where learners check out.' }}
          </p>
        </div>

        <div class="provider-card__cols">
          <ol class="provider-card__steps">
            <li>
              <span class="provider-card__num">1</span>
              <div>
                <strong>{{ isDE ? 'Workshop schreiben' : 'Author your workshop' }}</strong>
                <p>{{ isDE ? 'Lektionen als YAML — wie jeder andere Open-Learn-Workshop.' : 'Lessons as YAML — like any other Open Learn workshop.' }}</p>
              </div>
            </li>
            <li>
              <span class="provider-card__num">2</span>
              <div>
                <strong>{{ isDE ? 'Frei vs. Premium festlegen' : 'Choose free vs premium' }}</strong>
                <p>{{ isDE ? 'Per Zahl die ersten N freigeben — oder einzelne Lektionen markieren. Komplett kostenlos geht auch.' : 'Free the first N lessons — or pick individual ones. Fully free is also fine.' }}</p>
              </div>
            </li>
            <li>
              <span class="provider-card__num">3</span>
              <div>
                <strong>{{ isDE ? 'Verkaufsseite verlinken' : 'Link your checkout' }}</strong>
                <p>{{ isDE ? 'Eigene Landing-Page + Checkout. Open Learn führt Lernende elegant dorthin.' : 'Your own landing page + checkout. Open Learn guides learners there.' }}</p>
              </div>
            </li>
            <li>
              <span class="provider-card__num">4</span>
              <div>
                <strong>{{ isDE ? 'Importieren lassen' : 'Get imported' }}</strong>
                <p>{{ isDE ? 'Workshop-URL teilen — Open Learn rendert Banner, Schlösser und Kauf-CTA.' : 'Share the workshop URL — Open Learn renders banner, locks and buy CTA.' }}</p>
              </div>
            </li>
          </ol>

          <div class="provider-card__yaml" aria-label="workshops.yaml — Premium-Felder">
            <div class="provider-card__yaml-window">
              <div class="provider-card__yaml-dots">
                <span></span><span></span><span></span>
                <span class="provider-card__yaml-file">workshops.yaml</span>
              </div>
              <pre class="provider-card__yaml-body"><span class="hl-key">title:</span> <span class="hl-val">"Mein Kurs"</span>
<span class="hl-key">premium:</span> <span class="hl-bool">true</span>
<span class="hl-key">free_lessons:</span> <span class="hl-num">2</span>
<span class="hl-comment"># oder pro Lektion:</span>
<span class="hl-key">free_lesson_numbers:</span> [<span class="hl-num">0</span>, <span class="hl-num">1</span>, <span class="hl-num">5</span>]
<span class="hl-key">total_lessons:</span> <span class="hl-num">13</span>
<span class="hl-key">provider:</span>
  <span class="hl-key">name:</span> <span class="hl-val">"Mein Anbieter"</span>
  <span class="hl-key">landing_url:</span> <span class="hl-val">"https://..."</span>
  <span class="hl-key">accent_color:</span> <span class="hl-val">"#7c3aed"</span>
  <span class="hl-key">price_display:</span> <span class="hl-val">"49 €"</span></pre>
            </div>
          </div>
        </div>

        <div class="provider-card__cta-row">
          <a href="#/deutsch/local-dev:linux-grundlagen-preview/lessons" class="provider-card__cta provider-card__cta--primary">
            {{ isDE ? 'Demo ansehen' : 'View live demo' }}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
          </a>
          <a href="#/creators" class="provider-card__cta provider-card__cta--ghost">
            {{ isDE ? 'Workshop-Guide öffnen' : 'Open creator guide' }}
          </a>
        </div>
      </div>

      <!-- ══ PRIVACY — 3 themed Karten mit Icons ══ -->
      <div class="mb-12">
        <h3 class="text-lg font-semibold text-foreground mb-1">{{ $t('home.privacyTitle') }}</h3>
        <p class="text-sm text-muted-foreground mb-5">Deine Daten gehören dir — keine Konten, kein Tracking, voller Export.</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            v-for="item in privacyPoints"
            :key="item.key"
            class="privacy-card"
            :style="{ '--c': privacyColor(item.key) }"
          >
            <div class="privacy-icon">
              <component :is="privacyIcon(item.key)" class="w-5 h-5" />
            </div>
            <div>
              <h4 class="privacy-title">{{ item.title }}</h4>
              <p class="privacy-desc">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ ROADMAP — Status-Liste mit Dots und Progress-Indikatoren ══ -->
      <div class="mb-12">
        <h3 class="text-lg font-semibold text-foreground mb-1">{{ $t('home.roadmapTitle') }}</h3>
        <p class="text-sm text-muted-foreground mb-5">{{ $t('home.roadmapDesc') }}</p>
        <div class="roadmap-list">
          <div
            v-for="item in roadmapItems"
            :key="item.key"
            class="roadmap-item"
            :class="{ 'roadmap-item--done': item.done }"
          >
            <span class="roadmap-dot" aria-hidden="true">
              <svg v-if="item.done" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4 4 10-10"/></svg>
            </span>
            <div class="flex-grow min-w-0">
              <div class="roadmap-title">{{ item.title }}</div>
              <p class="roadmap-desc">{{ item.desc }}</p>
            </div>
            <a v-if="item.issue" :href="'https://github.com/openlearnapp/openlearnapp.github.io/issues/' + item.issue" target="_blank" rel="noopener" class="roadmap-issue" @click.stop>#{{ item.issue }}</a>
          </div>
        </div>
      </div>

      <!-- ══ OPEN SOURCE — Dark Gradient-Panel mit GitHub-Icon ══ -->
      <div class="os-card mb-8">
        <div class="os-bg" aria-hidden="true"></div>
        <div class="os-content">
          <div class="os-icon">
            <component :is="IconGitHub" class="w-10 h-10" />
          </div>
          <h3 class="os-title">{{ $t('home.openSourceTitle') }}</h3>
          <p class="os-desc">{{ $t('home.openSourceDesc') }}</p>
          <a href="https://github.com/openlearnapp/openlearnapp.github.io" target="_blank" rel="noopener" class="os-cta">
            <component :is="IconGitHub" class="w-4 h-4" />
            <span>{{ $t('home.viewOnGitHub') }}</span>
          </a>
        </div>
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
  { key: 'coach',  icon: '✨', title: t('home.roadmap.aiCoach'),  desc: t('home.roadmap.aiCoachDesc'),  issue: 45 },
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

// ── Built-in Tools: Custom Icons + Themen-Farben ──
const IconCheck = makeIcon('#10b981', [
  'M5 12.5l4 4 10-10',
  'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z',
])
const IconSpeaker = makeIcon('#06b6d4', [
  'M11 5L6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4V5z',
  'M15.5 8.5a5 5 0 0 1 0 7',
  'M18.5 5.5a9 9 0 0 1 0 13',
])
const IconVideoCam = makeIcon('#f472b6', [
  'M3 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z',
  'M17 10l5-3v10l-5-3',
])
const IconChart = makeIcon('#f59e0b', [
  'M3 21h18',
  'M6 17V11',
  'M11 17V7',
  'M16 17v-9',
  'M21 17V4',
])
const IconCoach = makeIcon('#818cf8', [
  'M22 9L12 5 2 9l10 4 10-4z',
  'M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5',
  'M22 9v6',
])
const IconSync = makeIcon('#a78bfa', [
  'M21 12a9 9 0 0 1-15.5 6.4L3 16',
  'M3 12a9 9 0 0 1 15.5-6.4L21 8',
  'M21 4v4h-4',
  'M3 20v-4h4',
])

const TOOL_ICONS  = { quiz: IconCheck, audio: IconSpeaker, video: IconVideoCam, progress: IconChart, coach: IconCoach, sync: IconSync }
const TOOL_COLORS = { quiz: '#10b981', audio: '#06b6d4', video: '#f472b6', progress: '#f59e0b', coach: '#818cf8', sync: '#a78bfa' }
function toolIcon(key)  { return TOOL_ICONS[key]  || IconCheck }
function toolColor(key) { return TOOL_COLORS[key] || '#10b981' }

// ── Icons für For-Creators / Privacy / Roadmap / Open-Source ──
const IconLock = makeIcon('#10b981', [
  'M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z',
  'M8 11V8a4 4 0 0 1 8 0v3',
])
const IconEyeOff = makeIcon('#06b6d4', [
  'M2 12s3-7 10-7c2.4 0 4.4 0.8 6 2',
  'M22 12s-3 7-10 7c-2.4 0-4.4-0.8-6-2',
  'M9 9.5A3 3 0 0 0 12 15a3 3 0 0 0 2.6-1.5',
  'M3 3l18 18',
])
const IconExport = makeIcon('#a78bfa', [
  'M12 3v12',
  'M7 8l5-5 5 5',
  'M3 17v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3',
])
const IconGitHub = makeIcon('#f8fafc', [
  'M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.47-1.12-1.47-.91-.62.07-.61.07-.61 1.01.07 1.54 1.04 1.54 1.04.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z',
])

const PRIVACY_ICONS  = { local: IconLock, notrack: IconEyeOff, export: IconExport }
const PRIVACY_COLORS = { local: '#10b981', notrack: '#06b6d4', export: '#a78bfa' }
function privacyIcon(key)  { return PRIVACY_ICONS[key]  || IconLock }
function privacyColor(key) { return PRIVACY_COLORS[key] || '#10b981' }

// ── Tool-Video-Player Logik ──
const TVP_SECONDS_PER_TOOL = 3.2
const tvpIndex = ref(0)
const tvpProgress = ref(0)       // 0..100 (gesamt über alle Tools)
const tvpPlaying = ref(true)
const tvpHover = ref(false)
let tvpRaf = null
let tvpLast = 0

const currentTool = computed(() => tools.value[tvpIndex.value] || tools.value[0])

function tvpTick(now) {
  if (tvpPlaying.value) {
    const dt = (now - tvpLast) / 1000
    const total = tools.value.length * TVP_SECONDS_PER_TOOL
    tvpProgress.value = (tvpProgress.value + (dt / total) * 100) % 100
    tvpIndex.value = Math.min(
      tools.value.length - 1,
      Math.floor((tvpProgress.value / 100) * tools.value.length)
    )
  }
  tvpLast = now
  tvpRaf = requestAnimationFrame(tvpTick)
}

function tvpSeek(i) {
  tvpIndex.value = i
  tvpProgress.value = (i / tools.value.length) * 100
}

function onTvpScrubClick(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const pct = ((e.clientX - rect.left) / rect.width) * 100
  tvpProgress.value = Math.max(0, Math.min(100, pct))
  tvpIndex.value = Math.min(
    tools.value.length - 1,
    Math.floor((tvpProgress.value / 100) * tools.value.length)
  )
}

// Particles for video screen background
const tvpParticles = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 73.3 + 30) % 800,
  y: (i * 51.7 + 22) % 360,
  r: 1.5 + (i % 3) * 1.2,
  phase: i * 0.43,
}))

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
  tvpRaf = requestAnimationFrame(tvpTick)

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
  if (tvpRaf) cancelAnimationFrame(tvpRaf)
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

/* Split-Pille: links Sprach-Wahl, rechts Workshops-Action */
.hero-split-cta {
  display: inline-flex;
  align-items: stretch;
  background: rgba(255,255,255,0.12);
  border: 1.5px solid rgba(255,255,255,0.3);
  backdrop-filter: blur(8px);
  border-radius: 999px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(99,102,241,0.3), 0 4px 20px rgba(0,0,0,0.4);
  transition: box-shadow 0.3s, border-color 0.3s;
}
.hero-split-cta:hover {
  border-color: rgba(99,102,241,0.6);
  box-shadow: 0 0 60px rgba(99,102,241,0.45), 0 6px 28px rgba(0,0,0,0.5);
}

.hero-split-lang {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px 12px 18px;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
  background: transparent;
  border: 0;
}
.hero-split-lang:hover { background: rgba(255,255,255,0.08); }

.hero-split-divider {
  width: 1px;
  background: rgba(255,255,255,0.25);
  align-self: stretch;
  margin: 6px 0;
}

.hero-split-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  letter-spacing: -0.01em;
  transition: background 0.2s, gap 0.2s;
}
.hero-split-action:hover {
  background: rgba(99,102,241,0.22);
  gap: 12px;
}
.hero-split-arrow {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.hero-split-action:hover .hero-split-arrow {
  transform: translateX(3px);
}

/* Dropdown transition */
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) translateX(-50%); }
.dropdown-enter-to, .dropdown-leave-from { transform: translateY(0) translateX(-50%); }

/* ── Tool-Video-Player Showcase ── */
.tvp-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 440px;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(180deg, #050810 0%, #0c0f1f 100%);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 24px 60px -16px rgba(0,0,0,0.4),
    inset 0 1px 0 rgba(255,255,255,0.06);
  isolation: isolate;
}
.tvp-screen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.6s ease;
}
.tvp-wash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 30%, color-mix(in srgb, var(--c) 30%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 70%, color-mix(in srgb, var(--c) 20%, transparent) 0%, transparent 55%);
  transition: background 0.6s ease;
  pointer-events: none;
}
.tvp-particles {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.tvp-content {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 24px;
  max-width: 80%;
}
.tvp-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  border-radius: 24px;
  background: color-mix(in srgb, var(--c) 12%, rgba(0,0,0,0.4));
  border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--c) 25%, transparent),
    0 10px 30px -8px color-mix(in srgb, var(--c) 50%, transparent);
  margin-bottom: 18px;
  filter: drop-shadow(0 0 16px currentColor);
}
.tvp-title {
  font-size: clamp(1.4rem, 3.4vw, 2.2rem);
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 12px rgba(0,0,0,0.5);
}
.tvp-desc {
  font-size: clamp(0.85rem, 1.6vw, 1rem);
  color: rgba(248,250,252,0.75);
  line-height: 1.5;
  max-width: 480px;
  margin: 0 auto;
}

/* Fade transition zwischen Tools */
.tvp-fade-enter-active, .tvp-fade-leave-active { transition: opacity 0.4s, transform 0.4s; }
.tvp-fade-enter-from { opacity: 0; transform: translateY(8px) scale(0.98); }
.tvp-fade-leave-to   { opacity: 0; transform: translateY(-8px) scale(0.98); }

/* Live-Indicator */
.tvp-live {
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 8px;
  border-radius: 999px;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(8px);
  z-index: 5;
}
.tvp-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
  animation: tvp-blink 1.4s ease-in-out infinite;
}
.tvp-live-text {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #f8fafc;
}
@keyframes tvp-blink {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
  50%      { opacity: 0.5; box-shadow: 0 0 0 6px rgba(239,68,68,0); }
}

.tvp-counter {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(8px);
  font-size: 11px;
  font-weight: 600;
  color: rgba(248,250,252,0.8);
  letter-spacing: 0.04em;
  z-index: 5;
}

/* ── Controls Overlay ── */
.tvp-controls {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.3s, transform 0.3s;
  z-index: 6;
}
.tvp-controls--show { opacity: 1; transform: translateY(0); }

/* Großer zentrierter Play/Pause-Button — wechselt Visibility je nach Spielstatus */
.tvp-center-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 76px;
  height: 76px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.16);
  border: 2px solid rgba(255,255,255,0.55);
  backdrop-filter: blur(10px);
  color: #fff;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              background 0.25s,
              opacity 0.35s,
              border-color 0.25s;
}
.tvp-center-play:hover {
  background: rgba(255,255,255,0.28);
  border-color: rgba(255,255,255,0.8);
  transform: translate(-50%, -50%) scale(1.08);
}
.tvp-center-play:active {
  transform: translate(-50%, -50%) scale(0.94);
}
/* Während Wiedergabe: ausblenden, nur bei Hover über Player zeigen */
.tvp-center-play--playing {
  opacity: 0;
}
.tvp-frame:hover .tvp-center-play--playing {
  opacity: 0.85;
}

/* Scrub bar */
.tvp-track {
  position: relative;
  flex: 1;
  height: 22px;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.tvp-track::before {
  content: '';
  position: absolute;
  left: 0; right: 0;
  height: 3px;
  border-radius: 3px;
  background: rgba(255,255,255,0.15);
}
.tvp-progress {
  position: absolute;
  left: 0;
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(90deg, rgba(255,255,255,0.7), #fff);
  transition: width 0.05s linear;
  pointer-events: none;
}
.tvp-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--c);
  border: 2px solid rgba(255,255,255,0.7);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  padding: 0;
}
.tvp-marker:hover {
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 0 12px var(--c);
}
.tvp-marker--active {
  transform: translate(-50%, -50%) scale(1.4);
  box-shadow: 0 0 14px var(--c);
}

.tvp-time {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  letter-spacing: 0.02em;
  min-width: 90px;
  text-align: right;
}

@media (prefers-reduced-motion: reduce) {
  .tvp-live-dot { animation: none; }
  .tvp-fade-enter-active, .tvp-fade-leave-active { transition: opacity 0.2s; }
}

/* ── For Creators Card ── */
.creator-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 22px 24px;
  border-radius: 20px;
  background: linear-gradient(135deg,
    color-mix(in srgb, #10b981 6%, hsl(var(--card))) 0%,
    hsl(var(--card)) 60%);
  border: 1px solid color-mix(in srgb, #10b981 20%, hsl(var(--border)));
  text-decoration: none;
  overflow: hidden;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.35s,
              box-shadow 0.35s;
}
.creator-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, #10b981 50%, transparent);
  box-shadow: 0 16px 40px -8px color-mix(in srgb, #10b981 25%, transparent);
}
.creator-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
  background: linear-gradient(135deg, color-mix(in srgb, #10b981 18%, transparent), color-mix(in srgb, #10b981 5%, transparent));
  border: 1px solid color-mix(in srgb, #10b981 30%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, #10b981 25%, transparent),
              0 6px 18px -4px color-mix(in srgb, #10b981 45%, transparent);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.creator-card:hover .creator-icon { transform: rotate(-6deg) scale(1.05); }
.creator-title { font-size: 1.05rem; font-weight: 700; color: hsl(var(--foreground)); margin-bottom: 4px; letter-spacing: -0.01em; }
.creator-desc  { font-size: 0.85rem; color: hsl(var(--muted-foreground)); line-height: 1.5; margin-bottom: 10px; }
.creator-link  { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; color: #10b981; }
.creator-arrow { transition: transform 0.25s; display: inline-block; }
.creator-card:hover .creator-arrow { transform: translateX(4px); }

.creator-yaml {
  flex-shrink: 0;
  display: none;
}
@media (min-width: 640px) { .creator-yaml { display: block; } }
.creator-yaml-window {
  width: 220px;
  background: #0f172a;
  border-radius: 10px;
  padding: 26px 14px 14px;
  position: relative;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 11px;
  line-height: 1.7;
}
.creator-yaml-dots {
  position: absolute;
  top: 8px; left: 10px;
  display: flex; gap: 5px;
}
.creator-yaml-dots span {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
}
.creator-yaml-dots span:nth-child(1) { background: #f87171; }
.creator-yaml-dots span:nth-child(2) { background: #fbbf24; }
.creator-yaml-dots span:nth-child(3) { background: #10b981; }
.creator-yaml-line { color: #e2e8f0; white-space: nowrap; }
.creator-yaml-indent { padding-left: 14px; }
.creator-yaml-key { color: #818cf8; margin-right: 6px; }
.creator-yaml-val { color: #34d399; }
.creator-yaml-dash { color: #94a3b8; margin-right: 4px; }

/* ── Privacy Cards ── */
.privacy-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  transition: border-color 0.3s, box-shadow 0.3s;
}
.privacy-card:hover {
  border-color: color-mix(in srgb, var(--c) 45%, transparent);
  box-shadow: 0 6px 20px -6px color-mix(in srgb, var(--c) 22%, transparent);
}
.privacy-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c);
  background: color-mix(in srgb, var(--c) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 25%, transparent);
}
.privacy-title { font-size: 0.9rem; font-weight: 700; color: hsl(var(--foreground)); margin-bottom: 4px; letter-spacing: -0.01em; }
.privacy-desc  { font-size: 0.78rem; color: hsl(var(--muted-foreground)); line-height: 1.5; }

/* ── Roadmap ── */
.roadmap-list {
  position: relative;
  padding-left: 26px;
}
.roadmap-list::before {
  content: '';
  position: absolute;
  left: 11px; top: 14px; bottom: 14px;
  width: 2px;
  background: linear-gradient(180deg,
    color-mix(in srgb, hsl(var(--primary)) 30%, transparent),
    color-mix(in srgb, hsl(var(--primary)) 10%, transparent));
  border-radius: 2px;
}
.roadmap-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  margin-bottom: 10px;
  transition: border-color 0.25s, transform 0.25s;
}
.roadmap-item:hover {
  transform: translateX(2px);
  border-color: color-mix(in srgb, hsl(var(--primary)) 40%, transparent);
}
.roadmap-item--done {
  border-color: color-mix(in srgb, #10b981 35%, transparent);
  background: color-mix(in srgb, #10b981 5%, hsl(var(--card)));
}
.roadmap-dot {
  position: absolute;
  left: -22px;
  top: 14px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: hsl(var(--background));
  border: 2px solid hsl(var(--primary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 1;
}
.roadmap-item--done .roadmap-dot {
  background: #10b981;
  border-color: #10b981;
}
.roadmap-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin-bottom: 2px;
}
.roadmap-item--done .roadmap-title {
  color: hsl(var(--muted-foreground));
  text-decoration: line-through;
}
.roadmap-desc  { font-size: 0.78rem; color: hsl(var(--muted-foreground)); line-height: 1.5; }
.roadmap-issue {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  padding: 4px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, hsl(var(--primary)) 8%, transparent);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}
.roadmap-issue:hover { background: color-mix(in srgb, hsl(var(--primary)) 18%, transparent); color: hsl(var(--primary)); }

/* ── Open Source CTA ── */
.os-card {
  position: relative;
  padding: 32px 24px;
  border-radius: 20px;
  background: linear-gradient(135deg, #050810 0%, #131040 60%, #1e1b4b 100%);
  border: 1px solid rgba(255,255,255,0.1);
  overflow: hidden;
  isolation: isolate;
  box-shadow: 0 16px 40px -8px rgba(0,0,0,0.3);
}
.os-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 25% 30%, rgba(168,85,247,0.18), transparent 55%),
    radial-gradient(ellipse at 75% 70%, rgba(16,185,129,0.15), transparent 55%);
  pointer-events: none;
}
.os-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}
.os-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  margin-bottom: 16px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  filter: drop-shadow(0 0 12px rgba(255,255,255,0.2));
}
.os-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}
.os-desc {
  font-size: 0.9rem;
  color: rgba(248,250,252,0.75);
  line-height: 1.6;
  margin-bottom: 20px;
}
.os-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
  border-radius: 999px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}
.os-cta:hover {
  transform: translateY(-2px);
  background: #fff;
  box-shadow: 0 10px 28px rgba(255,255,255,0.2);
}

@media (prefers-reduced-motion: reduce) {
  .creator-card, .creator-icon, .creator-arrow, .roadmap-item, .os-cta { transition: none; }
  .creator-card:hover, .creator-card:hover .creator-icon, .creator-card:hover .creator-arrow,
  .roadmap-item:hover, .os-cta:hover { transform: none; }
}

/* ── How-It-Works Timeline (Sektion B) ── */
.hiw-timeline { padding: 16px 0; }

/* Verbindungs-Linie zwischen den Steps */
.hiw-line {
  position: absolute;
  top: 30px;
  left: 16%;
  right: 16%;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg,
              color-mix(in srgb, hsl(var(--primary)) 30%, transparent),
              color-mix(in srgb, hsl(var(--primary)) 50%, transparent),
              color-mix(in srgb, hsl(var(--primary)) 30%, transparent));
  overflow: hidden;
}
.hiw-line-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, hsl(var(--primary)), transparent);
  width: 30%;
  animation: hiw-flow 3.5s linear infinite;
}
@keyframes hiw-flow {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

/* Mobile: Linie vertikal */
@media (max-width: 639px) {
  .hiw-line {
    top: 30px;
    bottom: 30px;
    left: calc(50% - 1px);
    right: auto;
    width: 2px;
    height: auto;
    background: linear-gradient(180deg,
                color-mix(in srgb, hsl(var(--primary)) 30%, transparent),
                color-mix(in srgb, hsl(var(--primary)) 50%, transparent),
                color-mix(in srgb, hsl(var(--primary)) 30%, transparent));
  }
  .hiw-line-fill {
    width: 100%;
    height: 30%;
    background: linear-gradient(180deg, transparent, hsl(var(--primary)), transparent);
    animation: hiw-flow-v 3.5s linear infinite;
  }
  @keyframes hiw-flow-v {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(400%); }
  }
}

.hiw-step {
  position: relative;
  text-align: center;
  padding: 0 8px;
  z-index: 1;
}

/* Number-Badge mit Glow */
.hiw-num {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: hsl(var(--background));
  border: 2px solid hsl(var(--primary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 900;
  color: hsl(var(--primary));
  letter-spacing: -0.02em;
  box-shadow: 0 0 0 6px hsl(var(--background)),
              0 4px 16px color-mix(in srgb, hsl(var(--primary)) 30%, transparent);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.35s;
  isolation: isolate;
}
.hiw-num span:first-child {
  position: relative;
  z-index: 2;
}
.hiw-num-glow {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, hsl(var(--primary)) 40%, transparent), transparent 70%);
  z-index: 0;
  animation: hiw-pulse 2.4s ease-out infinite;
}
@keyframes hiw-pulse {
  0%, 100% { transform: scale(1);    opacity: 0.6; }
  50%      { transform: scale(1.25); opacity: 0.3; }
}

.hiw-step:hover .hiw-num {
  transform: scale(1.08);
  box-shadow: 0 0 0 6px hsl(var(--background)),
              0 8px 24px color-mix(in srgb, hsl(var(--primary)) 50%, transparent);
}

.hiw-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}

/* Step 1: animierte Sprechblase mit Audio-Wellen */
.hiw-speak {
  display: flex;
  justify-content: center;
  margin: 0 auto 14px;
  width: 100px;
  height: 70px;
}
.hiw-wave {
  animation: hiw-wave-anim 1.5s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}
.hiw-wave-1 { animation-delay: 0s; }
.hiw-wave-2 { animation-delay: 0.1s; }
.hiw-wave-3 { animation-delay: 0.2s; }
.hiw-wave-4 { animation-delay: 0.15s; }
.hiw-wave-5 { animation-delay: 0.05s; }
.hiw-wave-6 { animation-delay: 0.25s; }
@keyframes hiw-wave-anim {
  0%, 100% { stroke-dasharray: 0 14;   opacity: 0.4; }
  50%      { stroke-dasharray: 14 0;   opacity: 1; }
}

/* Step 2: Workshop-Tiles im Karten-Mockup-Stil + animierter Cursor */
.hiw-tiles {
  position: relative;
  display: flex;
  gap: 7px;
  margin: 4px auto 14px;
  justify-content: center;
  height: 42px;
  width: 144px;
}
.hiw-tile {
  position: relative;
  width: 42px;
  height: 38px;
  border-radius: 6px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px color-mix(in srgb, var(--tc) 12%, transparent);
  overflow: hidden;
  display: block;
  transition: transform 0.3s, box-shadow 0.3s;
}
/* Farbiger Top-Bar wie echte Workshop-Karten */
.hiw-tile-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: var(--tc);
}
/* Content-Linien (simulieren Titel + Beschreibung) */
.hiw-tile-line {
  position: absolute;
  left: 5px;
  height: 2px;
  border-radius: 1px;
  background: hsl(var(--muted-foreground));
  opacity: 0.5;
}
.hiw-tile-line--w1 { top: 12px; width: 28px; opacity: 0.7; }
.hiw-tile-line--w2 { top: 18px; width: 18px; opacity: 0.4; }

/* Mittlere Karte „leuchtet auf" wenn der Cursor sie erreicht */
.hiw-tile--2 {
  animation: hiw-tile-glow 3s ease-in-out infinite;
}
@keyframes hiw-tile-glow {
  0%, 38%, 75%, 100% {
    transform: scale(1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px color-mix(in srgb, var(--tc) 12%, transparent);
  }
  50%, 60% {
    transform: scale(1.08) translateY(-2px);
    box-shadow: 0 6px 16px color-mix(in srgb, var(--tc) 35%, transparent),
                0 0 0 2px color-mix(in srgb, var(--tc) 50%, transparent);
  }
}

.hiw-cursor {
  position: absolute;
  color: hsl(var(--foreground));
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  animation: hiw-cursor-move 3s ease-in-out infinite;
  pointer-events: none;
}
@keyframes hiw-cursor-move {
  0%   { left: 8px;   top: 10px; transform: scale(1); }
  35%  { left: 64px;  top: 16px; transform: scale(1); }
  50%  { left: 64px;  top: 16px; transform: scale(0.8); }
  60%  { left: 64px;  top: 16px; transform: scale(1); }
  100% { left: 114px; top: 22px; transform: scale(1); }
}

.hiw-desc {
  font-size: 0.8rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
  max-width: 220px;
  margin: 0 auto;
}

/* Step 3: Progress-Balken-Animation */
.hiw-progress {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-bottom: 14px;
}
.hiw-bar {
  width: 18px;
  height: 5px;
  border-radius: 3px;
  background: color-mix(in srgb, hsl(var(--primary)) 20%, transparent);
  animation: hiw-bar-fill 2.5s ease-in-out infinite;
}
.hiw-bar:nth-child(1) { animation-delay: 0s; }
.hiw-bar:nth-child(2) { animation-delay: 0.2s; }
.hiw-bar:nth-child(3) { animation-delay: 0.4s; }
.hiw-bar:nth-child(4) { animation-delay: 0.6s; }
.hiw-bar:nth-child(5) { animation-delay: 0.8s; }
@keyframes hiw-bar-fill {
  0%, 50%  { background: color-mix(in srgb, hsl(var(--primary)) 20%, transparent); transform: scaleY(0.7); }
  25%      { background: hsl(var(--primary)); transform: scaleY(1.4); }
}

@media (prefers-reduced-motion: reduce) {
  .hiw-line-fill, .hiw-num-glow, .hiw-bar, .hiw-tile--2, .hiw-cursor, .hiw-wave { animation: none; }
  .hiw-step:hover .hiw-num { transform: none; }
}

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
  isolation: isolate;
  cursor: default;
}
/* Sanftes ambient Leuchten in Icon-Farbe — immer sichtbar, kein Hover-Trigger */
.uc-chip-glow {
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  background: radial-gradient(circle at center, var(--glow, #10b981) 0%, transparent 60%);
  opacity: 0.18;
  z-index: -1;
  filter: blur(14px);
}
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

/* ══ PROVIDER CARD — Bezahlten Workshop anbieten ══ */
.provider-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: 1.8rem 1.8rem 1.5rem 1.8rem;
  border-radius: 1.4rem;
  color: #fff;
  background:
    linear-gradient(140deg, #0b1020 0%, #1a1240 55%, #0b1020 100%);
  border: 1px solid rgba(124, 58, 237, 0.35);
  box-shadow:
    0 24px 60px -28px rgba(124, 58, 237, 0.7),
    inset 0 0 0 1px rgba(255,255,255,0.04);
}
.provider-card__aurora {
  position: absolute;
  inset: -30%;
  background:
    radial-gradient(40% 50% at 18% 24%, rgba(124, 58, 237, 0.55), transparent 70%),
    radial-gradient(35% 45% at 85% 78%, rgba(167, 139, 250, 0.4), transparent 72%),
    radial-gradient(28% 38% at 65% 15%, rgba(34, 211, 238, 0.45), transparent 70%);
  filter: blur(36px);
  animation: providerAurora 22s ease-in-out infinite alternate;
  z-index: 0;
}
.provider-card__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 28px 28px;
  mask: linear-gradient(170deg, rgba(0,0,0,0.45) 0%, transparent 75%);
  z-index: 0;
}
.provider-card__head { position: relative; z-index: 1; }
.provider-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(120deg, #7c3aed, #a78bfa, #22d3ee, #7c3aed);
  background-size: 300% 100%;
  animation: providerShift 7s ease-in-out infinite;
  margin-bottom: 0.85rem;
  box-shadow: 0 6px 18px -6px rgba(124, 58, 237, 0.8);
}
.provider-card__title {
  font-size: clamp(1.4rem, 2.3vw, 1.85rem);
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(120deg, #fff 30%, #d8b4fe 60%, #67e8f9);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.01em;
}
.provider-card__lead {
  position: relative;
  font-size: 0.95rem;
  line-height: 1.55;
  color: rgba(255,255,255,0.78);
  max-width: 70ch;
  margin: 0 0 1.2rem 0;
}
.provider-card__cols {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 1.4rem;
}
@media (max-width: 720px) {
  .provider-card__cols { grid-template-columns: 1fr; }
}
.provider-card__steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.provider-card__steps li {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
}
.provider-card__steps strong {
  display: block;
  font-size: 0.95rem;
  color: #fff;
  margin-bottom: 0.15rem;
}
.provider-card__steps p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: rgba(255,255,255,0.72);
}
.provider-card__num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  box-shadow: 0 4px 14px -4px rgba(124, 58, 237, 0.75),
              inset 0 0 0 1px rgba(255,255,255,0.18);
}
.provider-card__yaml-window {
  background: rgba(8, 12, 28, 0.85);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0.85rem;
  padding: 0.55rem 0 0.7rem 0;
  box-shadow: 0 12px 28px -14px rgba(0,0,0,0.6);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  overflow: hidden;
}
.provider-card__yaml-dots {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0 0.85rem 0.5rem 0.85rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.provider-card__yaml-dots span:not(.provider-card__yaml-file) {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.provider-card__yaml-dots span:nth-child(1) { background: #ef4444; }
.provider-card__yaml-dots span:nth-child(2) { background: #f59e0b; }
.provider-card__yaml-dots span:nth-child(3) { background: #10b981; }
.provider-card__yaml-file {
  margin-left: auto;
  font-size: 0.7rem;
  color: rgba(255,255,255,0.5);
}
.provider-card__yaml-body {
  margin: 0;
  padding: 0.7rem 1rem 0.4rem 1rem;
  color: rgba(255,255,255,0.88);
  white-space: pre;
  overflow-x: auto;
}
.provider-card__yaml-body .hl-key { color: #a78bfa; }
.provider-card__yaml-body .hl-val { color: #67e8f9; }
.provider-card__yaml-body .hl-num { color: #facc15; }
.provider-card__yaml-body .hl-bool { color: #f472b6; }
.provider-card__yaml-body .hl-comment { color: rgba(255,255,255,0.4); font-style: italic; }

.provider-card__cta-row {
  position: relative;
  z-index: 1;
  margin-top: 1.4rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.provider-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 1.15rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.provider-card__cta--primary {
  color: #fff;
  background: linear-gradient(120deg, #7c3aed, #a78bfa);
  box-shadow: 0 12px 26px -10px rgba(124, 58, 237, 0.85);
}
.provider-card__cta--primary:hover {
  transform: translateY(-1px) scale(1.02);
}
.provider-card__cta--ghost {
  color: rgba(255,255,255,0.9);
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.16);
}
.provider-card__cta--ghost:hover {
  background: rgba(255,255,255,0.14);
}

@keyframes providerAurora {
  0% { transform: translate3d(-3%, -3%, 0) rotate(0deg); }
  100% { transform: translate3d(3%, 4%, 0) rotate(6deg); }
}
@keyframes providerShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .provider-card__aurora,
  .provider-card__badge { animation: none; }
}
</style>
