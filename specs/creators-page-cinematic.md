# Creators-Seite — Cinematic Redesign mit Premium-Sektion

## Problem

Die Creators-Seite (`#/creators`) ist heute eine schmucklose Markdown-artige Aneinanderreihung von Erklär-Blöcken: Titel, drei Schritte, Ordner-Struktur als Code-Block, Hosting-Optionen mit Emoji-Icons. Sie erklärt korrekt wie man einen Workshop baut, aber ohne visuellen Reiz und ohne Hinweis auf die Premium-Funktion.

Workshop-Anbieter, die bezahlte Kurse anbieten wollen, finden hier weder den Premium-Konfigurations-Block noch eine Live-Demo.

## Lösung

Vollständiges Redesign mit:

- **Cinematic Hero** mit Aurora-Glow, Partikel-Animation, Gradient-Headline + 2 CTAs (Loslegen / Premium-Kurse anbieten)
- **3-Schritte-Block** mit Glow-Nummerierungen statt simplen Kreisen
- **Cinematische Code-Boxen** für Ordnerstruktur + `content.yaml` (mit macOS-Dots + Dateiname-Pillen)
- **Neue Premium-Sektion** „Verkaufe deinen Kurs über Open Learn" — eigene Aurora-Karte mit 4 Features + Live-YAML-Snippet + 2 CTAs (Live-Demo + Schema-Doku)
- **Hosting-Optionen** mit SVG-Icons statt Emojis (Paket / Globus / Server)
- **Final-CTA-Block** mit eigener Aurora

## Was unverändert bleibt

- Alle inhaltlichen Texte und Erklärungen — gleiche Substanz, andere Form
- Routing (`#/creators`)
- YAML-Schema-Beispiele
- Verlinkungen auf das Hauptrepo und die Workshop-Guide-Docs
- Vier Aufgabentypen (`qa`, `input`, `select`, `multiple-choice`)

## Abhängigkeit

Setzt PR #294 voraus — die Premium-Sektion verweist auf den Live-Demo-Pfad und zeigt das im Backbone eingeführte Schema.
