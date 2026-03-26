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
- Kompakte Karte (eine Zeile): Thumbnail links, Titel + Beschreibung rechts
- Props: `lesson`, `status`, `isFavorite`, `isNext`
- Status-Indikator: Kein Icon (offen), Punkt (besucht), Häkchen (erledigt)
- Favorit-Toggle: Stern-Icon
- Erledigt-Toggle: Checkbox/Button
- "Nächste Lektion" Variante: farbiger Rahmen, "Weiterlernen"-Label
- Erledigte Karten: leicht abgeblendet (opacity)

### Schritt 3: LearningPath + LessonsOverview Umbau

**LearningPath.vue:**
- Vertikale Linie (CSS) mit Knotenpunkten pro Lektion
- Linie immer links, Karten immer rechts — auf allen Bildschirmgrößen gleich
- Erledigte Pfad-Abschnitte: ausgefüllte Linie (primary, sanfter Gradient)
- Offene Abschnitte: gestrichelte graue Linie
- Knotenpunkte: Kreis mit Status-Farbe (grau/blau/grün)

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
