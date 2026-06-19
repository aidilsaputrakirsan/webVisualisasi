/**
 * Line-icons (stroke = currentColor) for the AI Agent material. Monochrome, no
 * emoji — they tint with each node's active/idle colour.
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

/** Goal → flag / target. */
export function GoalIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.6" />
    </svg>
  )
}

/** Agent brain / reasoning core. */
export function BrainIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 4.5A2.5 2.5 0 0 0 6.5 7a2.4 2.4 0 0 0-1 4.2A2.5 2.5 0 0 0 7 16a2.3 2.3 0 0 0 2 3.5 1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5z" />
      <path d="M15 4.5A2.5 2.5 0 0 1 17.5 7a2.4 2.4 0 0 1 1 4.2A2.5 2.5 0 0 1 17 16a2.3 2.3 0 0 1-2 3.5A1.5 1.5 0 0 1 13.5 18V6A1.5 1.5 0 0 1 15 4.5z" />
    </svg>
  )
}

/** Calculator tool. */
export function CalcIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8.5" y1="11.5" x2="8.5" y2="11.5" />
      <line x1="12" y1="11.5" x2="12" y2="11.5" />
      <line x1="15.5" y1="11.5" x2="15.5" y2="11.5" />
      <line x1="8.5" y1="15.5" x2="8.5" y2="15.5" />
      <line x1="12" y1="15.5" x2="12" y2="15.5" />
      <line x1="15.5" y1="15.5" x2="15.5" y2="15.5" />
    </svg>
  )
}

/** Currency / FX tool. */
export function CurrencyIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 9a2.5 2.5 0 0 0-2.5-1.5c-1.4 0-2.5.8-2.5 2 0 2.6 5 1.4 5 4 0 1.2-1.1 2-2.5 2A2.5 2.5 0 0 1 9.5 16" />
      <line x1="12" y1="5.5" x2="12" y2="7" />
      <line x1="12" y1="17" x2="12" y2="18.5" />
    </svg>
  )
}

/** Web search tool. */
export function SearchIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="11" cy="11" r="6.5" />
      <line x1="15.8" y1="15.8" x2="20" y2="20" />
    </svg>
  )
}

/** Final answer → check in a chat bubble. */
export function AnswerIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-9l-4 3.5V16.5H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5z" />
      <path d="M8.5 11l2.2 2.2L15 9" />
    </svg>
  )
}
