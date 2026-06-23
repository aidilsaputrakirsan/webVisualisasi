import { motion } from 'framer-motion'
import { NODE } from '../../../shared/theme'
import { PHASES, type Phase } from './edgeLoop'
import { SenseIcon, DecideIcon, ActIcon, LogIcon, LoopIcon } from './Icons'

const ICONS: Record<Phase, (p: { size?: number }) => JSX.Element> = {
  sense: SenseIcon,
  decide: DecideIcon,
  act: ActIcon,
  log: LogIcon,
}

const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const

/** Horizontal Sense → Decide → Act → Log strip with the current phase lit and
 *  a "loops back" hint on the right. Reads `step.phase`. */
export default function PhaseLoop({ phase, cycle, skipped }: { phase: Phase; cycle: number; skipped: boolean }) {
  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      {PHASES.map((p, i) => {
        const Icon = ICONS[p.id]
        const lit = p.id === phase
        // The Act node greys out on a suppressed cycle to show it was skipped.
        const skippedNode = p.id === 'act' && skipped
        const st = lit ? NODE.active : NODE.idle
        return (
          <div key={p.id} className="flex items-center" style={{ gap: 10 }}>
            <motion.div
              className="flex items-center rounded-2xl border-2"
              animate={{
                borderColor: lit ? st.border : skippedNode ? '#D8C7C4' : NODE.idle.border,
                background: lit ? st.bg : skippedNode ? '#F6EEEC' : '#FFFFFF',
                boxShadow: lit ? st.shadow : 'none',
                opacity: skippedNode ? 0.6 : 1,
              }}
              transition={SPRING}
              style={{ gap: 11, padding: '12px 18px', minWidth: 168 }}
            >
              <motion.span animate={{ color: lit ? st.border : '#9AA889' }} style={{ display: 'flex' }}>
                <Icon size={28} />
              </motion.span>
              <div className="flex flex-col" style={{ gap: 1 }}>
                <span className="font-semibold" style={{ fontSize: 23, color: lit ? st.text : '#3A3D32' }}>
                  {p.label}
                </span>
                <span className="font-mono" style={{ fontSize: 14, color: '#9AA889', whiteSpace: 'nowrap' }}>
                  {skippedNode ? 'dilewati' : p.desc}
                </span>
              </div>
            </motion.div>
            {i < PHASES.length - 1 && (
              <span style={{ color: '#B7C2A6', fontSize: 26 }}>→</span>
            )}
          </div>
        )
      })}

      {/* loops back to Sense */}
      <div className="flex items-center" style={{ gap: 8, marginLeft: 6 }}>
        <span style={{ color: '#B7C2A6', fontSize: 26 }}>↺</span>
        <span className="flex items-center font-mono" style={{ gap: 7, fontSize: 16, color: '#7C8A6C' }}>
          <LoopIcon size={20} />
          siklus {cycle}
        </span>
      </div>
    </div>
  )
}
