# Content System

## Purpose

The content system defines how learning material is structured, authored, and presented in Open Learn. It supports any subject -- languages, math, exam preparation -- through a flexible hierarchy of reusable building blocks.

## Content Hierarchy

All content is organized in five levels:

1. **Language** -- The interface language the learner already knows (e.g. German, English). All explanations and navigation appear in this language.
2. **Workshop** -- The subject being studied (e.g. Portuguese, Algebra, Driver License). A workshop lives under a language, so the same subject can be offered in multiple interface languages.
3. **Lesson** -- A single learning unit within a workshop, numbered for sequential progression (e.g. "01 - Essential Verbs").
4. **Section** -- A thematic group inside a lesson (e.g. "Ser vs. Estar"). Lessons typically contain 5-10 sections.
5. **Example** -- An individual question-and-answer pair within a section, optionally enriched with metadata.

## Content Types

### Explanations

Each section may include a rich-text explanation rendered from Markdown. Explanations introduce concepts, provide grammar rules, or give context before the examples.

### Q&A Examples

The core learning unit. Every example has a question (source prompt) and an answer (expected response). For language learning, the question is in the target language and the answer in the interface language.

### Labels

Examples can carry one or more labels (e.g. "Future Tense", "Passive Voice") that act as category tags. Labels are displayed as colored badges and allow learners to filter examples by grammar concept or topic.

### Related Items (Vocabulary)

Examples can reference related vocabulary or concepts. Each related item has a unique identifier (the term itself) plus translations and context. The same term can appear across multiple examples and lessons; marking it as learned in one place marks it everywhere.

### Images

Images are supported at every level of the hierarchy:

- **Workshop** -- Thumbnail shown on the workshop selection card.
- **Lesson** -- Header image displayed above the lesson title and as a card thumbnail in the lesson grid.
- **Section** -- Full-width image shown above the section explanation. Clicking opens a fullscreen lightbox.
- **Example** -- Thumbnail displayed alongside the Q&A text. Clicking opens a fullscreen lightbox.

All images support optional captions.

### Videos

Sections may include an embedded video displayed above the explanation. YouTube URLs are automatically converted to the correct embed format. Other video platforms (e.g. Vimeo) are supported via direct embed URLs.

## Authoring Format

All content is authored in YAML, chosen for its human readability and ease of hand-editing. Content creators write plain text files without needing specialized tools. The platform parses YAML at runtime -- there is no build step for content.

## Multi-Language Interface

The platform supports multiple interface languages simultaneously. A learner who speaks German can study Portuguese through German explanations, while an English speaker studies the same material through English explanations. The interface language determines the language of navigation, explanations, and answer translations.

## Content Distribution

Content can be hosted locally (bundled with the app), on any web server, or on IPFS. Languages, workshops, and individual lessons can each point to different sources, allowing distributed authoring and hosting. External workshops are added via URL and merged seamlessly with local content.

## Self-Contained Lessons

Each lesson is a standalone folder containing its content file and optional audio files. This makes lessons portable -- they can be shared, version-controlled, or hosted independently without depending on the rest of the platform.
