/**
 * Line-icons (stroke = currentColor) for the B-SMART IPM material. Monochrome,
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

/* ── Phase loop ─────────────────────────────────────────── */

/** Sense → radiating antenna. */
export function SenseIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M6 6a8.5 8.5 0 0 0 0 12M18 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  )
}

/** Decide → chip / edge gateway. */
export function DecideIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3" />
    </svg>
  )
}

/** Act → lightning bolt. */
export function ActIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M13 3 5 13h6l-2 8 8-10h-6z" />
    </svg>
  )
}

/** Log → bar chart / dashboard. */
export function LogIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <rect x="7.5" y="12" width="2.6" height="5" />
      <rect x="12" y="8.5" width="2.6" height="8.5" />
      <rect x="16.5" y="5.5" width="2.6" height="11.5" />
    </svg>
  )
}

/** Loop → continuous cycle. */
export function LoopIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 9a8 8 0 0 1 13.7-3.3L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 15a8 8 0 0 1-13.7 3.3L4 16" />
      <path d="M4 20v-4h4" />
    </svg>
  )
}

/* ── Sensors ────────────────────────────────────────────── */

/** Spectral light sensor. */
export function LightIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
    </svg>
  )
}

/** PIR motion sensor → waves at a body. */
export function PirIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="8" cy="12" r="2.5" />
      <path d="M13 8a6 6 0 0 1 0 8M16 5.5a9.5 9.5 0 0 1 0 13" />
    </svg>
  )
}

/** Camera with edge ML. */
export function CameraIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <circle cx="12" cy="13" r="3.2" />
      <path d="M8 7l1.5-2.5h5L16 7" />
    </svg>
  )
}

/** Climate → droplet + thermometer hint. */
export function ClimateIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3.5c2.5 3.4 4.5 6 4.5 8.6a4.5 4.5 0 0 1-9 0c0-2.6 2-5.2 4.5-8.6z" />
      <path d="M12 9.5v4.5" />
    </svg>
  )
}

/** Solar / battery power. */
export function PowerIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="7" width="15" height="10" rx="2" />
      <path d="M21 10v4" />
      <path d="M7 7l1-2.5M12 7v-2.5M16 7l-1-2.5" />
    </svg>
  )
}

/* ── Gateway checks ─────────────────────────────────────── */

/** False-trigger filter → funnel. */
export function FilterIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 5h16l-6 7v6l-4 2v-8z" />
    </svg>
  )
}

/** Day / night context gate. */
export function GateIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="9" cy="12" r="3.5" />
      <path d="M9 4.5V6M9 18v1.5M2.5 12H4M14 12h1.5M4.6 7.6l1 1M12.4 15.4l1 1M4.6 16.4l1-1M12.4 8.6l1-1" />
      <path d="M21 13.5a4 4 0 0 1-4.6-5.6 4.5 4.5 0 1 0 4.6 5.6z" />
    </svg>
  )
}

/** Attack-level gauge. */
export function GaugeIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 15a8 8 0 0 1 16 0" />
      <path d="M12 15l4-3" />
      <circle cx="12" cy="15" r="1" />
    </svg>
  )
}

/* ── Actuator modules ───────────────────────────────────── */

/** Phototactic trap → bulb with a moth hint. */
export function TrapIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 16a5 5 0 1 1 6 0v2H9z" />
      <path d="M9.5 20h5M10.5 22h3" />
    </svg>
  )
}

/** Adaptive deterrent → speaker with sound waves. */
export function DeterrentIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 9.5h3l4-3v11l-4-3H4z" />
      <path d="M15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
    </svg>
  )
}

/** Leaf — eco / chemical-free benefit. */
export function LeafIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 19c0-8 6-13 14-13 0 8-5 14-13 14a8 8 0 0 1-1-1z" />
      <path d="M5 19c3-4 6-6 9-7" />
    </svg>
  )
}

/** Rain — weather gate. */
export function RainIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 16a4 4 0 0 1-.5-7.96 5 5 0 0 1 9.7-1.2A3.5 3.5 0 0 1 17 16z" />
      <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
    </svg>
  )
}

/** Sun — daytime. */
export function SunIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  )
}

/** Moon — nighttime. */
export function MoonIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
    </svg>
  )
}
