import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../../../shared/theme'
import { CAPACITY, EDGES, NODES, RATE, edgeBetween, type NodeId, type RateStep, type Tone } from './arch'
import { GatewayIcon, ServerIcon, UserIcon } from './Icons'

const BOARD_W = 920
const BOARD_H = 232

const FAIL = { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B', shadow: '0 4px 18px rgba(220,38,38,0.22)' }

const TONE: Record<Tone, { stroke: string; bg: string; text: string }> = {
  request: { stroke: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text },
  allow: { stroke: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text },
  reject: { stroke: FAIL.border, bg: FAIL.bg, text: FAIL.text },
}

function point(from: NodeId, to: NodeId) {
  const e = edgeBetween(from, to)
  if (!e) return null
  const fromIsA = e.a === from
  return { sx: fromIsA ? e.ax : e.bx, sy: fromIsA ? e.ay : e.by, tx: fromIsA ? e.bx : e.ax, ty: fromIsA ? e.by : e.ay }
}

export default function RateView({ step, stepKey }: { step: RateStep; stepKey: number }) {
  const active = new Set(step.activeNodes)
  const activeEdge = step.packet ? edgeBetween(step.packet.from, step.packet.to) : undefined
  const pts = step.packet ? point(step.packet.from, step.packet.to) : null
  const tone = step.packet ? TONE[step.packet.tone] : null

  return (
    <div className="flex flex-col items-center" style={{ gap: 22 }}>
      <div className="relative" style={{ width: BOARD_W, height: BOARD_H }}>
        {/* Edges */}
        <svg width={BOARD_W} height={BOARD_H} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          {EDGES.map((e, i) => {
            const on = activeEdge && activeEdge.a === e.a && activeEdge.b === e.b
            const color = on ? (tone?.stroke ?? NODE.active.border) : '#D3C8B6'
            return <motion.line key={i} x1={e.ax} y1={e.ay} x2={e.bx} y2={e.by} animate={{ stroke: color, strokeWidth: on ? 3.5 : 2 }} strokeLinecap="round" />
          })}
        </svg>

        {/* Client */}
        <ChainBox id="client" active={active.has('client')} icon={UserIcon} title="Client" sub="pengirim request" />

        {/* Backend */}
        <ChainBox id="backend" active={active.has('backend')} icon={ServerIcon} title="Auth Service" sub="dilindungi" />

        {/* Gateway with token bucket */}
        <GatewayBox step={step} active={active.has('gw')} />

        {/* Packet */}
        <AnimatePresence>
          {step.packet && pts && tone && (
            <motion.div
              key={stepKey}
              className="absolute flex items-center rounded-full border font-mono font-semibold"
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
      </div>

      {/* Counters */}
      <div className="flex items-stretch justify-center" style={{ gap: 18 }}>
        <Counter label="Diteruskan · 200" value={step.allowed} tone={{ border: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text }} />
        <Counter label="Ditolak · 429" value={step.rejected} tone={FAIL} />
        <Counter label="Token tersisa" value={`${step.tokens}/${step.capacity}`} tone={{ border: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text }} />
      </div>
    </div>
  )
}

function ChainBox({
  id,
  active,
  icon: Icon,
  title,
  sub,
}: {
  id: NodeId
  active: boolean
  icon: ({ size }: { size?: number }) => JSX.Element
  title: string
  sub: string
}) {
  const n = NODES[id]
  const st = active ? NODE.active : NODE.idle
  return (
    <motion.div
      className="absolute flex items-center rounded-2xl border-2"
      animate={{ borderColor: st.border, background: active ? st.bg : '#FFFFFF', boxShadow: active ? st.shadow : '0 1px 4px rgba(0,0,0,0.05)', scale: active ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      style={{ left: n.cx - n.w / 2, top: n.cy - n.h / 2, width: n.w, height: n.h, gap: 12, padding: '0 16px' }}
    >
      <motion.span animate={{ color: st.border }} style={{ display: 'flex', flexShrink: 0 }}>
        <Icon size={30} />
      </motion.span>
      <div className="flex flex-col" style={{ gap: 2, minWidth: 0 }}>
        <span className="font-semibold" style={{ fontSize: 22, color: '#211C16', whiteSpace: 'nowrap' }}>
          {title}
        </span>
        <span className="font-mono" style={{ fontSize: 15, color: '#9C8F7B' }}>
          {sub}
        </span>
      </div>
    </motion.div>
  )
}

function GatewayBox({ step, active }: { step: RateStep; active: boolean }) {
  const n = NODES.gw
  const empty = step.tokens === 0
  const st = empty ? FAIL : active ? NODE.active : NODE.idle
  return (
    <motion.div
      className="absolute flex flex-col rounded-2xl border-2"
      animate={{ borderColor: st.border, background: '#FFFDF9', boxShadow: active ? st.shadow : '0 2px 10px rgba(0,0,0,0.06)', scale: active ? 1.02 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      style={{ left: n.cx - n.w / 2, top: n.cy - n.h / 2, width: n.w, height: n.h, padding: '14px 20px', gap: 12 }}
    >
      <div className="flex items-center" style={{ gap: 11 }}>
        <motion.span animate={{ color: empty ? FAIL.border : NODE.info.border }} style={{ display: 'flex', flexShrink: 0 }}>
          <GatewayIcon size={28} />
        </motion.span>
        <span className="font-semibold" style={{ fontSize: 21, color: '#211C16', whiteSpace: 'nowrap' }}>
          API Gateway
        </span>
        <motion.span
          animate={{ background: step.refilling ? NODE.done.bg : '#F1ECE3', color: step.refilling ? NODE.done.text : '#9C8F7B', borderColor: step.refilling ? NODE.done.border : '#E4DCCF' }}
          className="ml-auto rounded-full border font-mono"
          style={{ fontSize: 14, padding: '3px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {step.refilling ? `↑ ${RATE}` : RATE}
        </motion.span>
      </div>

      {/* Token bucket */}
      <div className="flex items-center" style={{ gap: 12 }}>
        <span className="font-mono" style={{ fontSize: 15, color: '#9C8F7B', whiteSpace: 'nowrap' }}>
          bucket
        </span>
        <div className="flex items-center" style={{ gap: 9 }}>
          {Array.from({ length: CAPACITY }).map((_, i) => {
            const filled = i < step.tokens
            return (
              <motion.span
                key={i}
                animate={{
                  background: filled ? '#D97706' : '#FFFFFF',
                  borderColor: filled ? '#B45309' : '#E0D6C5',
                  scale: filled ? 1 : 0.86,
                }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="rounded-full border-2"
                style={{ width: 30, height: 30 }}
              />
            )
          })}
        </div>
      </div>

      <span className="font-mono" style={{ fontSize: 14, color: empty ? FAIL.text : '#9C8F7B', whiteSpace: 'nowrap' }}>
        {empty ? 'bucket kosong → request → 429' : `${step.tokens} token siap dipakai`}
      </span>
    </motion.div>
  )
}

function Counter({ label, value, tone }: { label: string; value: number | string; tone: { border: string; bg: string; text: string } }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2" style={{ width: 240, padding: '12px 18px', borderColor: tone.border, background: tone.bg }}>
      <span className="font-mono font-semibold" style={{ fontSize: 34, color: tone.text }}>
        {value}
      </span>
      <span className="font-mono" style={{ fontSize: 15, color: '#6B6258' }}>
        {label}
      </span>
    </div>
  )
}
