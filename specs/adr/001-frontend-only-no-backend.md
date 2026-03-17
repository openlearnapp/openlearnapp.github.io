# ADR 001: Frontend-Only Architecture — No Backend

## Status
Accepted

## Context
Open Learn needs to be easy to deploy, maintain, and extend. Many learning platforms require server infrastructure for user management, data storage, and content delivery. This adds complexity, cost, and operational burden.

## Decision
Open Learn is a **purely static frontend application** with no backend server.

- All logic runs in the browser
- Content (YAML lessons) is served as static files
- User data is stored in the browser's localStorage
- The app is deployed as static files to GitHub Pages
- No database, no server-side rendering, no API server

## Consequences

**Benefits:**
- Zero infrastructure cost (GitHub Pages is free)
- No server maintenance or scaling concerns
- Works offline once loaded (content cached by browser)
- Easy to fork and deploy — just static files
- Privacy: user data never leaves the browser (unless coach consent is given)

**Trade-offs:**
- No cross-device sync out of the box (addressed by GitHub Issue #27 with GunDB)
- localStorage has a ~5MB limit per origin
- No server-side validation of assessment answers
- Content updates require redeployment or external hosting

## Related
- ADR 002: localStorage for persistence
- ADR 006: Coach as optional external service
- GitHub Issue #27: GunDB for distributed sync
