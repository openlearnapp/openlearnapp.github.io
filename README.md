# 🎓 Open Learn

> **[🌐 open-learn.app](https://open-learn.app)**

A modern, static single-page web application for learning any topic through practical examples. Built with Vue 3, this platform features interactive lessons with audio pronunciation, progress tracking, and a clean, responsive interface.

## ✨ Features

- **📚 Topic-Based Learning**: Organized lessons with sections and examples for any subject
- **🌐 Multi-Language Interface**: Learn any topic in your preferred language
- **🔊 Audio Reading**: Pre-recorded MP3 audio with variable speed and lock screen controls
- **📊 Progress Tracking**: Mark vocabulary items as learned with LocalStorage persistence
- **✅ Interactive Assessments**: Text input, multiple-choice, and single-select with auto-validation (click-to-save)
- **🤝 Coach Integration**: Optional batch forwarding of assessment answers to external coach services
- **🌍 External Workshops**: Add remote content sources hosted on GitHub Pages, IPFS, or any CDN
- **💾 Export / Import**: Per-topic backup and restore of progress and assessment data
- **🌓 Dark Mode**: Toggle between light and dark themes
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🚀 Static Deployment**: No backend required — easy deployment to GitHub Pages
- **📝 YAML-Based Content**: Simple, human-readable lesson format

## 🛠 Tech Stack

- **Framework**: Vue 3.4+ (Composition API with SFCs)
- **Routing**: Vue Router 4.6+ (hash-based routing)
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.4
- **Package Manager**: pnpm
- **Data Format**: YAML (parsed with js-yaml 4.1)
- **Markdown**: Marked 17.0 for explanations
- **Testing**:
  - Vitest 1.0 (unit tests)
  - Playwright 1.40 (E2E tests)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (installed automatically via packageManager field)

### Installation

```bash
# Clone the repository
git clone https://github.com/openlearnapp/openlearnapp.github.io.git
cd openlearnapp.github.io

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173` to see the app running.

## 📦 Development Commands

```bash
# Development server with hot reload
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Run unit tests (Vitest)
pnpm test

# Run unit tests with UI
pnpm test:ui

# Run E2E tests (Playwright)
pnpm test:e2e
```

### Local Workshop Development

Workshop repos placed as sibling directories are automatically detected and served during `pnpm dev`:

```
your-workspace/
├── openlearnapp.github.io/    ← pnpm dev here
├── workshop-english/          ← auto-detected (🔧)
├── workshop-portugiesisch/    ← auto-detected (🔧)
└── workshop-farsi/            ← auto-detected (🔧)
```

Local workshops appear **alongside** remote versions, marked with 🔧 in the title. Requirements: directory starts with `workshop-` and contains `index.yaml`. Changes are reflected immediately — no rebuild needed. Only active in dev mode.

## 📁 Project Structure

```
openlearnapp.github.io/
├── src/
│   ├── main.js              # Application entry point
│   ├── App.vue              # Root component with navigation
│   ├── style.css            # Custom styles (imports Tailwind)
│   ├── router/
│   │   └── index.js         # Vue Router configuration
│   ├── views/               # Page components
│   │   ├── Home.vue         # Topic selection
│   │   ├── LessonsOverview.vue  # Lessons grid
│   │   ├── LessonDetail.vue     # Lesson viewer
│   │   ├── LearningItems.vue    # Learning items browser
│   │   └── Settings.vue     # Settings panel
│   ├── composables/         # Reusable composition functions
│   │   ├── useLessons.js    # Lesson loading logic
│   │   ├── useSettings.js   # Settings persistence
│   │   ├── useProgress.js   # Progress tracking
│   │   └── useAudio.js      # Audio playback system
│   └── utils/
│       └── formatters.js    # Display name formatting
├── public/
│   ├── lessons/
│   │   └── index.yaml           # Language index
│   ├── workshop-open-learn-guide/   # Built-in workshop
│   ├── workshop-open-learn-feedback/
│   ├── workshop-milas-abenteuer/
│   └── default-sources.yaml     # Default workshop sources
├── tests/                   # Test files
├── docs/                    # Documentation
│   ├── workshop-guide.md    # How to create workshops
│   ├── lesson-schema.md     # YAML schema reference
│   ├── yaml-schemas.md      # Index file schemas
│   └── audio-system.md      # Audio system docs
└── dist/                    # Production build output
```

## 📚 Creating Workshops

Every workshop follows the same structure, whether built-in or hosted externally:

```
workshop-my-topic/
├── index.yaml           # Languages
├── deutsch/
│   ├── workshops.yaml   # Metadata (title, labels, colors)
│   └── my-topic/
│       ├── lessons.yaml
│       └── 01-lesson/
│           └── content.yaml
```

See the [Workshop Guide](docs/workshop-guide.md) for the full reference.

## 🧪 Testing

### Unit Tests
Located in `tests/`, run with:
```bash
pnpm test
```

### End-to-End Tests
Located in `tests/e2e/`, run with:
```bash
pnpm test:e2e
```

## 🚀 Deployment

The application is configured for GitHub Pages deployment using GitHub Actions.

### Manual Deployment

```bash
# Build the project
pnpm build

# The dist/ folder is ready for deployment
```

### GitHub Pages

Push to the `main` branch triggers automatic deployment via GitHub Actions (`.github/workflows/static.yml`).

**Note**: Vite is configured with `base: '/'` for custom domain deployment at [open-learn.app](https://open-learn.app).

## 🏗 Architecture

### Component Architecture
- **SFC Pattern**: Single File Components with Composition API
- **Composables**: Shared logic via composition functions
- **Singleton Settings**: Centralized settings management
- **Dynamic Routing**: Hash-based routing for static hosting

### Routes
- `#/` - Home (workshop selection)
- `#/:learning/:workshop/lessons` - Lessons overview
- `#/:learning/:workshop/lesson/:number` - Lesson detail
- `#/:learning/:workshop/items/:number?` - Learning items
- `#/settings` - Settings panel
- `#/add?source=URL` - Add external workshop

### Data Flow
1. Load `lessons/index.yaml` → get available interface languages
2. Load `lessons/{lang}/workshops.yaml` → get workshops
3. Load `lessons/{lang}/{workshop}/lessons.yaml` → get lesson folders
4. Load lesson content dynamically with js-yaml
5. Render with Vue components

## 📦 Workshops

Community workshops hosted on [open-learn.app](https://open-learn.app):

| Workshop | Description | Link |
|----------|-------------|------|
| **Portugiesisch** | 10 lessons — 30 core Portuguese verbs (DE) | [Start](https://open-learn.app/#/add?source=https://open-learn.app/workshop-portugiesisch) · [Repo](https://github.com/openlearnapp/workshop-portugiesisch) |
| **Englisch** | 10 lessons — 30 core English verbs (DE) | [Start](https://open-learn.app/#/add?source=https://open-learn.app/workshop-english) · [Repo](https://github.com/openlearnapp/workshop-english) |
| **Farsi** | 5 lessons — key words and phrases (DE/EN/FA) | [Start](https://open-learn.app/#/add?source=https://open-learn.app/workshop-farsi) · [Repo](https://github.com/openlearnapp/workshop-farsi) |
| **Arabisch** | 5 lessons — key words and phrases (DE/EN/AR) | [Start](https://open-learn.app/#/add?source=https://open-learn.app/workshop-arabisch) · [Repo](https://github.com/openlearnapp/workshop-arabisch) |
| **KI im Journalismus** | Workshop zum Einsatz von KI-Tools in der journalistischen Praxis | [Start](https://open-learn.app/#/add?source=https://open-learn.app/workshop-AI-im-Journalismus) · [Repo](https://github.com/openlearnapp/workshop-AI-im-Journalismus) |

Want to create your own workshop? See the [Workshop Guide](docs/workshop-guide.md).

## 🤝 Contributing

1. Follow semantic commit conventions
2. Create feature branches (never push to `main`)
3. Include tests and documentation
4. Create pull requests for review

## 📄 License

See LICENSE file for details.

## 🔧 Development Notes

For detailed development guidance and architecture information, see [`CLAUDE.md`](CLAUDE.md).
