import { AnimatePresence, motion } from 'framer-motion'
import { NODE, ACCENT } from '../palette'
import { ControllerIcon, DatabaseIcon, ModelIcon, ResponseIcon, RouteIcon, ViewIcon } from '../Icons'
import { STATIONS, type StationState, type Step } from './mvc'

const COLS = 3
const CARD_W = 296
const CARD_H = 138
const GAP = 20

const ICONS = {
  route: RouteIcon,
  controller: ControllerIcon,
  model: ModelIcon,
  database: DatabaseIcon,
  view: ViewIcon,
  response: ResponseIcon,
} as const

function styleFor(s: StationState) {
  if (s === 'active') return NODE.active
  if (s === 'done') return NODE.info
  return NODE.idle
}

/** A 3×2 grid of MVC stations plus the payload card that travels between them. */
export default function MvcView({ step }: { step: Step }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 24 }}>
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${COLS}, ${CARD_W}px)`, gap: GAP }}
      >
        {STATIONS.map((st, i) => {
          const s = styleFor(step.states[i])
          const active = step.states[i] === 'active'
          const Icon = ICONS[st.icon]
          return (
            <motion.div
              key={st.id}
              className="flex flex-col items-center justify-center rounded-2xl border-2"
              animate={{
                borderColor: s.border,
                backgroundColor: s.bg,
                boxShadow: active ? s.shadow : '0 1px 4px rgba(42,26,23,0.05)',
                scale: active ? 1.04 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ width: CARD_W, height: CARD_H, gap: 8 }}
            >
              <span style={{ color: s.text }}>
                <Icon size={38} />
              </span>
              <span className="font-serif font-semibold" style={{ fontSize: 27, color: s.text }}>
                {st.label}
              </span>
              <span className="font-mono" style={{ fontSize: 16, color: '#A08F8A' }}>
                {st.where}
              </span>
            </motion.div>
          )
        })}
      </div>

      <PayloadCard step={step} />
    </div>
  )
}

/** The single value in flight, relabelled and reshaped at every hop. */
function PayloadCard({ step }: { step: Step }) {
  const label = step.at >= 0 ? STATIONS[step.at].label : 'In flight'
  return (
    <div
      className="rounded-2xl border-2"
      style={{
        width: CARD_W * COLS + GAP * (COLS - 1),
        height: 186,
        borderColor: ACCENT.accent,
        background: ACCENT.accentSoft,
        boxShadow: '0 6px 20px rgba(245,48,3,0.14)',
      }}
    >
      <div
        className="flex items-center border-b"
        style={{ gap: 12, padding: '10px 20px', borderColor: '#F0C9BF' }}
      >
        <span className="font-mono font-semibold" style={{ fontSize: 19, color: ACCENT.accentText }}>
          {step.payload.kind}
        </span>
        <span className="ml-auto font-mono" style={{ fontSize: 17, color: '#A08F8A' }}>
          at {label}
        </span>
      </div>

      <div className="flex flex-col justify-center px-6 font-mono" style={{ height: 130, gap: 6 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step.payload.body.join('|')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
            style={{ gap: 6 }}
          >
            {step.payload.body.map((l, i) => (
              <span key={i} style={{ fontSize: 22, color: '#3A2320' }}>
                {l}
              </span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
