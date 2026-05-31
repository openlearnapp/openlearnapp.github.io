# Premium-Indikator auf Workshop-Karten

## Problem

Heute gibt es in der Workshop-Liste (`/#/deutsch`) keinen visuellen Unterschied zwischen kostenlosen und bezahlten Workshops. Lernende erkennen Premium-Workshops erst, wenn sie reinklicken und den Anbieter-Banner sehen. Anbieter-Branding und Preis bleiben unsichtbar in der Discovery-Phase.

## Lösung

Workshop-Karten mit `premium: true` bekommen drei klare Premium-Signale, die direkt auf der Karte sitzen:

### 1. Premium-Badge
Animiertes Aurora-Sternchen-Badge in der oberen rechten Ecke der Karte. Akzentfarbe stammt aus `provider.accent_color`. Wenn der Workshop für den Lernenden bereits freigeschaltet ist (LocalStorage), zeigt das Badge „Freigeschaltet" statt „Premium".

### 2. Aurora-Rand um die Karte
Animierter Farbverlauf-Rand (cyan → violett → cyan) um die ganze Workshop-Karte. Dezent, läuft langsam, springt nicht ins Auge — aber genug, dass die Karte sich von kostenlosen Workshops unterscheidet.

### 3. Anbieter-Strip am Karten-Fuß
Unter Titel und Beschreibung erscheint eine kleine Zeile:
- links: „Angeboten von **\<Anbieter-Name\>**"
- rechts: Preis aus `provider.price_display` in Anbieter-Akzentfarbe

Wenn der Workshop freigeschaltet ist, fällt der Preis weg.

## Was unverändert bleibt

- Kostenlose Workshops bekommen keinen Aurora-Rand, kein Badge, keinen Anbieter-Strip
- Karten-Layout, Bilder, Labels, Favoriten-Knopf, Link-Kopieren — alles bleibt wie heute
- Workshop-Card-Click führt weiterhin in die Lessons-Overview (von dort Provider-Banner + Schloss-Karten aus PR #294)

## Abhängigkeit

Setzt PR #294 (Premium-Backbone) voraus — nutzt das durchgereichte `meta.provider` und `meta.premium` aus `useLessons`.

## Test-Daten

Jeder Workshop mit `premium: true` in `workshops.yaml`. Beispiel-YAML im PR-Body.
