import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../../../shared/theme'
import { EDGES, NODES, edgeBetween, type FlowStep, type NodeId, type Tone } from './arch'
import { BoxIcon, BrowserIcon, DatabaseIcon, GatewayIcon, ShieldIcon } from './Icons'

const BOARD_W = 820
const BOARD_H = 520

const NODE_ICON: Record<NodeId, ({ size }: { size?: number }) => JSX.Element> = {
  fe: BrowserIcon,
  gw: GatewayIcon,
  auth: ShieldIcon,
  authdb: DatabaseIcon,
  item: BoxIcon,
  itemdb: DatabaseIcon,
}

const TONE: Record<Tone, { stroke: string; bg: string; text: string }> = {
  request: { stroke: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text },
  response: { stroke: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text },
  db: { stroke: NODE.info.border, bg: NODE.info.bg, text: NODE.info.text },
  verify: { stroke: '#7C3AED', bg: '#EDE9FE', text: '#5B21B6' },
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

export default function ArchView({ step, stepKey }: { step: FlowStep; stepKey: number }) {
  const active = new Set(step.activeNodes)
  const activeEdge = step.packet ? edgeBetween(step.packet.from, step.packet.to) : undefined
  const pts = step.packet ? point(step.packet.from, step.packet.to) : null
  const tone = step.packet ? TONE[step.packet.tone] : null

  return (
    <div className="relative" style={{ width: BOARD_W, height: BOARD_H }}>
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
              strokeDasharray={e.dashed ? '7 6' : undefined}
              strokeLinecap="round"
            />
          )
        })}
      </svg>

      {/* Inter-service hint label on the dashed verify edge */}
      <div
        className="absolute font-mono"
        style={{ left: 318, top: 286, width: 184, textAlign: 'center', fontSize: 13, color: '#9C8F7B' }}
      >
        inter-service (HTTP)
      </div>

      {/* Nodes */}
      {Object.values(NODES).map((n) => {
        const isActive = active.has(n.id)
        const isDb = n.id === 'authdb' || n.id === 'itemdb'
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
              padding: isDb ? '0 16px' : '0 18px',
            }}
          >
            <motion.span animate={{ color: st.border }} style={{ display: 'flex', flexShrink: 0 }}>
              <Icon size={isDb ? 24 : 28} />
            </motion.span>
            <div className="flex flex-col" style={{ gap: 1, minWidth: 0 }}>
              <span className="font-semibold" style={{ fontSize: isDb ? 19 : 21, color: '#211C16', whiteSpace: 'nowrap' }}>
                {n.label}
              </span>
              <span className="font-mono" style={{ fontSize: 14, color: '#9C8F7B' }}>
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
              padding: '5px 13px',
              fontSize: 16,
              whiteSpace: 'nowrap',
              borderColor: tone.stroke,
              background: tone.bg,
              color: tone.text,
              zIndex: 20,
            }}
          >
            {step.packet.tag}
            {step.hasToken && (step.packet.tone === 'request' || step.packet.tone === 'verify') && (
              <span
                className="rounded-full"
                style={{ fontSize: 12, padding: '1px 7px', background: '#FDEBC8', color: '#92400E', border: '1px solid #E9C893' }}
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
