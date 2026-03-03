# Feature Demos

---

## #26 — shadcn-vue Migration

UI-Komponenten (Button, Card, Switch, Input, Checkbox, Radio, Select, Badge) durch wiederverwendbare shadcn-vue Bausteine ersetzt. Keine visuellen oder funktionalen Aenderungen - nur sauberer, einheitlicher Code unter der Haube.

### Demo

1. **Settings** — Zahnrad oben rechts. Alle 7 Toggles durchklicken (Dark Mode, Show Answers, Show Labels, etc.). Export/Import und Audio-Speed Buttons testen.
2. **Dark Mode** — In Settings aktivieren, dann durch Home → Lessons → Lektion → Learning Items navigieren. Alles sollte einheitlich dunkel sein.
3. **Home** — Sprache waehlen, Workshop waehlen, "Load Lessons" klicken.
4. **Lessons-Uebersicht** — Hover ueber Lesson-Cards. "Assessment Results" Button testen.
5. **Lektion mit Assessments** — Text-Eingabe (Enter), Multiple-Choice (Checkboxen), Single-Choice (Radio) durchklicken. Gruen/rot Feedback pruefen.
6. **Learning Items** — Lesson-Filter Dropdown, "Group by Status"/"Group by Lesson" Checkboxen, Items als gelernt markieren.
7. **Mobile** — Browser-Fenster schmal ziehen. Floating Play-Button unten rechts pruefen.

---

## #27 — Store Progress and Assessment Results (GunDB Sync)

Lernfortschritt, Assessment-Antworten und Einstellungen werden ueber GunDB zwischen Geraeten/Tabs synchronisiert. Verschluesselte User-Accounts via SEA, kein Server noetig — laeuft komplett im Browser. WebRTC fuer Browser-zu-Browser Sync im selben Netzwerk. Session wird via Gun's recall() wiederhergestellt — kein Passwort in localStorage.

### Demo

1. **Register** — Settings oeffnen → Username + Passwort eingeben → "Register" klicken → Erfolgsmeldung.
2. **Auto-Sync** — Nach Login wird automatisch synchronisiert. Kein "Sync Now" Button noetig.
3. **Passwort-Sicherheit** — DevTools → Application → localStorage pruefen → kein Passwort sichtbar (nur Alias).
4. **Session-Wiederherstellung** — App neu laden → Session wird automatisch via recall() wiederhergestellt.
5. **Login-Guard** — Schnell 3x auf Login klicken → nur ein Request, Button zeigt "Logging in...".
6. **Echtzeit-Updates** — Aenderungen auf einem Geraet/Tab erscheinen automatisch auf dem anderen.
7. **Offline** — Ohne Login arbeiten → App funktioniert wie bisher (nur localStorage).
8. **Logout** — "Logout" klicken → Account-Sektion zeigt Login-Formular.

---

## #29 — Assessment Results Button in Top Navigation

Der Assessment-Results-Button wurde aus der Lessons-Uebersicht entfernt und als Icon (📋) in die obere Navigationsleiste verschoben. Sichtbar auf allen Seiten mit Workshop-Kontext (Lessons Overview, Lesson Detail, Learning Items).

### Demo

1. **Lessons Overview** — Workshop laden → oben rechts erscheint das 📋 Icon neben 📚 und ⚙️.
2. **Lesson Detail** — Lektion oeffnen → 📋 Icon ist sichtbar, klicken → Assessment Results Seite.
3. **Learning Items** — Items-Seite → 📋 Icon ist sichtbar.
4. **Home / Settings** — 📋 Icon ist NICHT sichtbar (kein Workshop-Kontext).
5. **Alter Button weg** — Auf der Lessons-Uebersicht gibt es keinen "Assessment Results" Button mehr unten.

---

## #30 — Result Page Improvements

Die Assessment-Results-Seite wurde um vier Features erweitert: Sent-Status-Tracking (wann zuletzt gesendet, per Email/Coach), Change-Detection (Hash-basiert: "Up to date" / "Changed" / "Never sent" Badge), Quick-Links zu Lektionen (Lesson-Titel sind jetzt klickbar), und Unlearned Learning Items pro Lektion (klickbar zum Markieren als gelernt).

### Demo

1. **Quick Links** — Results-Seite oeffnen → Lesson-Titel sind klickbar und fuehren direkt zur Lektion.
2. **Sent Status Badge** — Jede Lektion zeigt "Never sent" (grau), "Up to date" (gruen) oder "Changed" (rot).
3. **Send via Email** — "Send Results via Email" klicken → alle betroffenen Lektionen werden als "Up to date" markiert.
4. **Change Detection** — Nach dem Senden eine Antwort aendern → Badge wechselt zu "Changed".
5. **Unlearned Items** — Pro Lektion werden bis zu 10 ungelernte Items als Badges angezeigt. Klick → Item wird als gelernt markiert und verschwindet.
6. **Last Sent Info** — Unter dem Lesson-Titel steht "Last sent: [Datum] via [Kanal]".

---

## #31 — Section Videos (YouTube und lokal)

Sections koennen jetzt sowohl YouTube-Videos als auch lokale Videodateien (MP4, WebM) einbinden. YouTube-URLs werden automatisch erkannt und als Embed-Iframe gerendert. Lokale Videopfade werden relativ zum Lesson-Ordner aufgeloest und mit dem HTML5 `<video>`-Element dargestellt.

### Demo (Open Learn Showcase → Lesson 1: Amazing Animal Facts)

1. **YouTube Video** — Section "Ocean Creatures" zeigt ein YouTube-Video (Big Buck Bunny). Iframe-Embed wird angezeigt und ist abspielbar.
2. **Lokales Video** — Section "Insects & Tiny Creatures" zeigt ein lokales MP4-Video mit HTML5-Video-Controls.
3. **Responsive** — Videos passen sich der Breite an (aspect-video).
4. **Kein Video** — Section "Mammals Gone Wild" hat kein Video-Feld und zeigt keinen Player.
5. **YouTube Short URL** — URLs wie `https://youtu.be/xxx` werden korrekt zu Embed-URL konvertiert.

---

## #28 — Connect Workshop to Service Agent as Coach

Workshops mit konfiguriertem `coach.api` Endpoint werden mit einem KI-Service-Agent verbunden. Die Coach-Seite bietet eine Chat-Oberflaeche, ueber die Lernende Fragen stellen, Feedback zu ihren Antworten erhalten und Hilfe anfordern koennen. Der Agent erhaelt automatisch den Kontext (Assessment-Ergebnisse, Lernfortschritt) als Plain Text.

### Demo

1. **Coach Button** — Workshop mit `coach.api` in workshops.yaml laden → 🤖 Icon erscheint in der Top-Navigation.
2. **Kein Coach** — Workshop ohne `coach.api` → 🤖 Icon ist NICHT sichtbar.
3. **Chat** — Coach-Seite oeffnen → Vorschlaege ("How am I doing?", etc.) klicken oder eigene Frage tippen → Agent antwortet.
4. **Kontext** — Agent erhaelt automatisch Assessment-Ergebnisse und Lernfortschritt als Kontext.
5. **Chat-Verlauf** — Nachrichten bleiben in localStorage erhalten. "Clear chat" loescht den Verlauf.
6. **Fehlerbehandlung** — Bei Netzwerkfehler wird eine Fehlermeldung im Chat angezeigt.
