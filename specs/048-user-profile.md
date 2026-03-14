# User Profile and Instructor Dashboard

**Status: Concept** -- not yet approved for implementation.
**Issue: [#48](https://github.com/openlearnapp/openlearnapp.github.io/issues/48)**

## Purpose

Give every learner a personal profile showing their progress, active workshops, and a way to resume where they left off. Give workshop creators an instructor dashboard to manage and share their workshops. All of this without a central authentication server -- built on GunDB which is already in the project.

## Learner Profile

A learner's profile page shows their avatar (auto-generated from their username), display name, join date, and learning statistics such as total items learned, assessments completed, and learning streak. Below that, the profile lists all active workshops as cards, each showing a progress bar and the last lesson visited.

The profile avatar appears in the top-right corner of every page when the learner is logged in, replacing or sitting next to the settings icon. Tapping it navigates to the profile page.

## Continue Where You Left Off

Each workshop card on the profile includes a "Continue" button that takes the learner directly to the last lesson they were working on. The platform tracks the last visited lesson per workshop. This removes the friction of navigating back through menus to find where you stopped.

## Cross-Device Sync via GunDB

GunDB is already integrated for data sync. User profiles extend this: authentication uses GunDB's built-in user system (username and password, no email required), and progress data syncs across devices automatically. A learner can start on their phone and continue on their laptop without manual export/import.

Avatars are auto-generated from the username hash (identicon style), so no image upload is needed for MVP.

## Instructor Dashboard

Workshop creators who register as instructors get a dedicated dashboard. It shows their created workshops with links to the source repositories, a one-click share link for each workshop URL, coach configuration for their workshop's SA endpoint, and a count of how many learners have added their workshop.

Instructor status is a role flag in the GunDB user profile. Anyone can become an instructor -- no verification step is required for MVP.

## No Central Auth Server

The entire identity system runs on GunDB's peer-to-peer architecture. There is no central server handling authentication, no email verification, and no password reset flow that depends on a backend. This keeps the platform deployable as a static app while still providing user accounts and cross-device sync.

## Phased Approach

**Phase 1 -- Profile page and avatar.** Move login/register from the Settings page to a dedicated page. Build the profile page showing avatar, name, and active workshops with progress bars. Show the avatar in the navigation when logged in.

**Phase 2 -- Continue where you left off.** Track the last visited lesson per workshop. Show workshop cards on the profile with progress and a continue button.

**Phase 3 -- Instructor dashboard.** Add role selection on registration (learner or instructor). Build the instructor page with workshop management, share links, and coach setup.

## Open Questions

- Should public profiles be opt-in or opt-out?
- Should anyone be able to become an instructor, or is some form of verification needed?
- How should the coach use learner profile data for personalization?
