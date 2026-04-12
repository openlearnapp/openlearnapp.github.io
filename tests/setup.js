// Fix for Node 25+ built-in localStorage not having .clear()
// Node 25 exposes a global localStorage that conflicts with jsdom/happy-dom
if (typeof globalThis.localStorage !== 'undefined' && typeof globalThis.localStorage.clear !== 'function') {
  const store = {}
  globalThis.localStorage = {
    getItem(key) { return store[key] ?? null },
    setItem(key, value) { store[key] = String(value) },
    removeItem(key) { delete store[key] },
    clear() { Object.keys(store).forEach(k => delete store[k]) },
    get length() { return Object.keys(store).length },
    key(i) { return Object.keys(store)[i] ?? null },
  }
}

// Stub URL.createObjectURL — used by useAudioDebug.js to generate silent
// WAV blobs for inter-clip pauses. happy-dom / jsdom don't implement it.
if (typeof globalThis.URL.createObjectURL !== 'function') {
  globalThis.URL.createObjectURL = (blob) => `blob:silence-${blob?.size || 0}`
}

// Stub Blob if missing (some test environments lack it)
if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = class Blob {
    constructor(parts, opts) { this.size = parts?.[0]?.byteLength || 0; this.type = opts?.type }
  }
}
