/** Line-icons (stroke = currentColor) for the JWT Auth Patterns material. */

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

export function ClientIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="18" x2="12" y2="21" />
    </svg>
  )
}

export function GatewayIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 21V9a8 8 0 0 1 16 0v12" />
      <path d="M9 21v-8a3 3 0 0 1 6 0v8" />
      <line x1="2" y1="21" x2="22" y2="21" />
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

export function ShieldIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3 5 6v6c0 4.2 3 7.5 7 9 4-1.5 7-4.8 7-9V6z" />
      <path d="M9.2 12l2 2 3.6-3.8" />
    </svg>
  )
}

export function DatabaseIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.6" />
      <path d="M5 5.5v13c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-13" />
      <path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
    </svg>
  )
}

export function LockIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function KeyIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12 21 2" />
      <path d="M18 5l2 2" />
      <path d="M15 8l2 2" />
    </svg>
  )
}
