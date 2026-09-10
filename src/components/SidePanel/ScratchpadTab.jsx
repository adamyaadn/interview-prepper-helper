import { useState } from 'react'

export default function ScratchpadTab() {
  const [notes, setNotes] = useState('')

  return (
    <textarea
      className="scratchpad"
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      placeholder="Rough notes, half-formed thoughts, whatever..."
    />
  )
}
