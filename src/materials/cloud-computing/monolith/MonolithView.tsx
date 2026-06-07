import { AnimatePresence, motion } from 'framer-motion'
import { ACCENT, NODE } from '../palette'
import { BACKEND_BOX, EDGES, NODES, edgeBetween, type FlowStep, type NodeId, type Tone } from './arch'
import { AppIcon, BoxIcon, BrowserIcon, DatabaseIcon, ShieldIcon } from './Icons'

const BOARD_W = 820
const BOARD_H = 520

const NODE_ICON: Record<NodeId, ({ size }: { size?: number }) => JSX.Element> = {
  fe: BrowserIcon,
  app: AppIcon,
  auth: ShieldIcon,
  items: BoxIcon,
  db: DatabaseIcon,
}

const TONE: Record<Tone, { stroke: string; bg: string; text: string }> = {
  request: { stroke: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text },
  response: { stroke: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text },
  db: { stroke: NODE.info.border, bg: NODE.info.bg, text: NODE.info.text },
  // in-process call — teal, distinct from the microservices "verify" (purple/HTTP).
  internal: { stroke: '#0E7490', bg: '#CFFAFE', text: '#155E75' },
}

function point(from: NodeId, to: NodeId) {
  const e = edgeBetween(from, to)
  if (!e) return null
  const fromIsA = e.a === from
  return {
    sx: fromIsA ? e.ax : e.bx,
    sy: fromIsA ? e.ay : e.by,
    tx: fromIsA ? e.bx : e.ax,
    ty: fromIsA ? e.by : e.ay,
  }
}

export default function MonolithView({ step, stepKey }: { step: FlowStep; stepKey: number }) {
  const active = new Set(step.activeNodes)
  const activeEdge = step.packet ? edgeBetween(step.packet.from, step.packet.to) : undefined
  const pts = step.packet ? point(step.packet.from, step.packet.to) : null
  const tone = step.packet ? TONE[step.packet.tone] : null

  return (
    <div className="relative" style={{ width: BOARD_W, height: BOARD_H }}>
      {/* The single deployable — one box around app + both modules. */}
      <div
        className="absolute rounded-2xl border-2"
        style={{
          left: BACKEND_BOX.left,
          top: BACKEND_BOX.top,
          width: BACKEND_BOX.width,
          height: BACKEND_BOX.height,
          borderColor: '#CBA66B',
          borderStyle: 'dashed',
          background: 'rgba(253,243,224,0.55)',
        }}
      >
        <span
          className="absolute font-mono font-semibold"
          style={{ top: -28, left: 4, fontSize: 15, color: '#9A7B43', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
        >
          MONOLITH BACKEND · satu proses, satu deployment
        </span>
      </div>

      {/* Edges */}
      <svg width={BOARD_W} height={BOARD_H} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        {EDGES.map((e, i) => {
          const isActive = activeEdge && activeEdge.a === e.a && activeEdge.b === e.b
          const color = isActive ? (tone?.stroke ?? NODE.active.border) : '#D3C8B6'
          return (
            <motion.line
              key={i}
              x1={e.ax}
              y1={e.ay}
              x2={e.bx}
              y2={e.by}
              animate={{ stroke: color, strokeWidth: isActive ? 3.5 : 2 }}
              strokeLinecap="round"
            />
          )
        })}
      </svg>

      {/* Internal-call hint between the two modules */}
      <div
        className="absolute font-mono"
        style={{ left: 365, top: 306, width: 100, textAlign: 'center', fontSize: 14, color: '#9C8F7B' }}
      >
        in-process
      </div>

      {/* Nodes */}
      {Object.values(NODES).map((n) => {
        const isActive = active.has(n.id)
        const isDb = n.id === 'db'
        const st = isActive ? (isDb ? NODE.info : NODE.active) : NODE.idle
        const Icon = NODE_ICON[n.id]
        return (
          <motion.div
            key={n.id}
            className="absolute flex items-center rounded-2xl border-2"
            animate={{
              borderColor: st.border,
              background: isActive ? st.bg : '#FFFFFF',
              boxShadow: isActive ? st.shadow : '0 1px 4px rgba(0,0,0,0.05)',
              scale: isActive ? 1.04 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            style={{
              left: n.cx - n.w / 2,
              top: n.cy - n.h / 2,
              width: n.w,
              height: n.h,
              gap: 12,
              padding: '0 16px',
            }}
          >
            <motion.span animate={{ color: st.border }} style={{ display: 'flex', flexShrink: 0 }}>
              <Icon size={isDb ? 26 : 29} />
            </motion.span>
            <div className="flex flex-col" style={{ gap: 2, minWidth: 0 }}>
              <span className="font-semibold" style={{ fontSize: 22, color: '#211C16', whiteSpace: 'nowrap' }}>
                {n.label}
              </span>
              <span className="font-mono" style={{ fontSize: 16, color: '#9C8F7B' }}>
                {n.sub}
              </span>
            </div>
          </motion.div>
        )
      })}

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
            style={{
              gap: 7,
              padding: '6px 15px',
              fontSize: 18,
              whiteSpace: 'nowrap',
              borderColor: tone.stroke,
              background: tone.bg,
              color: tone.text,
              zIndex: 20,
            }}
          >
            {step.packet.tag}
            {step.hasToken && (step.packet.tone === 'request' || step.packet.tone === 'internal') && (
              <span
                className="rounded-full"
                style={{ fontSize: 13, padding: '1px 8px', background: ACCENT.accentSoft, color: ACCENT.accentText, border: `1px solid ${ACCENT.accent}55` }}
              >
                JWT
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
