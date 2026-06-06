/**
 * Small line-icons (stroke = currentColor) so they tint with each job's state
 * colour. Kept monochrome and minimal to match the "Editorial Paper" theme —
 * no emoji.
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

/** Backend → server / stacked racks. */
export function ServerIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <line x1="7" y1="7" x2="7" y2="7" />
      <line x1="7" y1="17" x2="7" y2="17" />
    </svg>
  )
}

/** Frontend → browser window. */
export function BrowserIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="6.5" y1="6.5" x2="6.5" y2="6.5" />
      <line x1="9" y1="6.5" x2="9" y2="6.5" />
    </svg>
  )
}

/** Build → shipping container / docker-ish box. */
export function ContainerIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 8.5 12 4l9 4.5v7L12 20 3 15.5z" />
      <path d="M3 8.5 12 13l9 -4.5" />
      <line x1="12" y1="13" x2="12" y2="20" />
    </svg>
  )
}

/** Trigger → git branch (push / PR). */
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

export function SkipIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <line x1="6" y1="6" x2="6" y2="18" />
      <path d="M9 7.5 18 12 9 16.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Empty ring for a queued / not-yet-run step. */
export function DotIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="6" />
    </svg>
  )
}

/** Animated ring spinner for a running step. */
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
