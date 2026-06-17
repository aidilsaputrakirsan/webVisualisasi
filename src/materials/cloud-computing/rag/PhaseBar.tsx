import { motion } from 'framer-motion'
import { NODE } from '../palette'
import { PHASES, type Mode } from './rag'

const ORDER: Mode[] = ['index', 'retrieve', 'generate']

/**
 * Breadcrumb of the 3 RAG phases (Indexing -> Retrieval -> Generation) for the
 * single continuous flow. The active phase is indigo, finished phases are green
 * (done), upcoming phases are grey (idle). Rendered inside the recorded stage.
 */
export default function PhaseBar({ phase }: { phase: Mode }) {
  const activeIdx = ORDER.indexOf(phase)
  return (
    <div className="flex items-center" style={{ gap: 13 }}>
      {ORDER.map((p, i) => {
        const state = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'idle'
        const st = state === 'active' ? NODE.active : state === 'done' ? NODE.done : NODE.idle
        const lit = state !== 'idle'
        return (
          <div key={p} className="flex items-center" style={{ gap: 13 }}>
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
                {PHASES[p].label}
              </span>
            </motion.div>
            {i < ORDER.length - 1 && (
              <motion.span
                animate={{ color: i < activeIdx ? NODE.done.border : '#C7CADD' }}
                style={{ fontSize: 26 }}
              >
                →
              </motion.span>
            )}
          </div>
        )
      })}
    </div>
  )
}
