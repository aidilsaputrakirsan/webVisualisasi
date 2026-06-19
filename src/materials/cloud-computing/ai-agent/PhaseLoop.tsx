import { motion } from 'framer-motion'
import { NODE } from '../palette'
import type { Phase } from './aiAgent'

const ORDER: { id: Phase; label: string }[] = [
  { id: 'think', label: 'Think' },
  { id: 'act', label: 'Act' },
  { id: 'observe', label: 'Observe' },
]

/**
 * The agent's inner loop: Think → Act → Observe, with a "↻" back-arrow showing
 * it repeats. Once the loop ends (phase 'final') all three read as done. The
 * iteration counter on the left shows which turn we are on.
 */
export default function PhaseLoop({ phase, iteration }: { phase: Phase; iteration: number }) {
  const final = phase === 'final'
  const activeIdx = ORDER.findIndex((p) => p.id === phase)

  return (
    <div className="flex items-center" style={{ gap: 14 }}>
      <div
        className="flex items-center rounded-full font-mono font-semibold"
        style={{
          gap: 8,
          padding: '8px 16px',
          fontSize: 19,
          background: '#FFFFFF',
          border: `2px solid ${NODE.idle.border}`,
          color: NODE.idle.text,
        }}
      >
        turn {Math.max(iteration, 1)}
      </div>

      {ORDER.map((p, i) => {
        const state = final || i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'idle'
        const st = state === 'active' ? NODE.active : state === 'done' ? NODE.done : NODE.idle
        const lit = state !== 'idle'
        return (
          <div key={p.id} className="flex items-center" style={{ gap: 14 }}>
            <motion.div
              className="flex items-center rounded-full border-2"
              animate={{
                borderColor: st.border,
                background: lit ? st.bg : '#FFFFFF',
                boxShadow: state === 'active' ? st.shadow : 'none',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              style={{ gap: 11, padding: '9px 20px' }}
            >
              <motion.span
                className="flex items-center justify-center rounded-full font-mono font-semibold"
                animate={{ background: lit ? st.border : '#E2E2EE', color: lit ? '#FFFFFF' : '#8C849C' }}
                style={{ width: 32, height: 32, fontSize: 18, flexShrink: 0 }}
              >
                {state === 'done' ? '✓' : i + 1}
              </motion.span>
              <span
                className="font-semibold"
                style={{ fontSize: 23, color: lit ? st.text : '#9FA3BC', whiteSpace: 'nowrap' }}
              >
                {p.label}
              </span>
            </motion.div>
            {i < ORDER.length - 1 && (
              <motion.span
                animate={{ color: final || i < activeIdx ? NODE.done.border : '#C7CADD' }}
                style={{ fontSize: 26 }}
              >
                →
              </motion.span>
            )}
          </div>
        )
      })}

      <motion.span
        animate={{ color: final ? NODE.done.border : NODE.active.border }}
        style={{ fontSize: 26, marginLeft: 2 }}
        title="repeats until the goal is met"
      >
        ↻
      </motion.span>
    </div>
  )
}
