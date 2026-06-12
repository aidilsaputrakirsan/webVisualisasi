import { AnimatePresence, motion } from 'framer-motion'
import { theme } from './theme'

/**
 * Mode cerita: panel narasi analogi yang menggantikan CodeBlock — untuk
 * penonton awam/non-IT. Teksnya berganti dengan transisi halus per step.
 */
export default function StoryPanel({
  story,
  width = 800,
  minHeight = 190,
}: {
  story: string
  width?: number
  minHeight?: number
}) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl border"
      style={{
        width,
        minHeight,
        padding: '28px 40px',
        borderColor: theme.line,
        background: theme.surface,
        boxShadow: '0 6px 18px rgba(33,28,22,0.06)',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={story}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22 }}
          className="text-center"
          style={{ fontSize: 31, lineHeight: 1.55, color: theme.ink, maxWidth: width - 80 }}
        >
          {story}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
