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

Once the issue direction is agreed upon, write a spec. This can be:

- A concept document in `docs/` (e.g., `docs/coach-agent-concept.md`)
- A detailed issue description with acceptance criteria
- An ADR in `docs/adr/` for architectural decisions

A good spec answers:

- **What** exactly will be built? (scope)
- **What not?** (explicit exclusions)
- **How** does it work from the user's perspective? (user flow)
- **What changes** in the codebase? (files, routes, composables)
- **How do we verify** it works? (acceptance criteria, test plan)
- **What are the dependencies?** (other issues, existing features)

### 3. Review — Get Agreement Before Coding

The spec is reviewed before implementation starts. This is the checkpoint where we align on:

- Is this the right solution?
- Is the scope appropriate for one PR?
- Are there architectural concerns?
- Are dependencies met?

A spec can be reviewed as:
- A PR that adds a `docs/` concept file
- Comments on the GitHub Issue
- A conversation in the team

**Only start coding after the spec is reviewed and approved.**

### 4. Implement — One Feature, One PR

Create a PR that implements the approved spec:

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

## Concept Documents

Concept docs live in `docs/` and describe ideas that are not yet approved for implementation. They are proposals, not commitments. A concept doc becomes a spec when it's reviewed and scoped into concrete work.

Examples:
- `docs/coach-agent-concept.md` — what a coach integration could look like
- `docs/kids-mode-concept.md` — ideas for a kids-friendly mode

## Checklist

Before opening a PR, check:

- [ ] Is there an approved spec or issue for this work?
- [ ] Is the PR scoped to one feature or fix?
- [ ] Are tests included for new logic?
- [ ] Are docs updated where needed?
- [ ] Is CHANGELOG.md updated?
- [ ] Does `pnpm build` pass?
