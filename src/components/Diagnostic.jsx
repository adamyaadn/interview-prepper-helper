import { useEffect, useState } from 'react'
import { useSession } from '../state/SessionContext'
import { generateDiagnostic, scoreAnswers } from '../lib/llm'
import { getFingerprints, addFingerprint, formatForPrompt } from '../lib/fingerprints'
import { DIFFICULTY_TIERS } from '../constants'

const RATING_LABELS = ['skip', 'meh', 'into it', 'hooked']

export default function Diagnostic() {
  const { difficulty, icLevel, longTermMemory, setTopic, setPhase } = useSession()
  const [status, setStatus] = useState('loading') // loading | ready | scoring | error
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [ratings, setRatings] = useState({})
  const [errorMsg, setErrorMsg] = useState('')
  const [tieOptions, setTieOptions] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const avoidText = formatForPrompt(getFingerprints(longTermMemory))
        const companies = DIFFICULTY_TIERS[difficulty].companies
        const result = await generateDiagnostic({ difficulty, companies, icLevel, avoidText })
        if (!cancelled) {
          setQuestions(result)
          setStatus('ready')
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message)
          setStatus('error')
        }
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setAnswer(i, text) {
    setAnswers((prev) => ({ ...prev, [i]: text }))
  }
  function setRating(i, val) {
    setRatings((prev) => ({ ...prev, [i]: val }))
  }

  async function finish() {
    setStatus('scoring')

    // Every asked question gets logged, answered or not — it was shown to
    // the user, so it shouldn't resurface tomorrow either.
    questions.forEach((q) => addFingerprint({ topic: q.topic, subtopic: q.subtopic, gist: q.prompt.slice(0, 80) }, longTermMemory))

    const qaPairs = questions.map((q, i) => ({
      topic: q.topic, subtopic: q.subtopic, prompt: q.prompt,
      rubric_hint: q.rubric_hint, answer: answers[i] || '',
    }))

    let depthScores = {}
    try {
      const scored = await scoreAnswers({ qaPairs })
      scored.forEach((s) => { depthScores[s.topic] = s.depth_score })
    } catch {
      // Scoring is a nice-to-have signal — fall back to self-rating alone if it fails.
    }

    const weights = {}
    questions.forEach((q, i) => {
      const depth = depthScores[q.topic] ?? 0
      const rating = ratings[i] ?? 0
      const lengthBonus = Math.min((answers[i]?.length || 0) / 200, 1)
      weights[q.topic] = (weights[q.topic] || 0) + depth * 2 + rating * 2 + lengthBonus
    })

    const maxWeight = Math.max(...Object.values(weights))
    const winners = Object.keys(weights).filter((t) => weights[t] === maxWeight)

    if (winners.length > 1) {
      setTieOptions(winners)
      setStatus('ready')
      return
    }
    setTopic(winners[0])
    setPhase('session')
  }

  if (status === 'loading') {
    return (
      <div className="card">
        <p>Building today's warm-up — six scenario questions, one per topic...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="card">
        <p className="error">Couldn't generate the warm-up: {errorMsg}</p>
        <button className="btn" onClick={() => setPhase('setup')}>Back to setup</button>
      </div>
    )
  }

  return (
    <div className="card">
      <h1>Quick warm-up</h1>
      <p className="muted">Answer whatever pulls you in — skip the rest. There are no wrong answers here.</p>

      {tieOptions && (
        <div className="tie-banner">
          <p>You were into both {tieOptions.join(' and ')} — pick one:</p>
          <div className="btn-row">
            {tieOptions.map((t) => (
              <button key={t} className="btn btn-primary" onClick={() => { setTopic(t); setPhase('session') }}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {!tieOptions && questions.map((q, i) => (
        <div key={i} className="question-card">
          <span className="pill">{q.topic}</span>
          <p>{q.prompt}</p>
          <textarea
            rows={3}
            value={answers[i] || ''}
            onChange={(e) => setAnswer(i, e.target.value)}
            placeholder="Type as much or as little as you want..."
          />
          <div className="rating-row">
            {RATING_LABELS.map((label, val) => (
              <button
                key={val}
                className={`rating-btn ${ratings[i] === val ? 'active' : ''}`}
                onClick={() => setRating(i, val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!tieOptions && (
        <button className="btn btn-primary" onClick={finish} disabled={status === 'scoring'}>
          {status === 'scoring' ? 'Reading your answers...' : "Find today's topic"}
        </button>
      )}
    </div>
  )
}
