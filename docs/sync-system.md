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

Three localStorage keys are synced as JSON blobs under `gun.user().get('openlearn')`:

| Key | Content | Sync Direction |
|-----|---------|----------------|
| `settings` | App preferences (dark mode, audio speed, language, coach consent, etc.) | Push + pull, last-write-wins |
| `progress` | Learning items marked as learned, per workshop | Push + pull, additive merge |
| `assessments` | Assessment answers, per lesson | Push + pull, additive merge |

**Not synced**: Lesson content, workshop sources, sent history, lesson progress (section-level tracking), peer configuration, profile data.

### Data Path in GunDB

All synced data is stored under the authenticated user's graph:

```
gun.user()
  └── openlearn
        ├── settings      → JSON string
        ├── progress      → JSON string
        └── assessments   → JSON string
```

Each value is `JSON.stringify()`'d before writing and `JSON.parse()`'d when reading. GunDB's SEA (Security, Encryption, Authorization) module encrypts data under the user's key pair — only the same user can read it back.

## Authentication

GunDB uses SEA key pairs for identity. There are no centralized accounts — the key pair **is** the identity, distributed across relay peers.

### Registration

1. `gun.user().create(alias, password)` generates a new SEA key pair
2. The key pair is derived from the alias + password combination
3. On success, auto-login is triggered

### Login

1. `gun.user().auth(alias, password)` authenticates with the key pair
2. On success:
   - `isLoggedIn` → `true`
   - Username stored in localStorage (`gun-session` key) for display only
   - `setupListeners()` — attaches real-time `.on()` callbacks
   - `autoSyncAll()` — pushes all local data to Gun
3. On first login on a new device, `loadFromGun()` pulls remote data and merges it into local state

### Session Recall

On app startup (`main.js`):

1. `initGun()` creates the Gun instance and calls `gun.user().recall({ sessionStorage: true })`
2. `autoLogin()` waits up to 2 seconds for session restoration
3. If Gun fires the `auth` event (session found), listeners and sync start automatically
4. No password is stored — Gun manages session tokens internally via sessionStorage

### Logout

1. Real-time listeners are torn down
2. `gun.user().leave()` ends the Gun session
3. Local state is cleared (login flag, username, session key)
4. localStorage data is **not** deleted — the user keeps their local data

## Sync Mechanisms

There are three distinct sync paths:

### 1. Auto-Sync on Login (Push)

**Trigger**: Successful login or session recall.

`autoSyncAll()` iterates over the three keys (`settings`, `progress`, `assessments`), reads each from localStorage, and writes to Gun:

```
localStorage → JSON.parse → gun.user().get('openlearn').get(key).put(JSON.stringify(data))
```

This ensures the relay peers always have the latest local state after login.

### 2. Real-Time Listeners (Pull)

**Trigger**: `setupListeners()` called on login.

For each of the three keys, a `.on()` listener is attached to the Gun graph node. When data changes on any connected peer (another device, another tab), GunDB pushes the update:

```
gun.user().get('openlearn').get(key).on(callback)
  → callback parses JSON
  → dispatches window CustomEvent('gun-sync', { key, data })
```

Each composable listens for its own key:

| Composable | Listens for | Merge Strategy |
|------------|-------------|----------------|
| `useSettings` | `gun-sync` where `key === 'settings'` | `Object.assign()` — overwrites local settings |
| `useProgress` | `gun-sync` where `key === 'progress'` | `mergeProgress()` — additive, never removes items |
| `useAssessments` | `gun-sync` where `key === 'assessments'` | `mergeAssessments()` — additive, never removes answers |

Listeners are torn down on logout.

### 3. Composable Watchers (Push)

**Trigger**: Any local change to settings, progress, or assessments.

Each composable has a Vue `watch(..., { deep: true })` on its reactive state. When the state changes:

```
watch(settings) → saveSettings()
  → localStorage.setItem('settings', JSON.stringify(data))
  → if (isLoggedIn) syncToGun('settings', data)
```

This means every local interaction (toggling dark mode, marking an item as learned, answering an assessment) is immediately persisted to localStorage **and** pushed to Gun if logged in.

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

- `gun.on('hi')` — fires when a relay peer connects → increments counter, sets `isConnected = true`
- `gun.on('bye')` — fires when a peer disconnects → decrements counter, sets `isConnected = false` when no peers remain

This is distinct from `isSyncing`, which is only `true` during active data transfer operations (`loadFromGun`, `autoSyncAll`).

### Additional Connectivity

- **WebRTC**: Loaded optionally (`gun/lib/webrtc`) for direct browser-to-browser connections, bypassing relay servers
- **Multicast**: Enabled (`multicast: true`) for local network device discovery on the same WLAN

## Connection Status UI

The status is shown in two places:

| Location | What's shown |
|----------|-------------|
| **Profile** (hero card) | Badge: "Not connected" / "Syncing…" / "Synced" |
| **Settings** (Sync Peers section) | "● Connected" / "○ Not connected" + per-peer health indicators (🟢🔴⚪) |

Three states are displayed based on two flags:

| `isSyncing` | `isConnected` | Display |
|-------------|---------------|---------|
| `false` | `false` | ○ Not connected |
| `true` | any | ⟳ Syncing… |
| `false` | `true` | ● Synced |

## Data Flow Summary

```
User action (e.g. mark item as learned)
  │
  ├─► localStorage.setItem('progress', ...)      ← always
  │
  └─► if logged in:
        syncToGun('progress', data)               ← push to relay peers
          │
          ▼
      Relay peer stores data
          │
          ▼
      Other device's .on() listener fires
          │
          ▼
      window.dispatchEvent('gun-sync')
          │
          ▼
      useProgress listens → mergeProgress()       ← additive merge
          │
          ▼
      Vue watcher fires → saveProgress()
          │
          ▼
      localStorage.setItem('progress', ...)       ← persisted on other device
```

## Echo-Back Guard

When device B receives data from device A via a `.on()` listener, the `Object.assign` on reactive state triggers Vue watchers, which call `syncToGun()` — pushing the same data right back to Gun. This creates a feedback loop that can cause GunDB's conflict resolution to pick stale values.

To prevent this, `useGun.js` uses a `_applyingRemote` flag:

1. Before dispatching the `gun-sync` event, `_applyingRemote = true`
2. `syncToGun()` returns early if the flag is set
3. After Vue watchers have flushed (via `setTimeout(..., 0)`), the flag resets

This ensures only intentional local changes are pushed to Gun.

## Debug Page

Navigate to `#/debug/gun` to inspect the sync system in real time:

- **Connection status**: login state, peers, connected/disconnected
- **Gun data**: raw JSON for each synced key as stored on relay peers
- **Local vs Remote diff**: whether local and remote data match
- **Actions**: manual refresh (pull) and push all
- **Sync Events**: live log of incoming `gun-sync` events with timestamp, key, and data preview

## Limitations

- **No conflict resolution beyond merge**: Settings use last-write-wins; progress and assessments use additive merge (items are never removed by sync).
- **No selective sync**: All three keys are synced as complete JSON blobs. A single changed setting re-syncs the entire settings object.
- **No offline queue**: If the device is offline when data changes, the change is written to localStorage but the Gun write may silently fail. It will sync when Gun reconnects to a peer.
- **Session recall is time-limited**: `autoLogin()` waits 2 seconds for session recall. On slow connections, the session may not restore in time.
- **Profile data is not synced**: Display name, learning goal, and native language are stored only in localStorage.
