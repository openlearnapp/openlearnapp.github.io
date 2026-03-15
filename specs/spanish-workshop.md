# Spanish Workshop

## Purpose

Add a bundled Spanish learning workshop available in both the German and English interface languages. Learners can study the most important Spanish words and phrases without leaving the platform.

## What

- 10 lessons covering core vocabulary and expressions in Spanish
- Available under both `deutsch/spanisch` and `english/spanish`
- Full audio: Spanish questions (voice: Mónica, es-ES), answers in the interface language (Anna for German, Samantha for English)
- Workshop thumbnails in SVG format
- Listed in `workshops.yaml` for both interface languages

## What Not

- No assessment types — lessons are Q&A only
- No external hosting — workshop is bundled directly in the platform repo
- No additional interface languages beyond German and English at this time

## Lessons

| # | German folder | English folder | Topic |
|---|---|---|---|
| 1 | `01-begrüssungen` | `01-greetings` | Greetings and politeness |
| 2 | `02-alltagswoerter` | `02-everyday-words` | Everyday words |
| 3 | `03-zahlen-zeit` | `03-numbers-time` | Numbers and time |
| 4 | `04-essen-einkaufen` | `04-food-shopping` | Food and shopping |
| 5 | `05-reisen-orientierung` | `05-travel-directions` | Travel and directions |
| 6 | `06-familie-personen` | `06-family-people` | Family and people |
| 7 | `07-farben-adjektive` | `07-colors-adjectives` | Colors and adjectives |
| 8 | `08-im-restaurant` | `08-at-the-restaurant` | At the restaurant |
| 9 | `09-koerper-gesundheit` | `09-body-health` | Body and health |
| 10 | `10-verben-alltag` | `10-verbs-daily-life` | Verbs and daily life |

## Content Structure

Each lesson follows the standard platform schema:

```yaml
version: 1
number: N
title: "..."
description: "..."
sections:
  - title: "..."
    explanation: |
      ...
    examples:
      - q: "Spanish phrase"
        a: "Translation"
        rel:
          - ["term", "translation", "context"]
```

3 sections per lesson, 5–10 examples per section.

## Audio

Generated with `generate-audio.sh` using macOS `say`:
- Questions (Spanish): voice `Mónica` (es-ES)
- Answers (German interface): voice `Anna` (de-DE)
- Answers (English interface): voice `Samantha` (en-US)

Each lesson folder contains `audio/manifest.yaml` listing all generated MP3 files.

## Files Changed

- `public/lessons/deutsch/workshops.yaml` — add `spanisch` entry
- `public/lessons/english/workshops.yaml` — add `spanish` entry
- `public/lessons/deutsch/spanisch/` — 10 lesson folders with content + audio
- `public/lessons/english/spanish/` — 10 lesson folders with content + audio

## Acceptance Criteria

- [ ] Spanish workshop appears on the workshop selection page in German interface
- [ ] Spanish workshop appears on the workshop selection page in English interface
- [ ] All 10 lessons load and display correctly
- [ ] Audio plays for all lessons in both language versions
- [ ] Thumbnails display correctly on workshop cards
