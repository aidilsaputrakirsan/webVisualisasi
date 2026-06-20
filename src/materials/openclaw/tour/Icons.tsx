import type { ReactNode } from 'react'

/** Line-icons for the OpenClaw material (stroke = currentColor). No emoji. */
const base = (size: number, strokeWidth: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

const cpu = (
  <>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
  </>
)

const PATHS: Record<string, ReactNode> = {
  server: (
    <>
      <rect x="4" y="4" width="16" height="7" rx="1.5" />
      <rect x="4" y="13" width="16" height="7" rx="1.5" />
      <circle cx="8" cy="7.5" r="0.8" />
      <circle cx="8" cy="16.5" r="0.8" />
      <line x1="11.5" y1="7.5" x2="16" y2="7.5" />
      <line x1="11.5" y1="16.5" x2="16" y2="16.5" />
    </>
  ),
  chat: <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />,
  cpu,
  chip: cpu,
  agent: cpu,
  laptop: (
    <>
      <rect x="4" y="5" width="16" height="10" rx="1.5" />
      <path d="M2 19h20l-1.6-3H3.6z" />
    </>
  ),
  cloud: <path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.5 3.5 0 0 1 18 18z" />,
  desktop: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="16" x2="12" y2="20" />
    </>
  ),
  box: (
    <>
      <path d="M12 3 4 7v10l8 4 8-4V7z" />
      <path d="M4 7l8 4 8-4M12 11v10" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path d="M18.5 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  swirl: (
    <>
      <path d="M20 12a8 8 0 1 1-8-8" />
      <path d="M16 12a4 4 0 1 1-4-4" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  star: <path d="M12 3l2.4 6.2 6.6.4-5.1 4.2 1.7 6.4L12 16.9 6.4 20.4l1.7-6.4-5.1-4.2 6.6-.4z" />,
  home: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9h12v-9" />
    </>
  ),
  apple: (
    <>
      <path d="M16.5 12.5c0-1.8 1.4-2.7 1.4-2.7s-1-1.6-3-1.6c-1.1 0-1.8.6-2.6.6s-1.5-.6-2.6-.6c-2 0-3.6 1.8-3.6 4.6 0 3.4 2.5 7.3 4.2 7.3.9 0 1.3-.5 2.3-.5s1.4.5 2.3.5c1.7 0 3.5-3.3 3.5-3.3s-1.9-.9-1.9-2.8z" />
      <path d="M12.5 5.2c.5-1 1.6-1.7 2.6-1.6.1 1-.4 1.9-1 2.5" />
    </>
  ),
  send: (
    <>
      <path d="M21 4 3 11l6 2 2 6 3-4 4 3z" />
      <path d="M21 4 11 15" />
    </>
  ),
  hash: (
    <>
      <line x1="9.5" y1="4" x2="7.5" y2="20" />
      <line x1="16.5" y1="4" x2="14.5" y2="20" />
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="3.5" y1="15" x2="19.5" y2="15" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="3" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </>
  ),
  game: (
    <>
      <rect x="3" y="8" width="18" height="9" rx="4.5" />
      <line x1="7.5" y1="12.5" x2="10" y2="12.5" />
      <line x1="8.75" y1="11.25" x2="8.75" y2="13.75" />
      <circle cx="15.5" cy="11.5" r="0.8" />
      <circle cx="17.5" cy="13.5" r="0.8" />
    </>
  ),
  shieldchat: (
    <>
      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z" />
      <path d="M9 10.5h6M9 13.5h4" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M5 4v5a4 4 0 0 0 8 0V4" />
      <path d="M9 18a5 5 0 0 0 5 4 4 4 0 0 0 4-4v-3" />
      <circle cx="18" cy="13" r="2" />
      <circle cx="5" cy="4" r="0.8" />
      <circle cx="13" cy="4" r="0.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z" />
      <path d="M9 12l2 2 4-4.5" />
    </>
  ),
  rocket: (
    <>
      <path d="M5 14c-1 2-1 5-1 5s3 0 5-1" />
      <path d="M8.5 18a14 14 0 0 1 8.5-13C20 5 20 8 19.5 11A14 14 0 0 1 6 19" />
      <circle cx="14.5" cy="9.5" r="1.6" />
    </>
  ),
  plug: (
    <>
      <path d="M9 2v6M15 2v6" />
      <path d="M7 8h10v2.5a5 5 0 0 1-10 0z" />
      <line x1="12" y1="15.5" x2="12" y2="22" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  save: (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v5h7" />
      <rect x="8" y="13" width="8" height="5" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  puzzle: (
    <path d="M9 4a2 2 0 0 1 4 0c0 .6.4 1 1 1h3a1 1 0 0 1 1 1v3c0 .6.4 1 1 1a2 2 0 0 1 0 4c-.6 0-1 .4-1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1 2 2 0 0 0-4 0 1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3c0-.6-.4-1-1-1a2 2 0 0 1 0-4c.6 0 1-.4 1-1V6a1 1 0 0 1 1-1h3a1 1 0 0 0 1-1z" />
  ),
  users: (
    <>
      <path d="M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19" />
      <circle cx="9" cy="7" r="3.5" />
      <path d="M22 19v-1.5a4 4 0 0 0-3-3.87" />
      <path d="M16 3.5a4 4 0 0 1 0 7" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <path d="M8.2 18H14a4 4 0 0 0 0-8h-4a4 4 0 0 1-4-4" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="16.5" x2="13.5" y2="16.5" />
    </>
  ),
  anchor: (
    <>
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="21" />
      <path d="M5 12a7 7 0 0 0 14 0" />
      <line x1="3" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21" y2="12" />
    </>
  ),
  webhook: (
    <>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="18" cy="9" r="2.2" />
      <circle cx="11" cy="18" r="2.2" />
      <path d="M8 7.5h8M16.5 10.7 12.2 16M9.7 16.3 7.2 8.8" />
    </>
  ),
  pulse: <path d="M3 12h4l2-5 4 10 2-5h6" />,
  window: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <circle cx="6.2" cy="6.5" r="0.7" />
      <circle cx="8.6" cy="6.5" r="0.7" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <line x1="10.8" y1="10.8" x2="20" y2="20" />
      <line x1="16" y1="16" x2="18.5" y2="13.5" />
      <line x1="18.5" y1="18.5" x2="21" y2="16" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
}

export function OCIcon({
  name,
  size = 24,
  strokeWidth = 1.8,
}: {
  name: string
  size?: number
  strokeWidth?: number
}) {
  return <svg {...base(size, strokeWidth)}>{PATHS[name] ?? PATHS.cpu}</svg>
}
