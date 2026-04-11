// src/composables/useAudioDebug.js
//
// Focused debug surface for the audio chain. Issue #240 called this out:
// "when the audio stops we should definitely have an event log showing us
// the reason for stopping". Before this existed, stops were invisible —
// caught by try/catch blocks in playNextItem / retryPlay and logged to
// the JS console in a form that was hard to scan alongside the queue.
//
// Design goals:
//   - Zero overhead when disabled (recordAudioEvent is an early return)
//   - Ring buffer capped at MAX_EVENTS so we never grow unbounded
//   - Every event carries a timestamp + a structured `kind` identifier
//   - Exportable as JSON for bug reports
//   - Reactive so an overlay component can render the log live
//
// Enabling:
//   - settings.showDebugOverlay = true (persisted)
//   - OR ?audioDebug=1 in the URL (session only)
//
// This file is imported by useAudio.js, so it must not import from
// useAudio itself (circular). Only Vue reactivity primitives.

import { ref, computed } from 'vue'

const MAX_EVENTS = 200

// Reactive ring buffer of events. Each event:
//   { t, kind, ...payload }
// `t` is performance.now() at insertion time.
const audioEvents = ref([])

// URL-based debug flag (session-only, no persistence). Checked lazily so
// SSR / test environments without `window` don't crash.
let _urlDebugFlag = null
function getUrlDebugFlag() {
  if (_urlDebugFlag !== null) return _urlDebugFlag
  try {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    const hash = window.location.hash || ''
    const hashParams = hash.includes('?') ? new URLSearchParams(hash.slice(hash.indexOf('?') + 1)) : null
    _urlDebugFlag = params.get('audioDebug') === '1' ||
                    !!(hashParams && hashParams.get('audioDebug') === '1')
  } catch {
    _urlDebugFlag = false
  }
  return _urlDebugFlag
}

// Test-only helper to reset the cached URL flag between tests.
export function __resetUrlDebugFlagCache() {
  _urlDebugFlag = null
}

// Settings-based debug flag. Wired externally via setDebugEnabled so the
// composable can react to settings changes without importing useSettings.
const _settingsDebugEnabled = ref(false)

export function setAudioDebugEnabled(enabled) {
  _settingsDebugEnabled.value = !!enabled
}

// Master flag: either URL param or settings toggle.
export const audioDebugEnabled = computed(
  () => _settingsDebugEnabled.value || getUrlDebugFlag()
)

/**
 * Record an audio event. No-op when debug is disabled, so the caller pays
 * nothing in production.
 *
 * @param {object} event - must include a `kind` string identifier
 */
export function recordAudioEvent(event) {
  if (!audioDebugEnabled.value) return
  audioEvents.value.push({
    t: Math.round(performance.now()),
    ...event,
  })
  if (audioEvents.value.length > MAX_EVENTS) {
    audioEvents.value.splice(0, audioEvents.value.length - MAX_EVENTS)
  }
}

export function clearAudioEvents() {
  audioEvents.value = []
}

export function getAudioEvents() {
  return audioEvents.value
}

/**
 * Serialize the event log as JSON for copy-paste into bug reports.
 * Includes a header with the current timestamp and the event count.
 */
export function serializeAudioEvents() {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    count: audioEvents.value.length,
    events: audioEvents.value,
  }, null, 2)
}

export function useAudioDebug() {
  return {
    audioEvents,
    audioDebugEnabled,
    setAudioDebugEnabled,
    recordAudioEvent,
    clearAudioEvents,
    serializeAudioEvents,
  }
}
