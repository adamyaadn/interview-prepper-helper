import ReactMarkdown from 'react-markdown'

// Wraps LLM output so **bold**, `code`, > blockquotes, and lists actually
// render instead of showing up as literal asterisks and backticks.
export default function Markdown({ children }) {
  return (
    <div className="md">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  )
}
