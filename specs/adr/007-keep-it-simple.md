# ADR 007: Keep It Simple

## Status
Accepted

## Context
Learning platforms tend to grow complex: user management, course builders, gamification, social features, admin dashboards. This complexity raises the barrier for contributors and makes the codebase harder to maintain.

## Decision
**Prioritize simplicity** in all technical and design decisions.

Guiding principles:
- **No build-time content processing** — lessons are YAML files fetched at runtime
- **No user accounts** — progress stored locally (until GunDB, Issue #27)
- **No admin interface** — content is managed via files and git
- **No component library** — pure Tailwind CSS (until shadcn-vue migration, Issue #26)
- **Minimal dependencies** — 4 runtime deps (vue, vue-router, js-yaml, marked)
- **Single-file composables** — each concern in one file, no abstractions over abstractions
- **Convention over configuration** — folder structure implies content structure

## Consequences

**Benefits:**
- Low barrier to entry for contributors
- Fast to deploy and iterate
- Easy to understand the entire codebase
- Works without internet (once loaded)
- Can be forked and customized quickly

**Trade-offs:**
- Some features are more manual (no drag-and-drop lesson builder)
- Content authoring requires YAML knowledge
- No real-time collaboration
- Some code duplication (acceptable over premature abstraction)

## When to Add Complexity
Only add complexity when:
1. A real user need exists (not hypothetical)
2. The simple solution has been tried and proven insufficient
3. The added complexity is documented (ADR) and tested
