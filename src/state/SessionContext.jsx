import { createContext, useContext, useMemo, useState } from 'react'

const SessionCtx = createContext(null)

export function SessionProvider({ children }) {
  const [difficulty, setDifficulty] = useState('Medium')
  const [icLevel, setIcLevel] = useState('IC3')
  const [longTermMemory, setLongTermMemory] = useState(false)
  const [phase, setPhase] = useState('setup') // 'setup' | 'diagnostic' | 'session'
  const [topic, setTopic] = useState(null)

  const value = useMemo(
    () => ({
      difficulty, setDifficulty,
      icLevel, setIcLevel,
      longTermMemory, setLongTermMemory,
      phase, setPhase,
      topic, setTopic,
    }),
    [difficulty, icLevel, longTermMemory, phase, topic]
  )

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
}

export function useSession() {
  const ctx = useContext(SessionCtx)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
