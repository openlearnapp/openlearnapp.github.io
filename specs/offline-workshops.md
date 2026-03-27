# Offline Workshops

## Purpose

Let learners download a complete workshop — lessons, audio, and images — so they can study without an internet connection. This enables learning on flights, in areas with poor connectivity, or anywhere data access is limited or expensive.

## Two Layers of Caching

Offline support has two distinct layers:

### 1. App Shell + Workshop Metadata (always cached)

Precached automatically after the first visit — no user action needed:

- **App shell**: HTML, JavaScript, CSS, fonts — the entire platform UI.
- **Language index**: Available interface languages (`index.yaml`).
- **Default sources**: The list of workshop sources (`default-sources.yaml`).
- **Workshop metadata**: Titles, descriptions, thumbnails, and lesson lists for all workshops (`workshops.yaml`, `lessons.yaml`, thumbnail images).

This means the learner can always open the app, browse the Home page, select a language, see all workshops with their titles and thumbnails, and navigate to the lessons overview — even without a connection. These files are small (a few KB each) and cached alongside the app shell.

### 2. Workshop Content (downloaded on demand)

Downloaded only when the learner explicitly requests it:

- **Lesson content**: All `content.yaml` files for every lesson in the workshop.
- **Audio files**: All MP3 files for every lesson.
- **Images**: All images referenced in lessons (headers, section images, example images).

This is the heavy content — audio files alone can be 50–150 MB per workshop.

## User Flow

### Downloading a Workshop

1. Learner navigates to a workshop's lessons overview page.
2. A download button indicates the workshop is available for offline use.
3. Tapping download starts fetching all workshop content in the background.
4. A progress indicator shows how much has been downloaded (e.g. "3 of 10 lessons").
5. Once complete, the workshop is marked as available offline.
6. The learner can close the browser or go offline — the workshop remains accessible.

### Using a Workshop Offline

When offline, the full app navigation works — Home, language selection, Workshop Overview, Settings — because the app shell and workshop metadata are always cached.

For downloaded workshops:

- Navigate between lessons, read content, view images, play audio.
- Complete assessments and track progress (stored in localStorage as today).
- All features that don't require network access continue to work.

For workshops that have not been downloaded:

- The workshop card is visible on the overview page (title, description, thumbnail all cached).
- Tapping it shows a message like "Download this workshop to use offline" rather than failing silently.
- The download button is disabled when offline.

### Managing Offline Workshops

On the Settings page, learners can see which workshops are stored offline and how much storage each uses. They can remove individual workshops to free up space.

## Service Worker

The service worker manages both caching layers. It is generated at build time by `vite-plugin-pwa` — no backend required.

- **App shell + metadata**: Precached at build time, updated automatically on new deployments.
- **Workshop content**: Cached into a separate named cache when the learner initiates a download. The service worker intercepts fetch requests and serves cached responses when offline.

## Storage

Workshop content is stored using the Cache API, which is designed for this purpose and works across browsers. Audio files are the largest assets — a workshop with 10 lessons and full audio might use 50–150 MB depending on content length.

Before starting a download, the app checks available storage and warns the learner if space might be tight. The Storage Manager API provides quota estimates on supported browsers.

## Cache Strategy

- **App shell + metadata**: Precached at install time. Cache-first always — instant load. Updated in the background on new deployments.
- **Workshop content**: Cached on demand when the learner initiates a download.
- **Network-first for online use**: When online, the app fetches fresh content and updates the cache. This ensures learners always see the latest version when connected.
- **Cache-first for offline use**: When offline, all requests fall back to cached content.

## What's Not Included

- **Coach integration**: The coach requires network access and does not work offline.
- **GunDB sync**: Cross-device synchronization requires a connection. Progress made offline syncs when the learner reconnects.
- **Adding new workshop sources**: Discovering and adding external workshops requires network access.
- **Automatic background downloads**: Downloads are always user-initiated.
- **Streaming or partial downloads**: A workshop is downloaded completely. There is no option to download individual lessons within a workshop.

## Offline Indicator

The app shows a clear signal when the learner is offline — a small indicator in the navigation bar. This helps learners understand why some workshops or features are unavailable.

When online again, the indicator disappears and all features resume normally.

## Update Behavior

When a learner opens a previously downloaded workshop while online, the app checks for content updates. If the workshop has changed, the updated content is re-cached silently. The learner always sees the latest version available — no manual "update" step is needed.

## Use Cases

- **Air travel**: Download a language workshop before a flight and study for hours without connectivity.
- **Commuting underground**: Pre-load workshops with audio for listening practice on the subway.
- **Limited data plans**: Download over Wi-Fi at home, then learn on mobile data without consuming quota.
- **Rural or developing regions**: Access educational content where internet is unreliable or unavailable.
- **Classroom use**: A teacher downloads workshops on shared devices before a class, ensuring all students can work even if the school Wi-Fi is unreliable.
