import { AnimatePresence, motion } from 'framer-motion'
import { NODE, theme } from '../../../shared/theme'
import { useTween, type RailStop } from '../kit/Hud'
import { WORLD } from '../kit/palette'
import { EDGE_KM, ORIGIN_KM, RTT_FAR, RTT_JAM, RTT_NEAR, type Quality, type Stage } from './story'

/** Journey stops for the bottom rail (ids match `Step.stage`). */
export const RAIL: readonly (RailStop & { id: Stage })[] = [
  { id: 'play', label: 'play', icon: 'play' },
  { id: 'origin', label: 'origin', icon: 'globe' },
  { id: 'copy', label: 'copy', icon: 'copy' },
  { id: 'edge', label: 'nearby', icon: 'pin' },
  { id: 'chunks', label: 'chunks', icon: 'chunks' },
  { id: 'quality', label: 'quality', icon: 'gauge' },
]

const toneOf = (ms: number) => (ms >= RTT_JAM ? WORLD.alert : ms <= RTT_NEAR ? NODE.done.border : theme.ink)

/** Round-trip time meter + (while streaming) the current quality chip. */
export function RttMeter({ ms, quality }: { ms: number | null; quality: Quality | null }) {
  const v = useTween(ms ?? 0)
  return (
    <div className="flex items-end justify-center" style={{ gap: 36, minHeight: 110 }}>
      <AnimatePresence>
        {ms !== null && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <span className="font-mono" style={{ fontSize: 22, letterSpacing: 4, color: theme.inkFaint }}>
              ROUND TRIP
            </span>
            <motion.span
              className="font-mono font-bold tabular-nums"
              animate={{ color: toneOf(ms) }}
              style={{ fontSize: 76, lineHeight: 1.05 }}
            >
              {Math.round(v)}
              <span style={{ fontSize: 40, color: theme.inkSoft }}> ms</span>
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {quality && (
          <motion.div
            key={quality}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className="rounded-full border font-mono font-semibold"
            style={{
              marginBottom: 14,
              fontSize: 28,
              padding: '10px 24px',
              borderColor: quality === 'hi' ? theme.accent : theme.lineStrong,
              background: quality === 'hi' ? theme.accentSoft : theme.surface,
              color: quality === 'hi' ? theme.accentDeep : theme.inkSoft,
            }}
          >
            {quality === 'hi' ? '1080p' : '480p'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const CELLS = 8
const PLAYHEAD = 2

/** Buffer strip: played cells, the playhead, and chunks ready ahead of it. */
export function BufferBar({ ahead, quality }: { ahead: number; quality: Quality }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 10 }}>
      <div className="flex" style={{ gap: 8 }}>
        {Array.from({ length: CELLS }, (_, i) => {
          const played = i < PLAYHEAD
          const now = i === PLAYHEAD
          const ready = i > PLAYHEAD && i <= PLAYHEAD + ahead
          return (
            <motion.div
              key={i}
              className="rounded-md border-2"
              animate={{
                backgroundColor: played ? theme.lineStrong : now ? theme.accent : ready ? (quality === 'hi' ? theme.accentSoft : theme.surfaceAlt) : theme.surface,
                borderColor: now ? theme.accentDeep : ready ? (quality === 'hi' ? theme.accent : theme.lineStrong) : theme.line,
                scale: now ? 1.08 : 1,
              }}
              transition={{ duration: 0.3, delay: ready ? (i - PLAYHEAD) * 0.08 : 0 }}
              style={{ width: 84, height: quality === 'hi' ? 46 : 32 }}
            />
          )
        })}
      </div>
      <span className="font-mono" style={{ fontSize: 20, color: theme.inkSoft, letterSpacing: 2 }}>
        BUFFER · {ahead} chunks ahead
      </span>
    </div>
  )
}

/** Final side-by-side: the far origin vs the edge next door. */
export function CompareBars() {
  const rows = [
    { label: `Origin · ${ORIGIN_KM}`, ms: RTT_FAR, color: WORLD.alert },
    { label: `Edge · ${EDGE_KM}`, ms: RTT_NEAR, color: NODE.done.border },
  ]
  return (
    <div className="flex flex-col" style={{ gap: 14, width: 860 }}>
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center" style={{ gap: 18 }}>
          <span className="font-mono" style={{ width: 300, fontSize: 24, color: theme.inkSoft }}>
            {r.label}
          </span>
          <div className="relative flex-1 overflow-hidden rounded-full" style={{ height: 26, background: theme.line }}>
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: r.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(r.ms / RTT_FAR) * 100}%` }}
              transition={{ duration: 0.9, delay: 0.3 + i * 0.4, ease: 'easeOut' }}
            />
          </div>
          <span className="font-mono font-bold tabular-nums" style={{ width: 120, textAlign: 'right', fontSize: 30, color: r.color }}>
            {r.ms} ms
          </span>
        </div>
      ))}
    </div>
  )
}
