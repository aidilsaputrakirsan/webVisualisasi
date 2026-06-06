/**
 * Line-icons (stroke = currentColor) for the Reliability material. Monochrome,
 * no emoji — they tint with each node's active/idle colour.
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

/** Item Service → package box. */
export function BoxIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M21 16V8l-9-5-9 5v8l9 5z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </svg>
  )
}

/** Auth Service → shield. */
export function ShieldIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3 5 6v6c0 4.2 3 7.5 7 9 4-1.5 7-4.8 7-9V6z" />
      <path d="M9.2 12l2 2 3.6-3.8" />
    </svg>
  )
}

/** Circuit breaker → lightning bolt. */
export function BoltIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
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

/** Animated ring spinner (request in-flight / waiting). */
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
