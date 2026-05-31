# Quiz-Bot entfernen — Aufgaben in ruhiger Inline-Darstellung

## Warum

Die animierte „linuxbot"-Quiz-Karte (Roboter-SVG mit Augen/Mund, Terminal-Header, Typing-Sounds, Frage-Tipp-Animation) war zu laut für den Lese-Flow. Die Karte hatte einen weißen Hintergrund, der sich nicht in den dunklen Lektion-Container einpasste, und die Frage wurde Buchstabe für Buchstabe getippt — Lernende müssen die Frage aber sofort lesen können.

Bezahlte Workshops sollen sich seriös und ruhig anfühlen. Der Bot passt nicht dazu.

## Was sich ändert

- **Multiple-Choice / Select / Input** rendern wieder inline in `LessonDetail.vue` mit dem ursprünglichen ruhigen Look (Checkbox bzw. Radio bzw. Input-Feld, grüner/roter Rahmen + Hintergrund bei richtig/falsch).
- Frage erscheint **sofort und vollständig** — keine Typing-Animation, keine Sounds.
- Hintergrund der Karte entspricht dem Lektion-Container — kein eigener weißer Block.
- Alte YAMLs mit `type: terminal-select` / `terminal-input` / `terminal-multiple-choice` funktionieren weiter: das `terminal-`-Prefix wird in `useAssessments.js` automatisch gestripped und intern als normales `select` / `input` / `multiple-choice` behandelt.

## Was bleibt unverändert

- Antwort-Speicherung, Validierung, Coach-Forwarding — alle Funktionen identisch.
- Quiz-Logik (genau eine richtige bei `select`, alle richtigen Boxen bei `multiple-choice`) unverändert.

## Was rausgenommen wurde

- `src/components/AssessmentCard.vue` — gelöscht (nie in `main`, war nur lokal).
- Roboter-SVG (Augen, Antenne, Mund, LEDs), Terminal-Header „linuxbot — terminal", `linuxbot:~$`-Prompt, „QUIZ MODE"-Label, „CORRECT/TRY AGAIN"-Texte.
- Tipp-Sounds bei der Frage-Animation, Klick-Geräusche der Optionen, Erfolgs-/Fehler-Sounds.

## Migration

Workshop-YAMLs mit `type: terminal-*` müssen **nicht** angefasst werden — der Stripper in `useAssessments.js` macht sie kompatibel. Wer aufräumen will, kann `terminal-` aus den `type`-Werten entfernen (geplant: separater PR im `workshop-linux-grundlagen` Repo).
