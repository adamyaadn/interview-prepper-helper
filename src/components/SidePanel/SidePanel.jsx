import { useState, lazy, Suspense } from 'react'
import IdeTab from './IdeTab'
import ScratchpadTab from './ScratchpadTab'

// Excalidraw is the single largest dependency in this app (~1MB gzipped) —
// deferring it means people who never open the whiteboard never pay for it.
const WhiteboardTab = lazy(() => import('./WhiteboardTab'))

const PANELS = [
  { id: 'ide', label: 'IDE' },
  { id: 'whiteboard', label: 'Whiteboard' },
  { id: 'notes', label: 'Scratchpad' },
]

export default function SidePanel() {
  const [active, setActive] = useState('ide')

  return (
    <div className="accordion">
      {PANELS.map((panel) => (
        <div className="accordion-panel" key={panel.id}>
          <button className="accordion-header" onClick={() => setActive(panel.id)}>
            <span>{panel.label}</span>
            <span className={`chevron ${active === panel.id ? 'open' : ''}`}>⌄</span>
          </button>
          {/* All three tabs stay mounted — only the active one's height opens.
              This keeps code, drawings, and notes alive when you switch away. */}
          <div className={`accordion-content ${active === panel.id ? 'open' : ''}`}>
            {panel.id === 'ide' && <IdeTab />}
            {panel.id === 'whiteboard' && (
              <Suspense fallback={<p className="muted" style={{ padding: 16 }}>Loading whiteboard...</p>}>
                <WhiteboardTab active={active === 'whiteboard'} />
              </Suspense>
            )}
            {panel.id === 'notes' && <ScratchpadTab />}
          </div>
        </div>
      ))}
    </div>
  )
}
