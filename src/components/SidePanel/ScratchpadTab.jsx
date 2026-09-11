import { useState } from 'react'

export default function ScratchpadTab() {
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState(false)

  async function copyNotes() {
    try {
      await navigator.clipboard.writeText(notes)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard permission denied — nothing else to do here.
    }
  }

  return (
    <div className="scratchpad-wrap">
      <div className="scratchpad-toolbar">
        <button className="copy-btn" onClick={copyNotes}>{copied ? 'Copied! 💖' : 'Copy'}</button>
      </div>
      <textarea
        className="scratchpad"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Rough notes, half-formed thoughts, whatever..."
      />
    </div>
  )
}
