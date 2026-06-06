import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../../../shared/theme'
import {
  LANE,
  LANE_EDGES,
  STATES,
  TRANSITIONS,
  laneEdge,
  type LaneId,
  type RelStep,
  type StateId,
  type Tone,
} from './arch'
import { BoltIcon, BoxIcon, CheckIcon, CrossIcon, ShieldIcon, SpinnerIcon } from './Icons'

const BOARD_W = 860
const BOARD_H = 480

const FAIL = { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B', shadow: '0 4px 18px rgba(220,38,38,0.22)' }

const TONE: Record<Tone, { stroke: string; bg: string; text: string }> = {
  request: { stroke: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text },
  pass: { stroke: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text },
  fail: { stroke: FAIL.border, bg: FAIL.bg, text: FAIL.text },
  reject: { stroke: '#9A3412', bg: '#FFE4D5', text: '#7C2D12' },
}

/** Colour for each circuit-breaker state. */
function stateStyle(id: StateId) {
  if (id === 'CLOSED') return NODE.done
  if (id === 'OPEN') return FAIL
  return NODE.active // HALF_OPEN
}

function point(from: LaneId, to: LaneId) {
  const e = laneEdge(from, to)
  if (!e) return null
  const fromIsA = e.a === from
  return {
    sx: fromIsA ? e.ax : e.bx,
    sy: fromIsA ? e.ay : e.by,
    tx: fromIsA ? e.bx : e.ax,
    ty: fromIsA ? e.by : e.ay,
  }
}

export default function ReliabilityView({ step, stepKey }: { step: RelStep; stepKey: number }) {
  const laneActive = new Set(step.laneActive)
  const activeLaneEdge = step.packet ? laneEdge(step.packet.from, step.packet.to) : undefined
  const pts = step.packet ? point(step.packet.from, step.packet.to) : null
  const tone = step.packet ? TONE[step.packet.tone] : null

  return (
    <div className="relative" style={{ width: BOARD_W, height: BOARD_H }}>
      {/* ── Request lane ───────────────────────────── */}
      <svg width={BOARD_W} height={150} className="absolute inset-x-0 top-0" style={{ pointerEvents: 'none' }}>
        {LANE_EDGES.map((e, i) => {
          const isActive = activeLaneEdge && activeLaneEdge.a === e.a && activeLaneEdge.b === e.b
          const color = isActive ? (tone?.stroke ?? NODE.active.border) : '#D3C8B6'
          return (
            <motion.line key={i} x1={e.ax} y1={e.ay} x2={e.bx} y2={e.by} animate={{ stroke: color, strokeWidth: isActive ? 3.5 : 2 }} strokeLinecap="round" />
          )
        })}
      </svg>

      {/* Item Service */}
      <LaneBox id="item" active={laneActive.has('item')} icon={BoxIcon} title="Item Service" sub="pemanggil" />

      {/* Circuit Breaker (shows state + failure counter) */}
      <BreakerBox step={step} active={laneActive.has('breaker')} />

      {/* Auth Service (UP / DOWN) */}
      <LaneBox
        id="auth"
        active={laneActive.has('auth')}
        icon={ShieldIcon}
        title="Auth Service"
        sub={step.authUp ? 'UP' : 'DOWN'}
        statusDot={step.authUp ? NODE.done.border : FAIL.border}
      />

      {/* Travelling packet */}
      <AnimatePresence>
        {step.packet && pts && tone && (
          <motion.div
            key={stepKey}
            className="absolute flex items-center rounded-full border font-mono"
            initial={{ left: pts.sx, top: pts.sy, opacity: 0, scale: 0.7, x: '-50%', y: '-50%' }}
            animate={{ left: pts.tx, top: pts.ty, opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            style={{ gap: 6, padding: '6px 15px', fontSize: 18, whiteSpace: 'nowrap', borderColor: tone.stroke, background: tone.bg, color: tone.text, zIndex: 20 }}
          >
            {step.packet.tag}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── State machine ──────────────────────────── */}
      <svg width={BOARD_W} height={BOARD_H} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        <defs>
          <marker id="rel-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
            <path d="M0 0 L7 3 L0 6" fill="none" stroke="#B7AB95" strokeWidth="1.4" />
          </marker>
          <marker id="rel-arrow-on" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
            <path d="M0 0 L7 3 L0 6" fill="none" stroke="#D97706" strokeWidth="1.6" />
          </marker>
        </defs>
        {TRANSITIONS.map((t, i) => {
          const on = step.activeTransition && step.activeTransition.from === t.from && step.activeTransition.to === t.to
          return (
            <motion.line
              key={i}
              x1={t.ax}
              y1={t.ay}
              x2={t.bx}
              y2={t.by}
              animate={{ stroke: on ? '#D97706' : '#CFC5B4', strokeWidth: on ? 3 : 1.6 }}
              markerEnd={on ? 'url(#rel-arrow-on)' : 'url(#rel-arrow)'}
            />
          )
        })}
      </svg>

      {/* Transition labels */}
      {TRANSITIONS.map((t, i) => {
        const on = step.activeTransition && step.activeTransition.from === t.from && step.activeTransition.to === t.to
        return (
          <div
            key={i}
            className="absolute font-mono"
            style={{ left: t.lx - 85, top: t.ly - 11, width: 170, textAlign: 'center', fontSize: 16, color: on ? '#B45309' : '#9C8F7B', fontWeight: on ? 700 : 400 }}
          >
            {t.label}
          </div>
        )
      })}

      {/* State nodes */}
      {Object.values(STATES).map((s) => {
        const isCurrent = step.state === s.id
        const st = stateStyle(s.id)
        return (
          <motion.div
            key={s.id}
            className="absolute flex flex-col items-center justify-center rounded-2xl border-2"
            animate={{
              borderColor: isCurrent ? st.border : '#D3C8B6',
              background: isCurrent ? st.bg : '#FFFFFF',
              boxShadow: isCurrent ? st.shadow : '0 1px 4px rgba(0,0,0,0.05)',
              scale: isCurrent ? 1.05 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            style={{ left: s.cx - s.w / 2, top: s.cy - s.h / 2, width: s.w, height: s.h }}
          >
            <span className="font-serif font-semibold" style={{ fontSize: 31, letterSpacing: '0.04em', color: isCurrent ? st.text : '#57503F' }}>
              {s.label}
            </span>
            <span className="font-mono" style={{ fontSize: 16, color: '#9C8F7B' }}>
              {s.sub}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

function LaneBox({
  id,
  active,
  icon: Icon,
  title,
  sub,
  statusDot,
}: {
  id: LaneId
  active: boolean
  icon: ({ size }: { size?: number }) => JSX.Element
  title: string
  sub: string
  statusDot?: string
}) {
  const n = LANE[id]
  const st = active ? NODE.active : NODE.idle
  return (
    <motion.div
      className="absolute flex items-center rounded-2xl border-2"
      animate={{ borderColor: st.border, background: active ? st.bg : '#FFFFFF', boxShadow: active ? st.shadow : '0 1px 4px rgba(0,0,0,0.05)', scale: active ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      style={{ left: n.cx - n.w / 2, top: n.cy - n.h / 2, width: n.w, height: n.h, gap: 12, padding: '0 16px' }}
    >
      <motion.span animate={{ color: st.border }} style={{ display: 'flex', flexShrink: 0 }}>
        <Icon size={32} />
      </motion.span>
      <div className="flex flex-col" style={{ gap: 3, minWidth: 0 }}>
        <span className="font-semibold" style={{ fontSize: 23, color: '#211C16', whiteSpace: 'nowrap' }}>
          {title}
        </span>
        <span className="flex items-center font-mono" style={{ fontSize: 17, color: '#9C8F7B', gap: 7 }}>
          {statusDot && <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusDot }} />}
          {sub}
        </span>
      </div>
    </motion.div>
  )
}

function BreakerBox({ step, active }: { step: RelStep; active: boolean }) {
  const n = LANE.breaker
  const st = stateStyle(step.state)
  const ratio = step.failureCount / step.threshold
  return (
    <motion.div
      className="absolute flex flex-col rounded-2xl border-2"
      animate={{ borderColor: st.border, background: active ? st.bg : '#FFFDF9', boxShadow: active ? st.shadow : '0 2px 10px rgba(0,0,0,0.06)', scale: active ? 1.03 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      style={{ left: n.cx - n.w / 2, top: n.cy - n.h / 2, width: n.w, height: n.h, padding: '14px 20px', gap: 10 }}
    >
      <div className="flex items-center" style={{ gap: 11 }}>
        <motion.span animate={{ color: st.border }} style={{ display: 'flex', flexShrink: 0 }}>
          <BoltIcon size={30} />
        </motion.span>
        <span className="font-semibold" style={{ fontSize: 22, color: '#211C16', whiteSpace: 'nowrap' }}>
          Circuit Breaker
        </span>
        <motion.span
          animate={{ background: st.bg, color: st.text, borderColor: st.border }}
          className="ml-auto rounded-full border font-mono font-semibold"
          style={{ fontSize: 16, padding: '4px 14px', whiteSpace: 'nowrap' }}
        >
          {step.state}
        </motion.span>
      </div>

      {/* failure meter */}
      <div className="flex items-center" style={{ gap: 11 }}>
        <span className="font-mono" style={{ fontSize: 16, color: '#9C8F7B', whiteSpace: 'nowrap' }}>
          gagal {step.failureCount}/{step.threshold}
        </span>
        <div className="relative flex-1 overflow-hidden rounded-full" style={{ height: 11, background: '#EFE6D7' }}>
          <motion.div
            animate={{ width: `${Math.min(ratio, 1) * 100}%`, background: step.state === 'OPEN' ? FAIL.border : ratio > 0 ? '#D97706' : '#D3C8B6' }}
            transition={{ type: 'spring', stiffness: 200, damping: 26 }}
            className="absolute inset-y-0 left-0 rounded-full"
          />
        </div>
        {step.state === 'OPEN' ? (
          <span style={{ color: FAIL.border, display: 'flex' }}><CrossIcon size={18} /></span>
        ) : step.state === 'HALF_OPEN' ? (
          <span style={{ color: NODE.active.border, display: 'flex' }}><SpinnerIcon size={18} /></span>
        ) : (
          <span style={{ color: NODE.done.border, display: 'flex' }}><CheckIcon size={18} /></span>
        )}
      </div>
    </motion.div>
  )
}
