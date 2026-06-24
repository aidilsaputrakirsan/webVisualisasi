import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../palette'
import { ArrowDownIcon, FileIcon, FingerprintIcon, HashIcon } from '../Icons'
import type { HashStep, Property } from './hashing'

const BOARD_W = 900
const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const

const PROPS: { key: Exclude<Property, null>; label: string }[] = [
  { key: 'deterministic', label: 'Selalu sama' },
  { key: 'fixed', label: 'Ukuran tetap' },
  { key: 'avalanche', label: 'Efek longsor' },
  { key: 'oneway', label: 'Satu arah' },
]

/** A faint conduit + arrow between two stages; lit while data flows. */
function Conduit({ lit }: { lit: boolean }) {
  return (
    <motion.span
      animate={{ color: lit ? NODE.active.border : NODE.idle.border }}
      transition={SPRING}
      style={{ display: 'flex' }}
    >
      <ArrowDownIcon size={34} />
    </motion.span>
  )
}

export default function HashingView({ step }: { step: HashStep }) {
  const feeding = step.phase === 'feed'
  const computing = step.phase === 'compute'
  const hasResult = step.phase === 'result' && step.digest

  return (
    <div className="flex flex-col items-center" style={{ width: BOARD_W, gap: 14 }}>
      {/* INPUT */}
      <motion.div
        className="flex flex-col rounded-2xl border-2"
        animate={{
          borderColor: feeding ? NODE.active.border : NODE.idle.border,
          background: feeding ? NODE.active.bg : '#FFFFFF',
          boxShadow: feeding ? NODE.active.shadow : NODE.idle.shadow,
        }}
        transition={SPRING}
        style={{ width: 760, padding: '16px 22px', gap: 8 }}
      >
        <div className="flex items-center" style={{ gap: 10 }}>
          <span style={{ display: 'flex', color: NODE.idle.text }}>
            <FileIcon size={26} />
          </span>
          <span className="font-mono font-semibold" style={{ fontSize: 16, color: '#7A8197', letterSpacing: 1 }}>
            MASUKAN
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step.input}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="font-mono"
            style={{ fontSize: 26, color: '#20243A', wordBreak: 'break-word', lineHeight: 1.4 }}
          >
            “
            {step.input.split('').map((ch, i) => (
              <span
                key={i}
                style={
                  i === step.changedAt
                    ? { background: NODE.active.bg, color: NODE.active.text, borderRadius: 4, padding: '0 2px', fontWeight: 700 }
                    : undefined
                }
              >
                {ch}
              </span>
            ))}
            ”
          </motion.div>
        </AnimatePresence>
        <span style={{ fontSize: 18, color: '#9098AD', fontStyle: 'italic' }}>{step.inputNote}</span>
      </motion.div>

      <Conduit lit={feeding} />

      {/* FUNCTION */}
      <motion.div
        className="flex items-center justify-center rounded-2xl border-2"
        animate={{
          borderColor: computing ? NODE.active.border : NODE.idle.border,
          background: computing ? NODE.active.bg : '#F8FAFF',
          boxShadow: computing ? NODE.active.shadow : NODE.idle.shadow,
          scale: computing ? 1.03 : 1,
        }}
        transition={SPRING}
        style={{ width: 420, padding: '16px 24px', gap: 14 }}
      >
        <motion.span
          animate={{ color: computing ? NODE.active.border : '#7A8197', rotate: computing ? 360 : 0 }}
          transition={{ rotate: { duration: 0.8 }, color: SPRING }}
          style={{ display: 'flex' }}
        >
          <HashIcon size={36} strokeWidth={2} />
        </motion.span>
        <div className="flex flex-col">
          <span className="font-semibold" style={{ fontSize: 30, color: '#20243A' }}>
            SHA-256
          </span>
          <span className="font-mono" style={{ fontSize: 16, color: '#9098AD' }}>
            kompresi satu arah
          </span>
        </div>
      </motion.div>

      <Conduit lit={computing} />

      {/* DIGEST */}
      <motion.div
        className="flex flex-col rounded-2xl border-2"
        animate={{
          borderColor: hasResult ? (step.property === 'avalanche' ? NODE.fail.border : NODE.done.border) : NODE.idle.border,
          background: hasResult ? '#FFFFFF' : '#F8FAFF',
          boxShadow: hasResult ? NODE.done.shadow : NODE.idle.shadow,
        }}
        transition={SPRING}
        style={{ width: 760, padding: '16px 22px', gap: 10, minHeight: 132 }}
      >
        <div className="flex items-center" style={{ gap: 10 }}>
          <span style={{ display: 'flex', color: hasResult ? NODE.done.border : '#7A8197' }}>
            <FingerprintIcon size={26} />
          </span>
          <span className="font-mono font-semibold" style={{ fontSize: 16, color: '#7A8197', letterSpacing: 1 }}>
            SIDIK JARI · 256-bit · 64 hex
          </span>
          {step.compareTo && (
            <span
              className="ml-auto rounded-full font-mono font-semibold"
              style={{ fontSize: 16, padding: '4px 12px', background: NODE.fail.bg, color: NODE.fail.text, border: `1px solid ${NODE.fail.border}` }}
            >
              {step.digest && diff(step.digest, step.compareTo)} / 64 hex berubah
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {step.digest ? (
            <motion.div
              key={step.digest + (step.compareTo ?? '')}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="flex flex-wrap font-mono"
              style={{ fontSize: 27, letterSpacing: 1, lineHeight: 1.45 }}
            >
              {step.digest.split('').map((ch, i) => {
                const differs = step.compareTo ? ch !== step.compareTo[i] : false
                const same = step.compareTo ? !differs : false
                return (
                  <span
                    key={i}
                    style={{
                      width: 22,
                      textAlign: 'center',
                      color: differs ? NODE.fail.text : same ? NODE.done.text : '#2B3550',
                      background: differs ? NODE.fail.bg : 'transparent',
                      fontWeight: differs ? 700 : 500,
                      borderRadius: 3,
                    }}
                  >
                    {ch}
                  </span>
                )
              })}
            </motion.div>
          ) : (
            <motion.span
              key="pending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: 22, color: '#A0A7BC', fontStyle: 'italic' }}
            >
              {computing ? 'menghitung…' : 'menunggu masukan'}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* PROPERTY SPOTLIGHT */}
      <div className="flex items-center justify-center" style={{ gap: 12, marginTop: 2 }}>
        {PROPS.map((p) => {
          const on = step.property === p.key
          return (
            <motion.span
              key={p.key}
              className="rounded-full border font-mono font-semibold"
              animate={{
                borderColor: on ? NODE.active.border : '#D5DBE8',
                background: on ? NODE.active.bg : '#FFFFFF',
                color: on ? NODE.active.text : '#9098AD',
                scale: on ? 1.05 : 1,
              }}
              transition={SPRING}
              style={{ fontSize: 19, padding: '7px 18px' }}
            >
              {p.label}
            </motion.span>
          )
        })}
      </div>
    </div>
  )
}

function diff(a: string, b: string): number {
  let n = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++
  return n
}
