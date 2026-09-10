import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'

const LANGS = { javascript: javascript(), python: python() }

export default function IdeTab() {
  const [lang, setLang] = useState('javascript')
  const [code, setCode] = useState('// scratch away\n')

  return (
    <div className="ide-tab">
      <div className="ide-toolbar">
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </select>
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
