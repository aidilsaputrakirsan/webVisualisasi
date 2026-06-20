import type { ReactNode } from 'react'

/**
 * Line-icons for the Vibe Coding material (stroke = currentColor) — professional
 * replacements for emoji. Colour is controlled by the parent. Lucide-style.
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
  chat: <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" />
    </>
  ),
  wave: (
    <>
      <path d="M3 11c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3" />
      <path d="M3 16c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 3 8l9 5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  steps: <path d="M3 19h4v-4h4v-4h4v-4h5" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M21 16l-5-5-8 8" />
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
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.9" />
    </>
  ),
  list: (
    <>
      <line x1="8.5" y1="7" x2="20" y2="7" />
      <line x1="8.5" y1="12" x2="20" y2="12" />
      <line x1="8.5" y1="17" x2="20" y2="17" />
      <circle cx="4.5" cy="7" r="1" />
      <circle cx="4.5" cy="12" r="1" />
      <circle cx="4.5" cy="17" r="1" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="8" />
      <line x1="6.4" y1="6.4" x2="17.6" y2="17.6" />
    </>
  ),
  persona: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M17 4.5 19 3M18.5 6.5 20.5 5" />
    </>
  ),
  brain: (
    <>
      <path d="M12 6a3 3 0 0 0-5 1.8A2.8 2.8 0 0 0 6 13a3 3 0 0 0 3 4 3 3 0 0 0 3-1.6" />
      <path d="M12 6a3 3 0 0 1 5 1.8A2.8 2.8 0 0 1 18 13a3 3 0 0 1-3 4 3 3 0 0 1-3-1.6" />
      <line x1="12" y1="6" x2="12" y2="17" />
    </>
  ),
  window: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <circle cx="6.2" cy="6.5" r="0.7" />
      <circle cx="8.6" cy="6.5" r="0.7" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 4v5h-5" />
    </>
  ),
  broom: (
    <>
      <path d="M20 4 12 12" />
      <path d="M5 19l3.5-5 3.6 3.6L7 21z" />
      <path d="M10.5 11.5l2 2" />
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
  bug: (
    <>
      <rect x="7.5" y="7" width="9" height="12" rx="4.5" />
      <line x1="12" y1="7" x2="12" y2="5" />
      <path d="M10 5.5 12 7l2-1.5" />
      <path d="M7.5 11H3.5M7.5 15H4M16.5 11H20.5M16.5 15H20" />
    </>
  ),
  logs: (
    <>
      <line x1="4" y1="7" x2="8" y2="7" />
      <line x1="11" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="8" y2="12" />
      <line x1="11" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="8" y2="17" />
      <line x1="11" y1="17" x2="20" y2="17" />
    </>
  ),
  plug: (
    <>
      <path d="M9 2v6M15 2v6" />
      <path d="M7 8h10v2.5a5 5 0 0 1-10 0z" />
      <line x1="12" y1="15.5" x2="12" y2="22" />
    </>
  ),
  commit: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <line x1="3" y1="12" x2="8.5" y2="12" />
      <line x1="15.5" y1="12" x2="21" y2="12" />
    </>
  ),
  branch: (
    <>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <circle cx="18" cy="8" r="2.4" />
      <line x1="6" y1="8.4" x2="6" y2="15.6" />
      <path d="M18 10.4c0 4-3 6-6.5 6H8.4" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
    </>
  ),
  terminal: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M8 9.5l3 2.5-3 2.5" />
      <line x1="13" y1="15" x2="16.5" y2="15" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v6l-4.6 8.3A1.5 1.5 0 0 0 6.7 20h10.6a1.5 1.5 0 0 0 1.3-2.7L14 9V3" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </>
  ),
  cycle: (
    <>
      <path d="M4 12a8 8 0 0 1 13-6" />
      <path d="M20 12a8 8 0 0 1-13 6" />
      <path d="M17 3v3.5h-3.5M7 21v-3.5h3.5" />
    </>
  ),
  refactor: (
    <>
      <path d="M4 8h12l-3-3" />
      <path d="M20 16H8l3 3" />
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
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  box: (
    <>
      <path d="M12 3 4 7v10l8 4 8-4V7z" />
      <path d="M4 7l8 4 8-4M12 11v10" />
    </>
  ),
  cursor: <path d="M5 3l6 16 2.2-6.2L19.4 11z" />,
  wing: (
    <>
      <path d="M21 5c-8 0-14 5-15 14 4 0 7-1.5 9-4" />
      <path d="M15 9c-3.5 1-6 3.5-7 7" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path d="M18.5 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
}

export function VCIcon({
  name,
  size = 24,
  strokeWidth = 1.8,
}: {
  name: string
  size?: number
  strokeWidth?: number
}) {
  return <svg {...base(size, strokeWidth)}>{PATHS[name] ?? PATHS.sparkles}</svg>
}
