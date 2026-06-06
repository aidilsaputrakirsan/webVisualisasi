/**
 * Line-icons (stroke = currentColor) for the Rate Limiting material. Monochrome,
 * no emoji — they tint with each node's active/idle colour.
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

/** Client → user. */
export function UserIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  )
}

/** Gateway → doorway / arch. */
export function GatewayIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 21V9a8 8 0 0 1 16 0v12" />
      <path d="M9 21v-8a3 3 0 0 1 6 0v8" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  )
}

/** Backend → server racks. */
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
