# Story Mode Redesign mit pretext

**Issue: [#156](https://github.com/openlearnapp/openlearnapp.github.io/issues/156)**

## Problem

Der aktuelle Story Mode hat ein fixes Layout: schwarzer Hintergrund, Bild oben, Narrations-Text als Overlay unten. Das funktioniert für kurze Sätze, aber:

- Längere Texte werden abgeschnitten oder schwer lesbar
- Text und Bild leben getrennt voneinander (Bild oben, Text unten)
- Es fehlt die Atmosphäre eines Kinderbuchs
- Der Mila-Workshop hat nur sehr kurze Sätze — kein Raum für echte Geschichten

## Ziel

Story Mode soll sich anfühlen wie ein **interaktives Bilderbuch**: Text und Bilder arbeiten zusammen, Seiten haben ein schönes Buch-Layout, längere Texte fließen natürlich.

## Lösung

### 1. pretext für Text-Layout

[`@chenglou/pretext`](https://github.com/chenglou/pretext) misst Text-Dimensionen ohne DOM-Reflow (300x schneller). Damit können wir:

- **Berechnen wie viel Text auf eine "Seite" passt** — Seitenumbrüche wie in einem Buch
- **Text-Größe dynamisch anpassen** — passend zum verfügbaren Platz neben Bildern
- **Saubere Zeilenumbrüche** — kein abgeschnittener Text, kein Overflow

**Integration:**
```js
import { prepare, layout } from '@chenglou/pretext'

// Text vorbereiten (einmalig pro Textblock)
const handle = prepare(text, { font: '18px serif', lineHeight: 28 })

// Layout berechnen für verfügbare Breite
const { height, lineCount } = layout(handle, containerWidth)
```

### 2. Buch-Layout für Story Mode

**Aktuell:** Fullscreen schwarz → Bild → Text-Overlay unten
**Neu:** Buch-Seiten mit Text und Bild nebeneinander oder übereinander

**Layout-Varianten:**

| Variante | Wann | Beschreibung |
|----------|------|--------------|
| **Bild + Text** | Section hat Bild + kurzen Text | Bild oben (60%), Text unten (40%) |
| **Vollbild-Text** | Langer Text ohne Bild | Seitenweise Text auf warmem Hintergrund, Buch-Schrift |
| **Vollbild-Bild** | Bild ohne Text (Stimmungsbild) | Wie bisher, Bild füllt Bildschirm |
| **Text um Bild** | Langer Text + kleines Bild | Text fließt um das Bild herum |

**Design-Prinzipien:**
- Warmer Hintergrund statt reines Schwarz (z.B. `#1a1a2e` oder Sepia-Töne)
- Serif-Schrift für Fließtext (Buch-Gefühl)
- Sanfte Seitenübergänge (Fade oder Slide)
- Große, lesbare Schrift (min. 18px)

### 3. Mila-Workshop erweitern

Der aktuelle Workshop hat 3 Lektionen mit je 2-5 kurzen Sätzen. Erweiterung:

- **Längere Erzähltexte** pro Section (3-5 Absätze statt 1-3 Sätze)
- **Mehr Sections** pro Lektion
- **Mehr Bilder** (verschiedene Szenen)
- **Neue Lektionen** (4-5 statt 3)

Beispiel für einen längeren Erzähltext:
```yaml
- q: |
    Mila stand am Rande des Waldes und schaute hinein.
    Die Bäume waren so hoch, dass sie den Himmel kaum sehen konnte.
    Überall war es still — nur das Rascheln der Blätter war zu hören.
    Ein schmaler Pfad führte zwischen den Stämmen hindurch,
    bedeckt mit weichem Moos und bunten Herbstblättern.
  voice: narrator
```

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/views/StoryView.vue` | Layout-System mit pretext, Buch-Design |
| `public/workshop-milas-abenteuer/` | Erweiterte Inhalte |
| `package.json` | `@chenglou/pretext` hinzufügen |

## Phasen

1. **Spec** — dieses Dokument
2. **pretext installieren + Text-Layout-Composable** — `useTextLayout()` mit prepare/layout
3. **Buch-Layout in StoryView** — neue Layout-Varianten, warmer Hintergrund, Serif-Schrift
4. **Mila-Workshop erweitern** — längere Texte, mehr Lektionen, neue Bilder
5. **Testen** — Desktop + Mobile, verschiedene Textlängen
