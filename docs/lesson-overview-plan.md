# Dev Plan: Lesson Overview — Lernpfad

**Spec:** [specs/lesson-overview.md](../specs/lesson-overview.md)
**Issue:** [#93](https://github.com/openlearnapp/openlearnapp.github.io/issues/93)

## Übersicht

Umbau der Lesson Overview von einem 3-Spalten Grid zu einem vertikalen Lernpfad mit Fortschrittsanzeige, Favoriten und Drag & Drop.

## Abhängigkeiten

### Neue Dependency

- **vuedraggable** (`vuedraggable@next`) — Vue 3 kompatible Drag & Drop Bibliothek, basiert auf SortableJS. Leichtgewichtig (~5 KB gzip), Touch-Support eingebaut. Wird nur für die Favoriten-Sortierung benötigt.

## Dateien die sich ändern

| Datei | Änderung |
|-------|----------|
| `src/views/LessonsOverview.vue` | Kompletter Umbau: Grid → Pfad-Layout |
| `src/composables/useProgress.js` | Erweitern: Lesson-Status + Favoriten |
| `package.json` / `pnpm-lock.yaml` | Neue Dependency: vuedraggable |

### Neue Dateien

| Datei | Zweck |
|-------|-------|
| `src/components/LearningPath.vue` | Pfad-Visualisierung (vertikale Linie + Knotenpunkte) |
| `src/components/LessonCard.vue` | Einzelne Lektionskarte (kompakt, mit Status-Indikator) |
| `src/components/ProgressBar.vue` | Fortschrittsbalken oben auf der Seite |
| `tests/e2e/lesson-overview.spec.js` | E2E Tests für den neuen Lernpfad |

## Bauplan — 4 Schritte

### Schritt 1: useProgress.js erweitern

Neue Funktionen im bestehenden Composable:

```js
// Lesson-Status: 'visited' oder 'completed'
function setLessonStatus(learning, workshop, lessonNumber, status)
function getLessonStatus(learning, workshop, lessonNumber)
function isLessonCompleted(learning, workshop, lessonNumber)

// Favoriten
function toggleFavorite(learning, workshop, lessonNumber)
function getFavorites(learning, workshop)
function reorderFavorites(learning, workshop, orderedNumbers)

// Fortschritt
function getCompletionCount(learning, workshop, totalLessons)
```

Datenstruktur in localStorage:

```json
{
  "lessonProgress": {
    "deutsch:portugiesisch": {
      "status": { "1": "completed", "2": "visited", "3": "completed" },
      "favorites": [4, 7, 9]
    }
  }
}
```

Getrennt von bestehendem `progress` (Item-Level) um keine Migration zu brauchen.

**Testen:** Unit-Tests für alle neuen Funktionen.

### Schritt 2: ProgressBar + LessonCard Komponenten

**ProgressBar.vue:**
- Zeigt "X/Y Lektionen erledigt" mit visueller Leiste
- Props: `completed` (number), `total` (number)
- Tailwind: `bg-primary` für gefüllten Teil, `bg-muted` für Rest, abgerundete Ecken

**LessonCard.vue:**
- Eigenständige Karte mit Rand und Schatten: `border`, `shadow-md`, `rounded-2xl`
- Layout: Großes Thumbnail links (w-24/w-28, volle Höhe), Titel + Description + Stats Mitte, Buttons rechts
- Explizite Hintergrundfarben: `bg-white` (Light) / `dark:bg-zinc-800/90` (Dark)
- Hover-Effekt: `hover:-translate-y-1 hover:shadow-xl` — Karte hebt sich an
- Zeile 1: Titel (text-base, font-semibold, truncate) + "Continue"-Badge wenn isNext
- Zeile 2: Description (text-sm, line-clamp-2) — jede Karte beschreibt die Lektion
- Zeile 3: Stats kondensiert ("4 Abschnitte · 12 Beispiele · 3 Quizzes") + Audio/Video-Icons
- Zeile 4 (optional): Fortschrittsbalken (h-1.5) wenn Fortschritt vorhanden
- "Nächste Lektion": ring-2 ring-primary/60, border-primary/40, shadow-lg
- Erledigte Karten: grüner Rand (border-green-500/40), grüner Hintergrund (bg-green-50 / dark:bg-green-950/30)
- Aktionen (Stern + Check): **immer sichtbar** bei allen Karten, vertikal rechts gestapelt, kein Hover-Verstecken
- Kein Hover-Effekt auf den Buttons selbst

### Schritt 3: LearningPath + LessonsOverview Umbau

**LearningPath.vue:**
- Vertikale Linie (CSS) mit kompakten Knotenpunkten pro Lektion
- Linie immer links, Karten immer rechts — auf allen Bildschirmgrößen gleich
- Abstände: space-y-6, gap-4
- Node-Dots: w-10 h-10 mit Nummer, Häkchen oder Punkt
- Pfadlinie auf left-5
- Erledigte Pfad-Abschnitte: ausgefüllte Linie (primary, sanfter Gradient)
- Offene Abschnitte: gestrichelte graue Linie

**LessonsOverview.vue Umbau:**
- Grid entfernen → LearningPath einsetzen
- Sortierlogik: Nächste → Favoriten → Offene → Erledigte
- Drag & Drop für Favoriten-Bereich (vuedraggable)
- `setLastVisited` wird beim Öffnen einer Lektion weiterhin gesetzt
- Beim ersten Besuch einer Lektion → automatisch Status "visited"

### Schritt 4: E2E Tests

Neue Tests in `tests/e2e/lesson-overview.spec.js`:

- Lernpfad wird angezeigt (vertikale Darstellung, keine Grid)
- Fortschrittsbalken zeigt "0/N"
- Erste Lektion ist als "Nächste" hervorgehoben
- Lektion als erledigt markieren → Häkchen, Fortschritt aktualisiert
- Favorit setzen → Lektion wandert nach oben
- Nach Reload: Status und Favoriten bleiben erhalten

## Reihenfolge und PRs

| PR | Inhalt | Abhängigkeit |
|----|--------|-------------|
| **PR 1** | useProgress.js Erweiterung + Unit-Tests | Keine |
| **PR 2** | ProgressBar + LessonCard Komponenten | PR 1 |
| **PR 3** | LearningPath + LessonsOverview Umbau + E2E Tests | PR 2 |

Alternativ: Alles in einem PR, wenn die Änderungen überschaubar bleiben.

## Risiken

- **Drag & Drop auf Mobile**: Touch-Events können mit Scroll kollidieren. vuedraggable hat dafür eingebauten Support (long press → drag), muss aber getestet werden.
- **Performance bei vielen Lektionen**: Pfad-Rendering mit 20+ Lektionen testen. CSS-only Lösung (kein Canvas/SVG) sollte performant sein.
- **Bestehende Workshops**: Kein Workshop liefert Lesson-Status — alles startet bei "offen". Kein Breaking Change.
