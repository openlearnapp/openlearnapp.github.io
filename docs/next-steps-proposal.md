# Open Learn — Vorschlaege fuer die naechsten Schritte

Stand: Februar 2026. Alle bisherigen Issues (#26-#31) sind abgeschlossen.

---

## Was wir haben

- Offene Lernplattform, jedes Thema moeglich (Sprachen, Mathe, Fuehrerschein, etc.)
- YAML-basierte Lektionen mit Audio, Video, Quizze, Vokabel-Tracking
- Kein Server noetig — laeuft komplett im Browser (GitHub Pages)
- GunDB fuer Cross-Device Sync mit verschluesselten Accounts
- Coach-Infrastruktur fuer KI-Feedback (bereit, braucht Endpoint)
- shadcn-vue UI, Dark Mode, Mobile-tauglich

---

## Vorschlag 1: Workshop-Marktplatz (hoechste Prioritaet)

**Problem:** Aktuell muss jeder seine eigenen Lektionen schreiben oder eine URL kennen. Ohne Inhalte kommen keine User.

**Loesung:** Eine Entdecken-Seite, auf der oeffentliche Workshops gelistet sind.

**Wie es funktioniert:**
- Workshop-Ersteller registrieren ihren Workshop (URL + Beschreibung)
- Zentrale `registry.yaml` auf GitHub — Pull Request zum Eintragen
- User oeffnen Open Learn → sehen eine Liste verfuegbarer Workshops → Ein Klick zum Laden
- Kein Backend noetig — die Registry ist eine statische Datei

**Aufwand:** Mittel (neue View + Registry-Format + Lade-Logik)

**Nutzen:** Macht die App sofort nutzbar fuer Leute die nicht selbst YAML schreiben wollen. Grundlage fuer alles Weitere.

---

## Vorschlag 2: KI-Coach aktivieren

**Problem:** Die Coach-Infrastruktur (#28) ist gebaut, aber kein Workshop hat einen Coach-Endpoint konfiguriert.

**Loesung:** Einen Workshop mit dem intelligent-web Service Agent verbinden.

**Wie es funktioniert:**
- Ein bestehender Workshop (z.B. Portugiesisch) bekommt `coach.api` in seiner topics.yaml
- Der Agent (intelligent-web Projekt) erhaelt die Lektionsinhalte als Wissenskontext
- User koennen im Chat Fragen stellen, Feedback zu Antworten bekommen, Erklaerungen anfordern

**Aufwand:** Gering (Konfiguration + Agent-Setup, Code ist fertig)

**Nutzen:** Zeigt das volle Potenzial der Plattform. Unterscheidungsmerkmal zu allen anderen Lernplattformen. Personalisierbares Lernen.

---

## Vorschlag 3: Lernstatistiken und Streak

**Problem:** Es gibt keinen Anreiz, taeglich zurueckzukommen. Kein Gefuehl von Fortschritt ueber die Zeit.

**Loesung:** Dashboard mit Lernstatistiken.

**Features:**
- Taeglicher Streak ("7 Tage in Folge gelernt")
- Wochen-/Monats-Uebersicht (wie viele Items gelernt, Quizze beantwortet)
- Fortschrittsbalken pro Workshop
- Optional: Push-Benachrichtigungen als Erinnerung (PWA)

**Aufwand:** Mittel (neues Composable + neue View + localStorage fuer Tageslog)

**Nutzen:** Taegliche Nutzung, Motivation, Gamification-Grundlage.

---

## Vorschlag 4: Offline-First mit PWA

**Problem:** Die App funktioniert nur mit Internetverbindung (Lektionen werden per Fetch geladen).

**Loesung:** Progressive Web App (PWA) mit Service Worker.

**Features:**
- App installierbar auf Handy (Home Screen Icon)
- Geladene Workshops offline verfuegbar (Service Worker Cache)
- Push-Benachrichtigungen fuer Lern-Erinnerungen
- Automatischer Sync wenn wieder online

**Aufwand:** Mittel (vite-plugin-pwa, Service Worker Config, Cache-Strategie)

**Nutzen:** Echte App-Erfahrung. Lernen unterwegs ohne Internet (Zug, Flugzeug). Professioneller Eindruck.

---

## Vorschlag 5: Gun Relay Server fuer echten Cross-Device Sync

**Problem:** GunDB synct aktuell nur lokal (gleicher Browser) oder per manuellem Login. Kein automatischer Sync ueber das Internet.

**Loesung:** Einen einfachen Gun Relay Server betreiben.

**Wie es funktioniert:**
- Kleiner Node.js Server (5 Zeilen Code) auf einem guenstigen VPS oder Cloudflare Worker
- Alle eingeloggten User verbinden sich automatisch
- Aenderungen auf Geraet A erscheinen sofort auf Geraet B
- Daten bleiben verschluesselt (SEA) — Server sieht nur verschluesselte Daten

**Aufwand:** Gering (Server-Setup + eine Zeile Config in useGun.js)

**Nutzen:** Macht den Account wirklich nutzbar. Ohne Relay ist der Sync nur ein Versprechen.

---

## Empfohlene Reihenfolge

1. **Workshop-Marktplatz** — bringt Inhalte und User
2. **KI-Coach aktivieren** — zeigt den Wow-Faktor
3. **Gun Relay Server** — macht Sync real
4. **Lernstatistiken** — haelt User in der App
5. **PWA** — professionelle App-Erfahrung

---

## Monetarisierungs-Optionen (langfristig)

| Modell | Beschreibung |
|---|---|
| **Freemium Coach** | Lektionen kostenlos, KI-Coach als Abo (5-10 EUR/Monat) |
| **Workshop-Gebuehren** | Ersteller verkaufen Premium-Workshops, Plattform nimmt Provision |
| **Firmen-Lizenzen** | Unternehmen nutzen Open Learn fuer interne Schulungen + Analytics |
| **Zertifikate** | Kostenpflichtige verifizierte Abschlusszertifikate |
