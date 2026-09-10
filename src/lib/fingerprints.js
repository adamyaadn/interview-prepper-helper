import { session, persisted } from './storage'

const SESSION_KEY = 'prepforge:fingerprints:session'
const PERSISTED_KEY = 'prepforge:fingerprints:longterm'
const MAX_PERSISTED = 100

export function getFingerprints(useLongTerm) {
  const sessionList = session.get(SESSION_KEY, [])
  if (!useLongTerm) return sessionList
  const longTerm = persisted.get(PERSISTED_KEY, [])
  return [...longTerm, ...sessionList]
}

export function addFingerprint({ topic, subtopic, gist }, useLongTerm) {
  const entry = { topic, subtopic, gist, at: Date.now() }

  const sessionList = session.get(SESSION_KEY, [])
  session.set(SESSION_KEY, [...sessionList, entry])

  if (useLongTerm) {
    const longTerm = persisted.get(PERSISTED_KEY, [])
    persisted.set(PERSISTED_KEY, [...longTerm, entry].slice(-MAX_PERSISTED))
  }
}

export function clearLongTermFingerprints() {
  persisted.remove(PERSISTED_KEY)
}

// Keeps the prompt lean — the most recent ~25 entries carry plenty of signal.
export function formatForPrompt(fingerprints) {
  if (!fingerprints.length) return 'None yet — this is the first question.'
  return fingerprints
    .slice(-25)
    .map((f) => `- [${f.topic}/${f.subtopic}] ${f.gist}`)
    .join('\n')
}
