import { describe, it, expect, beforeEach } from 'vitest'
import {
  recordAudioEvent,
  clearAudioEvents,
  getAudioEvents,
  serializeAudioEvents,
  setAudioDebugEnabled,
  audioDebugEnabled,
  __resetUrlDebugFlagCache,
} from '../src/composables/useAudioDebug'

describe('useAudioDebug', () => {
  beforeEach(() => {
    __resetUrlDebugFlagCache()
    setAudioDebugEnabled(true)
    clearAudioEvents()
  })

  it('records events when enabled', () => {
    recordAudioEvent({ kind: 'test-event', foo: 'bar' })
    const events = getAudioEvents()
    expect(events.length).toBe(1)
    expect(events[0].kind).toBe('test-event')
    expect(events[0].foo).toBe('bar')
    expect(typeof events[0].t).toBe('number')
  })

  it('is a no-op when disabled', () => {
    setAudioDebugEnabled(false)
    recordAudioEvent({ kind: 'test' })
    expect(getAudioEvents().length).toBe(0)
  })

  it('caps the ring buffer', () => {
    for (let i = 0; i < 300; i++) {
      recordAudioEvent({ kind: 'spam', i })
    }
    const events = getAudioEvents()
    expect(events.length).toBeLessThanOrEqual(200)
    // The cap drops the OLDEST events — the last one must still be in the buffer
    expect(events[events.length - 1].i).toBe(299)
  })

  it('clearAudioEvents empties the ring buffer', () => {
    recordAudioEvent({ kind: 'a' })
    recordAudioEvent({ kind: 'b' })
    expect(getAudioEvents().length).toBe(2)
    clearAudioEvents()
    expect(getAudioEvents().length).toBe(0)
  })

  it('serializeAudioEvents emits JSON with header + events', () => {
    recordAudioEvent({ kind: 'init-start', lesson: 'L1' })
    const json = serializeAudioEvents()
    const parsed = JSON.parse(json)
    expect(parsed.count).toBe(1)
    expect(parsed.events[0].kind).toBe('init-start')
    expect(parsed.events[0].lesson).toBe('L1')
    expect(typeof parsed.exportedAt).toBe('string')
  })

  it('audioDebugEnabled is reactive to setAudioDebugEnabled', () => {
    setAudioDebugEnabled(false)
    expect(audioDebugEnabled.value).toBe(false)
    setAudioDebugEnabled(true)
    expect(audioDebugEnabled.value).toBe(true)
  })
})
