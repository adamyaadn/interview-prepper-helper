import { useState } from 'react'
import { useSession } from '../state/SessionContext'
import { DIFFICULTY_TIERS, IC_LEVELS, TOPICS } from '../constants'
import { checkSessionStart } from '../lib/llm'

export default function Setup() {
  const {
    difficulty, setDifficulty,
    icLevel, setIcLevel,
    longTermMemory, setLongTermMemory,
    setPhase, setTopic,
  } = useSession()

  const [checking, setChecking] = useState(false)
  const [gateError, setGateError] = useState('')

  // Gates entry into a new day's session against the worker's per-IP daily
  // cap. Checked once here — turns within a session aren't re-checked.
  async function startSession(next) {
    setChecking(true)
    setGateError('')
    try {
      const { allowed, message } = await checkSessionStart()
      if (!allowed) {
        setGateError(message || "You've hit today's session limit — come back tomorrow.")
        return
      }
      next()
    } catch (err) {
      setGateError(err.message)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="card">
      <h1>Set up today's session</h1>
      <p className="muted">Free to use — no account, no key, no signup. Just pick your settings and go.</p>

      <label className="field">
        <span>Difficulty</span>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          {Object.keys(DIFFICULTY_TIERS).map((tier) => (
            <option key={tier} value={tier}>
              {tier} — {DIFFICULTY_TIERS[tier].companies.join(', ')}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Level</span>
        <select value={icLevel} onChange={(e) => setIcLevel(e.target.value)}>
          {IC_LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
        </select>
      </label>

      <label className="field-inline">
        <input
          type="checkbox"
          checked={longTermMemory}
          onChange={(e) => setLongTermMemory(e.target.checked)}
        />
        <span>Remember topics across days on this device, so tomorrow doesn't repeat today. Stored only in your browser's local storage — clearable anytime.</span>
      </label>

      {gateError && <p className="error">{gateError}</p>}

      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => startSession(() => setPhase('diagnostic'))} disabled={checking}>
          {checking ? 'Checking...' : 'Take the 6-question warm-up'}
        </button>
        <span className="muted">or jump straight to a topic:</span>
      </div>
      <div className="topic-pick">
        {TOPICS.map((t) => (
          <button
            key={t}
            className="btn btn-ghost"
            onClick={() => startSession(() => { setTopic(t); setPhase('session') })}
            disabled={checking}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
