/**
 * Node/edge colours for Laravel materials — the warm "flame red" variant of the
 * shared semantic palette. Drop-in replacement for `shared/theme`'s NODE:
 * Laravel views import { NODE } from '../palette' instead, so every "active"
 * highlight becomes Laravel red while done/info/idle keep their meaning.
 *
 * The accent itself is the single source `LARAVEL` in shared/courseTheme.
 */
import { NODE as BASE, type StateStyle } from '../../shared/theme'
import { LARAVEL } from '../../shared/courseTheme'

/** Re-exported accent set so views can tint chips/packets without hardcoding. */
export const ACCENT = LARAVEL

export const NODE: Record<'done' | 'active' | 'info' | 'idle' | 'fail', StateStyle> = {
  done: BASE.done,
  info: BASE.info,
  active: {
    border: LARAVEL.accent,
    bg: LARAVEL.accentSoft,
    text: LARAVEL.accentText,
    shadow: '0 4px 18px rgba(245,48,3,0.26)',
  },
  idle: {
    border: '#E0CFCA',
    bg: '#FFFFFF',
    text: '#5A4A45',
    shadow: '0 1px 4px rgba(42,26,23,0.06)',
  },
  fail: {
    border: '#DC2626',
    bg: '#FEE2E2',
    text: '#991B1B',
    shadow: '0 2px 12px rgba(220,38,38,0.20)',
  },
}

export const EDGE = {
  idle: '#DCC8C2',
  done: '#15803D',
  active: LARAVEL.accent,
} as const
