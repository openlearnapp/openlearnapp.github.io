# Workshop Filters

**Issue: [#90](https://github.com/openlearnapp/openlearnapp.github.io/issues/90)**

## Purpose

Allow learners to filter workshops by category labels. Workshop creators tag their workshops with labels like "Sprache", "IT", "Kids". The workshop overview page shows filter chips to narrow the list.

## Workshop Labels in YAML

Workshop entries in `workshops.yaml` gain an optional `labels` array:

```yaml
workshops:
  - folder: englisch
    code: en-US
    title: Englisch lernen
    labels: ["Sprache"]
  - folder: linux
    code: de-DE
    title: Linux Grundlagen
    labels: ["IT", "IT/Linux", "IT/DevOps"]
  - folder: docker
    code: de-DE
    title: Docker Grundlagen
    labels: ["IT", "IT/Docker", "IT/DevOps"]
```

Labels are free-form strings. Workshop creators choose their own labels. There is no controlled vocabulary — the platform collects all labels it encounters and shows them as filter options.

### Hierarchical Labels

Labels support hierarchy using `/` as separator. Top-level labels (without `/`) act as categories. Sub-labels (with `/`) appear only when their parent category is filtered:

- `"IT"` — top-level category, visible by default
- `"IT/Linux"`, `"IT/Docker"` — sub-labels, hidden until "IT" is selected
- Filtering by `"IT"` matches workshops with `"IT"` or any `"IT/*"` sub-label
- Sub-labels are displayed without their prefix (e.g. "Linux" instead of "IT/Linux")
- Only direct children are shown (not deeper nesting like `"IT/Linux/Kernel"`)

## Computed Labels

Two labels are computed automatically and always appear first in the filter row:

- **active** — applied to workshops the user has opened. Displayed as "Aktiv" (DE) / "Active" (EN). On the workshop card, clicking the label text filters; clicking the ✕ next to it deactivates the workshop.
- **local-dev** — applied to workshops loaded from sibling `../workshop-*` directories in dev mode. Displayed as "🔧 local-dev".

## Filter UI

The workshop overview page shows a horizontal row of filter chips above the workshop cards:

- No "Alle" button — tapping the active filter chip deselects it (shows all)
- Computed labels (`active`, `local-dev`) always appear first
- Then top-level labels sorted alphabetically
- When a filter is active, its sub-labels appear as additional chips
- Only one filter active at a time (single-select)
- Each chip shows the count of matching workshops
- Available chips narrow down to labels present in the filtered results (plus the active filter itself, so it can be deselected)

## Workshop Cards

Each workshop card shows its labels as small clickable chips between the title and description:

- Clicking a label chip on a card activates that filter (same as the top chips)
- The "Aktiv" label has a ✕ button to deactivate without filtering
- Heart (favorite) and copy link buttons are grouped on the right side of the card title
- No "Remove" button on cards (workshop sources are managed elsewhere)

## No Default Filter

On page load, no filter is selected — all workshops are shown. There is no default category filter. This ensures new users see everything available.

## Dev Mode: Automatic "local-dev" Label

Workshops loaded from sibling directories (`../workshop-*`) automatically receive the label `local-dev`. This requires no configuration from the developer. Local workshops appear alongside their remote counterparts, with titles prefixed by 🔧.

## Data Flow

1. Workshop creator adds `labels: [...]` to their `workshops.yaml`
2. `parseSource()` includes labels in the parsed workshop object
3. `loadContentSource()` and `loadLocalWorkshops()` store labels in `workshopMeta`
4. Local dev workshops get `local-dev` appended to their labels array
5. Workshop overview collects labels from filtered workshops
6. Filter chips are rendered from visible labels at the appropriate hierarchy level
7. Selecting a chip filters workshops and narrows available label chips
