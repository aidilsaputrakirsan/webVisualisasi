import { motion } from 'framer-motion'
import { theme, NODE } from '../../../shared/theme'
import { formatPct, type Team } from './worldCup'

const BAR_MAX = 460
const TOP_N = 4

/** Tim diurutkan menurut peluang juara saat ini — bar tumbuh dan baris
 *  berpindah (via `layout`) seiring jumlah simulasi naik dan angkanya stabil. */
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
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <span className="font-mono" style={{ fontSize: 21, letterSpacing: '0.06em', color: theme.inkFaint }}>
          PELUANG JADI JUARA
        </span>
        <span className="font-mono" style={{ fontSize: 21, color: theme.inkFaint }}>
          {trialCount.toLocaleString('id-ID')} simulasi
        </span>
      </div>

      <div className="flex flex-col" style={{ gap: 13 }}>
        {ranked.map((t, i) => {
          const p = probabilities[t.id]
          const isFav = championId === t.id
          return (
            <motion.div
              key={t.id}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex items-center"
              style={{ gap: 14 }}
            >
              <span className="font-mono" style={{ width: 26, fontSize: 20, color: theme.inkFaint, textAlign: 'right' }}>
                {i + 1}
              </span>
              <span style={{ width: 14, height: 14, borderRadius: 999, background: t.color, flexShrink: 0 }} />
              <span
                className="truncate font-semibold"
                style={{ width: 168, fontSize: 26, color: isFav ? NODE.active.text : theme.ink }}
              >
                {t.name}
              </span>
              <div className="relative overflow-hidden rounded-full" style={{ width: BAR_MAX, height: 22, background: theme.paperDeep }}>
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="h-full rounded-full"
                  style={{ width: Math.max(BAR_MAX * p, 3), background: isFav ? NODE.active.border : t.color }}
                />
              </div>
              <span
                className="font-mono font-semibold"
                style={{ width: 70, fontSize: 24, color: isFav ? NODE.active.text : theme.inkSoft, textAlign: 'right' }}
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
