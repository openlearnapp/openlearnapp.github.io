# Sync System — GunDB Identity & Cross-Device Sync

Open Learn uses [GunDB](https://gun.eco/) for decentralized user identity and cross-device data synchronization. All user data lives in localStorage first and is optionally synced to GunDB relay servers when logged in.

## Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Device A    │      │ Relay Peers  │      │  Device B   │
│  (Browser)   │◄────►│ (GunDB)      │◄────►│  (Browser)  │
│              │      │              │      │              │
│ localStorage │      │ toplocs.com  │      │ localStorage │
│   ↕ sync     │      │ relay.peer…  │      │   ↕ sync     │
│ Gun user()   │      └──────────────┘      │ Gun user()   │
└─────────────┘                             └─────────────┘
```

- **Without login**: App works fully offline, all data stays in localStorage.
- **With login**: Data is encrypted under the user's GunDB key pair and synced through relay peers to other devices logged into the same account.

## What Gets Synced

Four localStorage keys are synced as JSON blobs under `gun.user().get('openlearn')`:

| Key | Content | Merge Strategy |
|-----|---------|----------------|
| `settings` | App preferences (dark mode, audio speed, language, coach consent, etc.) | Last-write-wins (local precedence on login) |
| `progress` | Learning items marked as learned, per workshop | Timestamp per item, highest absolute wins |
| `assessments` | Assessment answers, per lesson | `submittedAt` per item, most recent wins |
| `contentSources` | User-added workshop source URLs | Timestamp per URL, highest absolute wins |

**Not synced**: Lesson content, sent history, lesson progress (section-level tracking), peer configuration, profile data (display name, learning goal, etc.), favorites, last visited lesson.

### Data Path in GunDB

All synced data is stored under the authenticated user's graph:

```
gun.user()
  └── openlearn
        ├── settings        → JSON string
        ├── progress        → JSON string
        ├── assessments     → JSON string
        ├── contentSources  → JSON string
        └── lastSync        → "timestamp:deviceId"
```

Each value is `JSON.stringify()`'d before writing and `JSON.parse()`'d when reading. GunDB's SEA (Security, Encryption, Authorization) module encrypts data under the user's key pair — only the same user can read it back.

## Data Format: Timestamp-Based Tombstones

To support **add, update, and delete** across devices, all synced data types (except settings) use timestamps on individual items:

### Progress

```json
{
  "de:pt": {
    "hello": 1712345678,     // positive = learned at this time
    "world": -1712345999     // negative = unlearned at this time
  }
}
```

**Merge rule**: For each item, the value with the highest **absolute** timestamp wins. This means an "unlearn" at T=100 beats a "learn" at T=50, regardless of order of sync events.

### ContentSources

```json
{
  "https://example.com/index.yaml": 1712345,      // added
  "https://removed.com/index.yaml": -1712346      // removed
}
```

`getContentSources()` returns only URLs with positive timestamps. Legacy array format is migrated on first read.

### Assessments

Already contain a `submittedAt` ISO timestamp. Clearing answers writes a tombstone:

```json
{
  "de:pt:1": {
    "0-0": { "type": "input", "answer": "hello", "correct": true, "submittedAt": "2026-04-10T14:30:00Z" },
    "0-1": { "_cleared": true, "submittedAt": "2026-04-10T15:00:00Z" }
  }
}
```

**Merge rule**: Per item, the entry with the most recent `submittedAt` wins. `getAnswer()` returns `null` for tombstoned entries — the UI doesn't need to know about tombstones.

### Settings

Settings don't use per-key timestamps. On login, remote fills in missing keys and local takes precedence. Subsequent changes are straightforward `Object.assign`.

## Authentication

GunDB uses SEA key pairs for identity. There are no centralized accounts — the key pair **is** the identity, distributed across relay peers.

### Registration

1. `gun.user().create(alias, password)` generates a new SEA key pair
2. The key pair is derived deterministically from alias + password
3. On success, auto-login is triggered

### Login

1. `gun.user().auth(alias, password)` authenticates with the key pair
2. On success:
   - `isLoggedIn` → `true`
   - Username stored in localStorage (`gun-session` key) for display only
   - `setupSyncListener()` — attaches the single `.on()` listener on `lastSync`
   - `autoSyncAll()` — **pulls remote, merges, then pushes** (see below)

### Session Recall

On app startup (`main.js`):

1. `initGun()` creates the Gun instance and calls `gun.user().recall({ sessionStorage: true })`
2. `autoLogin()` waits up to 2 seconds for session restoration
3. If Gun fires the `auth` event (session found), listeners and sync start automatically
4. No password is stored — Gun manages session tokens internally via sessionStorage

### Logout

1. The sync listener is torn down
2. `gun.user().leave()` ends the Gun session
3. Local reactive state is cleared (login flag, username, session key)
4. localStorage data is **not** deleted — the user keeps their local data

## Sync Mechanisms

Sync is coordinated by a lightweight **sync marker**: a single Gun node at `openlearn.lastSync` holding a `"timestamp:deviceId"` string. This avoids attaching `.on()` listeners to each data key (which fires constantly even without changes).

### The Sync Marker

```
gun.user().get('openlearn').get('lastSync') → "1712345678901:a1b2c3d4"
```

- Each browser tab gets a random `DEVICE_ID` on load
- When a device pushes data, it also writes a new marker
- Other devices listen only to this marker via `.on()`
- When they see a new timestamp from a **different** device ID, they pull the actual data via `.once()`

Benefits:
- **1 listener** instead of 4 (one per data key)
- Listener payload is ~25 bytes (just a timestamp + ID)
- Actual data is only fetched when something actually changed
- Own writes are ignored by device ID comparison

### 1. autoSyncAll — Pull, Merge, Push (on Login)

**Trigger**: Successful login or session recall.

Critical design: **pull first, then push**. A fresh device with empty data must not overwrite remote data.

```
for each sync key:
  1. .once() pull from Gun
  2. Merge remote with local (strategy depends on key type)
  3. Write merged result to localStorage
  4. gun.put(merged)
  5. Dispatch gun-sync event (method: "once (login)") so composables update UI

Finally: writeSyncMarker() — one marker for all keys
```

### 2. Sync Marker Listener — Pull on Remote Changes

**Trigger**: `setupSyncListener()` called on login.

A single `.on()` listener on `lastSync`. When the marker changes:

1. Parse `timestamp:deviceId` from the marker
2. If `deviceId === DEVICE_ID` → skip (own write), increment `duplicatesSkipped` stat
3. If `timestamp <= _lastOwnSync` → skip (already seen)
4. Otherwise → `pullFromRemote()`: fetch all keys via `.once()` and dispatch `gun-sync` events

Each composable listens for its own key via `gun-sync` window events:

| Composable | Listens for | Merge Function |
|------------|-------------|----------------|
| `useSettings` | `key === 'settings'` | `Object.assign()` — last-write-wins |
| `useProgress` | `key === 'progress'` | `mergeProgress()` — timestamp per item |
| `useAssessments` | `key === 'assessments'` | `mergeAssessments()` — submittedAt per item |
| `useLessons` | `key === 'contentSources'` | Timestamp merge + `content-sources-changed` event |

After `pullFromRemote()`, merged data is pushed back to Gun **only for keys that actually changed** (compared against a pre-merge snapshot). Unchanged keys skip the push to avoid traffic.

### 3. Composable Watchers — Push on Local Changes

**Trigger**: Any local change to a synced state.

Each composable has a Vue `watch(..., { deep: true })` on its reactive state. When state changes:

```
watch(progress) → saveProgress()
  → localStorage.setItem('progress', ...)
  → if (isLoggedIn) syncToGun('progress', data)
      → gun.put(data)
      → writeSyncMarker()
      → dispatch gun-sync event (method: "put")
```

Every local interaction (toggling dark mode, marking an item as learned, answering an assessment, adding a workshop) is immediately persisted to localStorage **and** pushed to Gun if logged in.

## Echo-Back & Loop Prevention

Several guards prevent sync loops and feedback echoes:

### 1. Device ID Check

The sync marker listener ignores markers from our own `DEVICE_ID`. This prevents a device from reacting to its own writes.

### 2. Timestamp Comparison

The listener also ignores markers with `timestamp <= _lastOwnSync` — protects against out-of-order delivery.

### 3. `_applyingRemote` Flag

When `pullFromRemote()` dispatches `gun-sync` events, the composable listeners do `Object.assign` on reactive state, triggering Vue watchers → `saveX()` → `syncToGun()`. Without a guard, this would push the just-pulled data right back to Gun.

- Before dispatching `gun-sync` events, `_applyingRemote = true`
- `syncToGun()` returns early if `_applyingRemote === true`
- The flag also wraps the merge-back push
- Resets after Vue watchers have flushed (via `setTimeout(..., 0)`)

### 4. Merge-Back: Only If Changed

After `pullFromRemote()`, localStorage is snapshotted and compared after merge. Only keys where `after !== before` are pushed back. Identical data never triggers a write.

### 5. Merge-Back: No Sync Marker

The merge-back push does **not** write a new sync marker. Otherwise: device B pulls from A → merges → pushes + marker → device A sees marker → pulls → merges → pushes + marker → infinite loop. The merge-back is a silent convergence.

## Relay Peers

Relay peers are GunDB servers that store and forward data between browsers. They are **not** databases — they're message relays that also cache data.

### Default Peers

```
https://toplocs.com/gun
https://relay.peer.ooo/gun
```

### Configuration

Users can add, remove, or replace relay peers in Settings. Custom peers are saved to `localStorage` under the `gun-peers` key. If no custom peers are saved, the defaults are used.

### Health Check

Settings has a "Check" button that runs a `fetch()` with a 5-second timeout against each peer URL to verify availability. This is a simple HTTP reachability check, not a GunDB protocol test.

### Connection Status

The `isConnected` reactive ref tracks actual peer connectivity:

- `gun.on('hi', peer)` — fires when a relay peer connects → added to `connectedPeerList`, `isConnected = true`
- `gun.on('bye', peer)` — fires when a peer disconnects → removed from list, `isConnected = false` when empty

This is distinct from `isSyncing`, which is only `true` during active data transfer operations (`pullFromRemote`, `autoSyncAll`).

### Additional Connectivity

- **Multicast**: Enabled (`multicast: true`) for local network device discovery on the same WLAN via UDP multicast
- **WebRTC**: Disabled — was polluting the Gun graph with `/RTC/` signaling entries per page visit. Multicast covers LAN discovery without WebRTC.

## Connection Status UI

Status is shown in two places:

| Location | What's shown |
|----------|-------------|
| **Profile** (hero card) | Badge: "Not connected" / "Syncing…" / "Synced" |
| **Settings** (Sync Peers section) | "● Connected" / "○ Not connected" + per-peer health indicators (🟢🔴⚪) |

## Debug Page

Navigate to `#/settings/debug` to inspect the sync system in real time:

- **Connection status**: login state, device ID, connected peers (with URLs)
- **Sync marker**: live display of `lastSync` value, color-coded by self vs remote
- **Sync stats**: bytes pushed/received, operation counts, own writes ignored, WebSocket frames, HTTP requests
- **Gun data**: raw JSON for each synced key (collapsible)
- **Local vs Remote diff**: whether local and remote data match per key
- **Actions**: manual refresh (pull) and push all
- **Sync Events**: live log of `gun-sync` events with method badges (put, once, on, put (merge-back)), timestamps, byte sizes, and full JSON content (collapsible, up to 100 entries)

## Data Flow Summary

```
User action (e.g. mark item as learned)
  │
  ├─► localStorage.setItem('progress', ...)       ← always
  │
  └─► if logged in:
        syncToGun('progress', data)
          │
          ├─► gun.put(data)                        ← push data to relay
          └─► gun.put("ts:deviceId")               ← write sync marker
                  │
                  ▼
              Other device's lastSync .on() fires
                  │
                  ▼
              Is deviceId different? Is timestamp new?
                  │ yes
                  ▼
              pullFromRemote()
                  │
                  ├─► snapshot localStorage before
                  ├─► .once() for each key → dispatch gun-sync
                  │     → composables merge with timestamp rules
                  │     → Vue watchers fire (syncToGun blocked by _applyingRemote)
                  │
                  └─► for each key where localStorage changed:
                        gun.put(merged)            ← silent merge-back (no marker)
```

## Tests

A comprehensive sync test suite lives in `tests/gun-sync.test.js` (19 tests) and `tests/gun.test.js`. Coverage includes:

- `syncToGun`: writes data + marker, blocked when not logged in
- Sync marker listener: ignores own device, triggers pull on remote markers
- Merge-back: no sync marker written, skips identical data, only pushes changed keys
- `autoSyncAll`: pulls and merges before pushing
- `loadFromGun`: parses data, handles missing keys
- Password security: no password in localStorage
- Sync stats: tracks bytes/ops, resets correctly
- `gun-sync` events: dispatches put/once/on with correct method labels

## Limitations

- **Last-write-wins on settings**: If two devices change the same setting concurrently, the last write wins. No field-level merging.
- **Full-blob sync**: Each key is synced as a complete JSON blob. A single changed setting re-syncs the entire settings object (though identical blobs are skipped).
- **No offline queue**: If the device is offline when data changes, the change is written to localStorage but the Gun write may silently fail. It will sync when Gun reconnects to a peer and the next local change triggers a push.
- **Session recall is time-limited**: `autoLogin()` waits 2 seconds for session recall. On slow connections, the session may not restore in time.
- **Profile data is not synced**: Display name, learning goal, native language, favorites, and lesson-level progress are stored only in localStorage.
- **Tombstones accumulate**: Unlearned items and cleared answers stay in the data as negative timestamps / `_cleared` entries. They're filtered out on read but occupy storage indefinitely.
