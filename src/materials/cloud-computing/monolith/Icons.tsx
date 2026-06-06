/**
 * Line-icons (stroke = currentColor) for the Monolith material. Monochrome,
 * no emoji — they tint with each node's active/idle colour. Mirrors the icon
 * set used by the Microservices material so the two read as a matched pair.
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

/** Backend app → server stack (single process). */
export function AppIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <line x1="7" y1="7" x2="7" y2="7" />
      <line x1="7" y1="17" x2="7" y2="17" />
    </svg>
  )
}

/** Auth module → shield. */
export function ShieldIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3 5 6v6c0 4.2 3 7.5 7 9 4-1.5 7-4.8 7-9V6z" />
      <path d="M9.2 12l2 2 3.6-3.8" />
    </svg>
  )
}

/** Items module → package box. */
export function BoxIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M21 16V8l-9-5-9 5v8l9 5z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </svg>
  )
}

/** Database → cylinder. */
export function DatabaseIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.6" />
      <path d="M5 5.5v13c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-13" />
      <path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
    </svg>
  )
}
