# Spec: Video-Hero Play-Indikator

## Problem

Der Workshop-Hero-Bereich sieht aus wie ein dekoratives Banner. Nutzer erkennen erst nach dem Klick, dass es sich um ein interaktives Video-Element handelt.

## Lösung

Zentrierter großer Play-Button mit pulsierender Animation — auf den ersten Blick als Video erkennbar, ohne Erklärung.

## Verhalten

- **Play-Button** ist immer sichtbar in der Mitte des Heroes (nicht unten links)
- **Puls-Animation**: zwei grüne Ringe die sich nach außen ausdehnen und verblassen (wie YouTube Live-Indikator)
- **Label** unter dem Button zeigt den `playLabel`-Text (z.B. „Video-Trailer")
- **Hover**: Button skaliert auf 110 %, Rand wird grün
- **Nach Klick / Touch-Controls aktiv**: Play-Button blendet sanft aus (Transition), Touch-Controls erscheinen
- **Der alte grüne Button** unten links entfällt — der zentrierte Button übernimmt die Funktion

## Nicht in diesem Spec

- Echter Video-Player (kommt wenn Video-URLs vorhanden)
- Fortschrittsbalken am unteren Rand (separates Feature)
- Trailer-Badge oben rechts (separates Feature)
