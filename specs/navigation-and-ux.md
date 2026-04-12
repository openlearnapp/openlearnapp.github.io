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

Learners can mark workshops and lessons as favorites.

**Workshop sort order:** active → favorite → has image → source order. Toggling favorite or active re-sorts the list.

**Lesson sort order:** favorites first (by lesson number), then all others (by lesson number). Completed/done status has no effect on sort order.

## Dark Mode

A dark theme is available and can be toggled from the Settings page. The preference is persisted across sessions. All pages, cards, and interactive elements adapt to the selected theme.

## Mobile Navigation

On mobile, the top nav must be compact — max 3-4 small buttons on the right. Space is reserved for the title.

### Header layout (mobile)

```
[ 🇩🇪 ] [ Back ]     Title        [ Story ] [ Toggle ] [ ☰ ]
```

- **Left**: Language dropdown (workshop overview only) or back button
- **Center**: Dynamic title (truncated if needed)
- **Right**: Action buttons (compact, 40×40px)

### Header sizing

- Mobile: `py-2` (slimmer)
- Desktop: `py-4`
- iOS PWA: separate safe-area spacer div above the header to push content below the status bar. The header uses `top: env(safe-area-inset-top)` for sticky positioning.

### Right-side buttons (mobile)

| Button | When visible | Icon |
|--------|-------------|------|
| **Story mode** | Lesson detail + lessons overview | Book (open book SVG) |
| **Toggle** | Lesson detail, lessons overview, items, results | Cycles between views (see below) |
| **Burger menu** | Always (except home) | Hamburger → X when open |

### Toggle button cycle (mobile)

One button replaces the individual Items/Results/Lesson buttons on desktop. It cycles through views, showing the icon for the **next** view:

| Current page | Icon shown | Tap goes to |
|-------------|-----------|-------------|
| Lesson detail | List (lines) | Learning items |
| Lessons overview | List (lines) | Learning items |
| Learning items | Clipboard | Assessment results |
| Assessment results | Lesson number or "123" | Back to lesson / lessons overview |

### Icon Component (`src/components/Icon.vue`)

All icons are defined in a central `Icon.vue` component. No inline SVGs — every icon is referenced by name:

```html
<Icon name="story" />
<Icon name="items" />
<Icon name="results" />
<Icon name="play" />
```

The Icon component:
- Renders an SVG with consistent size, stroke, and `pointer-events-none`
- Single source of truth — change an icon in one place, updates everywhere
- Available icons: `menu`, `close`, `story`, `items`, `results`, `lessons`, `workshops`, `play`, `pause`, `loading`, `settings`, `profile`, `coach`, `eye`, `eye-off`, `link`, `heart`, `check`, `wifi-off`, `chevron-down`, `back`

### Icon inventory

Each icon must be visually distinct. No two buttons share the same icon.

| Function | Icon name | Description |
|----------|-----------|-------------|
| **Story mode** | `story` | Open book (two pages) |
| **Learning items** | `items` | Flashcard (rectangle with divider) |
| **Results** | `results` | Clipboard with checklist |
| **Back to lesson** | — | Lesson number (text), or "123" |
| **Play/Pause** | `play` / `pause` | Standard media controls |
| **Loading** | `loading` | Arc spinner (NOT spinning) |
| **Burger menu** | `menu` / `close` | Three lines → X |
| **Settings** | `settings` | Gear |
| **Profile** | `profile` | Person silhouette |
| **Coach** | `coach` | Robot |

Desktop toggle buttons (Results, Items) must also cycle their icons:
- On the target page → show lesson number or "123" (to go back)
- On lesson/overview → show the target icon (flashcard / clipboard)

### Floating play button (mobile)

The play/pause button is a **floating action button** on lesson detail pages (mobile only):

- Position: `fixed bottom-20 right-6`
- Size: `w-12 h-12` (48px, with border)
- Style: `bg-primary text-white border-2 border-primary-foreground/30`
- SVG icons (not emoji) for proper centering
- Visible when audio is available or loading
- Loading state: hourglass emoji ⏳ (static, NOT spinning)
- Hidden on desktop (play button is in the top nav instead)

### Desktop right-side buttons

On desktop (`md:` breakpoint and up), individual buttons are shown:

| Button | When visible |
|--------|-------------|
| Play/Pause | Lesson detail |
| Story mode | Lesson detail + lessons overview |
| Results toggle | Lesson detail, items, results |
| Items toggle | Lesson detail, items, results |
| Burger menu | Always |

### Burger menu

Replaces individual Settings/Profile/Workshops buttons. Contains:
- Settings (gear icon)
- Profile (person icon)
- Workshops (grid icon, only on subpages)
- Coach (robot icon, only when workshop has coach)
- Version info at the bottom: `v1.0 · #192` (version + last merged PR)

### PWA behavior

- Home page is skipped in PWA — redirects to workshop overview
- Workshop back button hidden in single-workshop PWA
- Story mode X button always visible (exits to lessons overview)

## Responsive Design

The interface works across screen sizes:

- **Mobile**: Single-column layouts, touch-friendly controls, floating play/pause button positioned at the bottom-right corner.
- **Desktop**: Multi-column grids (2-3 columns) for workshop and lesson cards, inline audio controls in the navbar.

All interactive elements — assessments, learning item toggles, audio controls — are designed for touch input. Never use hover-only interactions — all controls must be always visible and tappable.

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
