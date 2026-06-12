import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../palette'
import { NODES, QUEUE_BOX, edgeBetween, edgesFor, type QueueStep, type Tone } from './queue'
import { BrowserIcon, CardIcon, CartIcon, MailIcon, TrayIcon } from './Icons'

const BOARD_W = 860
const BOARD_H = 540

const FAIL = { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B', shadow: '0 4px 18px rgba(220,38,38,0.22)' }
const PUBLISH = { stroke: '#7C3AED', bg: '#EDE9FE', text: '#5B21B6' }

const TONE: Record<Tone, { stroke: string; bg: string; text: string }> = {
  request: { stroke: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text },
  response: { stroke: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text },
  publish: PUBLISH,
  consume: { stroke: NODE.info.border, bg: NODE.info.bg, text: NODE.info.text },
  fail: { stroke: FAIL.border, bg: FAIL.bg, text: FAIL.text },
}

const NODE_ICON = {
  fe: BrowserIcon,
  order: CartIcon,
  pay: CardIcon,
} as const

const PAY_STATE = {
  up: { label: 'UP', dot: '#15803D', bg: '#DCFCE7', text: '#166534' },
  busy: { label: 'BUSY', dot: '#6D45D9', bg: '#ECE6FB', text: '#4326A0' },
  down: { label: 'DOWN', dot: '#DC2626', bg: '#FEE2E2', text: '#991B1B' },
} as const

const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const

export default function QueueView({
  step,
  stepKey,
  showQueue,
}: {
  step: QueueStep
  stepKey: number
  showQueue: boolean
}) {
  const edges = edgesFor(showQueue)
  const active = new Set(step.activeNodes)
  const activeEdge = step.packet ? edgeBetween(edges, step.packet.from, step.packet.to) : undefined
  const tone = step.packet ? TONE[step.packet.tone] : null

  const pts = (() => {
    if (!step.packet || !activeEdge) return null
    const fromIsA = activeEdge.a === step.packet.from
    return {
      sx: fromIsA ? activeEdge.ax : activeEdge.bx,
      sy: fromIsA ? activeEdge.ay : activeEdge.by,
      tx: fromIsA ? activeEdge.bx : activeEdge.ax,
      ty: fromIsA ? activeEdge.by : activeEdge.ay,
    }
  })()

  return (
    <div className="relative" style={{ width: BOARD_W, height: BOARD_H }}>
      {/* Edges */}
      <svg width={BOARD_W} height={BOARD_H} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        {edges.map((e, i) => {
          const isActive = activeEdge === e
          const color = isActive ? (tone?.stroke ?? NODE.active.border) : '#C7CADD'
          return (
            <motion.line
              key={`${e.a}-${e.b}-${i}`}
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

      {/* Edge hint labels */}
      {showQueue ? (
        <>
          <EdgeLabel x={452} y={226} text="publish ↓" />
          <EdgeLabel x={452} y={390} text="consume ↓" />
        </>
      ) : (
        <EdgeLabel x={452} y={308} text="HTTP · blocking" />
      )}

      {/* Service nodes */}
      {Object.values(NODES).map((n) => {
        const isPay = n.id === 'pay'
        let st = active.has(n.id) ? NODE.active : NODE.idle
        if (isPay && step.payState === 'down') st = FAIL
        else if (isPay && step.payState === 'busy') st = NODE.active
        const lit = st !== NODE.idle
        const Icon = NODE_ICON[n.id as keyof typeof NODE_ICON]
        const pay = PAY_STATE[step.payState]
        return (
          <motion.div
            key={n.id}
            className="absolute flex items-center rounded-2xl border-2"
            animate={{
              borderColor: st.border,
              background: lit ? st.bg : '#FFFFFF',
              boxShadow: lit ? st.shadow : '0 1px 4px rgba(30,34,58,0.06)',
              scale: lit ? 1.04 : 1,
            }}
            transition={SPRING}
            style={{
              left: n.cx - n.w / 2,
              top: n.cy - n.h / 2,
              width: n.w,
              height: n.h,
              gap: 12,
              padding: '0 18px',
            }}
          >
            <motion.span animate={{ color: st.border }} style={{ display: 'flex', flexShrink: 0 }}>
              <Icon size={30} />
            </motion.span>
            <div className="flex flex-col" style={{ gap: 2, minWidth: 0 }}>
              <span className="font-semibold" style={{ fontSize: 22, color: '#20243A', whiteSpace: 'nowrap' }}>
                {n.label}
              </span>
              <span className="font-mono" style={{ fontSize: 16, color: '#9FA3BC', whiteSpace: 'nowrap' }}>
                {n.sub}
              </span>
            </div>
            {isPay && (
              <motion.span
                className="ml-auto flex items-center rounded-full font-mono"
                animate={{ background: pay.bg, color: pay.text }}
                style={{ gap: 7, padding: '4px 12px', fontSize: 14, flexShrink: 0 }}
              >
                <motion.span
                  className="rounded-full"
                  animate={{ background: pay.dot, opacity: step.payState === 'down' ? [1, 0.35, 1] : 1 }}
                  transition={step.payState === 'down' ? { repeat: Infinity, duration: 1.2 } : undefined}
                  style={{ width: 9, height: 9 }}
                />
                {pay.label}
              </motion.span>
            )}
          </motion.div>
        )
      })}

      {/* Queue / broker box with message slots */}
      {showQueue && (
        <motion.div
          className="absolute flex items-center rounded-2xl border-2"
          animate={{
            borderColor: active.has('queue') ? NODE.active.border : NODE.idle.border,
            boxShadow: active.has('queue') ? NODE.active.shadow : NODE.idle.shadow,
          }}
          transition={SPRING}
          style={{
            left: QUEUE_BOX.cx - QUEUE_BOX.w / 2,
            top: QUEUE_BOX.cy - QUEUE_BOX.h / 2,
            width: QUEUE_BOX.w,
            height: QUEUE_BOX.h,
            gap: 16,
            padding: '0 20px',
            background: '#FFFFFF',
          }}
        >
          <motion.span
            animate={{ color: active.has('queue') ? NODE.active.border : NODE.idle.border }}
            style={{ display: 'flex', flexShrink: 0 }}
          >
            <TrayIcon size={30} />
          </motion.span>
          <div className="flex flex-col" style={{ gap: 2, width: 152, flexShrink: 0 }}>
            <span className="font-semibold" style={{ fontSize: 19, color: '#20243A', whiteSpace: 'nowrap' }}>
              Message Queue
            </span>
            <span className="font-mono" style={{ fontSize: 14, color: '#9FA3BC' }}>
              RabbitMQ · FIFO
            </span>
          </div>

          <div className="relative" style={{ width: 396, height: 56 }}>
            {/* empty slots (decoration) */}
            <div className="absolute inset-0 flex items-center" style={{ gap: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border-2 border-dashed"
                  style={{ width: 90, height: 52, borderColor: '#DDDFEC', flexShrink: 0 }}
                />
              ))}
            </div>
            {/* queued messages (head = leftmost) */}
            <div className="absolute inset-0 flex items-center" style={{ gap: 12 }}>
              <AnimatePresence>
                {step.queued.map((m) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, scale: 0.6, y: -28 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.6, y: 30 }}
                    transition={SPRING}
                    className="flex items-center justify-center rounded-xl border-2 font-mono font-semibold"
                    style={{
                      width: 90,
                      height: 52,
                      gap: 8,
                      fontSize: 19,
                      flexShrink: 0,
                      borderColor: PUBLISH.stroke,
                      background: PUBLISH.bg,
                      color: PUBLISH.text,
                    }}
                  >
                    <MailIcon size={17} />
                    {m.label}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* "Order menunggu" chip (sync blocking) */}
      <AnimatePresence>
        {step.waiting && (
          <motion.div
            className="absolute flex items-center rounded-full border font-mono"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [1, 0.45, 1], scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ opacity: { repeat: Infinity, duration: 1.1 } }}
            style={{
              left: 578,
              top: 160,
              gap: 7,
              padding: '5px 14px',
              fontSize: 16,
              whiteSpace: 'nowrap',
              borderColor: '#D97706',
              background: '#FDEBC8',
              color: '#92400E',
            }}
          >
            menunggu jawaban…
          </motion.div>
        )}
      </AnimatePresence>

      {/* "checkout gagal" chip near the user */}
      <AnimatePresence>
        {step.failed && (
          <motion.div
            className="absolute flex items-center rounded-full border font-mono"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              left: 572,
              top: 33,
              padding: '5px 14px',
              fontSize: 16,
              whiteSpace: 'nowrap',
              borderColor: FAIL.border,
              background: FAIL.bg,
              color: FAIL.text,
            }}
          >
            ✕ checkout gagal
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed orders next to Payment */}
      <div className="absolute flex items-center" style={{ left: 612, top: 448, gap: 7 }}>
        <AnimatePresence>
          {step.processed.map((label) => (
            <motion.span
              key={label}
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={SPRING}
              className="rounded-full border font-mono"
              style={{
                padding: '5px 12px',
                fontSize: 16,
                whiteSpace: 'nowrap',
                borderColor: NODE.done.border,
                background: NODE.done.bg,
                color: NODE.done.text,
              }}
            >
              ✓ {label}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

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
            {(step.packet.tone === 'publish' || step.packet.tone === 'consume') && <MailIcon size={16} />}
            {step.packet.tag}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EdgeLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <div className="absolute font-mono" style={{ left: x, top: y, fontSize: 14, color: '#9FA3BC', whiteSpace: 'nowrap' }}>
      {text}
    </div>
  )
}
