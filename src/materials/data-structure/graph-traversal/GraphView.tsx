import { motion } from 'framer-motion'
import { EDGES, GRAPH_H, GRAPH_W, NODE_R, VERTICES, vertex } from './graph'
import type { GraphStep } from './traversal'
import { NODE, EDGE } from '../../../shared/theme'

type VState = 'active' | 'output' | 'frontier' | 'idle'

function stateOf(step: GraphStep, id: string): VState {
  if (step.activeId === id) return 'active'
  if (step.output.includes(id)) return 'output'
  if (step.frontier.includes(id)) return 'frontier'
  return 'idle'
}

const COLORS: Record<VState, { border: string; bg: string; shadow: string; text: string }> = {
  active: NODE.active,
  output: NODE.done,
  frontier: NODE.info,
  idle: NODE.idle,
}

export default function GraphView({ step }: { step: GraphStep }) {
  const active = step.activeId
  const considering = step.consideringId

  const isWalkEdge = (a: string, b: string) =>
    (a === active && b === considering) || (a === considering && b === active)

  return (
    <div className="relative" style={{ width: GRAPH_W, height: GRAPH_H }}>
      <svg className="absolute inset-0" width={GRAPH_W} height={GRAPH_H}>
        {EDGES.map(([u, w]) => {
          const a = vertex(u)
          const b = vertex(w)
          const walking = isWalkEdge(u, w)
          const done = step.output.includes(u) && step.output.includes(w)
          const stroke = walking ? EDGE.active : done ? EDGE.done : EDGE.idle
          return (
            <motion.line
              key={`${u}-${w}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              strokeLinecap="round"
              animate={{ stroke, strokeWidth: walking ? 7 : 4 }}
              transition={{ duration: 0.25 }}
            />
          )
        })}
      </svg>

      {/* Pointer ring — always mounted, fades when no active vertex. */}
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
            ? { opacity: 1, scale: 1, left: vertex(active).x, top: vertex(active).y }
            : { opacity: 0, scale: 0.6 }
        }
        transition={{
          left: { type: 'spring', stiffness: 260, damping: 26 },
          top: { type: 'spring', stiffness: 260, damping: 26 },
          opacity: { duration: 0.25 },
          scale: { duration: 0.25 },
        }}
      />

      {VERTICES.map((v) => {
        const s = COLORS[stateOf(step, v.id)]
        return (
          <motion.div
            key={v.id}
            className="absolute flex items-center justify-center rounded-full font-mono font-bold"
            style={{
              left: v.x - NODE_R,
              top: v.y - NODE_R,
              width: NODE_R * 2,
              height: NODE_R * 2,
              fontSize: 32,
              borderWidth: 3,
              borderStyle: 'solid',
              zIndex: 5,
            }}
            animate={{
              borderColor: s.border,
              backgroundColor: s.bg,
              boxShadow: s.shadow,
              color: s.text,
              scale: step.activeId === v.id ? 1.12 : 1,
            }}
            transition={{ scale: { type: 'spring', stiffness: 300, damping: 22 }, default: { duration: 0.28 } }}
          >
            {v.id}
          </motion.div>
        )
      })}
    </div>
  )
}
