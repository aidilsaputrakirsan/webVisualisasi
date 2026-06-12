import { AnimatePresence, motion } from 'framer-motion'
import { NODE, theme } from '../../../shared/theme'
import { NUMS, TARGET, type SwStep } from './slidingWindow'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

const CELL_W = 118
const CELL_H = 118
const GAP = 16
const N = NUMS.length
const ROW_W = N * CELL_W + (N - 1) * GAP

const cellX = (i: number) => i * (CELL_W + GAP)

/** Visual utama: deret angka dengan jendela [left..right] yang melebar/mengecil. */
export default function WindowView({ step, mode }: { step: SwStep; mode: 'brute' | 'window' }) {
  const hasWindow = step.windowActive && step.right >= step.left
  const inBest = (i: number) =>
    step.bestRange != null && i >= step.bestRange[0] && i <= step.bestRange[1]
  const inWindow = (i: number) => hasWindow && i >= step.left && i <= step.right

  return (
    <div className="flex flex-col items-center" style={{ gap: 34, width: 960 }}>
      {/* Readout: target · jumlah jendela · rekor terpendek */}
      <div className="flex items-stretch justify-center" style={{ gap: 26 }}>
        <Stat label="TARGET" value={`≥ ${TARGET}`} tone="neutral" />
        <SumStat sum={step.sum} meets={step.meets} active={hasWindow} />
        <BestStat best={step.best} range={step.bestRange} />
      </div>

      {/* Deret angka + jendela */}
      <div className="relative" style={{ width: ROW_W, height: CELL_H + 52 }}>
        {/* Pita jendela hidup di belakang sel */}
        <AnimatePresence>
          {hasWindow && (
            <motion.div
              className="absolute rounded-2xl border-2"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                left: cellX(step.left) - 7,
                width: cellX(step.right) - cellX(step.left) + CELL_W + 14,
              }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              style={{
                top: -7,
                height: CELL_H + 14,
                borderColor: step.meets ? NODE.done.border : theme.accent,
                background: step.meets ? NODE.done.bg : theme.accentSoft,
                boxShadow: step.meets ? NODE.done.shadow : NODE.active.shadow,
              }}
            />
          )}
        </AnimatePresence>

        {/* Sel angka */}
        {NUMS.map((v, i) => {
          const active = inWindow(i)
          const best = inBest(i) && !active
          return (
            <div
              key={i}
              className="absolute flex items-center justify-center rounded-2xl border-2 font-mono font-bold"
              style={{
                left: cellX(i),
                top: 0,
                width: CELL_W,
                height: CELL_H,
                fontSize: 52,
                background: 'transparent',
                borderColor: active
                  ? step.meets
                    ? NODE.done.border
                    : theme.accent
                  : best
                    ? NODE.done.border
                    : theme.lineStrong,
                color: active
                  ? step.meets
                    ? NODE.done.text
                    : theme.accentDeep
                  : best
                    ? NODE.done.text
                    : theme.inkSoft,
                opacity: hasWindow && !active && !best ? 0.5 : 1,
              }}
            >
              {v}
              <span
                className="absolute font-mono"
                style={{ bottom: -30, fontSize: 18, color: theme.inkFaint, fontWeight: 400 }}
              >
                {i}
              </span>
            </div>
          )
        })}

        {/* Penunjuk left / right */}
        <Pointer label={mode === 'brute' ? 'start' : 'L'} index={step.left} color={theme.accentDeep} />
        {step.right >= 0 && (
          <Pointer label={mode === 'brute' ? 'end' : 'R'} index={step.right} color={theme.ink} />
        )}
      </div>

      {/* Meteran operasi — bukti O(n) vs O(n²) */}
      <OpMeter ops={step.ops} mode={mode} />
    </div>
  )
}

function Pointer({ label, index, color }: { label: string; index: number; color: string }) {
  return (
    <motion.div
      className="absolute flex flex-col items-center"
      animate={{ left: cellX(index) + CELL_W / 2 - 26 }}
      transition={SPRING}
      style={{ top: CELL_H + 8, width: 52 }}
    >
      <span
        className="rounded-md border px-2 font-mono font-semibold"
        style={{ fontSize: 17, color, borderColor: color, background: theme.surface }}
      >
        {label}
      </span>
    </motion.div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'neutral' }) {
  void tone
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border"
      style={{ width: 220, height: 132, gap: 8, borderColor: theme.line, background: theme.surface }}
    >
      <SectionLabel>{label}</SectionLabel>
      <span className="font-mono font-bold" style={{ fontSize: 46, color: theme.ink }}>
        {value}
      </span>
    </div>
  )
}

function SumStat({ sum, meets, active }: { sum: number; meets: boolean; active: boolean }) {
  const lit = active
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border-2"
      style={{
        width: 260,
        height: 132,
        gap: 6,
        borderColor: lit ? (meets ? NODE.done.border : theme.accent) : theme.line,
        background: lit ? (meets ? NODE.done.bg : theme.accentSoft) : theme.surface,
        boxShadow: lit ? (meets ? NODE.done.shadow : NODE.active.shadow) : 'none',
      }}
    >
      <SectionLabel>WINDOW SUM</SectionLabel>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={sum}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={SPRING}
          className="font-mono font-bold"
          style={{
            fontSize: 54,
            lineHeight: 1,
            color: lit ? (meets ? NODE.done.text : theme.accentDeep) : theme.inkFaint,
          }}
        >
          {sum}
        </motion.span>
      </AnimatePresence>
      <span className="font-mono" style={{ fontSize: 17, color: meets ? NODE.done.text : theme.inkFaint }}>
        {meets ? `≥ ${TARGET} ✓` : `< ${TARGET}`}
      </span>
    </div>
  )
}

function BestStat({ best, range }: { best: number | null; range: [number, number] | null }) {
  const values = range ? NUMS.slice(range[0], range[1] + 1) : null
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border"
      style={{ width: 240, height: 132, gap: 8, borderColor: theme.line, background: theme.surface }}
    >
      <SectionLabel>SHORTEST</SectionLabel>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={best ?? 'none'}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={SPRING}
          className="flex flex-col items-center"
          style={{ gap: 4 }}
        >
          <span
            className="font-mono font-bold"
            style={{ fontSize: 46, lineHeight: 1, color: best != null ? NODE.done.text : theme.inkFaint }}
          >
            {best != null ? `len ${best}` : '—'}
          </span>
          {values && (
            <span className="font-mono" style={{ fontSize: 18, color: theme.inkSoft }}>
              [{values.join(', ')}]
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/** Penghitung operasi "+=" — kecil tapi memperlihatkan kontras biaya. */
function OpMeter({ ops, mode }: { ops: number; mode: 'brute' | 'window' }) {
  return (
    <div className="flex items-center" style={{ gap: 14 }}>
      <SectionLabel>OPS +=</SectionLabel>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={ops}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={SPRING}
          className="font-mono font-bold"
          style={{
            fontSize: 30,
            color: mode === 'brute' ? '#DB2777' : NODE.done.border,
          }}
        >
          {ops}
        </motion.span>
      </AnimatePresence>
      <span className="font-mono" style={{ fontSize: 18, color: theme.inkFaint }}>
        {mode === 'brute' ? '· recomputing (O(n²))' : '· each element once (O(n))'}
      </span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono tracking-widest" style={{ fontSize: 17, color: theme.inkFaint }}>
      {children}
    </span>
  )
}
