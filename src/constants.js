export const TOPICS = ['DSA', 'LLD', 'HLD', 'Concurrency', 'AI Agents', 'Other']

export const DIFFICULTY_TIERS = {
  High: { label: 'High', companies: ['Atlassian', 'Google', 'Intuit', 'Arcesium'] },
  Medium: { label: 'Medium', companies: ['Oracle', 'Sixt', 'Okta', 'Akamai', 'Cisco'] },
  Low: { label: 'Low', companies: ['Infosys', 'Capgemini', 'Cognizant', 'Deloitte'] },
}

export const IC_LEVELS = ['IC1', 'IC2', 'IC3', 'IC4', 'IC5']

// Rotated across turns so a repeated subtopic still comes at a new angle.
export const ARCHETYPES = [
  { id: 'design', label: 'Design it from scratch' },
  { id: 'debug', label: 'Debug a broken version' },
  { id: 'optimize', label: 'Optimize a slow version' },
  { id: 'critique', label: 'Critique a trade-off' },
  { id: 'teach', label: 'Explain it to a junior engineer' },
  { id: 'extend', label: 'Scale or extend it' },
]

// Seeds, not a ceiling — prompts explicitly tell the model to range beyond these.
export const SUBTOPIC_SEEDS = {
  DSA: ['arrays & strings', 'trees & graphs', 'dynamic programming', 'greedy', 'heaps', 'tries', 'union-find', 'sliding window', 'backtracking'],
  LLD: ['design patterns', 'OOP modeling', 'parking-lot / elevator style systems', 'API design', 'state machines', 'concurrency-safe classes'],
  HLD: ['load balancing', 'caching', 'sharding', 'consistent hashing', 'queues & streaming', 'CAP trade-offs', 'rate limiting', 'CDNs'],
  Concurrency: ['locks & mutexes', 'lock-free structures', 'memory models', 'thread pools', 'async runtimes', 'deadlock & livelock', 'actor model', 'work-stealing schedulers'],
  'AI Agents': ['tool use & function calling', 'planning loops', 'memory & context management', 'multi-agent orchestration', 'evaluation & guardrails', 'RAG pipelines'],
  Other: ['networking fundamentals', 'databases & transactions', 'operating systems', 'security basics', 'behavioral / trade-off discussions'],
}
