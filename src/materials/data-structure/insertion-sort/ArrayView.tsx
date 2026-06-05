import { motion } from 'framer-motion'
import type { Step } from './types'

interface Props {
  step: Step
}

type CellState = 'sorted' | 'key' | 'comparing' | 'idle'

function classify(step: Step, cellId: number, index: number): CellState {
  if (cellId === step.keyId) return 'key'
  if (cellId === step.comparingId) return 'comparing'
  if (index < step.sortedCount) return 'sorted'
  return 'idle'
}

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

export default function ArrayView({ step }: Props) {
  // Shrink the boxes a little when the array is long so up to 12 still fit the
  // 1080-wide canvas comfortably.
  const n = step.cells.length
  const size = n > 10 ? 76 : n > 8 ? 84 : 92
  const gap = n > 10 ? 14 : 18

  return (
    <div className="flex items-end justify-center" style={{ gap }}>
      {step.cells.map((cell, index) => {
        const state = classify(step, cell.id, index)
        return (
          <motion.div
            key={cell.id}
            layout
            transition={SPRING}
            className="relative flex flex-col items-center"
          >
            <Box value={cell.value} state={state} size={size} />
          </motion.div>
        )
      })}
    </div>
  )
}

function Box({ value, state, size }: { value: number; state: CellState; size: number }) {
  const styles: Record<CellState, { border: string; bg: string; shadow: string; color: string }> = {
    sorted: {
      border: '#22c55e',
      bg: 'rgba(34,197,94,0.12)',
      shadow: '0 0 26px rgba(34,197,94,0.55), 0 0 6px rgba(34,197,94,0.9)',
      color: '#bbf7d0',
    },
    key: {
      border: '#f59e0b',
      bg: 'rgba(245,158,11,0.10)',
      shadow: '0 0 34px rgba(245,158,11,0.6), 0 0 8px rgba(245,158,11,0.95)',
      color: '#fde68a',
    },
    comparing: {
      border: '#60a5fa',
      bg: 'rgba(96,165,250,0.10)',
      shadow: '0 0 24px rgba(96,165,250,0.45)',
      color: '#bfdbfe',
    },
    idle: {
      border: '#27272a',
      bg: 'rgba(255,255,255,0.02)',
      shadow: 'none',
      color: '#a1a1aa',
    },
  }

  const s = styles[state]

  return (
    <motion.div
      className="flex items-center justify-center rounded-2xl font-mono font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        borderWidth: 3,
        borderStyle: 'solid',
      }}
      animate={{
        borderColor: s.border,
        backgroundColor: s.bg,
        boxShadow: s.shadow,
        color: s.color,
        // The key box lifts up while it is being inserted.
        y: state === 'key' ? -30 : 0,
        scale: state === 'key' ? 1.07 : 1,
      }}
      transition={{
        borderColor: { duration: 0.25 },
        backgroundColor: { duration: 0.25 },
        boxShadow: { duration: 0.25 },
        color: { duration: 0.25 },
        y: { type: 'spring', stiffness: 300, damping: 30 },
        scale: { type: 'spring', stiffness: 300, damping: 30 },
      }}
    >
      {value}
    </motion.div>
  )
}
