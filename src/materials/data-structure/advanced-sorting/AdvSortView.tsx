import { motion } from 'framer-motion'
import type { AdvStep } from './sorting'
import { NODE } from '../../../shared/theme'

const BOX = 84
const GAP = 16
const STRIDE = BOX + GAP
const MAX_H = 300
const BASE_H = 54

const PIVOT = { border: '#7C3AED', bg: '#EDE9FE', text: '#5B21B6' }
const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

export default function AdvSortView({ step }: { step: AdvStep }) {
  const n = step.cells.length
  const max = Math.max(...step.cells.map((c) => c.value))
  const totalW = n * BOX + (n - 1) * GAP

  function styleOf(id: number, index: number) {
    if (step.sorted.includes(index)) return NODE.done
    if (step.pivotId === id) return PIVOT
    if (step.compareIds.includes(id)) return NODE.active
    return NODE.idle
  }

  return (
    <div className="flex flex-col items-center" style={{ gap: 10 }}>
      {/* bars + range bracket */}
      <div className="relative" style={{ width: totalW, height: MAX_H + 20 }}>
        {step.rangeLo !== null && step.rangeHi !== null && (
          <motion.div
            className="absolute rounded-2xl"
            style={{ bottom: -8, top: -8, background: 'rgba(217,119,6,0.08)', border: '2px dashed #E0B070', zIndex: 0 }}
            initial={false}
            animate={{ left: step.rangeLo * STRIDE - 6, width: (step.rangeHi - step.rangeLo) * STRIDE + BOX + 12 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          />
        )}

        <div className="absolute inset-0 flex items-end" style={{ gap: GAP }}>
          {step.cells.map((cell, index) => {
            const s = styleOf(cell.id, index)
            const h = BASE_H + (cell.value / max) * (MAX_H - BASE_H)
            const emphasized = step.compareIds.includes(cell.id) || step.pivotId === cell.id
            return (
              <motion.div key={cell.id} layout transition={SPRING} className="flex items-end justify-center" style={{ zIndex: 1 }}>
                <motion.div
                  className="flex items-start justify-center rounded-t-xl rounded-b-md font-mono font-bold"
                  style={{ width: BOX, borderWidth: 3, borderStyle: 'solid', paddingTop: 8, fontSize: 26 }}
                  animate={{
                    height: h,
                    borderColor: s.border,
                    backgroundColor: s.bg,
                    color: s.text,
                    boxShadow: emphasized ? '0 4px 16px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                  transition={{ height: SPRING, default: { duration: 0.28 } }}
                >
                  {cell.value}
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* pointer chips */}
      <div className="flex" style={{ gap: GAP }}>
        {step.cells.map((_, index) => (
          <div key={index} className="flex justify-center" style={{ width: BOX, minHeight: 28 }}>
            {step.pointers[index] && (
              <span
                className="rounded-md border font-mono font-semibold"
                style={{
                  fontSize: 15,
                  padding: '1px 7px',
                  background: step.pointers[index] === 'pivot' ? PIVOT.bg : '#FDEBC8',
                  borderColor: step.pointers[index] === 'pivot' ? PIVOT.border : '#D97706',
                  color: step.pointers[index] === 'pivot' ? PIVOT.text : '#92400E',
                }}
              >
                {step.pointers[index]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
