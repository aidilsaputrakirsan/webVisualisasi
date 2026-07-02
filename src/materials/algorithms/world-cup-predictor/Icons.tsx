/** Line-icons specific to the World Cup Predictor material. */

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

export function TrophyIcon({ size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M7 3h10v5a5 5 0 0 1-10 0V3z" />
      <path d="M7 4H3.5v2a4 4 0 0 0 3.5 4" />
      <path d="M17 4h3.5v2a4 4 0 0 1-3.5 4" />
      <path d="M12 13v3.5" />
      <path d="M8.5 20.5h7" />
      <path d="M9.5 20.5c0-2.2 1-3 2.5-3s2.5.8 2.5 3" />
    </svg>
  )
}

export function DiceIcon({ size = 20, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}
