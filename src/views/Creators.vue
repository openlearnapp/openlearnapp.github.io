<template>
  <div>
    <!-- Intro -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold mb-2 text-foreground">{{ t('title') }}</h2>
      <p class="text-muted-foreground leading-relaxed">{{ t('intro') }}</p>
    </div>

    <!-- How it works -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-foreground mb-4">{{ t('howItWorks') }}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div v-for="(step, i) in creatorSteps" :key="i" class="text-center p-4">
          <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
            {{ i + 1 }}
          </div>
          <div class="text-sm font-medium text-foreground mb-1">{{ step.title }}</div>
          <div class="text-xs text-muted-foreground">{{ step.desc }}</div>
        </div>
      </div>
    </div>

    <!-- Workshop structure -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-foreground mb-3">{{ t('structureTitle') }}</h3>
      <p class="text-sm text-muted-foreground mb-4">{{ t('structureDesc') }}</p>
      <div class="p-4 rounded-lg bg-accent/30 font-mono text-xs text-muted-foreground leading-relaxed overflow-x-auto">
        <pre class="whitespace-pre">{{ folderStructure }}</pre>
      </div>
    </div>

    <!-- Lesson YAML example -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-foreground mb-3">{{ t('lessonTitle') }}</h3>
      <p class="text-sm text-muted-foreground mb-4">{{ t('lessonDesc') }}</p>
      <div class="p-4 rounded-lg bg-accent/30 font-mono text-xs text-muted-foreground leading-relaxed overflow-x-auto">
        <pre class="whitespace-pre">{{ lessonExample }}</pre>
      </div>
    </div>

    <!-- Assessment types -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-foreground mb-3">{{ t('assessmentsTitle') }}</h3>
      <p class="text-sm text-muted-foreground mb-4">{{ t('assessmentsDesc') }}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div v-for="type in assessmentTypes" :key="type.key" class="p-3 rounded-lg border border-border">
          <div class="text-sm font-medium text-foreground mb-1">{{ type.title }}</div>
          <p class="text-xs text-muted-foreground mb-2">{{ type.desc }}</p>
          <div class="p-2 rounded bg-accent/30 font-mono text-xs text-muted-foreground">
            <pre class="whitespace-pre">{{ type.yaml }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Hosting & sharing -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-foreground mb-3">{{ t('hostingTitle') }}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div v-for="option in hostingOptions" :key="option.key" class="p-3 rounded-lg bg-accent/20">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-base">{{ option.icon }}</span>
            <span class="text-sm font-medium text-foreground">{{ option.title }}</span>
          </div>
          <p class="text-xs text-muted-foreground">{{ option.desc }}</p>
        </div>
      </div>
    </div>

    <!-- Share link -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-foreground mb-3">{{ t('shareTitle') }}</h3>
      <p class="text-sm text-muted-foreground mb-3">{{ t('shareDesc') }}</p>
      <div class="p-3 rounded-lg bg-accent/30 font-mono text-xs text-muted-foreground break-all">
        https://open-learn.app/#/add?source=https://YOUR-USER.github.io/YOUR-REPO/index.yaml
      </div>
    </div>

    <!-- Audio generation -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-foreground mb-3">{{ t('audioTitle') }}</h3>
      <p class="text-sm text-muted-foreground mb-3">{{ t('audioDesc') }}</p>
      <div class="p-3 rounded-lg bg-accent/30 font-mono text-xs text-muted-foreground">
        ./generate-audio.sh public/lessons/deutsch/portugiesisch/01-basics/
      </div>
    </div>

    <!-- CTA -->
    <div class="p-5 rounded-lg border border-primary/20 bg-primary/5 text-center">
      <h3 class="text-lg font-semibold text-foreground mb-2">{{ t('ctaTitle') }}</h3>
      <p class="text-sm text-muted-foreground mb-4">{{ t('ctaDesc') }}</p>
      <div class="flex flex-wrap justify-center gap-3">
        <a href="https://github.com/openlearnapp/openlearnapp.github.io"
          target="_blank" rel="noopener"
          class="inline-block px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition">
          {{ t('viewOnGitHub') }}
        </a>
        <a href="https://github.com/openlearnapp/openlearnapp.github.io/tree/main/docs"
          target="_blank" rel="noopener"
          class="inline-block px-5 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition">
          {{ t('fullDocs') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLanguage } from '../composables/useLanguage'

const emit = defineEmits(['update-title'])
const { selectedLanguage } = useLanguage()

const isDE = computed(() => selectedLanguage.value === 'deutsch')

emit('update-title', isDE.value ? 'Workshop erstellen' : 'Create a Workshop')

function t(key) {
  const strings = {
    title: isDE.value ? 'Eigenen Workshop erstellen' : 'Create Your Own Workshop',
    intro: isDE.value
      ? 'Mit Open Learn kann jeder Lernmaterial erstellen und teilen. Workshops werden in einfachem YAML geschrieben — kein Programmieren nötig. Hoste sie kostenlos auf GitHub Pages und teile sie mit einem Link.'
      : 'Anyone can create and share learning content with Open Learn. Workshops are written in simple YAML — no coding required. Host them for free on GitHub Pages and share with a link.',
    howItWorks: isDE.value ? 'In 3 Schritten zum eigenen Workshop' : '3 Steps to Your Own Workshop',
    structureTitle: isDE.value ? 'Ordnerstruktur' : 'Folder Structure',
    structureDesc: isDE.value
      ? 'Ein Workshop ist ein Ordner mit YAML-Dateien. Die Struktur ist einfach: Sprache → Workshop → Lektionen.'
      : 'A workshop is a folder with YAML files. The structure is simple: Language → Workshop → Lessons.',
    lessonTitle: isDE.value ? 'Lektion schreiben' : 'Writing a Lesson',
    lessonDesc: isDE.value
      ? 'Jede Lektion ist eine content.yaml-Datei mit Sektionen und Beispielen. Sektionen können Erklärungen (Markdown), Videos und verschiedene Aufgabentypen enthalten.'
      : 'Each lesson is a content.yaml file with sections and examples. Sections can include explanations (Markdown), videos, and various assessment types.',
    assessmentsTitle: isDE.value ? 'Aufgabentypen' : 'Assessment Types',
    assessmentsDesc: isDE.value
      ? 'Open Learn unterstützt 4 Aufgabentypen — von einfachen Karteikarten bis zu Multiple-Choice-Fragen.'
      : 'Open Learn supports 4 assessment types — from simple flashcards to multiple-choice questions.',
    hostingTitle: isDE.value ? 'Hosting & Veröffentlichung' : 'Hosting & Publishing',
    shareTitle: isDE.value ? 'Workshop teilen' : 'Share Your Workshop',
    shareDesc: isDE.value
      ? 'Lernende fügen deinen Workshop mit einem einzigen Link hinzu. Der Link öffnet Open Learn und registriert deine Inhaltsquelle automatisch:'
      : 'Learners add your workshop with a single link. The link opens Open Learn and registers your content source automatically:',
    audioTitle: isDE.value ? 'Audio generieren' : 'Generate Audio',
    audioDesc: isDE.value
      ? 'Für Sprach-Workshops kannst du automatisch Audio-Dateien aus deinen Lektionen generieren:'
      : 'For language workshops, you can automatically generate audio files from your lessons:',
    ctaTitle: isDE.value ? 'Bereit loszulegen?' : 'Ready to get started?',
    ctaDesc: isDE.value
      ? 'Schau dir den Quellcode an oder lies die vollständige Dokumentation.'
      : 'Check out the source code or read the full documentation.',
    viewOnGitHub: isDE.value ? 'Auf GitHub ansehen' : 'View on GitHub',
    fullDocs: isDE.value ? 'Dokumentation lesen' : 'Read the Docs',
  }
  return strings[key] || key
}

const creatorSteps = computed(() => isDE.value ? [
  { title: 'YAML schreiben', desc: 'Erstelle Lektionen mit Fragen, Antworten, Erklärungen und Videos in einfachen YAML-Dateien.' },
  { title: 'Kostenlos hosten', desc: 'Lade alles auf GitHub Pages, IPFS oder einen beliebigen Webserver hoch.' },
  { title: 'Link teilen', desc: 'Teile einen Link — Lernende klicken und dein Workshop erscheint in Open Learn.' },
] : [
  { title: 'Write YAML', desc: 'Create lessons with questions, answers, explanations, and videos in simple YAML files.' },
  { title: 'Host for free', desc: 'Push to GitHub Pages, IPFS, or any static web server.' },
  { title: 'Share a link', desc: 'Share a link — learners click and your workshop appears in Open Learn.' },
])

const assessmentTypes = computed(() => isDE.value ? [
  { key: 'qa', title: 'Frage & Antwort (Standard)', desc: 'Klassische Karteikarten — Frage anzeigen, Antwort aufdecken.', yaml: '- q: "Wie heißt du?"\n  a: "What is your name?"' },
  { key: 'input', title: 'Freitext-Eingabe', desc: 'Lernende tippen ihre Antwort ein. Unterstützt mehrere akzeptierte Antworten.', yaml: '- type: input\n  q: "Übersetze: Guten Morgen"\n  a: "Good morning"' },
  { key: 'select', title: 'Single-Select', desc: 'Radio-Buttons — genau eine richtige Antwort.', yaml: '- type: select\n  q: "Hauptstadt von Frankreich?"\n  options:\n    - text: "Berlin"\n    - text: "Paris"\n      correct: true' },
  { key: 'mc', title: 'Multiple-Choice', desc: 'Checkboxen — mehrere richtige Antworten möglich.', yaml: '- type: multiple-choice\n  q: "Welche sind Primzahlen?"\n  options:\n    - text: "2"\n      correct: true\n    - text: "4"\n    - text: "7"\n      correct: true' },
] : [
  { key: 'qa', title: 'Q&A (Default)', desc: 'Classic flashcards — show question, reveal answer.', yaml: '- q: "What is your name?"\n  a: "Wie heißt du?"' },
  { key: 'input', title: 'Free-text Input', desc: 'Learners type their answer. Supports multiple accepted answers.', yaml: '- type: input\n  q: "Translate: Good morning"\n  a: "Guten Morgen"' },
  { key: 'select', title: 'Single Select', desc: 'Radio buttons — exactly one correct answer.', yaml: '- type: select\n  q: "Capital of France?"\n  options:\n    - text: "Berlin"\n    - text: "Paris"\n      correct: true' },
  { key: 'mc', title: 'Multiple Choice', desc: 'Checkboxes — multiple correct answers possible.', yaml: '- type: multiple-choice\n  q: "Which are prime numbers?"\n  options:\n    - text: "2"\n      correct: true\n    - text: "4"\n    - text: "7"\n      correct: true' },
])

const hostingOptions = computed(() => isDE.value ? [
  { key: 'gh', icon: '📦', title: 'GitHub Pages', desc: 'Kostenlos. Push dein Repo, aktiviere Pages — fertig. Am einfachsten.' },
  { key: 'ipfs', icon: '🌐', title: 'IPFS', desc: 'Dezentral und zensurresistent. Open Learn unterstützt ipfs:// URLs nativ.' },
  { key: 'any', icon: '🖥️', title: 'Jeder Webserver', desc: 'Jeder statische Webserver funktioniert — Netlify, Vercel, eigener Server.' },
] : [
  { key: 'gh', icon: '📦', title: 'GitHub Pages', desc: 'Free. Push your repo, enable Pages — done. Easiest option.' },
  { key: 'ipfs', icon: '🌐', title: 'IPFS', desc: 'Decentralized and censorship-resistant. Open Learn supports ipfs:// URLs natively.' },
  { key: 'any', icon: '🖥️', title: 'Any Web Server', desc: 'Any static web server works — Netlify, Vercel, your own server.' },
])

const folderStructure = `your-workshop/
├── index.yaml              # Languages your workshop supports
├── deutsch/
│   ├── workshops.yaml      # Workshop name, description, code
│   └── mein-workshop/
│       ├── lessons.yaml    # List of lesson folders
│       ├── 01-basics/
│       │   ├── content.yaml
│       │   └── audio/      # Optional MP3 files
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
            correct: true
          - text: "Madrid"`
</script>
