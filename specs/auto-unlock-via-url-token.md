# Auto-Unlock per URL-Token nach Kauf-Rückkehr

## Problem

Heute ist der Premium-Workshop nur per „Demo entsperren"-Knopf im Banner freischaltbar — als Vorschau. Echte Käufer haben aber keinen Weg, ihren Kauf in der App zu aktivieren. Der Kauf-Flow ist offen: Anbieter-Landing-Page → Checkout → ??? → kein direkter Übergang zurück in Open Learn mit aktivem Premium.

Das `unlock_token`-Feld im Workshop-Schema ist seit PR #294 reserviert, aber noch nicht ausgewertet.

## Lösung

Anbieter leitet den Käufer nach erfolgreichem Kauf zurück auf die Open-Learn-URL des Workshops mit `?unlock=<token>` als URL-Parameter. Die App vergleicht den Token mit dem `unlock_token`-Feld aus `workshops.yaml` und entsperrt den Workshop bei Match **persistent** für diesen Lernenden (gleiche LocalStorage-Schicht wie Demo-Unlock).

### Beispiel

```
https://open-learn.app/#/deutsch/linux-grundlagen/lessons?unlock=linuxpfad-2026-abc123
```

Wenn `workshops.yaml` hat:

```yaml
premium: true
unlock_token: "linuxpfad-2026-abc123"
```

→ Match → App entsperrt den Workshop, zeigt grünen Toast „Workshop freigeschaltet — viel Spaß beim Lernen!"

Bei Mismatch oder fehlendem Token → kein Unlock, kein Toast, normale Schloss-Anzeige.

### Saubere URL nach Unlock

Nach erfolgreichem Unlock wird der `?unlock=`-Param aus der URL entfernt (per `router.replace`), damit der Token nicht im Browser-Verlauf und Bookmark hängen bleibt.

## Was unverändert bleibt

- „Demo entsperren"-Knopf im Banner — bleibt für Reviewer
- LocalStorage-Schicht — gleiche Persistenz wie Demo-Unlock
- Anbieter-Workshop ohne `unlock_token` — Param wird ignoriert, kein Auto-Unlock möglich
- Kostenlose Workshops — Param wird ignoriert

## Sicherheits-Hinweis

Der Token ist **gemeinsam vom Anbieter und allen Lernenden bekannt** — er ist in `workshops.yaml` öffentlich. Das ist explizit so gewollt: Open Learn macht hier kein Account-System, sondern eine Path-as-Secret-Variante. Der eigentliche Schutz liegt bei der Anbieter-URL und beim Anbieter-Backend (nur zahlende Kunden bekommen den Token-Link per Mail). Wer den Token findet, kann den Workshop entsperren — Open Learn ist hier nicht der Zahlungs-Gatekeeper.

Für stärkeren Schutz kann der Anbieter pro Käufer eindeutige Tokens generieren und in einer separaten YAML-Quelle bereitstellen, deren Auto-Discovery-Mechanik in einer späteren Iteration spezifiziert wird.

## Abhängigkeit

Setzt PR #294 (Backbone) voraus — nutzt `meta.unlock_token` und `usePremium.unlock()`.
