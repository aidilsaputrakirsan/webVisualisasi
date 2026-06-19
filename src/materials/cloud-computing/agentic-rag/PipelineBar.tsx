import { motion } from 'framer-motion'
import { NODE } from '../palette'
import type { Phase } from './agenticRag'

const ORDER: { id: Phase; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'retrieve', label: 'Retrieve' },
  { id: 'grade', label: 'Grade' },
  { id: 'generate', label: 'Generate' },
  { id: 'validate', label: 'Validate' },
]

/**
 * The agentic pipeline: Plan → Retrieve → Grade → Generate → Validate. The
 * "Rewrite" phase is drawn as a glowing ↻ loop-back over the Grade pill — it
 * sends control back to Retrieve, the self-correction plain RAG never does.
 */
export default function PipelineBar({ phase, attempt }: { phase: Phase; attempt: number }) {
  const rewriting = phase === 'rewrite'
  // While rewriting, treat Grade as the active anchor for highlighting.
  const anchor: Phase = rewriting ? 'grade' : phase
  const activeIdx = ORDER.findIndex((p) => p.id === anchor)

  return (
    <div className="flex items-center" style={{ gap: 11 }}>
      <div
        className="flex items-center rounded-full font-mono font-semibold"
        style={{ gap: 8, padding: '8px 14px', fontSize: 18, background: '#FFFFFF', border: `2px solid ${NODE.idle.border}`, color: NODE.idle.text }}
      >
        try {attempt}
      </div>

      {ORDER.map((p, i) => {
        const state = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'idle'
        const st = state === 'active' ? NODE.active : state === 'done' ? NODE.done : NODE.idle
        const lit = state !== 'idle'
        const showLoop = rewriting && p.id === 'grade'
        return (
          <div key={p.id} className="flex items-center" style={{ gap: 11 }}>
            <motion.div
              className="relative flex items-center rounded-full border-2"
              animate={{
                borderColor: showLoop ? NODE.active.border : st.border,
                background: lit ? st.bg : '#FFFFFF',
                boxShadow: state === 'active' || showLoop ? NODE.active.shadow : 'none',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              style={{ gap: 9, padding: '8px 16px' }}
            >
              <motion.span
                className="flex items-center justify-center rounded-full font-mono font-semibold"
                animate={{ background: lit ? st.border : '#E2E2EE', color: lit ? '#FFFFFF' : '#8C849C' }}
                style={{ width: 28, height: 28, fontSize: 16, flexShrink: 0 }}
              >
                {state === 'done' ? '✓' : i + 1}
              </motion.span>
              <span className="font-semibold" style={{ fontSize: 20, color: lit ? st.text : '#9FA3BC', whiteSpace: 'nowrap' }}>
                {p.label}
              </span>
              {showLoop && (
                <motion.span
                  className="absolute font-mono font-semibold"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ top: -26, left: '50%', transform: 'translateX(-50%)', fontSize: 18, color: NODE.active.text, whiteSpace: 'nowrap' }}
                >
                  ↻ rewrite
                </motion.span>
              )}
            </motion.div>
            {i < ORDER.length - 1 && (
              <motion.span animate={{ color: i < activeIdx ? NODE.done.border : '#C7CADD' }} style={{ fontSize: 22 }}>
                →
              </motion.span>
            )}
          </div>
        )
      })}
    </div>
  )
}
