# Spec: Cinematic Home Hero

## Ziel

Home-Seite wirkt wie ein Produkt-Trailer — beim ersten Blick sichtbarer Sog statt Textwüste.

## Hero

- Höhe: 420 px, abgerundet
- Animierter SVG-Hintergrund (Sterne + Aurora + schwebende Sprachwörter)
- Glasmorphism-Sprachselektor als zentraler CTA
- Cinema-Bars oben/unten

## Technik

- Reine Vue + SVG + `requestAnimationFrame`
- Keine externen APIs, keine Bibliotheken, kein Build-Step
- Gleiche Technik wie `WorkshopHeroVideo.vue`

## Außerhalb des Scopes (eigene Issues)

- Parallax-Tiefe
- Scroll-getriebene Feature-Cards
- Workshop-Carousel im Hero
