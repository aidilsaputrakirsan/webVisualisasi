/** Line-icons (stroke = currentColor) for the Saga material. */
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

export function CartIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L22 7H6" />
    </svg>
  )
}

export function CardIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  )
}

export function BoxIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M21 16V8l-9-5-9 5v8l9 5z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </svg>
  )
}

export function TruckIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="1" y="6" width="13" height="10" rx="1" />
      <path d="M14 9h4l3 3v4h-7z" />
      <circle cx="6" cy="18" r="1.6" />
      <circle cx="18" cy="18" r="1.6" />
    </svg>
  )
}

export function CheckIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2.4}>
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  )
}

export function CrossIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2.4}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

export function UndoIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 7H4V2" />
      <path d="M4 7a8 8 0 1 1-2 5.3" />
    </svg>
  )
}

export function SpinnerIcon({ size = 16 }: IconProps) {
  return (
    <motion.svg {...base(size)} animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 0.9 }}>
      <path d="M12 4 a8 8 0 1 1 -8 8" />
    </motion.svg>
  )
}
