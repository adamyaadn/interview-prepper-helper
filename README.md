# PrepForge

Interactive interview prep, hosted for $0 — and now running on genuinely
free AI models. A static frontend on GitHub Pages talks to a Cloudflare
Worker, which calls Groq's free-tier API. No account for visitors, no key
to paste, no bill for anyone (including you).

## How it works

1. **Setup** — pick a difficulty tier (mapped to example companies) and IC
   level. No key, no account, nothing to configure as a visitor.
2. **Warm-up** — six scenario-based questions, one per topic (DSA, LLD, HLD,
   Concurrency, AI Agents, Other). Answer whichever pull you in and rate how
   into each one you were — the topic you engaged with most (not "did best
   on") becomes today's focus. Skip it entirely to jump straight to a topic
   instead.
3. **Session** — a live, conversational prep session on that topic. Questions
   rotate through six archetypes (design / debug / optimize / critique /
   teach-back / extend) so even a repeated subtopic comes at a new angle.
   "Go deeper," "speed round," and "next subtopic" give direct control over
   pace.
4. **Side panel** — IDE, whiteboard, and scratchpad stacked as a single-expand
   accordion. All three stay mounted, so switching between them never loses
   your work.

## Architecture

```
Browser (GitHub Pages, static)
   │  POST /session/start   — once per new day's session, gated by IP
   │  POST /generate        — { system, user, temperature }
   ▼
Cloudflare Worker (worker/)
   │  adds the real Groq key + pinned model + max_tokens
   ▼
Groq (free tier — Llama 3.3 70B by default)
```

The browser never holds a key and never picks a model. The worker meters
usage by **session**, not by individual call — you check in once when a
person starts a new day's plan, and the rest of that session's calls (the
syllabus, every turn, "go deeper," etc.) aren't separately rate-limited.
That keeps the metering cheap (one KV write per session instead of one per
call) while Groq's own generous limits — 30 requests/minute, 14,400/day —
act as the natural backstop underneath.

## Trade-off worth knowing: no live web search

Anthropic, OpenAI, and Gemini's paid tiers all offer a built-in web-search
tool that grounded questions in current interview trends. None of the free
tiers include that (Gemini's free tier explicitly excludes search
grounding). So the model now writes scenarios from its own training
knowledge rather than live search results — still application-based and
specific, just not pinned to this week's news. The anti-repetition system
(the fingerprint log + six rotating question archetypes) does more of the
work of keeping things fresh as a result.

## One-time setup

### 1. Get a free Groq key

[console.groq.com/keys](https://console.groq.com/keys) — sign up, no credit
card required.

### 2. The worker (Cloudflare)

```bash
cd worker
npx wrangler login
npx wrangler kv namespace create SESSIONS
# paste the id it prints into the kv_namespaces block in wrangler.toml

npx wrangler secret put GROQ_API_KEY

npx wrangler deploy
```

Wrangler prints your worker's URL (`https://prepforge-worker.<you>.workers.dev`).
Copy it — you'll need it in step 4.

Open `wrangler.toml` and set `ALLOWED_ORIGIN` to your actual GitHub Pages
origin (e.g. `https://yourname.github.io`) once you know it, so only your
frontend can call the worker.

### 3. GitHub Actions secrets, for auto-deploying the worker on push

In **Settings → Secrets and variables → Actions → Secrets**, add:
- `CLOUDFLARE_API_TOKEN` — create one at
  [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
  with the "Edit Cloudflare Workers" template.
- `CLOUDFLARE_ACCOUNT_ID` — found on the right sidebar of any page in the
  Cloudflare dashboard.

### 4. The frontend (GitHub Pages)

In **Settings → Secrets and variables → Actions → Variables**, add:
- `VITE_WORKER_URL` — the worker URL from step 2.

Then in **Settings → Pages**, set **Source** to **GitHub Actions**.

### 5. Push

```bash
git push origin main
```

Both workflows run: `.github/workflows/deploy-worker.yml` deploys the
worker whenever `worker/` changes, and `.github/workflows/deploy.yml`
builds and deploys the frontend with the worker URL baked in.

## Running locally

```bash
# terminal 1 — the worker
cd worker && npx wrangler dev

# terminal 2 — the frontend (defaults to http://localhost:8787)
npm install && npm run dev
```

## Customizing

- Difficulty tiers and their example companies, IC levels, question
  archetypes, and topic subtopic seeds all live in `src/constants.js`.
- All prompt text lives in `src/lib/prompts.js` — the engagement-over-correctness
  scoring philosophy and the anti-repetition mechanics are both implemented
  there and in `src/lib/fingerprints.js`.
- The model and the per-visitor daily session cap are both in
  `worker/wrangler.toml` — no code changes needed to tune them. Swap
  `GROQ_MODEL` for any other model in
  [Groq's current lineup](https://console.groq.com/docs/models) if you want
  a different quality/speed trade-off.
- Visual identity (palette, type, the graph-paper background) is in
  `src/index.css`.

## What's *not* covered here

The per-IP session cap uses `CF-Connecting-IP`, which is easy to defeat by
anyone willing to rotate IPs or use a VPN — this stops casual overuse, not
a determined bad actor. Since the whole stack is free either way, the worst
case is Groq's own rate limit kicking in for everyone until it resets, not
a bill. If you want to add a per-visitor session cap that's harder to
dodge, or a lightweight bot check, look at
[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) (free,
unlimited) — not wired in here to keep first-time setup simple.
