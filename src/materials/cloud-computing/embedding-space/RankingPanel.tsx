import { motion } from 'framer-motion'
import { CLUSTERS, rankingToQuery, NEIGHBOUR_IDS, QUERY } from './embeddings'

const ROWS = rankingToQuery()
const MAX_D = Math.max(...ROWS.map((r) => r.d))
const TOP = new Set(NEIGHBOUR_IDS)

/**
 * The "process" made literal: distance from the query word to every point,
 * sorted smallest-first. The three nearest (the answer) glow amber. This is the
 * whole trick — the category is never looked up, it falls out of the numbers.
 */
export default function RankingPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="absolute flex flex-col"
      style={{
        right: 24,
        top: 24,
        width: 360,
        gap: 10,
        padding: '18px 20px',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.93)',
        border: '1.5px solid #D7DAEA',
        boxShadow: '0 10px 30px rgba(30,34,58,0.10)',
      }}
    >
      <div style={{ fontSize: 20, color: '#5A6076', fontFamily: 'ui-sans-serif, system-ui' }}>
        distance from{' '}
        <span style={{ color: '#B45309', fontWeight: 700 }}>“{QUERY.label}”</span>
      </div>

      <div className="flex flex-col" style={{ gap: 6 }}>
        {ROWS.map((r) => {
          const hot = TOP.has(r.id)
          const color = CLUSTERS[r.cluster].color
          return (
            <div key={r.id} className="flex items-center" style={{ gap: 10 }}>
              <span
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  fontSize: 15,
                  fontFamily: 'ui-monospace, monospace',
                  fontWeight: 700,
                  background: hot ? '#D97706' : '#EDEEF5',
                  color: hot ? '#FFFFFF' : '#9097AC',
                }}
              >
                {r.rank}
              </span>
              <span
                style={{
                  width: 70,
                  flexShrink: 0,
                  fontSize: 19,
                  fontWeight: hot ? 700 : 500,
                  fontFamily: 'ui-sans-serif, system-ui',
                  color: hot ? '#20243A' : '#6A7088',
                }}
              >
                {r.label}
              </span>
              {/* distance bar */}
              <span className="relative" style={{ flex: 1, height: 8, borderRadius: 999, background: '#EDEEF5' }}>
                <motion.span
                  className="absolute left-0 top-0 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(r.d / MAX_D) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ height: 8, background: hot ? '#D97706' : color, opacity: hot ? 1 : 0.5 }}
                />
              </span>
              <span
                style={{
                  width: 48,
                  flexShrink: 0,
                  textAlign: 'right',
                  fontSize: 18,
                  fontFamily: 'ui-monospace, monospace',
                  fontWeight: hot ? 700 : 500,
                  color: hot ? '#92400E' : '#9097AC',
                }}
              >
                {r.d.toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
