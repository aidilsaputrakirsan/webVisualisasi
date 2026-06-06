import { AnimatePresence, motion } from 'framer-motion'
import { NODE_R, TREE_AREA_H, TREE_AREA_W } from './bst'
import type { BstStep } from './operations'
import { NODE, EDGE } from '../../../shared/theme'

type NodeState = 'highlight' | 'active' | 'path' | 'idle'

const COLORS: Record<NodeState, { border: string; bg: string; shadow: string; text: string }> = {
  highlight: NODE.done,
  active: NODE.active,
  path: NODE.info,
  idle: NODE.idle,
}

function stateOf(step: BstStep, id: number): NodeState {
  if (step.highlightId === id) return 'highlight'
  if (step.activeId === id) return 'active'
  if (step.path.includes(id)) return 'path'
  return 'idle'
}

const POS_SPRING = { type: 'spring', stiffness: 210, damping: 24 } as const

export default function BstTreeView({ step }: { step: BstStep }) {
  const byId = new Map(step.nodes.map((n) => [n.id, n]))
  const active = step.activeId !== null ? byId.get(step.activeId) : undefined

  return (
    <div className="relative" style={{ width: TREE_AREA_W, height: TREE_AREA_H }}>
      {/* Edges */}
      <svg className="absolute inset-0" width={TREE_AREA_W} height={TREE_AREA_H}>
        {step.nodes.map((n) =>
          [n.left, n.right].map((childId) => {
            if (childId === null) return null
            const c = byId.get(childId)
            if (!c) return null
            const onPath = step.path.includes(n.id) && step.path.includes(childId)
            return (
              <motion.line
                key={`${n.id}-${childId}`}
                initial={false}
                animate={{ x1: n.x, y1: n.y, x2: c.x, y2: c.y, stroke: onPath ? EDGE.active : EDGE.idle }}
                strokeWidth={4}
                strokeLinecap="round"
                transition={POS_SPRING}
              />
            )
          }),
        )}
      </svg>

      {/* Traveling pointer ring (hollow, so the value stays readable). Always
          mounted; fades out in place when there is no active node so it never
          jumps to the corner. */}
      <motion.div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: NODE_R * 2 + 18,
          height: NODE_R * 2 + 18,
          marginLeft: -(NODE_R + 9),
          marginTop: -(NODE_R + 9),
          border: '3px solid #D97706',
          boxShadow: '0 4px 16px rgba(217,119,6,0.35)',
          zIndex: 4,
        }}
        initial={false}
        animate={
          active
            ? { opacity: 1, scale: 1, left: active.x, top: active.y }
            : { opacity: 0, scale: 0.6 }
        }
        transition={{ left: POS_SPRING, top: POS_SPRING, opacity: { duration: 0.25 }, scale: { duration: 0.25 } }}
      />

      {/* Nodes */}
      <AnimatePresence>
        {step.nodes.map((n) => {
          const s = COLORS[stateOf(step, n.id)]
          return (
            <motion.div
              key={n.id}
              className="absolute flex items-center justify-center rounded-full font-mono font-bold"
              style={{
                marginLeft: -NODE_R,
                marginTop: -NODE_R,
                width: NODE_R * 2,
                height: NODE_R * 2,
                fontSize: 30,
                borderWidth: 3,
                borderStyle: 'solid',
                zIndex: 5,
              }}
              initial={{ opacity: 0, scale: 0, left: n.x, top: n.y }}
              animate={{
                opacity: 1,
                scale: step.activeId === n.id || step.highlightId === n.id ? 1.1 : 1,
                left: n.x,
                top: n.y,
                borderColor: s.border,
                backgroundColor: s.bg,
                boxShadow: s.shadow,
                color: s.text,
              }}
              exit={{ opacity: 0, scale: 0, left: n.x, top: n.y }}
              transition={{
                left: POS_SPRING,
                top: POS_SPRING,
                scale: { type: 'spring', stiffness: 300, damping: 20 },
                default: { duration: 0.28 },
              }}
            >
              {n.value}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
