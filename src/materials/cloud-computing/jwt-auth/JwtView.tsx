import { AnimatePresence, motion } from 'framer-motion'
import { ACCENT, NODE } from '../palette'
import { EDGES, NODES, edgeBetween, type JwtStep, type NodeId, type Tone } from './jwt'
import { BoxIcon, ClientIcon, DatabaseIcon, GatewayIcon, KeyIcon, LockIcon, ShieldIcon } from './Icons'

const BOARD_W = 940
const BOARD_H = 286

const NODE_ICON: Record<NodeId, ({ size }: { size?: number }) => JSX.Element> = {
  client: ClientIcon,
  gw: GatewayIcon,
  item: BoxIcon,
  auth: ShieldIcon,
  db: DatabaseIcon,
}

const TONE: Record<Tone, { stroke: string; bg: string; text: string }> = {
  request: { stroke: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text },
  pass: { stroke: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text },
  verify: { stroke: NODE.info.border, bg: NODE.info.bg, text: NODE.info.text },
  db: { stroke: NODE.info.border, bg: NODE.info.bg, text: NODE.info.text },
}

const FAIL = { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B' }

function point(from: NodeId, to: NodeId) {
  const e = edgeBetween(from, to)
  if (!e) return null
  const fromIsA = e.a === from
  return { sx: fromIsA ? e.ax : e.bx, sy: fromIsA ? e.ay : e.by, tx: fromIsA ? e.bx : e.ax, ty: fromIsA ? e.by : e.ay }
}

export default function JwtView({ step, stepKey }: { step: JwtStep; stepKey: number }) {
  const active = new Set(step.activeNodes)
  const activeEdge = step.packet ? edgeBetween(step.packet.from, step.packet.to) : undefined
  const pts = step.packet ? point(step.packet.from, step.packet.to) : null
  const tone = step.packet ? TONE[step.packet.tone] : null

  return (
    <div className="flex flex-col items-center" style={{ gap: 20 }}>
      <div className="relative" style={{ width: BOARD_W, height: BOARD_H }}>
        {/* Edges */}
        <svg width={BOARD_W} height={BOARD_H} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          {EDGES.map((e, i) => {
            const on = activeEdge && activeEdge.a === e.a && activeEdge.b === e.b
            const dim = (e.a === 'item' && e.b === 'auth') && step.authIdle
            const color = on ? (tone?.stroke ?? NODE.active.border) : dim ? '#DADCE6' : '#C7CADD'
            return (
              <motion.line
                key={i}
                x1={e.ax}
                y1={e.ay}
                x2={e.bx}
                y2={e.by}
                animate={{ stroke: color, strokeWidth: on ? 3.5 : 2, opacity: dim ? 0.5 : 1 }}
                strokeDasharray={e.dashed ? '7 6' : undefined}
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {Object.values(NODES).map((n) => {
          const isActive = active.has(n.id)
          const isAuthIdle = n.id === 'auth' && step.authIdle
          const st = isActive ? NODE.active : NODE.idle
          const Icon = NODE_ICON[n.id]
          const sub = isAuthIdle ? 'nganggur' : n.sub
          return (
            <motion.div
              key={n.id}
              className="absolute flex items-center rounded-2xl border-2"
              animate={{
                borderColor: isAuthIdle ? '#D6D8E2' : st.border,
                background: isActive ? st.bg : '#FFFFFF',
                boxShadow: isActive ? st.shadow : '0 1px 4px rgba(0,0,0,0.05)',
                scale: isActive ? 1.04 : 1,
                opacity: isAuthIdle ? 0.55 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              style={{ left: n.cx - n.w / 2, top: n.cy - n.h / 2, width: n.w, height: n.h, gap: 11, padding: '0 16px' }}
            >
              <motion.span animate={{ color: isAuthIdle ? '#A6A9BC' : st.border }} style={{ display: 'flex', flexShrink: 0 }}>
                <Icon size={n.id === 'db' ? 24 : 28} />
              </motion.span>
              <div className="flex flex-col" style={{ gap: 2, minWidth: 0 }}>
                <span className="font-semibold" style={{ fontSize: n.id === 'db' ? 19 : 21, color: '#1B2233', whiteSpace: 'nowrap' }}>
                  {n.label}
                </span>
                <span className="font-mono" style={{ fontSize: 15, color: isAuthIdle ? '#A6A9BC' : '#8990A8' }}>
                  {sub}
                </span>
              </div>
            </motion.div>
          )
        })}

        {/* Public-key badge (where local verification is possible) */}
        {step.keyAt && <Badge nodeId={step.keyAt} text="public key" icon={<KeyIcon size={16} />} tone={{ border: ACCENT.accent, bg: ACCENT.accentSoft, text: ACCENT.accentText }} />}

        {/* Lock badge (where verification actually happens this step) */}
        {step.verifyAt && (
          <Badge
            nodeId={step.verifyAt}
            text="verify JWT"
            icon={<LockIcon size={16} />}
            tone={{ border: NODE.info.border, bg: NODE.info.bg, text: NODE.info.text }}
            below
            pulse
          />
        )}

        {/* Travelling packet */}
        <AnimatePresence>
          {step.packet && pts && tone && (
            <motion.div
              key={stepKey}
              className="absolute flex items-center rounded-full border font-mono font-semibold"
              initial={{ left: pts.sx, top: pts.sy, opacity: 0, scale: 0.7, x: '-50%', y: '-50%' }}
              animate={{ left: pts.tx, top: pts.ty, opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              style={{ gap: 6, padding: '6px 14px', fontSize: 17, whiteSpace: 'nowrap', borderColor: tone.stroke, background: tone.bg, color: tone.text, zIndex: 20 }}
            >
              {step.packet.tag}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="flex items-stretch justify-center" style={{ gap: 18 }}>
        <Stat label="Latency" value={`${step.latency}ms`} tone={{ border: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text }} />
        <Stat label="Hop ke Auth" value={step.hops} tone={step.hops > 0 ? FAIL : { border: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text }} />
        <Stat label="Beban Auth" value={step.authCalls} tone={step.authCalls > 0 ? FAIL : { border: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text }} />
      </div>
    </div>
  )
}

function Badge({
  nodeId,
  text,
  icon,
  tone,
  below,
  pulse,
}: {
  nodeId: NodeId
  text: string
  icon: React.ReactNode
  tone: { border: string; bg: string; text: string }
  below?: boolean
  pulse?: boolean
}) {
  const n = NODES[nodeId]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: pulse ? [1, 1.08, 1] : 1 }}
      transition={pulse ? { duration: 0.9, repeat: Infinity } : { duration: 0.2 }}
      className="absolute flex items-center rounded-full border font-mono"
      style={{
        left: n.cx,
        top: below ? n.cy + n.h / 2 + 10 : n.cy - n.h / 2 - 28,
        transform: 'translateX(-50%)',
        gap: 6,
        padding: '3px 11px',
        fontSize: 14,
        background: tone.bg,
        color: tone.text,
        borderColor: tone.border,
        zIndex: 15,
      }}
    >
      <span style={{ display: 'flex', color: tone.border }}>{icon}</span>
      {text}
    </motion.div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone: { border: string; bg: string; text: string } }) {
  return (
    <motion.div
      animate={{ borderColor: tone.border, background: tone.bg }}
      className="flex flex-col items-center rounded-2xl border-2"
      style={{ width: 248, padding: '10px 18px' }}
    >
      <span className="font-mono font-semibold" style={{ fontSize: 32, color: tone.text }}>
        {value}
      </span>
      <span className="font-mono" style={{ fontSize: 15, color: '#5A6072' }}>
        {label}
      </span>
    </motion.div>
  )
}
