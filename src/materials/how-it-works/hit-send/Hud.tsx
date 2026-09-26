import { AnimatePresence, motion } from 'framer-motion'
import { NODE, theme } from '../../../shared/theme'
import { useTween, type RailStop } from '../kit/Hud'
import type { Stage } from './journey'

/** Journey stops for the bottom rail (ids match `Step.stage`). */
export const RAIL: readonly (RailStop & { id: Stage })[] = [
  { id: 'phone', label: 'phone', icon: 'phone' },
  { id: 'tower', label: 'tower', icon: 'tower' },
  { id: 'ocean', label: 'cable', icon: 'ocean' },
  { id: 'server', label: 'server', icon: 'server' },
  { id: 'queue', label: 'queue', icon: 'queue' },
  { id: 'friend', label: 'friend', icon: 'friend' },
]

export function NetworkClock({ ms, ticks, waiting }: { ms: number; ticks: 0 | 1 | 2; waiting: boolean }) {
  const v = useTween(ms)
  return (
    <div className="flex items-end justify-center" style={{ gap: 36 }}>
      <div className="flex flex-col items-center">
        <span className="font-mono" style={{ fontSize: 22, letterSpacing: 4, color: theme.inkFaint }}>
          NETWORK TIME
        </span>
        <span className="font-mono font-bold tabular-nums" style={{ fontSize: 76, lineHeight: 1.05, color: theme.ink }}>
          {(v / 1000).toFixed(3)}
          <span style={{ fontSize: 40, color: theme.inkSoft }}> s</span>
        </span>
      </div>
      <AnimatePresence mode="wait">
        {(ticks > 0 || waiting) && (
          <motion.div
            key={waiting ? 'wait' : ticks}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className="rounded-full border font-mono font-semibold"
            style={{
              marginBottom: 14,
              fontSize: 28,
              padding: '10px 24px',
              borderColor: ticks === 2 ? NODE.info.border : theme.lineStrong,
              background: ticks === 2 ? NODE.info.bg : theme.surface,
              color: ticks === 2 ? NODE.info.text : theme.inkSoft,
            }}
          >
            {ticks === 2 ? '✓✓ delivered' : waiting ? '✓ sent · waiting' : '✓ sent'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
