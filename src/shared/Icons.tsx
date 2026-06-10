/**
 * Generic line-icons (stroke = currentColor) shared across materials —
 * elegant replacements for emoji in canvas content and control panels.
 * Per-material icons that are too specific stay in that material's folder.
 */

interface IconProps {
  size?: number
  strokeWidth?: number
}

const base = (size: number, strokeWidth = 1.7) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export function CartIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L22 7H6" />
    </svg>
  )
}

export function CheckIcon({ size = 16, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  )
}

export function LightbulbIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3a6 6 0 0 0-4 10.5c.8.7 1.3 1.5 1.5 2.5h5c.2-1 .7-1.8 1.5-2.5A6 6 0 0 0 12 3z" />
      <path d="M9.5 19h5" />
      <path d="M10.5 22h3" />
    </svg>
  )
}

export function BookIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

export function CodeIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

export function PlayIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size, 2)} fill="currentColor">
      <path d="M7 4 20 12 7 20Z" />
    </svg>
  )
}

export function PauseIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size, 2.6)}>
      <line x1="8" y1="5" x2="8" y2="19" />
      <line x1="16" y1="5" x2="16" y2="19" />
    </svg>
  )
}

export function StepIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size, 2)} fill="currentColor">
      <path d="M5 4 16 12 5 20Z" />
      <line x1="19" y1="5" x2="19" y2="19" fill="none" strokeWidth={2.6} />
    </svg>
  )
}

export function ResetIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size, 2)}>
      <path d="M9 7H4V2" />
      <path d="M4 7a8 8 0 1 1-2 5.3" />
    </svg>
  )
}

export function SoundOnIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size, 2)}>
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}

export function SoundOffIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size, 2)}>
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <line x1="16" y1="9" x2="22" y2="15" />
      <line x1="22" y1="9" x2="16" y2="15" />
    </svg>
  )
}

export function ChevronUpIcon({ size = 24, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <polyline points="6 15 12 9 18 15" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 24, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
