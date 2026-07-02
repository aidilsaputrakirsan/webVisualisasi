import { motion } from 'framer-motion'
import { theme, NODE } from '../../../shared/theme'
import { formatPct, type Team } from './worldCup'

const BAR_MAX = 440
const TOP_N = 8

/** Top contenders ranked by current championship probability — bars grow and
 *  rows reorder (via `layout`) as the trial count climbs and the estimate
 *  settles. Only the leaders are shown; eliminated teams sit at 0%. */
export default function ProbabilityChart({
  teams,
  probabilities,
  championId,
  trialCount,
}: {
  teams: Team[]
  probabilities: Record<string, number>
  championId: string | null
  trialCount: number
}) {
  const ranked = [...teams].sort((a, b) => probabilities[b.id] - probabilities[a.id]).slice(0, TOP_N)

  return (
    <div
      className="rounded-2xl border"
      style={{
        width: 984,
        borderColor: theme.line,
        background: theme.surface,
        boxShadow: '0 6px 18px rgba(33,28,22,0.06)',
        padding: '18px 24px',
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <span className="font-mono" style={{ fontSize: 19, letterSpacing: '0.06em', color: theme.inkFaint }}>
          TOP {TOP_N} CHAMPIONSHIP PROBABILITY
        </span>
        <span className="font-mono" style={{ fontSize: 19, color: theme.inkFaint }}>
          {trialCount.toLocaleString('en-US')} trials
        </span>
      </div>

      <div className="flex flex-col" style={{ gap: 11 }}>
        {ranked.map((t, i) => {
          const p = probabilities[t.id]
          const isFav = championId === t.id
          return (
            <motion.div
              key={t.id}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex items-center"
              style={{ gap: 12 }}
            >
              <span className="font-mono" style={{ width: 24, fontSize: 18, color: theme.inkFaint, textAlign: 'right' }}>
                {i + 1}
              </span>
              <span style={{ width: 12, height: 12, borderRadius: 999, background: t.color, flexShrink: 0 }} />
              <span
                className="truncate font-mono font-semibold"
                style={{ width: 152, fontSize: 22, color: isFav ? NODE.active.text : theme.ink }}
              >
                {t.name}
              </span>
              <div className="relative overflow-hidden rounded-full" style={{ width: BAR_MAX, height: 20, background: theme.paperDeep }}>
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="h-full rounded-full"
                  style={{ width: Math.max(BAR_MAX * p, 3), background: isFav ? NODE.active.border : t.color }}
                />
              </div>
              <span
                className="font-mono font-semibold"
                style={{ width: 64, fontSize: 21, color: isFav ? NODE.active.text : theme.inkSoft, textAlign: 'right' }}
              >
                {formatPct(p)}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
