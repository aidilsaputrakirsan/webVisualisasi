/**
 * Line-icons (stroke = currentColor) for the Message Queue material.
 * Monochrome, no emoji — they tint with each node's active/idle colour.
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

/** Order Service → shopping cart. */
export function CartIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="9.5" cy="19.5" r="1.5" />
      <circle cx="17.5" cy="19.5" r="1.5" />
      <path d="M3 4h2.2l2.3 11h10.6l2.4-8H6.1" />
    </svg>
  )
}

/** Message broker → inbox tray. */
export function TrayIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 6.5 2.5 13v6A1.5 1.5 0 0 0 4 20.5h16a1.5 1.5 0 0 0 1.5-1.5v-6L20 6.5A1.5 1.5 0 0 0 18.6 5.5H5.4A1.5 1.5 0 0 0 4 6.5z" />
      <path d="M2.5 13h5.5l2 3h4l2-3h5.5" />
    </svg>
  )
}

/** Payment Service → credit card. */
export function CardIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <line x1="2.5" y1="10" x2="21.5" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  )
}

/** Message → envelope. */
export function MailIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7.5 12 13.5 21 7.5" />
    </svg>
  )
}
