import type { ReactNode } from 'react'

/**
 * Line-icons for the Claude Code material (stroke = currentColor) — professional
 * replacements for emoji in canvas content. Colour is controlled by the parent
 * via `color`/currentColor. Lucide-style geometry to match the shared Icons.
 */
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

const PATHS: Record<string, ReactNode> = {
  // loop stations
  think: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="3" />
      <circle cx="8.5" cy="10" r="0.9" />
      <circle cx="12" cy="10" r="0.9" />
      <circle cx="15.5" cy="10" r="0.9" />
      <path d="M8 16l-1.5 4 5-4" />
    </>
  ),
  zap: <path d="M13 2 4 14h6l-1 8 9-12h-6z" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16z" />
      <path d="M14 6l4 4" />
    </>
  ),
  // intro
  sparkles: (
    <>
      <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path d="M18.5 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  cpu: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </>
  ),
  loop: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 4v5h-5" />
    </>
  ),
  // tools
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  terminal: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M8 9.5l3 2.5-3 2.5" />
      <line x1="13" y1="15" x2="16.5" y2="15" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </>
  ),
  folders: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h3l2 2h4a2 2 0 0 1 2 2" />
      <path d="M6 10h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
    </>
  ),
  // customize
  slash: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <line x1="14.5" y1="8.5" x2="9.5" y2="15.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  users: (
    <>
      <path d="M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19" />
      <circle cx="9" cy="7" r="3.5" />
      <path d="M22 19v-1.5a4 4 0 0 0-3-3.87" />
      <path d="M16 3.5a4 4 0 0 1 0 7" />
    </>
  ),
  hook: (
    <>
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="20" />
      <path d="M5 12a7 7 0 0 0 14 0" />
      <line x1="3" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21" y2="12" />
    </>
  ),
  plug: (
    <>
      <path d="M9 2v6M15 2v6" />
      <path d="M7 8h10v2.5a5 5 0 0 1-10 0z" />
      <line x1="12" y1="15.5" x2="12" y2="22" />
    </>
  ),
  puzzle: (
    <path d="M9 4a2 2 0 0 1 4 0c0 .6.4 1 1 1h3a1 1 0 0 1 1 1v3c0 .6.4 1 1 1a2 2 0 0 1 0 4c-.6 0-1 .4-1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1 2 2 0 0 0-4 0 1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3c0-.6-.4-1-1-1a2 2 0 0 1 0-4c.6 0 1-.4 1-1V6a1 1 0 0 1 1-1h3a1 1 0 0 0 1-1z" />
  ),
  type: (
    <>
      <path d="M5 7V5h14v2" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="9" y1="19" x2="15" y2="19" />
    </>
  ),
  statusbar: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <circle cx="6.5" cy="17.2" r="0.7" />
      <line x1="9" y1="17.2" x2="14" y2="17.2" />
    </>
  ),
  // models
  brain: (
    <>
      <path d="M12 6a3 3 0 0 0-5 1.8A2.8 2.8 0 0 0 6 13a3 3 0 0 0 3 4 3 3 0 0 0 3-1.6" />
      <path d="M12 6a3 3 0 0 1 5 1.8A2.8 2.8 0 0 1 18 13a3 3 0 0 1-3 4 3 3 0 0 1-3-1.6" />
      <line x1="12" y1="6" x2="12" y2="17" />
    </>
  ),
  scale: (
    <>
      <line x1="12" y1="5" x2="12" y2="20" />
      <line x1="8" y1="20" x2="16" y2="20" />
      <line x1="5" y1="8" x2="19" y2="8" />
      <circle cx="12" cy="6" r="1.3" />
      <path d="M5 8l-2.3 4.6a2.6 2.6 0 0 0 4.6 0z" />
      <path d="M19 8l-2.3 4.6a2.6 2.6 0 0 0 4.6 0z" />
    </>
  ),
  rocket: (
    <>
      <path d="M5 14c-1 2-1 5-1 5s3 0 5-1" />
      <path d="M8.5 18a14 14 0 0 1 8.5-13C20 5 20 8 19.5 11A14 14 0 0 1 6 19" />
      <circle cx="14.5" cy="9.5" r="1.6" />
    </>
  ),
  cloud: <path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.5 3.5 0 0 1 18 18z" />,
  // permissions
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  checkcircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" />
      <line x1="9" y1="4" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="20" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2.5 20h19z" />
      <line x1="12" y1="9.5" x2="12" y2="14" />
      <circle cx="12" cy="17" r="0.7" />
    </>
  ),
  // scaling
  branch: (
    <>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <circle cx="18" cy="8" r="2.4" />
      <line x1="6" y1="8.4" x2="6" y2="15.6" />
      <path d="M18 10.4c0 4-3 6-6.5 6H8.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  // security
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
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z" />
      <path d="M9 12l2 2 4-4.5" />
    </>
  ),
}

export function CCIcon({
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
