import { motion } from 'framer-motion'
import { CLUSTERS, resolve, WORD_MAP } from './embeddings'

/**
 * "Word → vector" card. Shows the focused word and the (first three of many)
 * numbers that make up its embedding — driving home that a word is literally
 * turned into a list of numbers, and the plotted point is just those numbers.
 */
export default function VectorReadout({ focus }: { focus: string }) {
  const { label, pos } = resolve(focus)
  const isQuery = focus === 'query'
  const accent = isQuery ? '#B45309' : CLUSTERS[WORD_MAP[focus]?.cluster]?.color ?? '#4A4E66'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute flex flex-col"
      style={{
        right: 24,
        top: 24,
        width: 340,
        gap: 12,
        padding: '18px 22px',
        borderRadius: 20,
        background: isQuery ? 'rgba(255,248,237,0.94)' : 'rgba(255,255,255,0.92)',
        border: `1.5px solid ${isQuery ? '#F2B968' : '#D7DAEA'}`,
        boxShadow: '0 10px 30px rgba(30,34,58,0.10)',
      }}
    >
      <div className="flex items-center" style={{ gap: 12 }}>
        <span className="rounded-full" style={{ width: 14, height: 14, background: accent, flexShrink: 0 }} />
        <span
          style={{
            fontSize: 30,
            fontWeight: 700,
            fontFamily: 'ui-serif, Georgia, serif',
            color: '#20243A',
          }}
        >
          “{label}”
        </span>
        <span style={{ fontSize: 18, color: '#8C92A8', marginLeft: 'auto' }}>→ vector</span>
      </div>

      <div
        className="flex items-center flex-wrap"
        style={{
          gap: 8,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 22,
          color: accent,
          fontWeight: 600,
        }}
      >
        <span style={{ color: '#A9AEC4' }}>[</span>
        {pos.map((n, i) => (
          <span key={i}>
            {n >= 0 ? ' ' : ''}
            {n.toFixed(2)}
            {i < pos.length - 1 ? ',' : ''}
          </span>
        ))}
        <span style={{ color: '#A9AEC4' }}>, … ]</span>
      </div>

      <div style={{ fontSize: 18, color: '#8C92A8', fontFamily: 'ui-sans-serif, system-ui' }}>
        learned from context · showing 3 of 300 dims
      </div>
    </motion.div>
  )
}
