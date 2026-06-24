/**
 * Node/box colours for Blockchain materials — the cool "cobalt" variant of the
 * shared semantic palette. Drop-in replacement for `shared/theme`'s NODE:
 * blockchain views import { NODE } from '../palette' instead, so every "active"
 * highlight becomes cobalt while done/info keep their meaning. A `fail` state is
 * added for invalid / broken-link blocks (tamper detection, later materials).
 *
 * The accent itself is the single source `BLOCKCHAIN` in shared/courseTheme.
 */
import { NODE as BASE, type StateStyle } from '../../shared/theme'
import { BLOCKCHAIN } from '../../shared/courseTheme'

/** Re-exported accent set so views can tint chips without hardcoding. */
export const ACCENT = BLOCKCHAIN

export const NODE: Record<'done' | 'active' | 'info' | 'idle' | 'fail', StateStyle> = {
  done: BASE.done,
  info: BASE.info,
  active: {
    border: BLOCKCHAIN.accent,
    bg: BLOCKCHAIN.accentSoft,
    text: BLOCKCHAIN.accentText,
    shadow: '0 4px 18px rgba(37,99,235,0.26)',
  },
  idle: {
    border: '#C7CEDE',
    bg: '#FFFFFF',
    text: '#46506A',
    shadow: '0 1px 4px rgba(22,33,58,0.06)',
  },
  fail: {
    border: '#DC2626',
    bg: '#FEE2E2',
    text: '#991B1B',
    shadow: '0 4px 18px rgba(220,38,38,0.22)',
  },
}

export const EDGE = {
  idle: '#C7CEDE',
  done: '#15803D',
  active: BLOCKCHAIN.accent,
  fail: '#DC2626',
} as const
