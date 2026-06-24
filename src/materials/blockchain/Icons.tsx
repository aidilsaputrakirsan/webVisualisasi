/**
 * Line-icons (stroke = currentColor) shared by Blockchain materials. Sized in
 * fixed px like the rest of the canvas content. No emoji — professional SVGs.
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

/** The hash sigil — for the hashing function. */
export function HashIcon({ size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  )
}

/** A 3D cube — one block. */
export function BlockIcon({ size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M12 2.5 21 7v10l-9 4.5L3 17V7z" />
      <path d="M3 7l9 4.5L21 7" />
      <path d="M12 11.5V21.5" />
    </svg>
  )
}

/** Chain link — blocks linked by previous hash. */
export function LinkIcon({ size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M9 13a4 4 0 0 0 5.66 0l2.5-2.5a4 4 0 0 0-5.66-5.66l-1.4 1.4" />
      <path d="M15 11a4 4 0 0 0-5.66 0l-2.5 2.5a4 4 0 0 0 5.66 5.66l1.4-1.4" />
    </svg>
  )
}

/** Document / arbitrary input data. */
export function FileIcon({ size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <line x1="8.5" y1="13" x2="15.5" y2="13" />
      <line x1="8.5" y1="17" x2="13" y2="17" />
    </svg>
  )
}

/** Fingerprint — a digest as a unique fingerprint of data. */
export function FingerprintIcon({ size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M5.5 8.5a8 8 0 0 1 13 0" />
      <path d="M12 7a5 5 0 0 0-5 5v2a3 3 0 0 1-.5 1.7" />
      <path d="M17 12a5 5 0 0 0-1.5-3.6" />
      <path d="M12 12v2a7 7 0 0 1-1 3.6" />
      <path d="M14.5 14a5 5 0 0 1-1 4.5" />
      <path d="M12 12v.5" />
    </svg>
  )
}

/** Arrow pointing right — feed-in / produces. */
export function ArrowRightIcon({ size = 24, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="14 6 20 12 14 18" />
    </svg>
  )
}

/** Curved arrow down — produces a result below. */
export function ArrowDownIcon({ size = 24, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <line x1="12" y1="4" x2="12" y2="20" />
      <polyline points="6 14 12 20 18 14" />
    </svg>
  )
}
