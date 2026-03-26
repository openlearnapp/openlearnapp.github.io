# Workshop Filters

**Issue: [#90](https://github.com/openlearnapp/openlearnapp.github.io/issues/90)**

## Purpose

Allow learners to filter workshops by category labels. Workshop creators tag their workshops with labels like "Sprache", "IT", "Kids". The workshop overview page shows filter chips to narrow the list. In dev mode, local workshops are automatically tagged with "local-dev" so developers can quickly find their local versions.

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

Labels support hierarchy using `/` as separator. Top-level labels (without `/`) act as categories. Sub-labels (with `/`) appear when their parent category is filtered:

- `"IT"` — top-level category, always visible
- `"IT/Linux"`, `"IT/Docker"` — sub-labels, only shown when "IT" is active
- Filtering by `"IT"` matches workshops with `"IT"` or any `"IT/*"` sub-label
- Sub-labels are displayed without their prefix (e.g. "Linux" instead of "IT/Linux")

## Filter UI

The workshop overview page shows a horizontal row of filter chips above the workshop cards:

- Computed labels (`active`, `local-dev`) always appear first
- One chip per unique label found across visible workshops
- By default, only top-level labels are shown (no `/` in name)
- When a filter is active, its sub-labels appear as additional chips
- Tapping a chip filters the list; tapping again deselects
- Only one filter active at a time (single-select)
- The count of matching workshops is shown next to the chip

## Dev Mode: Automatic "local-dev" Label

Workshops loaded from sibling directories (`../workshop-*`) automatically receive the label `local-dev`. This requires no configuration from the developer. The label appears as a filter chip with the 🔧 icon, making it easy to toggle between viewing all workshops and only local ones.

## Data Flow

1. Workshop creator adds `labels: [...]` to their `workshops.yaml`
2. Platform reads labels during content source loading and stores them in `workshopMeta`
3. Workshop overview collects all unique labels from visible workshops
4. Filter chips are rendered from this set
5. Selecting a chip filters the `workshops` computed to only matching entries

## No Default Filter

On page load, "Alle" is selected — all workshops are shown. There is no default category filter. This ensures new users see everything available.
