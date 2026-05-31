# Premium-Visual: helle Lektion-Karten in Premium-Workshops

## Problem

In einem Premium-Workshop sind heute nur der Anbieter-Banner (PR #294) und die Schloss-Symbole in der Premium-Akzentfarbe (cyan). Die Lektion-Karten selbst — frei wie gesperrt — bleiben im normalen hellen weißen oder grauen Standard-Layout. Das wirkt visuell zerrissen: oben ein cinematischer Premium-Banner, darunter blasse Standard-Karten ohne Premium-Charakter.

## Lösung

Wenn der Workshop `premium: true` ist, bekommen **alle** Lektion-Karten in der Übersicht einen hellen Premium-Look passend zur Schloss-Glow-Farbe — sowohl die freien als auch die gesperrten Karten.

### Visuell

- Karten-Hintergrund leicht cyan-getönt (statt rein weiß / grau)
- Karten-Rand in cyan-violetter Anbieter-Akzentfarbe (deutlich heller als heute)
- Akzent-Bar links nimmt die Anbieter-Akzentfarbe an statt Standard-Grün/Blau
- „Weiterlernen"-Badge auf der nächsten Lektion in Anbieter-Akzentfarbe
- Hover-Effekt: Schimmer in Anbieter-Akzentfarbe statt Standard-Primary

Die Premium-Optik fließt durchgehend vom Workshop-Header über den Banner bis zu jeder einzelnen Lektion. Das Schloss-Glow auf gesperrten Karten passt jetzt nahtlos rein, statt als Fremdkörper auf einer blassen Karte zu hängen.

## Was unverändert bleibt

- Layout, Größen, Abstände, Buttons — exakt wie heute
- Kostenlose Workshops bekommen weiterhin das normale Standard-Theme
- Inhalt der Karten (Titel, Beschreibung, Statistik, Image) bleibt identisch

## Wie das technisch greift

`LessonCard.vue` bekommt ein optionales `isPremium` Prop. Wenn true, werden die Akzent-Farben durch die Anbieter-Akzentfarbe ersetzt (übergeben über CSS-Custom-Properties aus dem `provider.accent_color` / `provider.accent_color_soft`).

`LessonsOverview.vue` setzt `isPremium` für alle Karten in einem Premium-Workshop — sowohl für freie LessonCards als auch für die in `LockedLessonCard` eingebetteten LessonCards.

## Abhängigkeit

Setzt PR #294 (Backbone) voraus — nutzt `meta.provider.accent_color` / `accent_color_soft` und `meta.premium`.
