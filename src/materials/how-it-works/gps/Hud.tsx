import { AnimatePresence, motion } from 'framer-motion'
import { theme } from '../../../shared/theme'
import type { RailStop } from '../kit/Hud'
import { WORLD } from '../kit/palette'
import { SATS, type Stage } from './story'

/** Journey stops for the bottom rail (ids match `Step.stage`). */
export const RAIL: readonly (RailStop & { id: Stage })[] = [
  { id: 'sky', label: 'listen', icon: 'satellite' },
  { id: 'delay', label: 'delay', icon: 'timer' },
  { id: 'circle', label: 'circle', icon: 'ring' },
  { id: 'cross', label: 'cross', icon: 'cross' },
  { id: 'clock', label: 'clock', icon: 'clock' },
  { id: 'fix', label: 'you', icon: 'pin' },
]

const COLORS = [WORLD.sat1, WORLD.sat2, WORLD.sat3, WORLD.sat4]

/**
 * One row per satellite heard: signal delay → distance. With a bad phone
 * clock every distance turns uncertain (±300 m per microsecond).
 */
export function SatTable({ rows, clockBad }: { rows: number; clockBad: boolean }) {
  return (
    <div className="flex flex-col" style={{ gap: 8, width: 820, minHeight: 4 * 48 }}>
      <AnimatePresence initial={false}>
        {SATS.slice(0, rows).map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="flex items-center rounded-full border font-mono"
            style={{ gap: 18, padding: '6px 22px', fontSize: 26, borderColor: theme.line, background: theme.surface }}
          >
            <span className="rounded-full" style={{ width: 18, height: 18, background: COLORS[i] }} />
            <span style={{ width: 110, color: theme.inkSoft }}>SAT {s.id}</span>
            <span className="tabular-nums" style={{ width: 170, color: theme.ink }}>
              {s.delayMs.toFixed(1)} ms
            </span>
            <span style={{ color: theme.inkFaint }}>→</span>
            <motion.span
              className="tabular-nums font-semibold"
              animate={{ color: clockBad ? WORLD.alert : theme.ink }}
              style={{ marginLeft: 'auto' }}
            >
              {s.km} km{clockBad ? ' ±300 m?' : ''}
            </motion.span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
