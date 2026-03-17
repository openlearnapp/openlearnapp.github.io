# ADR 006: Coach as Optional External Service

## Status
Accepted

## Context
Workshop creators may want to collect learner answers for feedback, grading, or analytics. Building this into the platform would require a backend (contradicting ADR 001). The solution needs to be optional and privacy-respecting.

## Decision
The **coach is an optional external service** defined per workshop, not part of the platform itself.

- Workshops define a `coach` field in their lesson YAML with an API endpoint
- The platform queues answers and sends them as batches to that endpoint
- Users must explicitly opt-in via a consent toggle in Settings
- The platform never collects data itself

## How It Works
1. Lesson YAML defines: `coach: { api: "https://...", name: "Coach Name" }`
2. User enables consent in Settings (`coachConsent: true`)
3. Assessment answers are queued in-memory as user submits them
4. Batch sent via manual button, on lesson navigation, or on page close (sendBeacon)
5. Coach can accept (200) or reject (401 with optional `enrollUrl`)

## Consequences

**Benefits:**
- Platform stays backend-free
- Workshop creators control their own coach infrastructure
- Privacy by default — data only sent with explicit consent
- Flexible — coach can be a simple email relay, an AI agent, or a grading system
- Future: Service Agent integration (Issue #28) fits naturally

**Trade-offs:**
- No built-in analytics or grading dashboard
- Coach API must handle CORS
- No retry mechanism for failed submissions
- sendBeacon fallback is fire-and-forget (no error handling)

## Related
- ADR 001: Frontend-only (coach is external, not part of the platform)
- GitHub Issue #28: Connect to Service Agent as intelligent coach
- GitHub Issue #30: Track submission history on results page
