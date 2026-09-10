// PrepForge worker — holds the Groq key server-side and gates usage by
// *session*, not by individual call. Runs entirely on Cloudflare's free tier,
// talking to Groq's free tier. Two routes:
//
//   POST /session/start   — call once when a person starts a new day's
//                            session (warm-up or a direct topic pick).
//                            Checks + increments a per-IP daily counter.
//   POST /generate        — the actual model call. No metering here — a
//                            session that passed the gate above can make as
//                            many calls as it needs; Groq's own 30 req/min,
//                            14,400 req/day limits are the natural backstop.

const MAX_PROMPT_CHARS = 6000
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const cors = corsHeaders(origin, env)
    const { pathname } = new URL(request.url)

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors)

    if (pathname === '/session/start') return handleSessionStart(request, env, cors)
    if (pathname === '/generate') return handleGenerate(request, env, cors)
    return json({ error: 'Not found' }, 404, cors)
  },
}

// One KV write per session, not per call — a full session is ~15-25 calls,
// so this is the difference between a 1,000/day ceiling (Cloudflare's free
// KV write quota) capping the app at 1,000 total *calls* a day, versus
// capping it at 1,000 *sessions* a day. Much closer to what the free
// allocation is actually meant to support.
async function handleSessionStart(request, env, cors) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const today = new Date().toISOString().slice(0, 10)
  const key = `session:${today}:${ip}`
  const dailyLimit = Number(env.DAILY_SESSIONS_PER_IP || 3)

  let count = 0
  try {
    count = Number((await env.SESSIONS.get(key)) || 0)
  } catch {
    // Read failure — proceed, the write step below still protects the budget.
  }
  if (count >= dailyLimit) {
    return json({ allowed: false, message: `You've started ${dailyLimit} sessions today — come back tomorrow for more.` }, 200, cors)
  }

  try {
    await env.SESSIONS.put(key, String(count + 1), { expirationTtl: 60 * 60 * 26 })
  } catch {
    return json({ allowed: false, message: 'This app has hit its free daily capacity. Try again tomorrow.' }, 200, cors)
  }
  return json({ allowed: true }, 200, cors)
}

async function handleGenerate(request, env, cors) {
  let payload
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, cors)
  }

  const { system, user, temperature } = payload
  if (typeof system !== 'string' || typeof user !== 'string') {
    return json({ error: 'system and user must be strings' }, 400, cors)
  }
  if (system.length + user.length > MAX_PROMPT_CHARS) {
    return json({ error: 'Prompt too long' }, 413, cors)
  }
  if (!env.GROQ_API_KEY) {
    return json({ error: 'GROQ_API_KEY is not configured on this deployment.' }, 501, cors)
  }

  const safeTemperature = clamp(Number(temperature), 0, 1.3, 0.7)

  try {
    const text = await callGroq({ apiKey: env.GROQ_API_KEY, model: env.GROQ_MODEL, system, user, temperature: safeTemperature })
    return json({ text }, 200, cors)
  } catch (err) {
    return json({ error: String(err.message || err) }, 502, cors)
  }
}

// Groq's API is OpenAI-compatible chat completions — model and max_tokens
// are pinned here, never taken from the client.
async function callGroq({ apiKey, model, system, user, temperature }) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) throw new Error(`Groq error (${res.status}): ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

function clamp(n, min, max, fallback) {
  if (Number.isNaN(n)) return fallback
  return Math.min(Math.max(n, min), max)
}

function corsHeaders(origin, env) {
  const allowed = env.ALLOWED_ORIGIN || '*'
  return {
    'Access-Control-Allow-Origin': allowed === '*' ? '*' : allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers })
}
