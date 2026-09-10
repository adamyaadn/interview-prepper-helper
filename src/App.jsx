import { useSession } from './state/SessionContext'
import Setup from './components/Setup'
import Diagnostic from './components/Diagnostic'
import TopicSession from './components/TopicSession'
import SidePanel from './components/SidePanel/SidePanel'

export default function App() {
  const { phase } = useSession()

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">PrepForge</span>
        <span className="brand-sub">interview prep, on your terms</span>
      </header>

      <main className="app-main">
        <section className="content-col">
          {phase === 'setup' && <Setup />}
          {phase === 'diagnostic' && <Diagnostic />}
          {phase === 'session' && <TopicSession />}
        </section>

        {phase !== 'setup' && (
          <aside className="panel-col">
            <SidePanel />
          </aside>
        )}
      </main>
    </div>
  )
}
