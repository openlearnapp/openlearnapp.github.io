# Spec: Home Use-Case Panel

## Ziel

„Was du lernen kannst" als visuelle Visitenkarte der Plattform-Vielfalt — nicht als bloße Liste.

## Verhalten

- Dunkles Panel mit Verlaufs-Hintergrund und Farb-Glows
- Zwei horizontale Reihen mit Glas-Chips, scrollen endlos in entgegengesetzte Richtungen
- Jeder Chip: custom SVG-Icon (Linien-Stil) + Label, mit Drop-Shadow in der Icon-Farbe
- Hover auf Chip: leichter Lift, Glow in Icon-Farbe wird sichtbar
- Hover auf Panel: Reihen-Animation pausiert
- Maus-Parallax: Reihen verschieben sich um wenige Pixel gegensätzlich

## Technik

- Reines Vue + SVG + CSS-Keyframes
- Marquee-Trick: Inhalt doppelt rendern, mit `translateX(-50%)` für nahtlose Schleife
- Mouse-Position relativ zum Panel-Rechteck (-0.5 .. +0.5) als Parallax-Faktor
- Partikel aus einem deterministischen Seed-Array, animiert über `animFrame` (RAF)
- Respektiert `prefers-reduced-motion`
