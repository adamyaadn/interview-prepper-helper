import { useEffect } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
// Note: this version of @excalidraw/excalidraw injects its own styles at
// runtime — there's no separate stylesheet to import.

export default function WhiteboardTab({ active }) {
  useEffect(() => {
    if (!active) return
    // Excalidraw sizes its canvas off its container, which is 0px tall
    // until the accordion finishes expanding — nudge it once that's done.
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 260)
    return () => clearTimeout(t)
  }, [active])

  return (
    <div className="whiteboard-tab">
      <Excalidraw theme="dark" />
    </div>
  )
}
