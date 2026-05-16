# Spec: Home Feature Cards

## Ziel

Die 4 Plattform-Kernpunkte als eigenständige Karten — jede mit eigener Themen-Farbe und Identität, statt austauschbare Emoji-Quadrate.

## Verhalten

- 4 Karten im 2-Spalten-Grid (mobile: 1 Spalte)
- Pro Karte: Themen-Farbe, Custom-SVG-Icon, Titel, Beschreibung
- Hover: Karte hebt sich, Icon kippt + glüht, Unterstreichung wächst von Mitte
- Cursor-Spotlight: radialer Verlauf in Themen-Farbe folgt dem Mauszeiger
- Dark Mode: Schatten verstärkt sich, Glow bleibt sichtbar

## Technik

- Vue 3 mit `h()` Render-Funktion für SVG-Icons (kein externes Asset)
- CSS Custom Properties (`--c`, `--mx`, `--my`) für Themen-Farbe + Mauspos
- `color-mix(in srgb, ...)` für transparente Mischfarben
- `prefers-reduced-motion` deaktiviert alle Transitions

## Themen-Farben

| Feature | Farbe | Icon |
|---|---|---|
| Jedes Thema | Orange (#f97316) | Zielscheibe |
| Reichhaltiges Lernerlebnis | Cyan (#06b6d4) | Film |
| Eigene Inhalte erstellen | Grün (#10b981) | Stift |
| Null Infrastruktur | Violett (#a855f7) | Schild |
