# Spec: Home How-It-Works Timeline

## Ziel

„So funktioniert es" als visuell verbundene Timeline statt drei isolierte Spalten — der Lernpfad ist sichtbar.

## Verhalten

- 3 Schritte mit Nummern-Badges (1, 2, 3)
- Verbindende Linie zwischen den Schritten (horizontal Desktop, vertikal Mobile)
- Lichtstreifen fließt animiert durch die Linie
- Nummern-Badges haben pulsierenden Ring-Glow
- Schritt 1: interaktiver Sprach-Selektor (öffnet bestehendes Dropdown)
- Schritt 2: Link zum Workshop-Overview
- Schritt 3: animierte Progress-Balken visualisieren Lern-Fortschritt
- Hover auf Schritt: Badge skaliert, Schatten verstärkt

## Technik

- Reines CSS + SVG, keine externen Animationen
- CSS Custom Properties für Theme-Farben aus Tailwind-Vars
- `color-mix()` für sanfte Mischfarben
- `prefers-reduced-motion` deaktiviert alle Animationen
- Mobile-Breakpoint dreht die Linie um 90°
