import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'

const LANGS = { javascript: javascript(), python: python() }

export default function IdeTab() {
  const [lang, setLang] = useState('javascript')
  const [code, setCode] = useState('// scratch away\n')
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard permission denied — nothing else to do here.
    }
  }

  return (
    <div className="ide-tab">
      <div className="ide-toolbar">
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </select>
        <button className="copy-btn" onClick={copyCode}>{copied ? 'Copied! 💖' : 'Copy'}</button>
      </div>
      <CodeMirror
        value={code}
        height="280px"
        theme={oneDark}
        extensions={[LANGS[lang]]}
        onChange={(val) => setCode(val)}
      />
    </div>
  )
}
