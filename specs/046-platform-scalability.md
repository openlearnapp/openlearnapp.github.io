# Platform Scalability

**Issue: [#46](https://github.com/openlearnapp/openlearnapp.github.io/issues/46)**

## Purpose

Open Learn should work for any instructor and any subject -- not just language learning. Science, math, law, music, programming, and any other topic should be teachable on the platform. This means making language-specific features optional, simplifying workshop creation for non-technical instructors, and providing a cross-workshop learner profile.

## The Problem Today

Audio and pronunciation features are deeply integrated into the platform, but they are irrelevant for non-language workshops like math or law. There is no simple way for an instructor without GitHub experience to create a workshop. Learners have no overview of their progress across multiple workshops from different creators.

## Features Made Optional Per Workshop

Every feature that is subject-specific becomes opt-in at the workshop level. Audio playback, pronunciation, labels, and other language-oriented features can be enabled or disabled by the workshop creator. A math workshop enables assessments but disables audio. A music workshop enables audio but uses it for listening exercises instead of pronunciation. No feature forces itself on a workshop where it is not relevant.

Existing workshops continue to work without any changes. Defaults remain as they are today.

## Simplified Workshop Creation

Instructors who do not use GitHub need a way to create workshops. A web-based form lets them enter questions and answers, which generates a valid YAML file they can download. The instructor hosts that file wherever they choose -- GitHub Pages, their own server, IPFS, or any static file host. This preserves the platform's architecture (no server dependency) while removing the Git/YAML knowledge barrier.

## Cross-Workshop Learner Profile

Learners who use multiple workshops from different creators get a unified view of their progress. GunDB (already in the project) stores progress, learned items, and assessment results across all workshops. The learner sees everything in one place without needing a central server. This connects to the user profile concept in Issue #48.

## What Does Not Change

The platform remains a static app. The YAML format stays the same. Existing workshops continue to work without modification. The architecture is extended, not replaced.

## Relationships to Other Work

- Connects to Issue #48 (user profile) for cross-workshop progress display
- Connects to Issue #7 (coach agent) as a bridge between instructor and learner
- Connects to Issue #16 (showcase workshops) as templates for new instructors

## Open Questions

- What is the right order to tackle these three pillars (optional features, simplified creation, cross-workshop profile)?
- How should the web-based workshop creator handle more advanced features like sections, labels, and images?
- Should there be a directory or marketplace where instructors can list their workshops?
