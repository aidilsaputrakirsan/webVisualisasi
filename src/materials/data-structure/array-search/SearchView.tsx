import { motion } from 'framer-motion'
import type { Mode, SearchStep } from './search'
import { NODE } from '../../../shared/theme'

const BOX = 92
const GAP = 18
const STRIDE = BOX + GAP

export default function SearchView({
  array,
  step,
  mode,
}: {
  array: number[]
  step: SearchStep
  mode: Mode
}) {
  const n = array.length
  const totalW = n * BOX + (n - 1) * GAP
  const binary = mode === 'binary'
  const inWindow = (i: number) =>
    step.low === null || step.high === null ? true : i >= step.low && i <= step.high

  return (
    <div className="flex flex-col items-center" style={{ gap: 10 }}>
      {/* index labels */}
      <div className="flex" style={{ gap: GAP }}>
        {array.map((_, i) => (
          <div key={i} className="text-center font-mono" style={{ width: BOX, fontSize: 18, color: '#A89E90' }}>
            {i}
          </div>
        ))}
      </div>

      {/* boxes + range window */}
      <div className="relative" style={{ width: totalW, height: BOX }}>
        {binary && step.low !== null && step.high !== null && step.low <= step.high && (
          <motion.div
            className="absolute rounded-2xl"
            style={{ top: -8, height: BOX + 16, background: 'rgba(217,119,6,0.10)', border: '2px dashed #E0B070', zIndex: 0 }}
            initial={false}
            animate={{ left: step.low * STRIDE - 6, width: (step.high - step.low) * STRIDE + BOX + 12 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          />
        )}

        <div className="absolute inset-0 flex" style={{ gap: GAP }}>
          {array.map((val, i) => {
            const found = step.foundIndex === i
            const active = step.activeIndex === i
            const eliminated = binary && !inWindow(i)
            const checked = !binary && step.checked.includes(i)

            const t = found ? NODE.done : active ? NODE.active : NODE.idle
            const dim = eliminated ? 0.32 : checked ? 0.55 : 1

            return (
              <motion.div
                key={i}
                className="flex items-center justify-center rounded-2xl font-mono font-semibold"
                style={{ width: BOX, height: BOX, fontSize: 34, borderWidth: 3, borderStyle: 'solid', zIndex: 1 }}
                animate={{
                  borderColor: t.border,
                  backgroundColor: t.bg,
                  boxShadow: active || found ? t.shadow : '0 1px 4px rgba(0,0,0,0.05)',
                  color: t.text,
                  opacity: dim,
                  scale: active ? 1.08 : 1,
                }}
                transition={{ scale: { type: 'spring', stiffness: 300, damping: 22 }, default: { duration: 0.28 } }}
              >
                {val}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* pointer row */}
      <div className="flex" style={{ gap: GAP }}>
        {array.map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1" style={{ width: BOX, minHeight: 34 }}>
            {!binary && step.activeIndex === i && <Chip label="i" tone="amber" />}
            {binary && (
              <div className="flex items-center justify-center gap-1">
                {step.low === i && <Chip label="L" tone="blue" />}
                {step.activeIndex === i && <Chip label="mid" tone="amber" />}
                {step.high === i && <Chip label="R" tone="blue" />}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Chip({ label, tone }: { label: string; tone: 'amber' | 'blue' }) {
  const c = tone === 'amber' ? { bg: '#FDEBC8', bd: '#D97706', tx: '#92400E' } : { bg: '#DBEAFE', bd: '#2563EB', tx: '#1E40AF' }
  return (
    <span
      className="rounded-md border font-mono font-semibold"
      style={{ fontSize: 16, padding: '2px 8px', background: c.bg, borderColor: c.bd, color: c.tx }}
    >
      {label}
    </span>
  )
}
