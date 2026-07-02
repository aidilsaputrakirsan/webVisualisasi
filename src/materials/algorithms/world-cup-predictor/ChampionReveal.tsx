import { motion } from 'framer-motion'
import { theme, NODE } from '../../../shared/theme'
import { TEAM_MAP, formatPct, type PredictorStep } from './worldCup'
import { TrophyIcon } from './Icons'

/** The ONLY place a trophy appears — deliberately withheld until the very
 *  last step, after all 4,000 Monte Carlo trials are in. Earlier steps never
 *  crown a "champion", so a single lucky simulated run can't be mistaken for
 *  the model's actual prediction. */
export default function ChampionReveal({ step }: { step: PredictorStep }) {
  if (!step.championId || !step.probabilities) return null
  const t = TEAM_MAP[step.championId]
  const pct = step.probabilities[step.championId]

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col items-center rounded-2xl border text-center"
      style={{
        width: 460,
        padding: '26px 24px',
        borderColor: NODE.done.border,
        background: NODE.done.bg,
        boxShadow: NODE.done.shadow,
        color: NODE.done.text,
      }}
    >
      <TrophyIcon size={44} />
      <span className="mt-2 font-mono" style={{ fontSize: 16, letterSpacing: '0.08em', color: theme.inkSoft }}>
        PREDICTED CHAMPION
      </span>
      <span className="mt-1 font-serif font-bold" style={{ fontSize: 34 }}>
        {t.name}
      </span>
      <span className="mt-1 font-mono font-semibold" style={{ fontSize: 20 }}>
        {formatPct(pct)} across 4,000 simulations
      </span>
    </motion.div>
  )
}
