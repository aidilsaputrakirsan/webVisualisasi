import { AnimatePresence, motion } from 'framer-motion'
import { NODE, theme } from '../../../shared/theme'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '../../../shared/Icons'
import {
  MAX_GUESSES,
  RANGE_MAX,
  RANGE_MIN,
  type GnStep,
  type Verdict,
} from './guessNumber'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

const BAR_W = 880
const BAR_H = 58

const VERDICT_STYLE: Record<Verdict, { color: string; bg: string; label: string }> = {
  up: { color: '#2563EB', bg: '#DBEAFE', label: 'Lebih besar' },
  down: { color: '#DB2777', bg: '#FCE7F3', label: 'Lebih kecil' },
  hit: { color: NODE.done.border, bg: NODE.done.bg, label: 'Tepat' },
}

function VerdictIcon({ verdict, size = 22 }: { verdict: Verdict; size?: number }) {
  if (verdict === 'up') return <ChevronUpIcon size={size} />
  if (verdict === 'down') return <ChevronDownIcon size={size} />
  return <CheckIcon size={size} strokeWidth={2.8} />
}

/** Visual utama: kartu angka rahasia, rentang yang menyempit, dan riwayat tebakan. */
export default function RangeView({ step, secret }: { step: GnStep; secret: number }) {
  const candidates = step.high - step.low + 1
  return (
    <div className="flex flex-col items-center" style={{ gap: 30, width: 960 }}>
      {/* Kartu angka rahasia + tebakan saat ini */}
      <div className="flex items-center justify-center" style={{ gap: 70 }}>
        <SecretCard secret={secret} revealed={step.revealed} />
        <GuessReadout step={step} />
      </div>

      {/* Rentang 1–100 yang menyempit */}
      <div className="flex flex-col items-center" style={{ gap: 12 }}>
        <div className="flex items-baseline justify-between" style={{ width: BAR_W }}>
          <SectionLabel>RENTANG KANDIDAT</SectionLabel>
          <span className="font-mono" style={{ fontSize: 20, color: theme.inkSoft }}>
            sisa{' '}
            <AnimatePresence mode="popLayout">
              <motion.span
                key={candidates}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="inline-block font-bold"
                style={{ color: theme.accentDeep }}
              >
                {candidates}
              </motion.span>
            </AnimatePresence>{' '}
            angka
          </span>
        </div>

        <div
          className="relative rounded-xl border"
          style={{ width: BAR_W, height: BAR_H, borderColor: theme.lineStrong, background: theme.surface }}
        >
          {/* Jendela [low, high] yang masih hidup */}
          <motion.div
            className="absolute rounded-lg border-2"
            animate={{
              left: ((step.low - RANGE_MIN) / RANGE_MAX) * BAR_W,
              width: (candidates / RANGE_MAX) * BAR_W,
            }}
            transition={SPRING}
            style={{
              top: 4,
              bottom: 4,
              borderColor: theme.accent,
              background: theme.accentSoft,
              boxShadow: NODE.active.shadow,
            }}
          />
          {/* Penanda tebakan (garis + gelembung angka) */}
          <AnimatePresence>
            {step.guess != null && (
              <motion.div
                className="absolute flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, left: ((step.guess - 0.5) / RANGE_MAX) * BAR_W - 30 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
                style={{ top: -56, width: 60 }}
              >
                <div
                  className="flex items-center justify-center rounded-lg border-2 font-mono font-bold"
                  style={{
                    width: 60,
                    height: 44,
                    fontSize: 24,
                    borderColor: theme.accent,
                    background: theme.surface,
                    color: theme.accentDeep,
                    boxShadow: NODE.active.shadow,
                  }}
                >
                  {step.guess}
                </div>
                <div style={{ width: 3, height: 12 + BAR_H, background: theme.accent }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between font-mono" style={{ width: BAR_W, fontSize: 18, color: theme.inkFaint }}>
          {[1, 25, 50, 75, 100].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* Riwayat tebakan + meteran percobaan */}
      <div className="flex flex-col items-center" style={{ gap: 14, minHeight: 150 }}>
        <div className="flex items-center" style={{ gap: 26 }}>
          <SectionLabel>RIWAYAT TEBAKAN</SectionLabel>
          <AttemptDots count={step.attempts} />
        </div>
        <div className="flex flex-wrap items-center justify-center" style={{ gap: 12, width: 900, minHeight: 64 }}>
          <AnimatePresence>
            {step.history.map((g) => {
              const s = VERDICT_STYLE[g.verdict]
              return (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, y: -20, scale: 0.7 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={SPRING}
                  className="flex items-center rounded-xl border-2 font-mono font-semibold"
                  style={{
                    gap: 8,
                    padding: '10px 18px',
                    fontSize: 26,
                    borderColor: s.color,
                    background: s.bg,
                    color: s.color,
                  }}
                >
                  {g.value}
                  <VerdictIcon verdict={g.verdict} size={20} />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/** Kartu yang menutupi angka rahasia; berbalik (flip 3D) saat ketemu. */
function SecretCard({ secret, revealed }: { secret: number; revealed: boolean }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 12 }}>
      <SectionLabel>ANGKA RAHASIA</SectionLabel>
      <div style={{ width: 150, height: 170, perspective: 800 }}>
        <motion.div
          className="relative h-full w-full"
          animate={{ rotateY: revealed ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <CardFace borderColor={theme.lineStrong} background={theme.surfaceAlt} color={theme.inkFaint}>
            ?
          </CardFace>
          <CardFace
            borderColor={NODE.done.border}
            background={NODE.done.bg}
            color={NODE.done.text}
            back
            shadow={NODE.done.shadow}
          >
            {secret}
          </CardFace>
        </motion.div>
      </div>
    </div>
  )
}

function CardFace({
  children,
  borderColor,
  background,
  color,
  back,
  shadow,
}: {
  children: React.ReactNode
  borderColor: string
  background: string
  color: string
  back?: boolean
  shadow?: string
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 font-mono font-bold"
      style={{
        fontSize: 64,
        borderColor,
        background,
        color,
        boxShadow: shadow ?? '0 4px 14px rgba(33,28,22,0.08)',
        backfaceVisibility: 'hidden',
        transform: back ? 'rotateY(180deg)' : undefined,
      }}
    >
      {children}
    </div>
  )
}

/** Tebakan saat ini + respons ("lebih besar / lebih kecil / tepat"). */
function GuessReadout({ step }: { step: GnStep }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 12, width: 360 }}>
      <SectionLabel>TEBAKAN</SectionLabel>
      <div className="flex h-[170px] flex-col items-center justify-center" style={{ gap: 10 }}>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={step.guess ?? 'none'}
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18 }}
            transition={SPRING}
            className="font-mono font-bold"
            style={{ fontSize: 84, lineHeight: 1, color: step.guess != null ? theme.ink : theme.inkFaint }}
          >
            {step.guess ?? '–'}
          </motion.span>
        </AnimatePresence>
        <div style={{ height: 46 }}>
          <AnimatePresence mode="wait">
            {step.verdict && (
              <motion.div
                key={step.verdict}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
                className="flex items-center rounded-full border-2 font-mono font-semibold"
                style={{
                  gap: 8,
                  padding: '6px 20px',
                  fontSize: 23,
                  borderColor: VERDICT_STYLE[step.verdict].color,
                  background: VERDICT_STYLE[step.verdict].bg,
                  color: VERDICT_STYLE[step.verdict].color,
                }}
              >
                <VerdictIcon verdict={step.verdict} />
                {VERDICT_STYLE[step.verdict].label}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/** Meteran 7 titik — bukti "tak pernah lebih dari 7 tebakan". */
function AttemptDots({ count }: { count: number }) {
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      {Array.from({ length: MAX_GUESSES }, (_, i) => (
        <motion.span
          key={i}
          animate={{
            background: i < count ? theme.accent : theme.line,
            scale: i === count - 1 ? 1.25 : 1,
          }}
          transition={SPRING}
          className="rounded-full"
          style={{ width: 14, height: 14 }}
        />
      ))}
      <span className="font-mono" style={{ fontSize: 18, color: theme.inkFaint, marginLeft: 6 }}>
        maks {MAX_GUESSES}
      </span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono tracking-widest" style={{ fontSize: 19, color: theme.inkFaint }}>
      {children}
    </span>
  )
}
