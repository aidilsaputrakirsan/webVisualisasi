import { motion } from 'framer-motion'
import { EDGES, NODE_R, TREE, TREE_H, TREE_W, node } from './tree'
import type { TreeStep } from './traversal'
import { NODE, EDGE } from '../../../shared/theme'

type NodeState = 'active' | 'visited' | 'queued' | 'idle'

function stateOf(step: TreeStep, id: number): NodeState {
  if (step.activeId === id) return 'active'
  if (step.visited.includes(id)) return 'visited'
  if (step.queued.includes(id)) return 'queued'
  return 'idle'
}

const COLORS: Record<NodeState, { border: string; bg: string; shadow: string; text: string }> = {
  active: NODE.active,
  visited: NODE.done,
  queued: NODE.info,
  idle: NODE.idle,
}

export default function TreeView({
  step,
  activeEdge,
}: {
  step: TreeStep
  activeEdge: [number, number] | null
}) {
  const active = step.activeId !== null ? node(step.activeId) : null

  const isActiveEdge = (from: number, to: number) =>
    activeEdge !== null &&
    ((activeEdge[0] === from && activeEdge[1] === to) ||
      (activeEdge[0] === to && activeEdge[1] === from))

  return (
    <div className="relative" style={{ width: TREE_W, height: TREE_H }}>
      {/* Edges sit behind the nodes. The edge the pointer is walking glows amber;
          an edge turns green once both endpoints have been visited. */}
      <svg className="absolute inset-0" width={TREE_W} height={TREE_H}>
        {EDGES.map(({ from, to }) => {
          const a = node(from)
          const b = node(to)
          const walking = isActiveEdge(from, to)
          const done = step.visited.includes(from) && step.visited.includes(to)
          const stroke = walking ? EDGE.active : done ? EDGE.done : EDGE.idle
          return (
            <motion.line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              strokeLinecap="round"
              animate={{
                stroke,
                strokeWidth: walking ? 7 : 4,
                filter: walking ? 'drop-shadow(0 0 8px rgba(245,158,11,0.9))' : 'none',
              }}
              transition={{ duration: 0.25 }}
            />
          )
        })}
      </svg>

      {/* Traveling pointer: a hollow glowing ring (halo) that slides between
          nodes along the edges, making the recursion/BFS walk visible. It is
          always mounted — when there is no active node it just fades out in
          place, so it never jumps to the corner. */}
      <motion.div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: NODE_R * 2 + 18,
          height: NODE_R * 2 + 18,
          marginLeft: -(NODE_R + 9),
          marginTop: -(NODE_R + 9),
          border: '3px solid #D97706',
          background: 'transparent',
          boxShadow: '0 4px 16px rgba(217,119,6,0.35)',
          zIndex: 4,
        }}
        initial={false}
        animate={
          active
            ? { opacity: 1, scale: 1, left: active.x, top: active.y }
            : { opacity: 0, scale: 0.6 }
        }
        transition={{
          left: { type: 'spring', stiffness: 260, damping: 26 },
          top: { type: 'spring', stiffness: 260, damping: 26 },
          opacity: { duration: 0.25 },
          scale: { duration: 0.25 },
        }}
      />

      {TREE.map((n) => {
        const s = COLORS[stateOf(step, n.id)]
        return (
          <motion.div
            key={n.id}
            className="absolute flex items-center justify-center rounded-full font-mono font-bold"
            style={{
              left: n.x - NODE_R,
              top: n.y - NODE_R,
              width: NODE_R * 2,
              height: NODE_R * 2,
              fontSize: 34,
              borderWidth: 3,
              borderStyle: 'solid',
            }}
            animate={{
              borderColor: s.border,
              backgroundColor: s.bg,
              boxShadow: s.shadow,
              color: s.text,
              scale: step.activeId === n.id ? 1.12 : 1,
            }}
            transition={{
              scale: { type: 'spring', stiffness: 300, damping: 22 },
              default: { duration: 0.28 },
            }}
          >
            {n.value}
          </motion.div>
        )
      })}
    </div>
  )
}
