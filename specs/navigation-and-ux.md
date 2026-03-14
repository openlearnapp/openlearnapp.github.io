# Navigation & UX

## Purpose

Provide a clear, consistent, and mobile-friendly interface that lets learners move between workshops, lessons, and learning tools without friction.

## Page Structure

The platform is organized into the following pages:

| Page | What it shows |
|------|---------------|
| **Home** | Landing page with platform introduction, feature highlights, and language selection. |
| **Workshop Overview** | Workshop cards for the selected language, with language switcher. |
| **Lessons Overview** | Lesson cards for a specific workshop, displayed as a grid. |
| **Lesson Detail** | Full lesson content: sections, explanations, examples, assessments, and audio controls. |
| **Learning Items** | Vocabulary and concept browser with filtering by lesson and learned/unlearned status. |
| **Assessment Results** | Performance overview across all lessons in a workshop. |
| **Coach** | Interaction with an external coach, if configured for the workshop. |
| **Settings** | App preferences, dark mode, data export/import, and coach consent. |

## Context-Aware Navigation Bar

The top navigation bar adapts to the current page:

- **Dynamic title**: Shows the platform name on Home, the workshop name on overview pages, and the lesson title on detail pages.
- **Back button**: Appears on all pages except Home. Navigates contextually — from Lesson Detail back to Lessons Overview, from Lessons Overview back to Workshop Overview.
- **Right-side actions**: Change per page. May include Settings, Play/Pause (for audio), Learning Items, Results, and Coach buttons depending on context.
- **Language dropdown**: Available on the Workshop Overview page for switching interface language.
- **Home page**: The navbar is hidden on the Home page for a cleaner landing experience.

## Workshop Favorites and Sorting

Learners can mark workshops as favorites. Favorited workshops appear at the top of the workshop list, making it fast to access frequently used content. Workshops can also be sorted to match the learner's preference.

## Dark Mode

A dark theme is available and can be toggled from the Settings page. The preference is persisted across sessions. All pages, cards, and interactive elements adapt to the selected theme.

## Responsive Design

The interface works across screen sizes:

- **Mobile**: Single-column layouts, touch-friendly controls, floating play/pause button positioned at the bottom-right corner.
- **Desktop**: Multi-column grids (2-3 columns) for workshop and lesson cards, inline audio controls in the navbar.

All interactive elements — assessments, learning item toggles, audio controls — are designed for touch input.

## Label Filtering

Labels (tags like grammar categories or topic markers) can be used to filter content across views. When a label filter is active:

- Only examples matching the selected label are shown in Lesson Detail.
- Audio playback respects the filter, playing only filtered examples.
- The filter applies consistently wherever examples are displayed.

## Table of Contents

Lesson Detail pages include a table of contents for quick navigation to specific sections within a lesson. This is especially useful for longer lessons with many sections.

## Footer

The platform includes a footer with relevant links, providing access to additional resources and information about the project.

## Deep Linking

Every page has a stable URL using hash-based routing. Direct links to specific workshops, lessons, or learning items work without requiring prior navigation. This supports bookmarking and sharing of specific content.
