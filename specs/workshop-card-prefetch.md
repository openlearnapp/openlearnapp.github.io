# Workshop Card Prefetch — Hover Beschleunigt den Klick

**Issue: [#124](https://github.com/openlearnapp/openlearnapp.github.io/issues/124)**

## Zweck

Heute zeigt die App nach dem Klick auf eine Workshop-Karte einen Ladezustand, bis alle Lektionen geladen sind. Bei langsamen Netzen sind das mehrere hundert Millisekunden bis Sekunden gefühlte Wartezeit.

Die Hover-Bewegung der Maus dauert vom Beginn des Hovers bis zum Klick typischerweise 200–500ms. In diesem Fenster lassen sich die Daten **vorab im Hintergrund laden**, sodass der Klick anschließend ohne Verzögerung navigiert.

## Aktueller Zustand

- `WorkshopOverview.vue` rendert ein Grid aus Workshop-Karten.
- `@click="openWorkshop(ws)"` navigiert zur `LessonsOverview`-Route.
- Erst nach der Navigation startet `loadAllLessonsForWorkshop()` — das Lesson-Grid bleibt leer bis die Daten da sind.
- `loadAllLessonsForWorkshop()` ist bereits memoized in `useLessons.js` (siehe `lessonsCache`). Mehrfache Aufrufe für dasselbe Workshop dedupen.

## Neues Verhalten

### Prefetch beim Hover

Sobald der Maus-Cursor über eine Workshop-Karte schwebt, startet im Hintergrund das Laden der Lessons. Die UI ist nicht blockiert — der User kann frei weiterklicken oder weghovern.

- Auslöser: `@pointerenter` auf der Karte
- Aktion: `loadAllLessonsForWorkshop(learning, ws)` (non-blocking)
- Cache: bereits geladen → kein zweiter Request
- Fehler: still verschluckt (`.catch(() => {})`) — Prefetch ist Best-Effort

### Visuelles Feedback (Wow-Effekt)

Drei Karten-Zustände, sichtbar gemacht durch dezente Animationen:

| Status | Auslöser | Visuell |
|---|---|---|
| `idle` | Default | Standard-Karte |
| `loading` | Pointer ist auf Karte, Daten werden geladen | **Shimmer** im Akzent-Balken oben (animierter Glanz von links nach rechts) |
| `ready` | Daten sind im Cache | **Glow-Pulse** am Karten-Rand (Primary-Farbe), 1× kurz aufleuchtend |

Der Übergang `loading → ready` ist die Belohnung: die Karte signalisiert "ich bin bereit, klick mich". Bei warmem Cache (zweites Hover) ist die Karte sofort `ready`, kein Shimmer.

### Mobile-Verhalten

- Touch-Geräte feuern `pointerenter` auch beim Scrollen — das wäre Datenverschwendung.
- Lösung: Prefetch nur wenn `event.pointerType !== 'touch'` (also nur Maus/Pen).
- Mobile-User profitieren beim Klick (durch Cache nach erstem Aufruf), zahlen aber nicht für Hover-Phantome.

### Daten-Schonmodus

Respektiere `navigator.connection`:
- `saveData === true` → kein Prefetch
- `effectiveType` ∈ {`slow-2g`, `2g`} → kein Prefetch

User mit aktivem Datensparen oder schwachem Netz bekommen den klassischen Klick-Pfad ohne Hintergrundlast.

## Erwarteter Effekt

- Desktop-Klick fühlt sich **instant** an, wenn die Hover-Phase ≥ 200ms dauert.
- Bereits geladene Workshops (z.B. nach Rückkehr von einer Lektion) erscheinen sofort als `ready`.
- Keine zusätzlichen Requests bei warmem Cache.
- Keine Mehrlast für Mobile / Daten-Sparmodus.

## Was nicht im Scope ist

- Long-Press auf Mobile als Prefetch-Trigger (zu komplex, geringer Nutzen).
- Cancel laufender Fetches beim Weghovern (Browser dedupliziert ohnehin via Memoization-Cache).
- Prefetch von Bildern / Audio (Issue beschränkt sich auf Lesson-Metadata).
