import { motion } from 'framer-motion'
import type { SortStep } from './sorting'
import { NODE } from '../../../shared/theme'

const BAR_W = 92
const GAP = 20
const MAX_H = 320
const BASE_H = 60

type BarState = 'compare' | 'min' | 'sorted' | 'idle'

const COLORS: Record<BarState, { border: string; bg: string; text: string }> = {
  compare: { border: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text },
  min: { border: NODE.info.border, bg: NODE.info.bg, text: NODE.info.text },
  sorted: { border: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text },
  idle: { border: NODE.idle.border, bg: NODE.idle.bg, text: NODE.idle.text },
}

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

export default function SortView({ step }: { step: SortStep }) {
  const n = step.cells.length
  const max = Math.max(...step.cells.map((c) => c.value))

  function stateOf(id: number, index: number): BarState {
    if (step.compareIds.includes(id)) return 'compare'
    if (step.minId === id) return 'min'
    if (index < step.sortedLeft || index >= n - step.sortedRight) return 'sorted'
    return 'idle'
  }

  return (
    <div className="flex items-end justify-center" style={{ gap: GAP, height: MAX_H + 20 }}>
      {step.cells.map((cell, index) => {
        const s = COLORS[stateOf(cell.id, index)]
        const h = BASE_H + (cell.value / max) * (MAX_H - BASE_H)
        return (
          <motion.div
            key={cell.id}
            layout
            transition={SPRING}
            className="flex flex-col items-center justify-end"
          >
            <motion.div
              className="flex items-start justify-center rounded-t-xl rounded-b-md font-mono font-bold"
              style={{ width: BAR_W, borderWidth: 3, borderStyle: 'solid', paddingTop: 10, fontSize: 28 }}
              animate={{ height: h, borderColor: s.border, backgroundColor: s.bg, color: s.text }}
              transition={{ height: SPRING, default: { duration: 0.28 } }}
            >
              {cell.value}
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}
