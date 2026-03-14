# ADR 004: Hash-Based Routing for GitHub Pages

## Status
Accepted

## Context
Single-page applications need client-side routing. GitHub Pages doesn't support server-side URL rewriting, so direct links to routes like `/deutsch/portugiesisch/lessons` return a 404.

## Decision
Use **hash-based routing** (`createWebHashHistory` in Vue Router).

All routes use the `#/` prefix:
- `#/` — Home
- `#/:learning/:workshop/lessons` — Lessons overview
- `#/:learning/:workshop/lesson/:number` — Lesson detail
- `#/:learning/:workshop/items/:number?` — Learning items
- `#/settings` — Settings
- `#/add?source=URL` — Add external source

## Consequences

**Benefits:**
- Works on GitHub Pages without any server configuration
- Works on any static file hosting (S3, IPFS, local file://)
- No 404 issues with direct links or page refreshes
- Simple deployment — just upload files

**Trade-offs:**
- URLs contain `#` (less clean than history mode)
- Hash fragment not sent to server (irrelevant for static hosting)
- SEO impact (irrelevant for a learning app with user-generated progress)

## Related
- ADR 001: Frontend-only architecture
- Vite config: `base: '/open-learn/'` for GitHub Pages subdirectory
