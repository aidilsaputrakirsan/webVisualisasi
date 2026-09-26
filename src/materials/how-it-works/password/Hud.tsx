import { AnimatePresence, motion } from 'framer-motion'
import { NODE, theme } from '../../../shared/theme'
import type { RailStop } from '../kit/Hud'
import { WORLD } from '../kit/palette'
import { LADDER, RATE_LABEL, type Stage, type Step } from './story'

/** Journey stops for the bottom rail (ids match `Step.stage`). */
export const RAIL: readonly (RailStop & { id: Stage })[] = [
  { id: 'store', label: 'sign up', icon: 'lock' },
  { id: 'hash', label: 'hash', icon: 'fingerprint' },
  { id: 'leak', label: 'leak', icon: 'alert' },
  { id: 'guess', label: 'guess', icon: 'terminal' },
  { id: 'brute', label: 'brute force', icon: 'chunks' },
  { id: 'defend', label: 'defend', icon: 'shield' },
]

const TONE = {
  bad: WORLD.alert,
  mid: theme.accentDeep,
  good: NODE.done.border,
}

/** Time-to-crack readout + the guesses-per-second assumption behind it. */
export function CrackMeter({ step }: { step: Step }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 14, minHeight: 170 }}>
      <AnimatePresence mode="wait">
        {step.crack && (
          <motion.div
            key={step.crack}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center rounded-3xl"
            style={{ padding: '10px 36px', background: 'rgba(250,247,242,0.92)', boxShadow: '0 6px 24px rgba(33,28,22,0.10)' }}
          >
            <span className="font-mono" style={{ fontSize: 22, letterSpacing: 4, color: theme.inkFaint }}>
              TIME TO CRACK
            </span>
            <span className="font-mono font-bold" style={{ fontSize: 72, lineHeight: 1.05, color: TONE[step.crackTone] }}>
              {step.crack}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {step.rate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-full border font-mono"
            style={{ fontSize: 22, padding: '6px 18px', borderColor: theme.lineStrong, background: theme.surface, color: theme.inkSoft }}
          >
            assuming {RATE_LABEL}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Worst-case time to brute-force each password, on a log scale. */
export function Ladder() {
  const min = -3
  const max = 13
  return (
    <div className="flex flex-col rounded-3xl border" style={{ gap: 12, width: 900, padding: '24px 28px', background: 'rgba(255,255,255,0.92)', borderColor: theme.line }}>
      {LADDER.map((row, i) => (
        <div key={row.label} className="flex items-center font-mono" style={{ gap: 16, fontSize: 25 }}>
          <span style={{ width: 230, color: theme.ink }}>{row.label}</span>
          <div className="relative flex-1 overflow-hidden rounded-full" style={{ height: 22, background: theme.line }}>
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: TONE[row.tone] }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(3, ((row.log - min) / (max - min)) * 100)}%` }}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.25, ease: 'easeOut' }}
            />
          </div>
          <span className="font-semibold" style={{ width: 210, textAlign: 'right', color: TONE[row.tone] }}>
            {row.time}
          </span>
        </div>
      ))}
      <span className="font-mono" style={{ fontSize: 18, color: theme.inkFaint, textAlign: 'center' }}>
        worst case · log scale · {RATE_LABEL}
      </span>
    </div>
  )
}
