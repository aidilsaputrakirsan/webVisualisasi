import { motion } from 'framer-motion'
import { NODE, EDGE, ACCENT } from '../palette'
import {
  BoltIcon,
  ControllerIcon,
  GearIcon,
  GlobeIcon,
  LayersIcon,
  ResponseIcon,
  RouteIcon,
  ShieldIcon,
} from '../Icons'
import { STAGES, type Step, type StageState } from './lifecycle'

const ROW_H = 74
const RAIL_X = 96
const CARD_W = 690

const ICONS = {
  globe: GlobeIcon,
  bolt: BoltIcon,
  gear: GearIcon,
  layers: LayersIcon,
  shield: ShieldIcon,
  route: RouteIcon,
  controller: ControllerIcon,
  response: ResponseIcon,
} as const

/** Map a stage's lifecycle state onto the shared semantic node palette. */
function styleFor(state: StageState) {
  if (state === 'active') return NODE.active
  if (state === 'returned') return NODE.done
  if (state === 'passed') return NODE.info
  return NODE.idle
}

/**
 * The lifecycle rail: nine stacked stage cards joined by a vertical line, with
 * a single packet chip riding the rail down (Request) and back up (Response).
 */
export default function LifecycleView({ step }: { step: Step }) {
  const height = STAGES.length * ROW_H
  const parked = step.at < 0
  const packetY = (parked ? (step.phase === 'in' ? 0 : STAGES.length - 1) : step.at) * ROW_H + ROW_H / 2

  return (
    <div className="relative" style={{ width: 940, height }}>
      {/* Rail spine — the shared path both legs travel. */}
      <div
        className="absolute rounded-full"
        style={{
          left: RAIL_X - 2,
          top: ROW_H / 2,
          width: 4,
          height: height - ROW_H,
          background: EDGE.idle,
        }}
      />

      {STAGES.map((stage, i) => {
        const s = styleFor(step.states[i])
        const Icon = ICONS[stage.icon]
        const isActive = step.states[i] === 'active'
        return (
          <div key={stage.id} className="absolute" style={{ top: i * ROW_H, left: 0, height: ROW_H }}>
            {/* Stop marker on the rail. */}
            <motion.div
              className="absolute rounded-full border-2"
              animate={{
                borderColor: s.border,
                backgroundColor: s.bg,
                scale: isActive ? 1.18 : 1,
              }}
              transition={{ duration: 0.25 }}
              style={{ left: RAIL_X - 17, top: ROW_H / 2 - 17, width: 34, height: 34 }}
            />

            {/* Stage card. */}
            <motion.div
              className="absolute flex items-center rounded-2xl border"
              animate={{
                borderColor: s.border,
                backgroundColor: s.bg,
                boxShadow: s.shadow,
                x: isActive ? 10 : 0,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                left: RAIL_X + 42,
                top: 6,
                width: CARD_W,
                height: ROW_H - 14,
                gap: 18,
                paddingLeft: 22,
                paddingRight: 22,
              }}
            >
              <span style={{ color: s.text }}>
                <Icon size={30} />
              </span>
              <span className="flex flex-col" style={{ gap: 2 }}>
                <span className="font-semibold" style={{ fontSize: 25, color: s.text }}>
                  {stage.label}
                </span>
                <span className="font-mono" style={{ fontSize: 18, color: '#8A7A74' }}>
                  {stage.where}
                </span>
              </span>
            </motion.div>
          </div>
        )
      })}

      {/* The travelling packet. */}
      <motion.div
        className="absolute flex items-center justify-center rounded-full border font-mono font-semibold"
        animate={{
          y: packetY - 20,
          opacity: parked ? 0 : 1,
          backgroundColor: step.phase === 'in' ? ACCENT.accent : '#15803D',
          borderColor: step.phase === 'in' ? ACCENT.accentDeep : '#166534',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          left: 0,
          top: 0,
          width: 74,
          height: 40,
          fontSize: 17,
          color: '#FFFFFF',
          letterSpacing: '0.04em',
        }}
      >
        {step.phase === 'in' ? 'REQ' : 'RES'}
      </motion.div>
    </div>
  )
}
