<template>
  <div class="creators-page">
    <!-- ══ HERO ══ -->
    <section class="cr-hero">
      <div class="cr-hero__aurora" aria-hidden="true"></div>
      <div class="cr-hero__grid" aria-hidden="true"></div>
      <div class="cr-hero__particles" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="cr-hero__inner">
        <div class="cr-badge">
          <span class="cr-badge__dot"></span>
          {{ isDE ? 'Für Kursanbieter & Workshop-Autoren' : 'For Course Providers & Workshop Authors' }}
        </div>
        <h1 class="cr-hero__title">{{ t('title') }}</h1>
        <p class="cr-hero__lead">{{ t('intro') }}</p>
        <div class="cr-hero__cta">
          <a href="#start" class="cr-btn cr-btn--primary">
            {{ isDE ? 'Loslegen' : 'Get started' }}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
          </a>
          <a href="#premium" class="cr-btn cr-btn--ghost">
            {{ isDE ? 'Kostenpflichtige Kurse anbieten' : 'Sell paid courses' }}
          </a>
        </div>
      </div>
    </section>

    <!-- ══ 3 STEPS ══ -->
    <section id="start" class="cr-section">
      <h2 class="cr-h2">{{ t('howItWorks') }}</h2>
      <div class="cr-steps">
        <div v-for="(step, i) in creatorSteps" :key="i" class="cr-step">
          <div class="cr-step__num">{{ i + 1 }}</div>
          <div class="cr-step__title">{{ step.title }}</div>
          <p class="cr-step__desc">{{ step.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ══ FOLDER STRUCTURE ══ -->
    <section class="cr-section">
      <h2 class="cr-h2">{{ t('structureTitle') }}</h2>
      <p class="cr-lead">{{ t('structureDesc') }}</p>
      <div class="cr-code">
        <div class="cr-code__dots">
          <span></span><span></span><span></span>
          <span class="cr-code__file">your-workshop/</span>
        </div>
        <pre class="cr-code__body">{{ folderStructure }}</pre>
      </div>
    </section>

    <!-- ══ LESSON YAML ══ -->
    <section class="cr-section">
      <h2 class="cr-h2">{{ t('lessonTitle') }}</h2>
      <p class="cr-lead">{{ t('lessonDesc') }}</p>
      <div class="cr-code">
        <div class="cr-code__dots">
          <span></span><span></span><span></span>
          <span class="cr-code__file">content.yaml</span>
        </div>
        <pre class="cr-code__body">{{ lessonExample }}</pre>
      </div>
    </section>

    <!-- ══ PREMIUM / BEZAHLT ══ -->
    <section id="premium" class="cr-premium">
      <div class="cr-premium__aurora" aria-hidden="true"></div>
      <div class="cr-premium__grid" aria-hidden="true"></div>

      <div class="cr-premium__head">
        <div class="cr-badge cr-badge--premium">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M12 2 14.5 8.5 21.5 9 16 13.5 17.5 20.5 12 17 6.5 20.5 8 13.5 2.5 9 9.5 8.5z"/>
          </svg>
          {{ isDE ? 'NEU · Bezahlte Workshops' : 'NEW · Paid Workshops' }}
        </div>
        <h2 class="cr-premium__title">
          {{ isDE ? 'Verkaufe deinen Kurs über Open Learn' : 'Sell your course through Open Learn' }}
        </h2>
        <p class="cr-premium__lead">
          {{ isDE
            ? 'Du bestimmst welche Lektionen frei zugänglich sind und wo Lernende den Kurs kaufen. Open Learn macht aus deinem Inhalt einen interaktiven Lernpfad mit Lektion-Vorschau, Schloss-Symbolen und nahtlosem Kauf-Flow.'
            : 'You decide which lessons are free and where learners purchase. Open Learn turns your content into an interactive learning path with lesson previews, lock indicators and a seamless checkout flow.' }}
        </p>
      </div>

      <div class="cr-premium__cols">
        <ul class="cr-premium__features">
          <li>
            <span class="cr-premium__check">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </span>
            <div>
              <strong>{{ isDE ? 'Du wählst welche Lektionen frei sind' : 'You choose which lessons are free' }}</strong>
              <p>{{ isDE ? 'Per Anzahl (erste N) oder einzelne Lektions-Nummern. Auch ein komplett kostenloser Workshop ist möglich.' : 'By count (first N) or by individual lesson numbers. Fully free is also fine.' }}</p>
            </div>
          </li>
          <li>
            <span class="cr-premium__check">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </span>
            <div>
              <strong>{{ isDE ? 'Deine eigene Verkaufs-Seite' : 'Your own checkout page' }}</strong>
              <p>{{ isDE ? 'Open Learn führt Lernende per Klick zu deiner Landing-Page. Stripe, Lemon Squeezy, eigene Seite — egal.' : 'Open Learn directs learners to your landing page. Stripe, Lemon Squeezy, your own page — all fine.' }}</p>
            </div>
          </li>
          <li>
            <span class="cr-premium__check">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </span>
            <div>
              <strong>{{ isDE ? 'Branding bleibt deins' : 'Your branding stays' }}</strong>
              <p>{{ isDE ? 'Logo, Akzentfarbe, Headline, Bullet-Vorteile — alles erscheint im Werbe-Banner deines Kurses.' : 'Logo, accent color, headline, bullet benefits — all show in your course\'s ad banner.' }}</p>
            </div>
          </li>
          <li>
            <span class="cr-premium__check">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </span>
            <div>
              <strong>{{ isDE ? 'Nach dem Kauf: alle Schlösser offen' : 'After purchase: every lock opens' }}</strong>
              <p>{{ isDE ? 'Open Learn entsperrt automatisch — Lernende lernen weiter ohne Reibung.' : 'Open Learn unlocks automatically — learners continue without friction.' }}</p>
            </div>
          </li>
        </ul>

        <div class="cr-code cr-code--premium">
          <div class="cr-code__dots">
            <span></span><span></span><span></span>
            <span class="cr-code__file">workshops.yaml</span>
          </div>
          <pre class="cr-code__body"><span class="hl-key">title:</span> <span class="hl-val">"Mein Kurs"</span>
<span class="hl-key">premium:</span> <span class="hl-bool">true</span>
<span class="hl-comment"># Variante A: die ersten N frei</span>
<span class="hl-key">free_lessons:</span> <span class="hl-num">2</span>
<span class="hl-comment"># Variante B: einzelne Lektionen frei</span>
<span class="hl-key">free_lesson_numbers:</span> [<span class="hl-num">1</span>, <span class="hl-num">2</span>, <span class="hl-num">6</span>]
<span class="hl-key">total_lessons:</span> <span class="hl-num">13</span>
<span class="hl-key">provider:</span>
  <span class="hl-key">name:</span> <span class="hl-val">"Mein Anbieter"</span>
  <span class="hl-key">headline:</span> <span class="hl-val">"..."</span>
  <span class="hl-key">pitch:</span> <span class="hl-val">"..."</span>
  <span class="hl-key">bullets:</span> [<span class="hl-val">"..."</span>]
  <span class="hl-key">landing_url:</span> <span class="hl-val">"https://..."</span>
  <span class="hl-key">accent_color:</span> <span class="hl-val">"#7c3aed"</span>
  <span class="hl-key">price_display:</span> <span class="hl-val">"49 €"</span></pre>
        </div>
      </div>

      <div class="cr-premium__cta">
        <a :href="`#/${currentLang}/local-dev:linux-grundlagen-preview/lessons`" class="cr-btn cr-btn--primary">
          {{ isDE ? 'Live-Demo ansehen' : 'View live demo' }}
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
        </a>
        <a href="https://github.com/openlearnapp/openlearnapp.github.io/tree/main/docs"
           target="_blank" rel="noopener"
           class="cr-btn cr-btn--ghost">
          {{ isDE ? 'Schema-Doku' : 'Schema docs' }}
        </a>
      </div>
    </section>

    <!-- ══ ASSESSMENT TYPES ══ -->
    <section class="cr-section">
      <h2 class="cr-h2">{{ t('assessmentsTitle') }}</h2>
      <p class="cr-lead">{{ t('assessmentsDesc') }}</p>
      <div class="cr-assess">
        <div v-for="type in assessmentTypes" :key="type.key" class="cr-assess__item">
          <div class="cr-assess__title">{{ type.title }}</div>
          <p class="cr-assess__desc">{{ type.desc }}</p>
          <pre class="cr-assess__yaml">{{ type.yaml }}</pre>
        </div>
      </div>
    </section>

    <!-- ══ HOSTING ══ -->
    <section class="cr-section">
      <h2 class="cr-h2">{{ t('hostingTitle') }}</h2>
      <div class="cr-hosting">
        <div v-for="option in hostingOptions" :key="option.key" class="cr-hosting__item">
          <component :is="option.icon" class="cr-hosting__icon" />
          <div class="cr-hosting__name">{{ option.title }}</div>
          <p class="cr-hosting__desc">{{ option.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ══ SHARE LINK ══ -->
    <section class="cr-section">
      <h2 class="cr-h2">{{ t('shareTitle') }}</h2>
      <p class="cr-lead">{{ t('shareDesc') }}</p>
      <div class="cr-code">
        <div class="cr-code__dots">
          <span></span><span></span><span></span>
          <span class="cr-code__file">share-link</span>
        </div>
        <pre class="cr-code__body">https://open-learn.app/#/add?source=https://YOUR-USER.github.io/YOUR-REPO/index.yaml</pre>
      </div>
    </section>

    <!-- ══ AUDIO ══ -->
    <section class="cr-section">
      <h2 class="cr-h2">{{ t('audioTitle') }}</h2>
      <p class="cr-lead">{{ t('audioDesc') }}</p>
      <div class="cr-code">
        <div class="cr-code__dots">
          <span></span><span></span><span></span>
          <span class="cr-code__file">terminal</span>
        </div>
        <pre class="cr-code__body">./generate-audio.sh public/lessons/deutsch/portugiesisch/01-basics/</pre>
      </div>
    </section>

    <!-- ══ FINAL CTA ══ -->
    <section class="cr-final">
      <div class="cr-final__aurora" aria-hidden="true"></div>
      <h2 class="cr-final__title">{{ t('ctaTitle') }}</h2>
      <p class="cr-final__lead">{{ t('ctaDesc') }}</p>
      <div class="cr-final__cta">
        <a href="https://github.com/openlearnapp/openlearnapp.github.io"
           target="_blank" rel="noopener"
           class="cr-btn cr-btn--primary">
          {{ t('viewOnGitHub') }}
        </a>
        <a href="https://github.com/openlearnapp/openlearnapp.github.io/tree/main/docs"
           target="_blank" rel="noopener"
           class="cr-btn cr-btn--ghost">
          {{ t('fullDocs') }}
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLanguage } from '../composables/useLanguage'

const emit = defineEmits(['update-title'])
const { selectedLanguage } = useLanguage()
const { locale } = useI18n()

// Robust DE-Check: works even if user lands on /creators without picking a learning language first.
// vue-i18n locale ('de'/'en'/'fa'/'ar') is always set; selectedLanguage may be null on first visit.
const isDE = computed(() => locale.value === 'de' || selectedLanguage.value === 'deutsch')
const currentLang = computed(() => selectedLanguage.value || (locale.value === 'de' ? 'deutsch' : 'english'))

emit('update-title', isDE.value ? 'Workshop erstellen' : 'Create a Workshop')

function t(key) {
  const strings = {
    title: isDE.value ? 'Erstelle und teile deinen eigenen Workshop' : 'Build and share your own workshop',
    intro: isDE.value
      ? 'Mit Open Learn kann jeder Lernmaterial bauen — gratis oder bezahlt. Workshops sind YAML-Dateien, keine Code-Kenntnisse nötig. Hoste sie kostenlos, teile sie mit einem Link.'
      : 'With Open Learn anyone can build learning content — free or paid. Workshops are YAML files, no coding required. Host them for free, share with a link.',
    howItWorks: isDE.value ? 'In 3 Schritten zum eigenen Workshop' : '3 steps to your own workshop',
    structureTitle: isDE.value ? 'Ordnerstruktur' : 'Folder structure',
    structureDesc: isDE.value
      ? 'Ein Workshop ist ein Ordner mit YAML-Dateien. Sprache → Workshop → Lektionen.'
      : 'A workshop is a folder of YAML files. Language → Workshop → Lessons.',
    lessonTitle: isDE.value ? 'Lektion schreiben' : 'Writing a lesson',
    lessonDesc: isDE.value
      ? 'Jede Lektion ist eine content.yaml. Sektionen mit Markdown-Erklärungen, Videos, Beispielen und Aufgaben.'
      : 'Each lesson is a content.yaml. Sections with markdown explanations, videos, examples and assessments.',
    assessmentsTitle: isDE.value ? 'Aufgabentypen' : 'Assessment types',
    assessmentsDesc: isDE.value
      ? '4 Aufgabentypen — von einfachen Karteikarten bis Multiple-Choice.'
      : '4 assessment types — from simple flashcards to multiple choice.',
    hostingTitle: isDE.value ? 'Hosting & Veröffentlichung' : 'Hosting & publishing',
    shareTitle: isDE.value ? 'Workshop teilen' : 'Share your workshop',
    shareDesc: isDE.value
      ? 'Lernende fügen deinen Workshop mit einem einzigen Link hinzu — Open Learn registriert die Quelle automatisch.'
      : 'Learners add your workshop with a single link — Open Learn registers the source automatically.',
    audioTitle: isDE.value ? 'Audio generieren' : 'Generate audio',
    audioDesc: isDE.value
      ? 'Automatische Audio-Dateien aus deinen Lektionen — für Sprach-Workshops besonders praktisch.'
      : 'Automatic audio files from your lessons — handy for language workshops.',
    ctaTitle: isDE.value ? 'Bereit loszulegen?' : 'Ready to get started?',
    ctaDesc: isDE.value
      ? 'Schau dir den Quellcode an oder lies die vollständige Dokumentation.'
      : 'Check the source or read the full docs.',
    viewOnGitHub: isDE.value ? 'Auf GitHub ansehen' : 'View on GitHub',
    fullDocs: isDE.value ? 'Dokumentation lesen' : 'Read the docs',
  }
  return strings[key] || key
}

const creatorSteps = computed(() => isDE.value ? [
  { title: 'YAML schreiben', desc: 'Lektionen mit Fragen, Antworten, Erklärungen und Videos in einfachen YAML-Dateien.' },
  { title: 'Kostenlos hosten', desc: 'GitHub Pages, IPFS oder jeder beliebige statische Webserver.' },
  { title: 'Link teilen', desc: 'Lernende klicken — dein Workshop erscheint sofort in Open Learn.' },
] : [
  { title: 'Write YAML', desc: 'Lessons with questions, answers, explanations and videos as YAML files.' },
  { title: 'Host for free', desc: 'GitHub Pages, IPFS or any static web server.' },
  { title: 'Share a link', desc: 'Learners click — your workshop appears in Open Learn instantly.' },
])

const assessmentTypes = computed(() => isDE.value ? [
  { key: 'qa', title: 'Frage & Antwort (Standard)', desc: 'Klassische Karteikarten — Frage anzeigen, Antwort aufdecken.', yaml: '- q: "Wie heißt du?"\n  a: "What is your name?"' },
  { key: 'input', title: 'Freitext-Eingabe', desc: 'Lernende tippen ihre Antwort. Mehrere akzeptierte Antworten möglich.', yaml: '- type: input\n  q: "Übersetze: Guten Morgen"\n  a: "Good morning"' },
  { key: 'select', title: 'Single-Select', desc: 'Radio-Buttons — genau eine richtige Antwort.', yaml: '- type: select\n  q: "Hauptstadt von Frankreich?"\n  options:\n    - text: "Berlin"\n    - text: "Paris"\n      correct: true' },
  { key: 'mc', title: 'Multiple-Choice', desc: 'Checkboxen — mehrere richtige Antworten möglich.', yaml: '- type: multiple-choice\n  q: "Welche sind Primzahlen?"\n  options:\n    - text: "2"\n      correct: true\n    - text: "4"\n    - text: "7"\n      correct: true' },
] : [
  { key: 'qa', title: 'Q&A (Default)', desc: 'Classic flashcards — show question, reveal answer.', yaml: '- q: "What is your name?"\n  a: "Wie heißt du?"' },
  { key: 'input', title: 'Free-text input', desc: 'Learners type their answer. Supports multiple accepted answers.', yaml: '- type: input\n  q: "Translate: Good morning"\n  a: "Guten Morgen"' },
  { key: 'select', title: 'Single Select', desc: 'Radio buttons — exactly one correct answer.', yaml: '- type: select\n  q: "Capital of France?"\n  options:\n    - text: "Berlin"\n    - text: "Paris"\n      correct: true' },
  { key: 'mc', title: 'Multiple Choice', desc: 'Checkboxes — multiple correct answers possible.', yaml: '- type: multiple-choice\n  q: "Which are prime numbers?"\n  options:\n    - text: "2"\n      correct: true\n    - text: "4"\n    - text: "7"\n      correct: true' },
])

const IconPackage = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('path', { d: 'M16.5 9.4 7.55 4.24' }),
  h('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
  h('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }),
  h('line', { x1: '12', y1: '22.08', x2: '12', y2: '12' }),
])
const IconGlobe = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('circle', { cx: '12', cy: '12', r: '10' }),
  h('line', { x1: '2', y1: '12', x2: '22', y2: '12' }),
  h('path', { d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' }),
])
const IconServer = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
  h('rect', { x: '2', y: '2', width: '20', height: '8', rx: '2', ry: '2' }),
  h('rect', { x: '2', y: '14', width: '20', height: '8', rx: '2', ry: '2' }),
  h('line', { x1: '6', y1: '6', x2: '6.01', y2: '6' }),
  h('line', { x1: '6', y1: '18', x2: '6.01', y2: '18' }),
])

const hostingOptions = computed(() => isDE.value ? [
  { key: 'gh', icon: IconPackage, title: 'GitHub Pages', desc: 'Kostenlos. Push dein Repo, aktiviere Pages — fertig.' },
  { key: 'ipfs', icon: IconGlobe, title: 'IPFS', desc: 'Dezentral, zensurresistent. Open Learn unterstützt ipfs:// nativ.' },
  { key: 'any', icon: IconServer, title: 'Jeder Webserver', desc: 'Netlify, Vercel, eigener Server — jeder statische Host funktioniert.' },
] : [
  { key: 'gh', icon: IconPackage, title: 'GitHub Pages', desc: 'Free. Push your repo, enable Pages — done.' },
  { key: 'ipfs', icon: IconGlobe, title: 'IPFS', desc: 'Decentralized, censorship-resistant. Native ipfs:// support.' },
  { key: 'any', icon: IconServer, title: 'Any web server', desc: 'Netlify, Vercel, your own server — any static host works.' },
])

const folderStructure = `your-workshop/
├── index.yaml              # Sprachen die der Workshop unterstützt
├── deutsch/
│   ├── workshops.yaml      # Name, Beschreibung, Premium-Config
│   └── mein-workshop/
│       ├── lessons.yaml    # Liste der Lektions-Ordner
│       ├── 01-basics/
│       │   ├── content.yaml
│       │   └── audio/      # Optionale MP3-Dateien
│       └── 02-advanced/
│           └── content.yaml
└── english/
    ├── workshops.yaml
    └── my-workshop/
        ├── lessons.yaml
        └── ...`

const lessonExample = `number: 1
title: "The Basics"
description: "Learn the fundamentals"
sections:
  - title: "Introduction"
    explanation: |
      Welcome! This section covers **the basics**.
      - Point one
      - Point two
    video: "https://youtube.com/watch?v=abc123"
    examples:
      - q: "What is 2 + 2?"
        a: "4"
      - type: select
        q: "Capital of France?"
        options:
          - text: "Berlin"
          - text: "Paris"
            correct: true`
</script>

<style scoped>
.creators-page {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding-bottom: 3rem;
}

/* ── HERO ── */
.cr-hero {
  position: relative;
  overflow: hidden;
  border-radius: 1.6rem;
  padding: 3rem 2rem 3.2rem 2rem;
  color: #fff;
  background: linear-gradient(140deg, #0a0e22 0%, #1a1140 55%, #0a0e22 100%);
  border: 1px solid rgba(124, 58, 237, 0.4);
  box-shadow: 0 30px 70px -32px rgba(124, 58, 237, 0.8);
  isolation: isolate;
}
.cr-hero__aurora {
  position: absolute;
  inset: -30%;
  background:
    radial-gradient(40% 50% at 15% 25%, rgba(124, 58, 237, 0.6), transparent 70%),
    radial-gradient(38% 50% at 85% 75%, rgba(167, 139, 250, 0.45), transparent 72%),
    radial-gradient(28% 38% at 65% 18%, rgba(34, 211, 238, 0.5), transparent 70%);
  filter: blur(38px);
  animation: crAurora 22s ease-in-out infinite alternate;
  z-index: 0;
}
.cr-hero__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 28px 28px;
  mask: linear-gradient(170deg, rgba(0,0,0,0.5) 0%, transparent 75%);
  z-index: 0;
}
.cr-hero__particles {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.cr-hero__particles span {
  position: absolute;
  width: 4px; height: 4px;
  border-radius: 50%;
  background: #c4b5fd;
  opacity: 0.7;
  animation: crFloat 9s ease-in-out infinite;
}
.cr-hero__particles span:nth-child(1) { top: 22%; left: 10%; animation-delay: 0s; }
.cr-hero__particles span:nth-child(2) { top: 42%; left: 28%; animation-delay: 1.2s; }
.cr-hero__particles span:nth-child(3) { top: 70%; left: 22%; animation-delay: 2.4s; }
.cr-hero__particles span:nth-child(4) { top: 28%; left: 78%; animation-delay: 0.8s; }
.cr-hero__particles span:nth-child(5) { top: 60%; left: 85%; animation-delay: 1.8s; }
.cr-hero__particles span:nth-child(6) { top: 82%; left: 60%; animation-delay: 3.0s; }

.cr-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 720px;
}
.cr-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.32rem 0.75rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.92);
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  backdrop-filter: blur(8px);
  margin-bottom: 1rem;
}
.cr-badge__dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #a78bfa;
  box-shadow: 0 0 8px #a78bfa;
  animation: crBlink 1.6s ease-in-out infinite;
}
.cr-badge--premium {
  color: #fff;
  background: linear-gradient(120deg, #7c3aed, #a78bfa, #22d3ee, #7c3aed);
  background-size: 300% 100%;
  animation: crShift 7s ease-in-out infinite;
  border: none;
  box-shadow: 0 6px 18px -6px rgba(124, 58, 237, 0.8);
}
.cr-hero__title {
  font-size: clamp(1.7rem, 3vw, 2.4rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.01em;
  margin: 0 0 0.6rem 0;
  background: linear-gradient(120deg, #fff 30%, #d8b4fe 60%, #67e8f9);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.cr-hero__lead {
  margin: 0 0 1.4rem 0;
  font-size: 1.02rem;
  line-height: 1.55;
  color: rgba(255,255,255,0.82);
  max-width: 60ch;
}
.cr-hero__cta { display: flex; flex-wrap: wrap; gap: 0.75rem; position: relative; z-index: 1; }

/* ── BUTTONS ── */
.cr-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.2rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.92rem;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.cr-btn--primary {
  color: #fff;
  background: linear-gradient(120deg, #7c3aed, #a78bfa);
  box-shadow: 0 12px 26px -10px rgba(124, 58, 237, 0.9);
}
.cr-btn--primary:hover { transform: translateY(-1px) scale(1.02); }
.cr-btn--ghost {
  color: rgba(255,255,255,0.92);
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  backdrop-filter: blur(8px);
}
.cr-btn--ghost:hover { background: rgba(255,255,255,0.14); }

/* ── SECTIONS ── */
.cr-section {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.cr-h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: hsl(var(--foreground));
  margin: 0;
  letter-spacing: -0.005em;
}
.cr-lead {
  margin: 0 0 0.4rem 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: hsl(var(--muted-foreground));
  max-width: 70ch;
}

/* ── 3 STEPS ── */
.cr-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}
.cr-step {
  position: relative;
  padding: 1.3rem 1.2rem 1.1rem 1.2rem;
  border-radius: 1rem;
  background: linear-gradient(150deg, rgba(124, 58, 237, 0.06), transparent 70%), hsl(var(--card));
  border: 1px solid hsl(var(--border));
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.cr-step:hover {
  border-color: rgba(124, 58, 237, 0.35);
  transform: translateY(-2px);
}
.cr-step__num {
  width: 32px; height: 32px;
  border-radius: 9px;
  display: grid; place-items: center;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  box-shadow: 0 6px 14px -4px rgba(124, 58, 237, 0.7),
              inset 0 0 0 1px rgba(255,255,255,0.18);
  margin-bottom: 0.7rem;
}
.cr-step__title {
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 0.25rem;
}
.cr-step__desc {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
}

/* ── CODE BOX ── */
.cr-code {
  background: rgba(8, 12, 28, 0.92);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0.85rem;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  box-shadow: 0 12px 28px -14px rgba(0,0,0,0.55);
}
.cr-code__dots {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.85rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.cr-code__dots span:not(.cr-code__file) {
  width: 10px; height: 10px; border-radius: 50%;
}
.cr-code__dots span:nth-child(1) { background: #ef4444; }
.cr-code__dots span:nth-child(2) { background: #f59e0b; }
.cr-code__dots span:nth-child(3) { background: #10b981; }
.cr-code__file {
  margin-left: auto;
  font-size: 0.72rem;
  color: rgba(255,255,255,0.5);
}
.cr-code__body {
  margin: 0;
  padding: 0.85rem 1rem;
  color: rgba(255,255,255,0.88);
  white-space: pre;
  overflow-x: auto;
}
.cr-code__body .hl-key { color: #a78bfa; }
.cr-code__body .hl-val { color: #67e8f9; }
.cr-code__body .hl-num { color: #facc15; }
.cr-code__body .hl-bool { color: #f472b6; }
.cr-code__body .hl-comment { color: rgba(255,255,255,0.4); font-style: italic; }

/* ── PREMIUM SECTION ── */
.cr-premium {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  border-radius: 1.6rem;
  padding: 2.4rem 2rem 2.2rem 2rem;
  background: linear-gradient(140deg, #0a0e22 0%, #1a1140 55%, #0a0e22 100%);
  border: 1px solid rgba(124, 58, 237, 0.4);
  box-shadow: 0 30px 70px -32px rgba(124, 58, 237, 0.85);
  color: #fff;
}
.cr-premium__aurora {
  position: absolute;
  inset: -30%;
  background:
    radial-gradient(40% 50% at 15% 25%, rgba(124, 58, 237, 0.55), transparent 70%),
    radial-gradient(38% 50% at 85% 75%, rgba(167, 139, 250, 0.42), transparent 72%),
    radial-gradient(28% 38% at 65% 18%, rgba(34, 211, 238, 0.45), transparent 70%);
  filter: blur(38px);
  animation: crAurora 22s ease-in-out infinite alternate;
  z-index: 0;
}
.cr-premium__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 28px 28px;
  mask: linear-gradient(170deg, rgba(0,0,0,0.45) 0%, transparent 75%);
  z-index: 0;
}
.cr-premium__head { position: relative; z-index: 1; }
.cr-premium__title {
  font-size: clamp(1.4rem, 2.4vw, 1.9rem);
  font-weight: 800;
  line-height: 1.2;
  margin: 0.6rem 0 0.5rem 0;
  background: linear-gradient(120deg, #fff 30%, #d8b4fe 60%, #67e8f9);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.cr-premium__lead {
  margin: 0 0 1.4rem 0;
  font-size: 0.96rem;
  line-height: 1.55;
  color: rgba(255,255,255,0.78);
  max-width: 70ch;
}
.cr-premium__cols {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 1.5rem;
}
@media (max-width: 720px) {
  .cr-premium__cols { grid-template-columns: 1fr; }
}
.cr-premium__features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.cr-premium__features li {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.cr-premium__check {
  flex-shrink: 0;
  width: 26px; height: 26px;
  border-radius: 8px;
  display: grid; place-items: center;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  box-shadow: 0 4px 12px -4px rgba(124, 58, 237, 0.7),
              inset 0 0 0 1px rgba(255,255,255,0.18);
}
.cr-premium__features strong {
  display: block;
  font-size: 0.95rem;
  color: #fff;
  margin-bottom: 0.15rem;
}
.cr-premium__features p {
  margin: 0;
  font-size: 0.83rem;
  line-height: 1.45;
  color: rgba(255,255,255,0.72);
}
.cr-code--premium {
  background: rgba(6, 10, 24, 0.92);
}
.cr-premium__cta {
  position: relative;
  z-index: 1;
  margin-top: 1.6rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* ── ASSESSMENTS ── */
.cr-assess {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.9rem;
}
.cr-assess__item {
  padding: 1rem;
  border-radius: 0.9rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
}
.cr-assess__title {
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 0.25rem;
}
.cr-assess__desc {
  margin: 0 0 0.55rem 0;
  font-size: 0.83rem;
  line-height: 1.45;
  color: hsl(var(--muted-foreground));
}
.cr-assess__yaml {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.74rem;
  background: rgba(8, 12, 28, 0.85);
  color: rgba(255,255,255,0.88);
  padding: 0.6rem 0.75rem;
  border-radius: 0.55rem;
  overflow-x: auto;
  white-space: pre;
}

/* ── HOSTING ── */
.cr-hosting {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.9rem;
}
.cr-hosting__item {
  padding: 1.1rem 1rem 1rem 1rem;
  border-radius: 0.9rem;
  background: linear-gradient(150deg, rgba(124, 58, 237, 0.05), transparent 70%), hsl(var(--card));
  border: 1px solid hsl(var(--border));
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.cr-hosting__item:hover {
  border-color: rgba(124, 58, 237, 0.35);
  transform: translateY(-2px);
}
.cr-hosting__icon {
  width: 22px; height: 22px;
  color: #a78bfa;
  margin-bottom: 0.45rem;
}
.cr-hosting__name {
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 0.25rem;
}
.cr-hosting__desc {
  margin: 0;
  font-size: 0.83rem;
  line-height: 1.45;
  color: hsl(var(--muted-foreground));
}

/* ── FINAL CTA ── */
.cr-final {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: 2rem;
  border-radius: 1.4rem;
  text-align: center;
  background: linear-gradient(140deg, #0a0e22 0%, #1a1140 55%, #0a0e22 100%);
  border: 1px solid rgba(124, 58, 237, 0.35);
  color: #fff;
}
.cr-final__aurora {
  position: absolute;
  inset: -30%;
  background:
    radial-gradient(40% 50% at 20% 30%, rgba(124, 58, 237, 0.45), transparent 70%),
    radial-gradient(35% 50% at 80% 70%, rgba(167, 139, 250, 0.38), transparent 72%);
  filter: blur(36px);
  animation: crAurora 22s ease-in-out infinite alternate;
  z-index: 0;
}
.cr-final__title {
  position: relative;
  z-index: 1;
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 0.4rem 0;
  background: linear-gradient(120deg, #fff 30%, #d8b4fe 70%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.cr-final__lead {
  position: relative;
  z-index: 1;
  margin: 0 0 1rem 0;
  color: rgba(255,255,255,0.8);
  font-size: 0.95rem;
}
.cr-final__cta {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

/* ── ANIMATIONS ── */
@keyframes crAurora {
  0% { transform: translate3d(-3%, -3%, 0) rotate(0deg); }
  100% { transform: translate3d(3%, 4%, 0) rotate(6deg); }
}
@keyframes crShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes crBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes crFloat {
  0%, 100% { transform: translateY(0); opacity: 0.7; }
  50% { transform: translateY(-12px); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .cr-hero__aurora,
  .cr-hero__particles span,
  .cr-premium__aurora,
  .cr-final__aurora,
  .cr-badge--premium,
  .cr-badge__dot { animation: none; }
}
</style>
