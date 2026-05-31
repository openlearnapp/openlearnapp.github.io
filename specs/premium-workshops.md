# Premium Workshops — bezahlte Lektionen, Anbieter-Werbe-Banner, URL-Guard

## Problem

Open Learn ist heute eine reine kostenlose Plattform. Workshop-Anbieter, die ihre Inhalte verkaufen wollen, haben keine Möglichkeit, Lernende von der App zu einem Kauf-Flow zu leiten und nach dem Kauf gezielt Lektionen freizuschalten. Die statische Architektur (kein Backend, kein Account-System) soll dabei erhalten bleiben.

Konzept und Fallbeispiel: siehe das Begleitrepo `concept-paid-workshops`.

## Lösung

Drei zusammenhängende Teile, die nur greifen wenn ein Workshop in seiner `workshops.yaml` als Premium markiert ist. Alles bleibt additiv — bestehende kostenlose Workshops verhalten sich unverändert.

### 1. Schema in `workshops.yaml`

Neue optionale Felder am Workshop-Eintrag:

| Feld | Bedeutung |
|---|---|
| `premium: true` | Aktiviert das Premium-Rendering. Default `false`. |
| `free_lessons: N` | Die ersten N Lektionen sind frei. |
| `free_lesson_numbers: [a, b, c]` | Spezifische Lektions-Nummern frei (überschreibt `free_lessons`, wenn gesetzt). |
| `total_lessons: N` | Optional, nur für Anzeige. |
| `unlock_token: "..."` | Reserviert für späteren Auto-Unlock-Flow per URL-Parameter. |
| `provider:` | Branding und Werbe-Inhalt des Anbieters. |

Provider-Sub-Felder: `name`, `headline`, `pitch`, `bullets: []`, `logo`, `landing_url`, `accent_color`, `accent_color_soft`, `price_display`, `price_note`.

Fehlt `premium: true`, wird kein einziger neuer UI-Teil aktiv — der Workshop verhält sich genau wie heute.

### 2. Anbieter-Werbe-Banner direkt unter dem Trailer

Wenn `premium: true`: zwischen dem Trailer-Video und der Lektions-Liste erscheint ein cinematischer Banner mit dem Branding aus `provider:` — Logo, Headline, Pitch, Bullet-Liste, Preis, „Kurs freischalten"-CTA. Der Banner sitzt im selben Container wie der Trailer (kein zweiter Block), Akzentfarbe stammt aus `provider.accent_color`.

Werbung lebt **nur einmal** ganz oben. Bei den einzelnen Lektion-Karten taucht kein Preis und kein „Freischalten"-Button auf.

### 3. Schloss-Karten für gesperrte Lektionen

Gesperrte Lektionen rendern in derselben Form wie freie Lektionen — gleicher Hintergrund, gleiches Thumbnail. Einziger Unterschied: ein dezenter cyan-glühender Schloss-Indikator auf dem Thumbnail (langsames Glow-Flackern). Klick auf die Karte (auch auf die Stern- bzw. Markieren-Buttons) öffnet `provider.landing_url` in einem neuen Tab.

### 4. URL-Guard im LessonDetail

Wer eine gesperrte Lektion per Direkt-URL aufruft (`#/.../lesson/N`), wird auf die Übersicht zurückgeleitet. Greift nur bei `premium: true`.

### 5. Demo-Unlock per LocalStorage

Im Banner gibt es einen „Demo entsperren"-Knopf, der einen Eintrag in LocalStorage schreibt. Damit verhalten sich alle gesperrten Lektionen so, als wäre der Workshop gekauft. Der spätere echte Kauf-Rückkehr-Flow per URL-Token (`?unlock=<token>`) ist Teil einer Folge-Iteration; das `unlock_token`-Feld im Schema ist bereits dafür reserviert.

## Was unverändert bleibt

- Kostenlose Workshops verhalten sich exakt wie heute — kein Banner, keine Schlösser, kein Guard.
- Antwort-Speicherung, Audio, Coach-Forwarding, Offline-Modus — alle bestehenden Funktionen.
- Die `workshops.yaml`-Struktur ist additiv: ein Anbieter ohne Premium ändert nichts.

## Test-Daten

Demo-Workshop unter `openlearnapp/workshop-linux-grundlagen-preview` mit fiktivem Anbieter „LINUXPFAD Akademie", 3 freien Lektionen (Nr. 1, 2, 6), 10 gesperrten. Live unter https://open-learn.app/workshop-linux-grundlagen-preview/.

## Was bewusst raus ist

- Kein Account-System, kein Login.
- Kein Open-Learn-eigener Checkout — der Kauf passiert beim Anbieter.
- Keine Umsatzbeteiligungs-Mechanik in der App selbst.
- Auto-Unlock per `?unlock=<token>` ist Folge-Iteration.

## Verwandt

- `concept-paid-workshops` Repo: Konzept + Fallbeispiel
- Folge-PRs: Premium-Badge auf Workshop-Karten, Anbieter-Onboarding auf Home, Creators-Seite Cinematic Redesign
