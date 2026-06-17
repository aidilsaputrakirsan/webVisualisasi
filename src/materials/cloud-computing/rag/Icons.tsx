/**
 * Line-icons (stroke = currentColor) for the RAG material. Monochrome, no emoji
 * — they tint with each node's active/idle colour.
 */

interface IconProps {
  size?: number
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

/** Question / source document → document with text lines. */
export function DocIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M6 2.5h7l5 5V21a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 21z" />
      <path d="M13 2.5V7.5h5" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="16.5" x2="15" y2="16.5" />
    </svg>
  )
}

/** Question → speech bubble with "?". */
export function AskIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V16.5H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5z" />
      <path d="M9.6 9.4a2.4 2.4 0 0 1 4 1.7c0 1.6-2.4 1.8-2.4 3" />
      <line x1="11.2" y1="14.6" x2="11.2" y2="14.6" />
    </svg>
  )
}

/** Embedding model → sparkles (text → vector). */
export function SparkIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </svg>
  )
}

/** Vector DB → stacked layers / grid of vectors. */
export function VectorDbIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.6" />
      <path d="M5 5.5v13c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-13" />
      <path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
    </svg>
  )
}

/** LLM → chip / processor. */
export function LlmIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
      <line x1="9.5" y1="3" x2="9.5" y2="6.5" />
      <line x1="14.5" y1="3" x2="14.5" y2="6.5" />
      <line x1="9.5" y1="17.5" x2="9.5" y2="21" />
      <line x1="14.5" y1="17.5" x2="14.5" y2="21" />
      <line x1="3" y1="9.5" x2="6.5" y2="9.5" />
      <line x1="3" y1="14.5" x2="6.5" y2="14.5" />
      <line x1="17.5" y1="9.5" x2="21" y2="9.5" />
      <line x1="17.5" y1="14.5" x2="21" y2="14.5" />
    </svg>
  )
}

/** Answer → check in a chat bubble. */
export function AnswerIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-9l-4 3.5V16.5H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5z" />
      <path d="M8.5 11l2.2 2.2L15 9" />
    </svg>
  )
}
