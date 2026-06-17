import { motion } from 'framer-motion'
import { PHASES, type Phase } from './rideMatching'

const ORDER: Phase[] = ['nearest', 'eta', 'smart', 'batch']

const ACTIVE = { border: '#0D9488', bg: '#CCFBF1', text: '#115E59' }
const DONE = { border: '#15803D', bg: '#DCFCE7', text: '#166534' }

/** Breadcrumb of the four strategies the single play walks through. */
export default function StrategyBar({ phase }: { phase: Phase }) {
  const activeIdx = ORDER.indexOf(phase)
  return (
    <div className="flex items-center" style={{ gap: 11 }}>
      {ORDER.map((p, i) => {
        const state = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'idle'
        const lit = state !== 'idle'
        const st = state === 'active' ? ACTIVE : DONE
        return (
          <div key={p} className="flex items-center" style={{ gap: 11 }}>
            <motion.div
              className="flex items-center rounded-full border-2"
              animate={{
                borderColor: lit ? st.border : '#D2DED8',
                background: lit ? st.bg : '#FFFFFF',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              style={{ gap: 9, padding: '7px 16px' }}
            >
              <motion.span
                className="flex items-center justify-center rounded-full font-mono font-semibold"
                animate={{ background: lit ? st.border : '#E3EDE7', color: lit ? '#FFFFFF' : '#8AA197' }}
                style={{ width: 26, height: 26, fontSize: 15, flexShrink: 0 }}
              >
                {state === 'done' ? '✓' : i + 1}
              </motion.span>
              <span className="font-semibold" style={{ fontSize: 19, color: lit ? st.text : '#9AB0A6', whiteSpace: 'nowrap' }}>
                {PHASES[p].label}
              </span>
            </motion.div>
            {i < ORDER.length - 1 && (
              <motion.span animate={{ color: i < activeIdx ? DONE.border : '#C2D2CA' }} style={{ fontSize: 22 }}>
                →
              </motion.span>
            )}
          </div>
        )
      })}
    </div>
  )
}
