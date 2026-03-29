# Lesson Overview — Lernpfad

**Issue: [#93](https://github.com/openlearnapp/openlearnapp.github.io/issues/93)**

## Purpose

Die Lesson Overview zeigt dem Lernenden alle Lektionen eines Workshops. Heute ist das ein gleichförmiges Grid ohne Fortschrittsanzeige. Der Lernende sieht nicht, wo er steht und was als Nächstes kommt.

Das Ziel: Die Übersicht wird zum **Lernpfad** — sie zeigt klar den Fortschritt, hebt die nächste Lektion hervor und erlaubt dem Lernenden, seine eigene Reihenfolge zu wählen.

## Aktueller Zustand

- 3-Spalten Grid (Desktop), 1-Spalte (Mobile)
- Jede Karte: Nummer, Titel, Beschreibung, Abschnitt-Anzahl, optional Bild
- Kein Fortschritt sichtbar
- Kein Fokus auf "nächste Lektion"
- `useProgress.js` trackt Items und `lastVisited`, aber kein Lesson-Status

## Neues Verhalten

### 1. Layout: Horizontale Karten mit großem Thumbnail

Weg vom Grid. Jede Lektion ist eine eigenständige Karte mit klarer Trennung vom Hintergrund.

- Großes Thumbnail links (w-24/w-28, volle Höhe der Karte), Titel + Description + Stats in der Mitte, Aktions-Buttons rechts
- Jede Karte hat einen sichtbaren Rand und Schatten (`border`, `shadow-md`) — hebt sich klar vom Hintergrund ab in Light und Dark Mode
- Explizite Hintergrundfarben: `bg-white` (Light) / `bg-zinc-800` (Dark) — kein generisches `bg-card`
- Hover-Effekt auf der ganzen Karte: hebt sich an (`hover:-translate-y-1 hover:shadow-xl`)
- "Nächste Lektion"-Karte mit Primary-Ring und -Schatten
- Description (max 2 Zeilen) sichtbar — jede Karte sagt, was die Lektion beinhaltet
- Stats kondensiert in einer Zeile: "4 Abschnitte · 12 Beispiele · 3 Quizzes"
- Aktionen (Favorit, Erledigt) **immer sichtbar** auf allen Geräten — vertikal gestapelt rechts, kein Hover-Verstecken
- Kein Hover-Effekt auf den Buttons selbst

### 2. Lesson-Status

Jede Lektion hat einen von drei Zuständen:

| Status | Bedeutung | Visuelle Darstellung |
|--------|-----------|---------------------|
| **Offen** | Noch nicht besucht | Normal, kein Indikator |
| **Besucht** | Mindestens einmal geöffnet | Dezenter Indikator (z.B. kleiner Punkt) |
| **Erledigt** | Vom Nutzer manuell markiert | Häkchen-Symbol, grüner Rand und Hintergrund (`bg-green-50` / `dark:bg-green-950/30`) |

**Wichtig:** "Erledigt" wird **nur manuell** vom Nutzer gesetzt — nicht automatisch. Der Nutzer entscheidet selbst, wann eine Lektion für ihn abgeschlossen ist. Das Markieren geschieht direkt in der Übersicht über einen Button/Toggle auf der Karte.

### 3. Nächste Lektion hervorheben

Die Übersicht zeigt die **nächste empfohlene Lektion** prominent oben:

- Wenn noch keine Lektion besucht → Lektion 1
- Wenn Lektionen 1-4 erledigt → Lektion 5 oben
- Wenn Lektionen 1-3 und 5 erledigt, 4 nicht → Lektion 4 oben (erste nicht erledigte)

**Regel:** Die nächste Lektion ist die **niedrigste nicht erledigte Lektion**. Falls der Nutzer Favoriten gesetzt hat, kommen diese zuerst (siehe Abschnitt 5).

Die nächste Lektion bekommt eine visuell hervorgehobene Karte (größer, farbiger Rahmen, "Weiterlernen"-Label).

### 4. Sortierung

Standard-Sortierung der restlichen Lektionen unterhalb der "Nächsten Lektion":

1. **Favorisierte Lektionen** (vom Nutzer priorisiert, in der gewählten Reihenfolge)
2. **Offene/Besuchte Lektionen** (nach Nummer aufsteigend)
3. **Erledigte Lektionen** (nach Nummer aufsteigend, visuell abgeblendet)

### 5. Favoriten / Lernpfad anpassen

Der Nutzer kann Lektionen als Favorit markieren, um seine eigene Lernreihenfolge zu bestimmen.

- Stern-/Herz-Icon auf jeder Karte
- Favorisierte Lektionen erscheinen oben in der Liste (nach der "Nächsten Lektion")
- Reihenfolge der Favoriten: chronologisch nach Zeitpunkt des Favorisierens
- Favoriten werden in localStorage gespeichert

**Beispiel:** Workshop hat 10 Lektionen. Nutzer favorisiert 4, 7, 9.
→ Anzeige: [Nächste: 4] → 7 → 9 → 1, 2, 3, 5, 6, 8, 10

### 6. Kein Locking

Alle Lektionen sind immer frei zugänglich. Es gibt keine Sperren, keine erzwungene Reihenfolge. Der Lernpfad ist ein **Vorschlag**, kein Zwang.

## Was sich NICHT ändert

- Klick auf Karte → öffnet Lektion (wie bisher)
- Workshop-Beschreibung und Source-Anzeige bei Remote-Workshops bleiben
- "Als App installieren"-Button bleibt
- Bestehende Workshops funktionieren ohne Änderung

## Persistenz

Neue Daten in localStorage:

- **Lesson-Status** (besucht/erledigt): Erweiterung von `useProgress.js`
- **Favoriten**: Neues Feld in `useProgress.js`, z.B. `{ "deutsch:portugiesisch": { favorites: [4, 7, 9], completed: [1, 2, 3] } }`
- `lastVisited` existiert bereits und wird weiter genutzt

## Entscheidungen

1. **Grafischer Pfad**: Ja — eine vertikale Linie verbindet die Lektionen visuell. Erledigte Abschnitte der Linie sind farbig ausgefüllt (primary color, sanfter Gradient), offene Abschnitte gestrichelt/grau. An jedem Knotenpunkt sitzt ein Kreis-Indikator (w-10 h-10, offen/besucht/erledigt). Die Linie verläuft durchgehend links, Karten liegen rechts davon — auf allen Bildschirmgrößen gleich. Karten sind eigenständige Elemente mit Rand und Schatten, die sich klar vom Hintergrund abheben. Hover hebt die Karte leicht an. Der Stil ist clean und minimalistisch — keine Spielelemente, sondern ein eleganter visueller Fortschrittsindikator.
2. **Fortschrittsbalken**: Ja — oben auf der Seite wird der Gesamtfortschritt angezeigt (z.B. "4/10 Lektionen erledigt" mit visueller Leiste).
3. **Drag & Drop**: Ja — Favoriten können per Drag & Drop umsortiert werden. Touch-Support (long press → drag) für Mobile. Reihenfolge wird in localStorage gespeichert.

## Abgrenzung

- Kein automatisches Tracking ("Lektion X% abgeschlossen") — nur manuelles Markieren
- Keine Gamification (XP, Badges, Streaks) — das ist ein anderes Feature
- Kein Locking oder Prerequisites zwischen Lektionen
