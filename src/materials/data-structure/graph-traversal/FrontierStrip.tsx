import { AnimatePresence, motion } from 'framer-motion'

/** The queue (BFS) or call stack (DFS) strip. For a stack, the top (current)
 *  is on the right. */
export default function FrontierStrip({
  label,
  items,
  tone,
}: {
  label: string
  items: string[]
  tone: 'queue' | 'stack'
}) {
  const color =
    tone === 'queue'
      ? { border: '#2563EB', bg: '#DBEAFE', text: '#1E40AF' }
      : { border: '#D97706', bg: '#FDEBC8', text: '#92400E' }

  return (
    <div className="flex items-center justify-center gap-4" style={{ minHeight: 78 }}>
      <span className="font-mono text-stone-500" style={{ fontSize: 24 }}>
        {label}
      </span>
      <div
        className="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-white/70 px-4"
        style={{ minHeight: 64, minWidth: 120 }}
      >
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <motion.span
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-stone-400"
              style={{ fontSize: 22 }}
            >
              kosong
            </motion.span>
          ) : (
            items.map((id, i) => (
              <motion.div
                key={`${id}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="flex items-center justify-center rounded-lg border-2 font-mono font-semibold"
                style={{ width: 48, height: 48, fontSize: 24, borderColor: color.border, background: color.bg, color: color.text }}
              >
                {id}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
