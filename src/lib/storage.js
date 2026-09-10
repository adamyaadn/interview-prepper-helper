// Session-only — dies when the tab closes. Nothing here ever touches localStorage.
export const session = {
  get(key, fallback = null) {
    try {
      const raw = sessionStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage disabled or full — app still works purely in-memory
    }
  },
  remove(key) {
    sessionStorage.removeItem(key)
  },
}

// Opt-in, cross-session — used ONLY for the anti-repetition fingerprint log,
// and only when the user turns "remember across days" on. Never used for
// the API key or anything else.
export const persisted = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore
    }
  },
  remove(key) {
    localStorage.removeItem(key)
  },
}
