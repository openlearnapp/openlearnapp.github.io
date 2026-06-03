# Video-Lock pro Lektion — Text frei, Video gesperrt

## Problem

Premium-Sperre liegt heute nur auf Lektion-Ebene (PR #294). Anbieter wollen aber häufig eine Lektion **textlich frei** anbieten (als Vorgeschmack) und nur das **Video** sperren — der Lernende kann den Text lesen, aber für das Video muss er kaufen.

## Lösung — Schema-Erweiterung

In `content.yaml` darf `section.video` jetzt zwei Formen haben:

```yaml
sections:
  # Variante A — wie heute, String, frei
  - title: "Frei"
    video: "https://youtube.com/..."

  # Variante B — Object mit Premium-Flag
  - title: "Gesperrt"
    explanation: |
      Dieser Text ist frei lesbar.
    video:
      url: "https://youtube.com/..."
      premium: true                  # Video gesperrt bis Kauf
      preview_image: "vorschau.png"   # optional — gedimmtes Standbild
```

Alte YAMLs mit `section.video: "..."` als String funktionieren weiter, unverändert.

## Rendering

Drei Fälle:

| Fall | Was gerendert wird |
|---|---|
| `section.video` ist String | normaler Video-Player (wie heute) |
| `section.video.premium: true` + Workshop ist freigeschaltet | normaler Player mit `section.video.url` |
| `section.video.premium: true` + Workshop ist NICHT freigeschaltet | **PremiumVideoLock-Block** statt Player |

### PremiumVideoLock-Block

- Falls `preview_image` gesetzt: gedimmtes Standbild als Hintergrund (16:9)
- Falls nicht: dunkler Aurora-Hintergrund mit Premium-Akzent
- Mittig zentriert: cyan glühender Schloss-Indikator (gleicher Glow-Stil wie auf `LockedLessonCard`)
- Darunter: kleine Zeile „Video freischalten" oder „Mit Kauf freigeschaltet"
- Klick auf den Block öffnet `provider.landing_url` in neuem Tab

Section-Text (Markdown-Erklärung, Beispiele, Quizze) **bleibt voll lesbar** — der Lock greift nur auf das Video.

## Was unverändert bleibt

- Lektion-Ebene-Sperre (`free_lessons` / `free_lesson_numbers`) — wirkt weiter unverändert
- Bestehende kostenlose Workshops — unangetastet
- Antwort-Speicherung, Audio, Coach-Forwarding — wie heute

## Abhängigkeit

Setzt PR #294 (Backbone) voraus — nutzt `usePremium.isUnlocked()` und `provider.landing_url` aus `workshopMetaData`.
