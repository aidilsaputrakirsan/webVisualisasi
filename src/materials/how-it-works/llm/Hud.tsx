import { AnimatePresence, motion } from 'framer-motion'
import { theme } from '../../../shared/theme'
import type { RailStop } from '../kit/Hud'
import { WORLD } from '../kit/palette'
import { ANSWER, PROMPT_TOKENS, type Stage, type Step } from './story'

/** Journey stops for the bottom rail (ids match `Step.stage`). */
export const RAIL: readonly (RailStop & { id: Stage })[] = [
  { id: 'ask', label: 'ask', icon: 'chat' },
  { id: 'tokens', label: 'tokens', icon: 'chunks' },
  { id: 'numbers', label: 'numbers', icon: 'grid' },
  { id: 'attention', label: 'attention', icon: 'link' },
  { id: 'guess', label: 'guess', icon: 'bars' },
  { id: 'repeat', label: 'repeat', icon: 'loop' },
]

/** Words out of the model; hidden while the skyline is writing (the sentence card shows progress live). */
function answerCount(step: Step) {
  if (step.rounds) return null
  return Math.min(ANSWER.length, step.phoneWords)
}

/** Tokens in → tokens out counters, plus a warning chip for the wrong guess. */
export function TokenMeter({ step }: { step: Step }) {
  const tokensIn = step.tokens || step.rounds || step.phoneWords > 0 ? PROMPT_TOKENS[step.prompt].length : null
  const out = answerCount(step)
  return (
    <div className="flex items-end justify-center" style={{ gap: 44, minHeight: 120 }}>
      <AnimatePresence>
        {tokensIn !== null && (
          <motion.div key="in" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
            <span className="font-mono" style={{ fontSize: 22, letterSpacing: 4, color: theme.inkFaint }}>
              TOKENS IN
            </span>
            <span className="font-mono font-bold tabular-nums" style={{ fontSize: 72, lineHeight: 1.05, color: theme.ink }}>
              {tokensIn}
            </span>
          </motion.div>
        )}
        {out !== null && out > 0 && (
          <motion.div key="out" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
            <span className="font-mono" style={{ fontSize: 22, letterSpacing: 4, color: theme.inkFaint }}>
              TOKENS OUT
            </span>
            <motion.span key={out} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="font-mono font-bold tabular-nums" style={{ fontSize: 72, lineHeight: 1.05, color: theme.accentDeep }}>
              {out}
            </motion.span>
          </motion.div>
        )}
        {step.wrong && (
          <motion.div
            key="wrong"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-full border font-mono font-semibold"
            style={{ marginBottom: 14, fontSize: 26, padding: '10px 22px', borderColor: WORLD.alert, background: WORLD.alertSoft, color: WORLD.alert }}
          >
            confident, but wrong
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
