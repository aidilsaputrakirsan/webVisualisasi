/** Line icons for the journey rails (stroke = currentColor, Lucide-style). */
const PATHS = {
  phone: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  tower: (
    <>
      <path d="M12 10v11M9 21l3-11 3 11" />
      <circle cx="12" cy="8" r="1.4" />
      <path d="M8.5 4.5a5 5 0 0 0 0 7M15.5 4.5a5 5 0 0 1 0 7" />
    </>
  ),
  ocean: (
    <>
      <path d="M2 8c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
      <path d="M2 13c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
      <path d="M3 19h18" />
      <circle cx="12" cy="19" r="1.2" />
    </>
  ),
  server: (
    <>
      <rect x="4" y="3" width="16" height="7" rx="1.5" />
      <rect x="4" y="14" width="16" height="7" rx="1.5" />
      <path d="M8 6.5h.01M8 17.5h.01" />
    </>
  ),
  queue: (
    <>
      <rect x="2.5" y="9" width="5" height="6" rx="1" />
      <rect x="9.5" y="9" width="5" height="6" rx="1" />
      <rect x="16.5" y="9" width="5" height="6" rx="1" />
      <path d="M5 19h14" />
    </>
  ),
  friend: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="m9.5 12 2 2 3.5-4" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7l5.5-3.5z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.8 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.8-3.8-9S9.5 5.5 12 3z" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  chunks: (
    <>
      <rect x="2.5" y="7" width="5" height="10" rx="1" />
      <rect x="9.5" y="7" width="5" height="10" rx="1" />
      <rect x="16.5" y="7" width="5" height="10" rx="1" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="m12 16 4-5" />
      <path d="M4 20h16" />
    </>
  ),
  satellite: (
    <>
      <rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)" />
      <path d="m5.5 5.5 3 3M15.5 15.5l3 3" />
      <path d="M3 8l5-5 2.5 2.5-5 5zM16 21l5-5-2.5-2.5-5 5z" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 13.5V9.5M9.5 2.5h5" />
    </>
  ),
  ring: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="1.3" />
    </>
  ),
  cross: (
    <>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  qr: (
    <>
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
      <path d="M14.5 14.5h2.5v2.5M20.5 14.5v6h-3.5M14.5 20.5h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
      <rect x="4" y="8" width="16" height="11" rx="2" />
      <circle cx="16" cy="13.5" r="1.3" />
    </>
  ),
  hub: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="4.5" cy="5" r="1.8" />
      <circle cx="19.5" cy="5" r="1.8" />
      <circle cx="4.5" cy="19" r="1.8" />
      <circle cx="19.5" cy="19" r="1.8" />
      <path d="m6 6.3 3.8 3.6M18 6.3l-3.8 3.6M6 17.7l3.8-3.6M18 17.7l-3.8-3.6" />
    </>
  ),
  bank: (
    <>
      <path d="M3 9.5 12 4l9 5.5z" />
      <path d="M5.5 10v7M10 10v7M14 10v7M18.5 10v7M3.5 20h17" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5.5h16v10H9l-5 4z" />
      <path d="M8 10h8" />
    </>
  ),
  grid: (
    <>
      <path d="M5 4v16M9.5 4v16M14 4v16M18.5 4v16" />
      <path d="M3 8.5h5M7.5 13h4M12 6h4.5M16.5 16h4" />
    </>
  ),
  link: (
    <>
      <circle cx="5" cy="17" r="2" />
      <circle cx="19" cy="17" r="2" />
      <path d="M5 15c0-9 14-9 14 0" />
    </>
  ),
  bars: (
    <>
      <path d="M5 20V10M10 20V4M15 20v-7M20 20v-4M3 20h18" />
    </>
  ),
  loop: (
    <>
      <path d="M17 3l3 3-3 3" />
      <path d="M20 6H9a5 5 0 0 0 0 10h1" />
      <path d="M7 21l-3-3 3-3" />
      <path d="M4 18h11a5 5 0 0 0 0-10h-1" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M7 11a5 5 0 0 1 10 0v2" />
      <path d="M12 11v4a6 6 0 0 1-1.5 4" />
      <path d="M9.5 12.5V15a8 8 0 0 1-1 3.5M14.5 12v3.5a9 9 0 0 1-.8 3.5" />
      <path d="M4.5 13v-2a7.5 7.5 0 0 1 15 0v3" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 21 19.5H3z" />
      <path d="M12 10v4.5M12 17h.01" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="m7 10 3 2.5L7 15M12.5 15.5H17" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v6c0 4.2-3 7.3-7 8.5-4-1.2-7-4.3-7-8.5V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  store: (
    <>
      <path d="M4 10v10h16V10" />
      <path d="M3 10l2-5h14l2 5c0 1.4-1.1 2.5-2.5 2.5S16 11.4 16 10c0 1.4-1.1 2.5-2.5 2.5h-3C9.1 12.5 8 11.4 8 10c0 1.4-1.1 2.5-2.5 2.5S3 11.4 3 10z" />
      <path d="M10 20v-4h4v4" />
    </>
  ),
}

export type IconName = keyof typeof PATHS

export function StageIcon({ name, size = 34 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  )
}
