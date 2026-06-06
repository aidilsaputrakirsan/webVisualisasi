/**
 * Line-icons (stroke = currentColor) for the CD pipeline material — they tint
 * with each stage/service state colour. Monochrome, no emoji, matching the
 * "Editorial Paper" theme.
 */
import { motion } from 'framer-motion'

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

/** CI stage → lab flask (tests). */
export function FlaskIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 3h6" />
      <path d="M10 3v6l-4.5 8a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9V3" />
      <line x1="8" y1="15" x2="16" y2="15" />
    </svg>
  )
}

/** Gate stage → git branch decision (if push to main?). */
export function BranchIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <circle cx="18" cy="8" r="2.4" />
      <path d="M6 8.4v7.2" />
      <path d="M18 10.4v1.1a4 4 0 0 1-4 4H6" />
    </svg>
  )
}

/** Backend service → server racks. */
export function ServerIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <line x1="7" y1="7" x2="7" y2="7" />
      <line x1="7" y1="17" x2="7" y2="17" />
    </svg>
  )
}

/** Frontend service → browser window. */
export function BrowserIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="6.5" y1="6.5" x2="6.5" y2="6.5" />
      <line x1="9" y1="6.5" x2="9" y2="6.5" />
    </svg>
  )
}

/** Database service → cylinder. */
export function DatabaseIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.6" />
      <path d="M5 5.5v13c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-13" />
      <path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
    </svg>
  )
}

/** Health check → heartbeat pulse. */
export function PulseIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 12h4l2-5 3 10 2-5h4" />
    </svg>
  )
}

/** Production live → globe. */
export function GlobeIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.4 4 5.7 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.7-4-9s1.4-6.6 4-9z" />
    </svg>
  )
}

/** Railway panel header → cloud. */
export function CloudIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9.5a3.5 3.5 0 0 1 .5 8.5z" />
    </svg>
  )
}

export function CheckIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2.4}>
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  )
}

export function CrossIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2.4}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

/** Skipped → a "no entry" / strike. */
export function SkipIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="8" />
      <line x1="7" y1="7" x2="17" y2="17" />
    </svg>
  )
}

export function DotIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="6" />
    </svg>
  )
}

export function SpinnerIcon({ size = 16 }: IconProps) {
  return (
    <motion.svg
      {...base(size)}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, ease: 'linear', duration: 0.9 }}
    >
      <path d="M12 4 a8 8 0 1 1 -8 8" />
    </motion.svg>
  )
}

export function LockIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
