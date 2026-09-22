import { useEffect, useRef, useState } from 'react'
import { useSession } from '../state/SessionContext'
import { generateSyllabus, generateTurn, generateAnswerReveal } from '../lib/llm'
import { getFingerprints, addFingerprint, formatForPrompt } from '../lib/fingerprints'
import { ARCHETYPES, DIFFICULTY_TIERS } from '../constants'
import Markdown from './Markdown'

const MAX_HISTORY_TURNS = 6 // last ~3 exchanges — keeps the prompt bounded regardless of session length

export default function TopicSession() {
  const { difficulty, icLevel, longTermMemory, topic, setPhase } = useSession()
  const [syllabus, setSyllabus] = useState(null)
  const [subtopicIndex, setSubtopicIndex] = useState(0)
  const [archetypeIndex, setArchetypeIndex] = useState(0)
  const [transcript, setTranscript] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revealed, setRevealed] = useState({})
  const [revealing, setRevealing] = useState(null)
  const scrollRef = useRef(null)

  const companies = DIFFICULTY_TIERS[difficulty].companies

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const avoidText = formatForPrompt(getFingerprints(longTermMemory))
        const plan = await generateSyllabus({ topic, difficulty, companies, icLevel, avoidText })
        if (cancelled) return
        setSyllabus(plan)
        await runTurn({
          subtopicOverride: plan.subtopics[0]?.name,
          paceInstruction: 'Open the session with a warm, inviting first question.',
          historyOverride: [],
        })
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [transcript])

  async function runTurn({ subtopicOverride, paceInstruction, historyOverride } = {}) {
    setLoading(true)
    setError('')
    const subtopic = subtopicOverride || syllabus?.subtopics[subtopicIndex]?.name || topic
    const archetype = ARCHETYPES[archetypeIndex % ARCHETYPES.length].id
    const avoidText = formatForPrompt(getFingerprints(longTermMemory))
    const history = historyOverride ?? transcript

    try {
      const reply = await generateTurn({
        topic, subtopic, archetype, difficulty, companies, icLevel,
        avoidText, paceInstruction: paceInstruction || 'Continue naturally.', history: history.slice(-MAX_HISTORY_TURNS),
      })
      setTranscript([...history, { role: 'assistant', content: reply }])
      addFingerprint({ topic, subtopic, gist: reply.slice(0, 80) }, longTermMemory)
      setArchetypeIndex((i) => i + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function send() {
    if (!draft.trim()) return
    const withAnswer = [...transcript, { role: 'user', content: draft }]
    setTranscript(withAnswer)
    setDraft('')
    runTurn({ historyOverride: withAnswer, paceInstruction: 'Continue naturally.' })
  }

  function nextSubtopic() {
    const next = Math.min(subtopicIndex + 1, (syllabus?.subtopics.length || 1) - 1)
    setSubtopicIndex(next)
    runTurn({ subtopicOverride: syllabus?.subtopics[next]?.name, paceInstruction: 'Move on to the next subtopic in the plan.' })
  }

  function goDeeper() {
    runTurn({ paceInstruction: 'Go deeper on the same subtopic — push into edge cases and follow-up trade-offs.' })
  }

  function speedRound() {
    runTurn({ paceInstruction: 'Speed round — ask a short, rapid-fire question in one or two sentences.' })
  }

  async function revealAnswer(i, questionText) {
    setRevealing(i)
    try {
      const subtopic = syllabus?.subtopics[subtopicIndex]?.name || topic
      const text = await generateAnswerReveal({ topic, subtopic, question: questionText, difficulty, icLevel })
      setRevealed((prev) => ({ ...prev, [i]: text }))
    } catch (err) {
      setRevealed((prev) => ({ ...prev, [i]: `Couldn't load an answer: ${err.message}` }))
    } finally {
      setRevealing(null)
    }
  }

  return (
    <div className="card session-card">
      <div className="session-head">
        <div>
          <span className="pill">{topic}</span>
          {syllabus && <span className="muted"> · {syllabus.subtopics[subtopicIndex]?.name}</span>}
        </div>
        <button className="btn btn-ghost" onClick={() => setPhase('setup')}>Switch topic</button>
      </div>

      {syllabus && <p className="muted overview">{syllabus.overview}</p>}

      <div className="transcript" ref={scrollRef}>
        {transcript.map((turn, i) => (
          <div key={i}>
            <div className={`bubble ${turn.role}`}><Markdown>{turn.content}</Markdown></div>
            {turn.role === 'assistant' && (
              <>
                <button
                  className="see-answer-btn"
                  onClick={() => revealed[i] ? setRevealed((p) => { const n = { ...p }; delete n[i]; return n }) : revealAnswer(i, turn.content)}
                  disabled={revealing === i}
                >
                  {revealing === i ? 'Loading...' : revealed[i] ? 'Hide answer' : 'See answer 💖'}
                </button>
                {revealed[i] && <div className="answer-reveal"><Markdown>{revealed[i]}</Markdown></div>}
              </>
            )}
          </div>
        ))}
        {loading && <div className="bubble assistant loading">Thinking...</div>}
      </div>

      {error && <p className="error">{error}</p>}

      <div className="composer">
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your answer..."
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <button className="btn btn-primary" onClick={send} disabled={loading}>Send</button>
      </div>

      <div className="btn-row pace-row">
        <button className="btn btn-ghost" onClick={goDeeper} disabled={loading}>Go deeper</button>
        <button className="btn btn-ghost" onClick={speedRound} disabled={loading}>Speed round</button>
        <button className="btn btn-ghost" onClick={nextSubtopic} disabled={loading || !syllabus}>Next subtopic</button>
      </div>
    </div>
  )
}
