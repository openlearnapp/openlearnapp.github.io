# Spec: Home Hero Parallax

## Ziel

Tiefenwirkung im Home-Hero durch Layer mit unterschiedlichem Bewegungsverhalten.

## Layer

| Layer | Inhalt | Verhalten |
|---|---|---|
| Hintergrund | Himmel + Sterne | Treibt langsam nach unten, slow drift |
| Mitte | Aurora + Glow | Subtile vertikale Bewegung |
| Vordergrund | Sprachwörter | Wandert nach oben, schnellere Drift |

## Technik

- SVG `<g transform>` pro Layer
- Position pro Frame berechnet aus Scroll-Offset + `Math.sin(animFrame * f)` Drift
- Reines Vue Reactivity, kein Listener-Spam (RAF-Loop bereits da)
- Drift sorgt für Tiefenwirkung auch wenn nicht gescrollt wird
