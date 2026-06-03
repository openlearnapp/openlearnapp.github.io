# Anbieter-Onboarding-Sektion auf der Startseite

## Problem

Workshop-Anbieter, die ihre Inhalte verkaufen wollen, finden auf der Open-Learn-Startseite keinen Hinweis, dass das technisch möglich ist. Premium-Features (PR #294, #297, #299) sind in der App vorhanden, aber neue Anbieter erfahren davon nicht — sie müssen erst auf `/creators` klicken und sich durchscrollen.

## Lösung

Eine prominente Sektion auf der Home (`#/`) zwischen den bestehenden Blöcken: „**Verkaufe deinen Kurs über Open Learn**". 

### Visuell

- Aurora-Hintergrund passend zum Premium-Look (cyan + violett)
- Headline mit Gradient-Text
- 4 nummerierte Schritte: YAML schreiben → Frei vs. Premium wählen → Verkaufsseite verlinken → Importieren lassen
- Live-YAML-Snippet rechts, der die `premium:`-Felder zeigt — Anbieter sieht direkt wie es geht
- Zwei CTAs: „Live-Demo ansehen" + „Workshop-Guide öffnen"

### Wo sie sitzt

Direkt vor dem Privacy-Block, in derselben Breite wie die anderen Home-Sektionen. Sticht durch die Aurora-Optik visuell raus — passt zum Premium-Branding, ohne den restlichen Home-Look zu brechen.

## Was unverändert bleibt

- Andere Home-Sektionen (Hero, Features, How it works, Roadmap, Privacy, Open Source) bleiben exakt wie heute
- Kein neues Routing, kein neues View
- Wer kostenlos Workshops bauen will, wird durch die Sektion nicht angesprochen — der „Workshop erstellen"-Link bleibt prominent

## Abhängigkeit

Setzt PR #294 (Backbone) voraus — verlinkt auf die Live-Demo und nutzt das dort eingeführte Schema in den Code-Beispielen.
