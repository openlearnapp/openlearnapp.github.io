# External Workshops

## Purpose

Allow anyone to create, host, and share learning workshops independently — without needing access to the Open Learn platform repository or any central server.

## Open Hosting Model

Workshop creators publish their content on any static hosting platform: GitHub Pages, IPFS, a personal CDN, or any web server that serves files over HTTPS. Open Learn fetches content directly from these URLs at runtime. There is no upload process, no approval step, and no central content registry.

This means workshop availability depends only on the hosting provider, not on Open Learn itself.

## Adding Workshops via Share Links

Learners add external workshops through a share link in the format `#/add?source=URL`. When a learner opens this link:

1. The platform fetches the source URL to discover available languages and workshops.
2. The learner sees what the source offers and confirms the addition.
3. The source is saved, and its workshops appear on the Home page alongside all other content.

Workshop creators can distribute their share links through any channel — email, social media, course websites, QR codes, or messaging apps.

## Default Sources

The platform ships with a set of default workshop sources defined in a configuration file. These are loaded automatically on first use and cannot be removed by the user. They provide starter content so the platform is useful out of the box.

## User-Added Sources

When a learner adds an external workshop source, the URL is persisted in the browser's localStorage. On subsequent visits, the platform reloads content from all saved sources. Users can remove sources they have added, but not the platform defaults.

## No Central Server Dependency

All content loading happens client-side via direct HTTP requests to the source URLs. There is no intermediary API, no content database, and no account system involved. The platform is a static site that assembles content from distributed sources at runtime.

IPFS URLs are supported and automatically resolved to HTTP gateway URLs.

## Workshop Discovery

Users discover workshops through:

- **Direct sharing**: A creator sends or publishes their share link.
- **Default sources**: Workshops bundled with the platform serve as examples and starting points.
- **Word of mouth**: Because share links are simple URLs, they spread naturally through communities, course materials, and social channels.

There is currently no built-in workshop directory or search feature. Discovery is intentionally decentralized — creators are responsible for distributing their own links.

## Content Integration

Once added, external workshops are indistinguishable from built-in content. They appear in the same workshop list, support the same features (audio, assessments, learning items, progress tracking), and use the same navigation. Learners do not need to know or care whether a workshop is built-in or external.

## Multi-Language Support

External workshop sources can provide content in multiple interface languages. The platform discovers available languages from the source and presents the appropriate workshops based on the learner's selected language.
