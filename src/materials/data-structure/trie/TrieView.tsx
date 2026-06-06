import { AnimatePresence, motion } from 'framer-motion'
import { NODE_R, TRIE_H, TRIE_W, type TrieStep } from './trie'
import { NODE } from '../../../shared/theme'

type State = 'result' | 'active' | 'path' | 'idle'

const COLORS: Record<State, { border: string; bg: string; shadow: string; text: string }> = {
  result: NODE.done,
  active: NODE.active,
  path: NODE.info,
  idle: NODE.idle,
}

const SPRING = { type: 'spring', stiffness: 220, damping: 26 } as const

export default function TrieView({ step }: { step: TrieStep }) {
  const byId = new Map(step.nodes.map((n) => [n.id, n]))
  const active = step.activeId !== null ? byId.get(step.activeId) : undefined

  function stateOf(id: number): State {
    if (step.resultIds.includes(id) || step.createdId === id) return 'result'
    if (step.activeId === id) return 'active'
    if (step.pathIds.includes(id)) return 'path'
    return 'idle'
  }

  return (
    <div className="relative" style={{ width: TRIE_W, height: TRIE_H }}>
      {/* edges */}
      <svg className="absolute inset-0" width={TRIE_W} height={TRIE_H}>
        {step.nodes.map((n) => {
          if (n.parent === null) return null
          const p = byId.get(n.parent)
          if (!p) return null
          const onPath = step.pathIds.includes(n.id) && step.pathIds.includes(n.parent)
          return (
            <motion.line
              key={`${n.parent}-${n.id}`}
              initial={false}
              animate={{ x1: p.x, y1: p.y, x2: n.x, y2: n.y, stroke: onPath ? '#60a5fa' : '#D3C8B6' }}
              strokeWidth={3}
              strokeLinecap="round"
              transition={SPRING}
            />
          )
        })}
      </svg>

      {/* pointer ring */}
      <motion.div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: NODE_R * 2 + 16,
          height: NODE_R * 2 + 16,
          marginLeft: -(NODE_R + 8),
          marginTop: -(NODE_R + 8),
          border: '3px solid #D97706',
          boxShadow: '0 4px 16px rgba(217,119,6,0.35)',
          zIndex: 4,
        }}
        initial={false}
        animate={active ? { opacity: 1, scale: 1, left: active.x, top: active.y } : { opacity: 0, scale: 0.6 }}
        transition={{ left: SPRING, top: SPRING, opacity: { duration: 0.25 }, scale: { duration: 0.25 } }}
      />

      {/* nodes */}
      <AnimatePresence>
        {step.nodes.map((n) => {
          const s = COLORS[stateOf(n.id)]
          const isRoot = n.parent === null
          return (
            <motion.div
              key={n.id}
              className="absolute flex items-center justify-center rounded-full font-mono font-bold"
              style={{ width: NODE_R * 2, height: NODE_R * 2, marginLeft: -NODE_R, marginTop: -NODE_R, fontSize: isRoot ? 16 : 30, borderWidth: 3, borderStyle: 'solid', zIndex: 5 }}
              initial={{ opacity: 0, scale: 0, left: n.x, top: n.y }}
              animate={{
                opacity: 1,
                scale: step.activeId === n.id || step.createdId === n.id ? 1.12 : 1,
                left: n.x,
                top: n.y,
                borderColor: isRoot ? '#9C8F7B' : s.border,
                backgroundColor: isRoot ? '#EFE7D8' : s.bg,
                boxShadow: s.shadow,
                color: isRoot ? '#6B6258' : s.text,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ left: SPRING, top: SPRING, scale: { type: 'spring', stiffness: 300, damping: 20 }, default: { duration: 0.28 } }}
            >
              {isRoot ? 'root' : n.char}
              {n.isEnd && (
                <span
                  className="absolute flex items-center justify-center rounded-full font-bold"
                  style={{ right: -6, bottom: -6, width: 24, height: 24, fontSize: 15, background: '#15803D', color: '#fff', border: '2px solid #FAF7F2' }}
                >
                  ✓
                </span>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
