# Builtin Workshops — Media & Image Concept

This document defines the purpose, structure, and media strategy for the two builtin workshops: **Open Learn Guide** and **Open Learn Feedback**. It describes what kind of image or video should be used at each content level to create a compelling, professional user experience.

## Design Principles

1. **Screenshots for UI-specific context** — only where we explain a specific screen or feature
2. **Illustrations / graphics for concepts** — when explaining ideas, workflows, or abstract features
3. **Icons or minimal graphics for examples** — small, meaningful visuals that support the question without overwhelming the card
4. **Consistency** — same visual style across both workshops and all languages
5. **Purpose over decoration** — every image should help the user understand something, not just fill space

---

## Image Hierarchy Overview

| Level | Display | Ideal Image Type |
|-------|---------|-----------------|
| **Workshop thumbnail** | Card on home page (h-36 banner) | Branded illustration representing the workshop's purpose |
| **Lesson image** | Card in overview + header in detail | Key visual summarizing the lesson topic |
| **Section image** | Above explanation, full-width with lightbox | Contextual: screenshot OR concept illustration |
| **Example image** | Rightbound thumbnail next to Q&A text | Small, focused icon or cropped screenshot |
| **Assessment image** | Rightbound thumbnail next to question | Visual hint related to the question |

---

## Workshop 1: Open Learn Guide

**Purpose**: Onboard new users. Explain how the platform works, how to navigate, track progress, and create workshops.

**Tone**: Friendly, clear, educational. Like a product tour.

**Color**: Blue primary (`220 75% 50%`)

### Workshop Thumbnail

**Current**: Screenshot of lessons overview (generic)
**Idea**: Custom illustration — a stylized Open Learn logo with learning symbols (lightbulb, book, checkmark). Should feel inviting and say "start here". Blue-themed to match the workshop color.

---

### Lesson 1: Welcome to Open Learn

**Purpose**: First contact. Explain what Open Learn is and let users try the core features.

**Lesson Header Image**
- **Current**: Screenshot of the lesson page itself (recursive, not ideal)
- **Idea**: Welcoming hero illustration — e.g. a person at a laptop with floating Q&A cards, labels, and a progress bar. Communicates "this is a learning platform".

#### Section 1.1: What is Open Learn?

**Section Image**
- **Current**: Screenshot of home page ✅ (appropriate — shows the actual product)
- **Keep**: Yes, a real screenshot of the home page is the right choice here

**Example Images** (4 Q&A cards):
| Example | Current | Idea |
|---------|---------|------|
| "Where does Open Learn store my progress?" | None | Small icon: browser/lock symbol (privacy) |
| "Do I need an account?" | None | Small icon: no-login symbol (crossed-out user icon) |
| "Can I use Open Learn offline?" | None | Small icon: wifi-off symbol |
| "What kind of content can I learn?" | None | Small icon: grid of topics (language flag, math symbol, book) |

#### Section 1.2: Features at a Glance

**Section Image**
- **Current**: Screenshot of Q&A cards ✅ (shows exactly what we're explaining)
- **Keep**: Yes

**Example Images** (4 Q&A cards):
| Example | Current | Idea |
|---------|---------|------|
| "What are Q&A cards?" | None | Small screenshot crop: a single Q&A card |
| "What are labels?" | None | Small screenshot crop: label badges on a card |
| "What are learning items?" | None | Small screenshot crop: learning item badges with checkmarks |
| "What are assessments?" | None | Small screenshot crop: an assessment input field |

#### Section 1.3: Check Your Understanding

**Section Image**
- **Current**: Screenshot of assessments ✅ (matches the interactive content)
- **Keep**: Yes

**Assessment Images** (3 assessments):
| Assessment | Current | Idea |
|------------|---------|------|
| Input: "Where does Open Learn save your progress?" | None | Small icon: database/storage symbol |
| Select: "What do you need to start using Open Learn?" | None | Small icon: open door / "free entry" symbol |
| Multiple-choice: "Which are actual Open Learn features?" | None | Small icon: checklist with checkmarks |

---

### Lesson 2: Using the Platform

**Purpose**: Practical how-to. Navigation, progress tracking, settings, audio/video.

**Lesson Header Image**
- **Current**: Screenshot (recursive)
- **Idea**: Illustration of the platform's three navigation levels — home → lessons → detail — as a visual flow/journey

#### Section 2.1: Navigation

**Section Image**
- **Current**: Screenshot of lessons overview ✅ (shows the navigation context)
- **Keep**: Yes

**Example Images** (3 Q&A cards):
| Example | Current | Idea |
|---------|---------|------|
| "How do I get back to the lesson list?" | None | Small screenshot crop: back button in nav bar |
| "Can I share a link to a specific lesson?" | None | Small icon: link/share symbol |
| "What does the home page show?" | None | Small screenshot crop: home page workshop cards |

#### Section 2.2: Progress & Labels

**Section Image**
- **Current**: Screenshot of Q&A cards with learning items ✅
- **Keep**: Yes

**Example Images** (3 Q&A cards):
| Example | Current | Idea |
|---------|---------|------|
| "How do I mark something as learned?" | None | Small screenshot crop: learning item badge being tapped (before/after) |
| "Can I filter cards by label?" | None | Small screenshot crop: label filter in action |
| "What happens if I clear my browser data?" | None | Small icon: warning/trash symbol |

#### Section 2.3: Settings

**Section Image**
- **Current**: Screenshot of settings page ✅
- **Keep**: Yes

**Assessment/Example Images**:
| Example | Current | Idea |
|---------|---------|------|
| Multiple-choice: "Which can you customize in Settings?" | None | Small screenshot crop: settings toggles |
| "What does 'Show answers' do?" | None | Small icon: eye/visibility symbol |
| "What does 'Hide learned examples' do?" | None | Small icon: filter/funnel symbol |

#### Section 2.4: Videos & Audio

**Section Image**
- **Current**: No image (has YouTube video embed instead) ✅
- **Keep**: Yes — the video IS the visual

**Example Images** (3 cards):
| Example | Current | Idea |
|---------|---------|------|
| "What video formats does Open Learn support?" | None | Small icon: play button / video player |
| "How does the audio system work?" | None | Small icon: speaker/headphones |
| Select: "Where can you change the audio playback speed?" | None | Small icon: speed/gauge symbol |

---

### Lesson 3: Create Your Own Workshop

**Purpose**: Technical guide for workshop creators. YAML structure, schema, publishing.

**Lesson Header Image**
- **Current**: Screenshot (recursive)
- **Idea**: Illustration of the creation flow — YAML code on the left transforming into a colorful workshop card on the right. "Code to content" visual.

#### Section 3.1: Folder Structure

**Section Image**
- **Current**: Screenshot of the section itself (recursive, not ideal)
- **Idea**: Clean folder tree diagram — styled as a graphic, not a screenshot. Shows the hierarchy: `lessons/ → language/ → workshop/ → lesson/ → content.yaml` with color-coded file types.

**Example Images** (6 Q&A cards):
| Example | Current | Idea |
|---------|---------|------|
| "What file lists all lessons?" | None | Small icon: list/file symbol for lessons.yaml |
| "What file contains the actual learning content?" | None | Small icon: document symbol for content.yaml |
| "Can a workshop have audio and video?" | None | Small icon: speaker + play button |
| "How can I customize the colors?" | None | Small icon: color palette / paint brush |
| "What do 'color' and 'primaryColor' control?" | None | Small screenshot crop: workshop card showing accent bar + header |
| "What does a workshops.yaml with colors look like?" | None | Small code snippet preview (styled) |

#### Section 3.2: Writing a Lesson

**Section Image**
- **Current**: Screenshot of the section (recursive)
- **Idea**: Side-by-side: YAML code on the left → rendered lesson on the right. Shows the transformation.

**Example Images** (3 Q&A cards):
| Example | Current | Idea |
|---------|---------|------|
| "What does the 'number' field do?" | None | Small icon: numbered list (1, 2, 3) |
| "What is the 'rel' field for?" | None | Small icon: connected nodes / vocabulary symbol |
| "What Markdown features work in explanations?" | None | Small icon: Markdown logo or bold/italic formatting |

#### Section 3.3: Assessment Types

**Section Image**
- **Current**: Screenshot of the assessment section (recursive)
- **Idea**: Three-panel illustration showing the three assessment types side by side: text input field, radio buttons, checkboxes. Clean, diagrammatic.

**Assessment Images** (3 assessments):
| Assessment | Current | Idea |
|------------|---------|------|
| Input: "What YAML field sets the assessment type?" | None | Small code snippet: `type: input` |
| Select: "Which assessment type uses radio buttons?" | None | Small icon: radio button group |
| Multiple-choice: "Which fields are required?" | None | Small icon: checkbox group |

#### Section 3.4: Publishing

**Section Image**
- **Current**: Screenshot (recursive)
- **Idea**: Illustration showing three publishing paths: GitHub logo → GitHub Pages, globe → external URL, IPFS logo → decentralized. A "choose your path" visual.

**Example Images** (3 cards):
| Example | Current | Idea |
|---------|---------|------|
| "What's the easiest way to publish?" | None | Small icon: GitHub logo + rocket |
| "Can I host a workshop on my own server?" | None | Small icon: server/cloud symbol |
| Select: "What happens when you push to main?" | None | Small icon: GitHub Actions / deploy symbol |

---

## Workshop 2: Open Learn Feedback

**Purpose**: Collect user feedback. Pure survey — no correct answers, no teaching.

**Tone**: Conversational, low-pressure. "We'd love to hear from you."

**Color**: Green primary (`152 60% 36%`)

### Workshop Thumbnail

**Current**: Screenshot (same as guide — generic)
**Idea**: Custom illustration — speech bubbles, stars, feedback symbols. Green-themed. Should feel like "your voice matters".

---

### Lesson 1: Open Learn — Your Feedback

**Lesson Header Image**
- **Current**: Screenshot (recursive)
- **Idea**: Illustration of diverse feedback — speech bubbles, emoji reactions (thumbs up, lightbulb, heart), a megaphone. Warm, inviting.

#### Section 1.1: First Impressions

**Section Image**
- **Current**: Screenshot of the survey section ✅ (shows what they'll interact with)
- **Alternative**: Illustration of a first-impression moment — person opening a laptop, seeing the platform for the first time

**Assessment Images**:
| Assessment | Current | Idea |
|------------|---------|------|
| Select: "How did you discover Open Learn?" | Screenshot of select card | Small icon: magnifying glass / discovery symbol |
| Select: "What is your overall first impression?" | None | Small icon: star rating / impression symbol |
| Input: "What makes Open Learn different?" | None | Small icon: lightbulb / unique idea |

#### Section 1.2: How Would You Use It?

**Section Image**
- **Current**: Screenshot ✅
- **Alternative**: Illustration grid of use cases — language flags, math symbols, graduation cap, cooking pot

**Assessment Images**:
| Assessment | Current | Idea |
|------------|---------|------|
| Multiple-choice: "What would you most like to learn?" | Screenshot of MC card | Small icon: grid of topic symbols |
| Select: "Would you create your own workshop?" | None | Small icon: pencil / creation symbol |
| Input: "What specific topic would you love?" | None | Small icon: thought bubble |

#### Section 1.3: Features & Wishes

**Section Image**
- **Current**: Screenshot ✅
- **Alternative**: Illustration of a feature wishlist — checklist with some items checked, some with stars

**Assessment Images**:
| Assessment | Current | Idea |
|------------|---------|------|
| Multiple-choice: "Which features are most important?" | None | Small icon: ranking/priority bars |
| Select: "How important is free & open-source?" | None | Small icon: open-source symbol / heart |
| Input: "What feature do you wish existed?" | None | Small icon: magic wand / wish star |
| Input: "Any other thoughts?" | None | Small icon: speech bubble |

#### Section 1.4: About You (Optional)

**Section Image**
- **Current**: Screenshot ✅
- **Alternative**: Illustration of user personas — silhouettes representing student, teacher, developer, hobbyist

**Assessment Images**:
| Assessment | Current | Idea |
|------------|---------|------|
| Select: "What best describes you?" | None | Small icon: person with role badge |
| Select: "How tech-savvy are you?" | None | Small icon: skill level meter |
| Select: "Would you recommend Open Learn?" | None | Small icon: share/recommend symbol |

---

## Implementation Priority

### Phase 1: Replace recursive screenshots (high impact, low effort)
Lesson header images and section images in Lesson 3 currently show screenshots of themselves. Replace with:
- Lesson headers: Meaningful hero images or illustrations
- Lesson 3 sections: Diagrams and concept illustrations instead of self-referencing screenshots

### Phase 2: Add example-level images to Guide workshop (medium impact)
Add small, focused images to Q&A cards and assessments in all 3 guide lessons. Prioritize:
- Feature explanation cards in Lesson 1 (cropped screenshots of specific UI elements)
- Assessment cards across all lessons (concept icons)

### Phase 3: Replace screenshots with illustrations (high impact, high effort)
Create custom illustrations for:
- Workshop thumbnails (branded, distinctive)
- Lesson headers (hero images)
- Concept sections in Lesson 3 (folder structure, publishing paths)

### Phase 4: Feedback workshop polish
Replace section screenshots with warmer, more inviting illustrations that match the conversational survey tone.

---

## Image Specifications

| Level | Recommended Size | Format | Notes |
|-------|-----------------|--------|-------|
| Workshop thumbnail | 1280×400 | PNG | Landscape banner, displayed at h-36 |
| Lesson header | 1280×400 | PNG | Landscape, displayed at max-h-64 with object-cover |
| Lesson card thumbnail | 1280×400 | PNG | Same as header (reused) |
| Section image | 1280×600 | PNG | Full-width, max-h-96, click-to-zoom lightbox |
| Example/Assessment image | 320×320 | PNG | Small square-ish, displayed at w-32/w-40 rightbound |

All images should work in both light and dark mode. Use neutral backgrounds or transparency where possible.
