# Burger Menu

## Purpose

Consolidate secondary navigation items (Settings, Profile) into a burger menu to reduce top bar clutter, especially on mobile. Action items like Play/Pause and Story Mode stay in the top bar for one-click access.

## Requirements

### Menu Button

- Hamburger icon (three horizontal lines) in the top-right corner
- Visually distinct from the lesson overview icon (numbered button) and settings gear
- Same styling as other nav buttons (rounded, semi-transparent)
- Visible on all pages except Home

### Menu Items

The burger menu contains navigation-only items:

| Item | Icon | Condition |
|------|------|-----------|
| Settings | Gear | Always |
| Profile | Avatar/User | Always |
| Coach | TV/Monitor | When `coach.api` exists |

### Items that stay in the top bar (NOT in the menu)

These are action items that need one-click access:

- Play/Pause (audio control)
- Story Mode (content mode toggle)
- Learning Items / Results toggle (content navigation)
- Mobile toggle button (cycles views)

### Behavior

- Click hamburger icon → dropdown opens below the button
- Click outside or click an item → dropdown closes
- Menu items navigate to their respective pages
- On Settings/Profile page: menu still accessible, current page highlighted

### Responsive

- **Mobile**: Burger menu replaces the individual Settings and Profile buttons, saving space
- **Desktop**: Same burger menu, consistent experience

## i18n

New keys needed in all 4 language files (de, en, ar, fa):

- `nav.menu` — Menu button label
- `nav.closeMenu` — Close menu label (for accessibility)

## Out of Scope

- Nested submenus
- Animations beyond simple fade
- Moving Learning Items or Results into the menu
