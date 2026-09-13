import { SUBTOPIC_SEEDS, ARCHETYPES, TOPICS } from '../constants'

export function buildDiagnosticPrompt({ difficulty, companies, icLevel, avoidText }) {
  const system = `You are a panel of experienced interview leads across six domains: DSA, LLD (low-level design), HLD (high-level design), concurrency/multithreading, AI agents, and general engineering fundamentals (Other). You write application-based, scenario-driven interview questions — never textbook definitions. Draw on everything you know about what real interviews at ${difficulty}-tier companies (examples: ${companies.join(', ')}) actually probe for a candidate at level ${icLevel}, and let that shape the scenarios. Cover subtopics beyond the obvious mainstream ones — pull from the long tail of each domain, not just the first thing that comes to mind. Respond with ONLY a raw JSON array, no prose, no code fences.`

  const user = `Write exactly one scenario-based question for each of these six topics: ${TOPICS.join(', ')}.

Each question must:
- Read like something asked in a real ${difficulty}-tier onsite for an ${icLevel} candidate — a concrete situation, not "what is X".
- Reach into an under-covered subtopic of its domain where reasonable, not just the most obvious one.
- Be answerable in 3-6 sentences by someone who wants to engage, not write an essay.

Do not repeat or closely resemble any of these previously asked questions:
${avoidText}

Return a JSON array of exactly 6 objects, each shaped like:
{"topic": "<one of ${TOPICS.join('|')}>", "subtopic": "<short phrase>", "prompt": "<the question text>", "rubric_hint": ["<idea 1>", "<idea 2>", "<idea 3>"]}`

  return { system, user }
}

export function buildScoringPrompt({ qaPairs }) {
  const system = `You evaluate how deeply someone engaged with an interview-style question — NOT whether they were correct. You are generous and curious, not a grader. Depth means: how many distinct, relevant ideas they raised, whether they reasoned about trade-offs, whether they showed genuine interest. A confidently wrong but thoughtful answer scores as high as a correct but shallow one. Respond with ONLY a raw JSON array, no prose.`

  const items = qaPairs
    .map(
      (qa, i) =>
        `${i + 1}. [${qa.topic}/${qa.subtopic}] Q: ${qa.prompt}\nA: ${qa.answer || '(left blank)'}\nRubric hints (for your reference only, do not grade against them literally): ${(qa.rubric_hint || []).join(', ') || 'none'}`
    )
    .join('\n\n')

  const user = `Score engagement depth for each answer below, on a 0-3 scale (0 = blank/no attempt, 1 = brief/surface, 2 = solid engagement, 3 = rich, multi-angle engagement).

${items}

Return a JSON array of objects: {"topic": "<topic>", "depth_score": <0-3>, "note": "<one short phrase on what stood out>"}`

  return { system, user }
}

export function buildSyllabusPrompt({ topic, difficulty, companies, icLevel, avoidText }) {
  const seeds = SUBTOPIC_SEEDS[topic]?.join(', ') || ''
  const system = `You design a short, focused interview-prep session for one topic. Ground it in what ${difficulty}-tier companies (examples: ${companies.join(', ')}) actually ask an ${icLevel} candidate, drawing on everything you know about current interview patterns. Respond with ONLY a raw JSON object, no prose.`

  const user = `Build today's session plan for the topic "${topic}".

Known subtopics to draw from (not exhaustive — go beyond this list if something more current or interesting fits): ${seeds}.

Avoid retreading these recent questions:
${avoidText}

Return a JSON object shaped like:
{"topic": "${topic}", "overview": "<1-2 sentence framing of today's focus>", "subtopics": [{"name": "<subtopic>", "why": "<why it matters at this level/tier>"}]}

Include 3-5 subtopics, ordered from foundational to advanced.`

  return { system, user }
}

export function buildTurnPrompt({ topic, subtopic, archetype, difficulty, companies, icLevel, avoidText, paceInstruction, history }) {
  const archetypeDef = ARCHETYPES.find((a) => a.id === archetype) || ARCHETYPES[0]
  const isFirstTurn = history.length === 0

  const system = `You are running a live, interactive interview-prep session on "${topic}" (currently focused on "${subtopic}") for an ${icLevel} candidate targeting ${difficulty}-tier companies (examples: ${companies.join(', ')}). Talk like a real interviewer in a real back-and-forth conversation — one exchange at a time.

Hard rules:
- Ask exactly ONE question per response. Never bundle a second question, a second scenario, or a "let's also try..." into the same message.
- Never invent, assume, or respond to something the candidate hasn't actually said. If there's no candidate message yet, just ask your question directly — no "assume you've just answered" framing, no fictional prior exchange.
- Only react to the candidate's last message if one actually exists in the conversation below.
- Plain conversational prose. Markdown is fine (bold, code, etc.) but keep it light — this is spoken dialogue, not a document.
- Frame the question in this turn's style: "${archetypeDef.label}."
- Never ask something resembling these already-covered prompts:
${avoidText}`

  const historyText = history.length
    ? history.map((turn) => `${turn.role === 'user' ? 'Candidate' : 'Interviewer'}: ${turn.content}`).join('\n')
    : ''

  const user = isFirstTurn
    ? `${paceInstruction}\n\nThis is the very first message of the session — there's no prior exchange. Just ask your opening question directly, in this turn's style ("${archetypeDef.label}"). Keep it under ~100 words.`
    : `Conversation so far:
${historyText}

${paceInstruction}

The candidate's last message is right above. Respond to it briefly and generously — note what was strong — then ask your next question in this turn's style ("${archetypeDef.label}"). Keep your whole response under ~120 words.`

  return { system, user }
}

export function buildAnswerRevealPrompt({ topic, subtopic, question, difficulty, icLevel }) {
  const system = `You give concise, generous model answers for interview-prep questions. You're not grading — you're showing what a strong response might cover, so the person can compare notes with their own attempt. Keep it to 3-5 short bullet points, no preamble, no "Here's the answer" framing — just the points themselves as plain text with a leading dash on each line.`

  const user = `Topic: ${topic} (${subtopic}). Level: ${icLevel}, ${difficulty} difficulty.

The question just asked was:
${question}

Give 3-5 bullet points covering what a strong answer would touch on.`

  return { system, user }
}
