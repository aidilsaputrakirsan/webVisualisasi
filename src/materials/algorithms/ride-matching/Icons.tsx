/** Top-down vehicle + pickup-pin SVGs, drawn inline so recordings never depend
 *  on a CDN. Vehicles point "north" at rotation 0; the map rotates them by the
 *  driver's heading. */

export function CarIcon({ color, size = 64, rotate = 0, opacity = 1 }: { color: string; size?: number; rotate?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 48" style={{ display: 'block', opacity, transform: `rotate(${rotate}deg)`, transition: 'transform 0.4s ease' }}>
      {/* wheels */}
      <g fill="#2A2E3A">
        <rect x="2.5" y="10" width="4.5" height="10" rx="2" />
        <rect x="29" y="10" width="4.5" height="10" rx="2" />
        <rect x="2.5" y="28" width="4.5" height="10" rx="2" />
        <rect x="29" y="28" width="4.5" height="10" rx="2" />
      </g>
      {/* body */}
      <rect x="6" y="2" width="24" height="44" rx="10" fill={color} />
      {/* cabin */}
      <rect x="9.5" y="15" width="17" height="17" rx="5" fill="#FFFFFF" opacity="0.88" />
      {/* windshield */}
      <path d="M10 14 L26 14 L23 8 Q18 6 13 8 Z" fill="#FFFFFF" opacity="0.6" />
      {/* headlights */}
      <rect x="9.5" y="3.5" width="4" height="2.6" rx="1.3" fill="#FFF7E0" />
      <rect x="22.5" y="3.5" width="4" height="2.6" rx="1.3" fill="#FFF7E0" />
    </svg>
  )
}

export function BikeIcon({ color, size = 58, rotate = 0, opacity = 1 }: { color: string; size?: number; rotate?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 48" style={{ display: 'block', opacity, transform: `rotate(${rotate}deg)`, transition: 'transform 0.4s ease' }}>
      {/* wheels */}
      <ellipse cx="18" cy="9" rx="4" ry="6.5" fill="#2A2E3A" />
      <ellipse cx="18" cy="39" rx="4" ry="6.5" fill="#2A2E3A" />
      {/* handlebar */}
      <rect x="9" y="11" width="18" height="3.4" rx="1.7" fill={color} />
      {/* body */}
      <rect x="13.5" y="9" width="9" height="30" rx="4.5" fill={color} />
      <rect x="14.5" y="20" width="7" height="9" rx="3" fill="#FFFFFF" opacity="0.85" />
    </svg>
  )
}

export function PinIcon({ color, size = 54 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 40" style={{ display: 'block' }}>
      <path
        d="M16 1 C8 1 2 7 2 15 C2 25 16 39 16 39 C16 39 30 25 30 15 C30 7 24 1 16 1 Z"
        fill={color}
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      <circle cx="16" cy="15" r="5.5" fill="#FFFFFF" />
    </svg>
  )
}
