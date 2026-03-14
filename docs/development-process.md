# Development Process

This project follows a **spec-driven development process**. Every feature goes through a defined sequence: from idea to spec to review to implementation. Code without a reviewed spec will not be merged.

## Why Spec-Driven?

- **Alignment before effort** — we agree on *what* and *why* before writing code
- **Better PRs** — small, focused, reviewable, with clear acceptance criteria
- **Less wasted work** — no building features that get rejected or need complete rework
- **Shared understanding** — everyone can follow along, not just the person writing code

## The Process

### 1. Issue — Describe the Problem or Idea

Open a GitHub Issue that explains:

- **What** is the problem or opportunity?
- **Why** does it matter for users?
- **Who** benefits (learner, instructor, platform)?

Keep it short. This is a conversation starter, not a final spec. If you're unsure about the direction, say so — ask questions, propose alternatives.

**Do not start coding at this stage.**

### 2. Spec — Define the Solution

Once the issue direction is agreed upon, write a spec as a Markdown file in the `specs/` folder — one file per feature or topic.

**Naming convention:** `specs/<feature-name>.md` (e.g., `specs/coach-agent.md`, `specs/user-profile.md`)

A good spec answers:

- **What** exactly will be built? (scope)
- **What not?** (explicit exclusions)
- **How** does it work from the user's perspective? (user flow)
- **What changes** in the codebase? (files, routes, composables)
- **How do we verify** it works? (acceptance criteria, test plan)
- **What are the dependencies?** (other issues, existing features)

### 3. Spec PR — Review Before or With Implementation

The spec is submitted as a PR. There are two valid workflows:

**Option A — Spec first, then implement:**
1. Open a PR that only adds the `specs/` file
2. Get the spec reviewed and approved
3. Open a separate PR with the implementation

**Option B — Spec and implementation together:**
1. Open a PR that includes both the `specs/` file and the implementation
2. The spec is reviewed as part of the code review

Both are fine. The key rule: **every feature PR must include a spec in `specs/`**.

The spec review checks:
- Is this the right solution?
- Is the scope appropriate for one PR?
- Are there architectural concerns?
- Are dependencies met?

### 4. Implement — One Feature, One PR

Create a PR that implements the approved spec (or includes the spec — see step 3):

- **One feature per PR** — don't bundle unrelated changes
- **Reference the issue** — `feat: coach chat UI (Issue #7)`
- **Include tests** for new logic
- **Update docs** if the feature changes how things work (CLAUDE.md, README, feature docs)
- **Update CHANGELOG.md** with an entry under the current date

### 5. Review — Code Review

The PR is reviewed for:

- Does it match the spec?
- Is the code clean and consistent with the project?
- Are there tests?
- Is the scope contained (no scope creep)?

## What Belongs in a Single PR?

**Good** — focused, reviewable:
- One feature (e.g., "coach chat UI")
- One bugfix (e.g., "audio skips missing files")
- One docs update (e.g., "add kids mode concept")

**Bad** — too broad, hard to review:
- Feature + unrelated bugfix + new concept doc + another feature
- Multiple issues addressed in one PR
- Code that depends on uncomitted/unreviewed work

## Bugfixes

Small bugfixes don't need a full spec. But they still need:

- A clear issue or PR description (what was broken, what's fixed)
- A test if the bug is non-trivial
- Their own PR (don't bundle with features)

## Specs, ADRs, and Docs

This project separates product truth from development documentation:

### `specs/` — Product Specifications (Source of Truth)

Each spec describes what a feature **should be** — regardless of whether it is already implemented or still planned. Specs are the single source of truth for product decisions.

- **One file per feature**: `specs/<feature-name>.md`
- **Every feature PR must include a spec** in `specs/`
- Specs are living documents — they are updated as the feature evolves

### `specs/adr/` — Architecture Decision Records

ADRs document fundamental technical decisions that affect the entire project. They are numbered sequentially (`001-`, `002-`, ...) and rarely change once written.

Use an ADR when:
- A decision constrains future implementation choices (e.g., "no backend", "localStorage only")
- The reasoning behind a choice needs to be preserved (e.g., "why hash-based routing?")
- Reversing the decision would require significant rework

Use a spec (not an ADR) when:
- Describing a product feature or user-facing behavior
- The document will evolve as the feature grows

### `docs/` — Development Documentation

How-to guides for developers and workshop creators. Not product truth, but practical reference:
- How to set up the dev environment
- How to create a workshop
- How to use the audio system
- Development process (this document)

## Checklist

Before opening a PR, check:

- [ ] Is there a spec in `specs/` for this feature?
- [ ] Is the PR scoped to one feature or fix?
- [ ] Are tests included for new logic?
- [ ] Are docs updated where needed?
- [ ] Is CHANGELOG.md updated?
- [ ] Does `pnpm build` pass?
