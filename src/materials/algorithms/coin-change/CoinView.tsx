import { AnimatePresence, motion } from 'framer-motion'
import { NODE, theme } from '../../../shared/theme'
import { fmtRp, type CcStep, type ModeDef, type Piece } from './coinChange'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

/** Visual utama: laci kasir (pecahan), sisa kembalian, dan nampan hasil. */
export default function CoinView({ step, def }: { step: CcStep; def: ModeDef }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 26, width: 960 }}>
      {/* Konteks transaksi */}
      <div
        className="rounded-full border font-mono"
        style={{
          fontSize: 22,
          padding: '10px 28px',
          borderColor: theme.line,
          background: theme.surface,
          color: theme.inkSoft,
        }}
      >
        🛒 {def.scenario}
      </div>

      {/* Laci kasir — pecahan yang tersedia */}
      <div className="flex flex-col items-center" style={{ gap: 14 }}>
        <SectionLabel>LACI KASIR — PECAHAN (BESAR → KECIL)</SectionLabel>
        <div className="flex items-center justify-center" style={{ gap: 22 }}>
          {def.denoms.map((d, i) => {
            const active = step.denomIndex === i
            const exhausted = d.value > step.remaining && step.remaining > 0
            const style = active ? NODE.active : NODE.idle
            return (
              <motion.div
                key={d.value}
                animate={{
                  scale: active ? 1.08 : 1,
                  opacity: !active && exhausted ? 0.45 : 1,
                }}
                transition={SPRING}
                className="flex flex-col items-center justify-center rounded-2xl border-2 font-mono"
                style={{
                  width: 196,
                  height: 100,
                  borderColor: active ? style.border : d.color,
                  background: active ? style.bg : `${d.color}10`,
                  boxShadow: style.shadow,
                }}
              >
                <span className="font-semibold" style={{ fontSize: 30, color: active ? style.text : d.color }}>
                  {fmtRp(d.value)}
                </span>
                <span style={{ fontSize: 17, color: theme.inkFaint }}>per {def.unit}</span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Sisa kembalian */}
      <div className="flex items-baseline" style={{ gap: 18 }}>
        <span className="font-mono tracking-widest" style={{ fontSize: 22, color: theme.inkFaint }}>
          SISA
        </span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={step.remaining}
            initial={{ opacity: 0, y: 14, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14 }}
            transition={SPRING}
            className="font-mono font-bold"
            style={{ fontSize: 64, color: step.remaining === 0 ? NODE.done.border : theme.accentDeep }}
          >
            {fmtRp(step.remaining)}
          </motion.span>
        </AnimatePresence>
        {step.remaining === 0 && (
          <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} style={{ fontSize: 40 }}>
            ✅
          </motion.span>
        )}
      </div>

      {/* Nampan — kembalian yang sudah diberikan */}
      <div className="flex flex-col items-center" style={{ gap: 14, minHeight: 220 }}>
        <SectionLabel>
          KEMBALIAN DIBERIKAN — {step.taken.length} {def.unit.toUpperCase()}
        </SectionLabel>
        <div
          className="flex flex-wrap content-start items-center justify-center rounded-2xl border"
          style={{
            gap: 14,
            width: 900,
            minHeight: 160,
            padding: 18,
            borderColor: theme.line,
            background: theme.surfaceAlt,
          }}
        >
          <AnimatePresence>
            {step.taken.map((piece) => (
              <PieceCard key={piece.id} piece={piece} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Twist — kombinasi paling hemat (hanya mode kupon, step terakhir) */}
      <AnimatePresence>
        {step.optimal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING}
            className="flex flex-col items-center"
            style={{ gap: 14 }}
          >
            <SectionLabel color={NODE.done.border}>
              💡 CARA PALING HEMAT — {step.optimal.length} {def.unit.toUpperCase()}
            </SectionLabel>
            <div
              className="flex items-center justify-center rounded-2xl border-2"
              style={{
                gap: 14,
                padding: 18,
                borderColor: NODE.done.border,
                background: NODE.done.bg,
                boxShadow: NODE.done.shadow,
              }}
            >
              {step.optimal.map((piece) => (
                <PieceCard key={piece.id} piece={piece} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PieceCard({ piece }: { piece: Piece }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -30, scale: 0.6 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={SPRING}
      className="flex items-center justify-center rounded-xl border-2 font-mono font-semibold"
      style={{
        width: 176,
        height: 76,
        fontSize: 26,
        borderColor: piece.color,
        background: `${piece.color}14`,
        color: piece.color,
        boxShadow: '0 2px 10px rgba(33,28,22,0.08)',
      }}
    >
      {fmtRp(piece.value)}
    </motion.div>
  )
}

function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="font-mono tracking-widest" style={{ fontSize: 19, color: color ?? theme.inkFaint }}>
      {children}
    </span>
  )
}
