/**
 * Node/edge colours for Cloud Computing materials — the cool "indigo" variant of
 * the shared semantic palette. Drop-in replacement for `shared/theme`'s NODE:
 * cloud views import { NODE } from '../palette' instead, so every "active"
 * highlight becomes indigo while done/info/fail keep their meaning.
 *
 * The accent itself is the single source `CLOUD` in shared/courseTheme.
 */
import { NODE as BASE, type StateStyle } from '../../shared/theme'
import { CLOUD } from '../../shared/courseTheme'

/** Re-exported accent set so views can tint chips/packets without hardcoding. */
export const ACCENT = CLOUD

export const NODE: Record<'done' | 'active' | 'info' | 'idle', StateStyle> = {
  done: BASE.done,
  info: BASE.info,
  active: {
    border: CLOUD.accent,
    bg: CLOUD.accentSoft,
    text: CLOUD.accentText,
    shadow: '0 4px 18px rgba(109,69,217,0.28)',
  },
  idle: {
    border: '#C9CCE0',
    bg: '#FFFFFF',
    text: '#4A4E66',
    shadow: '0 1px 4px rgba(30,34,58,0.06)',
  },
}

export const EDGE = {
  idle: '#C7CADD',
  done: '#15803D',
  active: CLOUD.accent,
} as const
