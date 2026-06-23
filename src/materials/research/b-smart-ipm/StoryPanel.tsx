import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../../../shared/theme'
import { PHASES, type Phase } from './edgeLoop'

/**
 * Panel naratif pengganti blok kode: menampilkan "cerita" Bahasa Indonesia dari
 * frame berjalan, dengan chip fase yang sedang aktif. Ukuran px tetap untuk
 * kanvas 1080-lebar.
 */
export default function StoryPanel({
  phase,
  text,
  width = 900,
}: {
  phase: Phase
  text: string
  width?: number
}) {
  const label = PHASES.find((p) => p.id === phase)?.label ?? ''
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ width, borderColor: '#DCE4CF', background: '#FFFFFF', boxShadow: '0 6px 18px rgba(34,41,26,0.06)' }}
    >
      <div
        className="flex items-center gap-3 border-b px-6 py-3.5"
        style={{ borderColor: '#E9EFDD', background: '#F4F6EE' }}
      >
        <span className="font-mono font-semibold" style={{ fontSize: 16, letterSpacing: 2, color: '#7C8A6C' }}>
          CERITA
        </span>
        <span
          className="rounded-full font-mono"
          style={{ fontSize: 15, padding: '3px 13px', background: NODE.active.bg, color: NODE.active.text, border: `1px solid ${NODE.active.border}` }}
        >
          {label}
        </span>
      </div>

      <div className="px-7 py-6" style={{ minHeight: 132 }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            style={{ fontSize: 27, lineHeight: 1.5, color: '#2A3120' }}
          >
            {text}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
