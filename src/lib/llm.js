import { buildDiagnosticPrompt, buildScoringPrompt, buildSyllabusPrompt, buildTurnPrompt } from './prompts'

// Set at build time (see .github/workflows/deploy.yml) — points at your
// deployed Cloudflare Worker. Falls back to localhost for `npm run dev`
// against `wrangler dev` running locally.
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'

// Models occasionally wrap JSON in prose or code fences despite instructions
// not to — strip both before parsing rather than fail the whole turn.
function parseJson(raw) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : raw
  const arrayStart = candidate.indexOf('[')
  const objectStart = candidate.indexOf('{')
  const start = arrayStart === -1 ? objectStart : objectStart === -1 ? arrayStart : Math.min(arrayStart, objectStart)
  const end = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'))
  const sliced = start >= 0 && end >= 0 ? candidate.slice(start, end + 1) : candidate
  return JSON.parse(sliced)
}

// Call once per new day's session — before the first generate() call — to
// check the per-IP daily cap. Individual generate() calls aren't metered
// on their own; this is the gate.
export async function checkSessionStart() {
  const res = await fetch(`${WORKER_URL}/session/start`, { method: 'POST' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data // { allowed: boolean, message?: string }
}

async function complete({ system, user, temperature }) {
  const res = await fetch(`${WORKER_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, user, temperature }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data.text
}

export async function generateDiagnostic({ difficulty, companies, icLevel, avoidText }) {
  const { system, user } = buildDiagnosticPrompt({ difficulty, companies, icLevel, avoidText })
  const raw = await complete({ system, user, temperature: 1.0 })
  return parseJson(raw)
}

export async function scoreAnswers({ qaPairs }) {
  const { system, user } = buildScoringPrompt({ qaPairs })
  const raw = await complete({ system, user, temperature: 0.2 })
  return parseJson(raw)
}

export async function generateSyllabus({ topic, difficulty, companies, icLevel, avoidText }) {
  const { system, user } = buildSyllabusPrompt({ topic, difficulty, companies, icLevel, avoidText })
  const raw = await complete({ system, user, temperature: 0.85 })
  return parseJson(raw)
}

export async function generateTurn({ topic, subtopic, archetype, difficulty, companies, icLevel, avoidText, paceInstruction, history }) {
  const { system, user } = buildTurnPrompt({ topic, subtopic, archetype, difficulty, companies, icLevel, avoidText, paceInstruction, history })
  return complete({ system, user, temperature: 0.95 })
}
