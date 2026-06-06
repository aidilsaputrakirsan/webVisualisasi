/**
 * Central design tokens — the single source of truth for the "Editorial Paper"
 * light theme (warm off-white paper + amber accent). Change colours here and
 * the whole app follows. JS-animated colours (nodes, edges, boxes) read from
 * here; class-based chrome uses matching Tailwind `stone`/`amber` utilities.
 */
export const theme = {
  paper: '#FAF7F2', // page / canvas background
  paperDeep: '#F1E9DB', // letterbox behind the canvas
  surface: '#FFFFFF', // cards
  surfaceAlt: '#F6F0E6',
  ink: '#211C16', // primary text
  inkSoft: '#6B6258', // secondary text
  inkFaint: '#A89E90', // muted / line numbers
  line: '#E4DCCF', // subtle borders
  lineStrong: '#D3C8B6',
  accent: '#D97706', // amber — active / buttons
  accentDeep: '#B45309', // amber for text on light
  accentSoft: '#FDEBC8', // amber fill
} as const

export interface StateStyle {
  border: string
  bg: string
  shadow: string
  text: string
}

/**
 * Semantic states shared by every visualization. Map a material's local state
 * names onto these: e.g. sorted/visited → done, key/pointer → active,
 * comparing/queued → info.
 */
export const NODE: Record<'done' | 'active' | 'info' | 'idle', StateStyle> = {
  done: {
    border: '#15803D',
    bg: '#DCFCE7',
    text: '#166534',
    shadow: '0 2px 12px rgba(21,128,61,0.18)',
  },
  active: {
    border: '#D97706',
    bg: '#FDEBC8',
    text: '#92400E',
    shadow: '0 4px 18px rgba(217,119,6,0.30)',
  },
  info: {
    border: '#2563EB',
    bg: '#DBEAFE',
    text: '#1E40AF',
    shadow: '0 2px 12px rgba(37,99,235,0.18)',
  },
  idle: {
    border: '#D3C8B6',
    bg: '#FFFFFF',
    text: '#57503F',
    shadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
}

/** Tree edge colours. */
export const EDGE = {
  idle: '#CFC5B4',
  done: '#15803D',
  active: '#D97706',
} as const
