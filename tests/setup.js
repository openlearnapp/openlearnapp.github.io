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
