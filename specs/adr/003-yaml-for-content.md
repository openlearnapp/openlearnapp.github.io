# ADR 003: YAML for Lesson Content

## Status
Accepted

## Context
Lesson content needs a format that is human-readable, easy to author, and supports nested structures (lesson → section → example → related items). Options considered: JSON, YAML, Markdown with frontmatter, custom DSL.

## Decision
Use **YAML** as the content format for all lesson data.

- Lessons are authored in `content.yaml` files
- Index files (`index.yaml`, `workshops.yaml`, `lessons.yaml`) organize the hierarchy
- Parsed at runtime with `js-yaml` library

## Consequences

**Benefits:**
- Human-readable and easy to edit (no quotes, no commas)
- Supports multi-line strings natively (for explanations)
- Supports comments (for content authors)
- Nested structures map naturally to lesson hierarchy
- Easy to validate and extend schema
- Well-supported by editors (syntax highlighting, linting)

**Trade-offs:**
- Requires a parser library (~50KB for js-yaml)
- Indentation-sensitive (can cause subtle errors)
- No native browser support (unlike JSON)
- Fetched as text and parsed client-side

## Schema Documentation
- `docs/lesson-schema.md` — individual lesson format
- `docs/yaml-schemas.md` — index file schemas

## Related
- ADR 001: Frontend-only (content served as static files)
- ADR 004: Hash-based routing (content paths match route structure)
