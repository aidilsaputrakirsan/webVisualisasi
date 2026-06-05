import { AnimatePresence, motion } from 'framer-motion'

/** The running traversal result — values slide in as they are emitted. */
export default function OutputBar({ output }: { output: number[] }) {
  return (
    <div className="flex items-center justify-center gap-4" style={{ minHeight: 80 }}>
      <span className="font-mono text-neutral-500" style={{ fontSize: 24 }}>
        Output
      </span>
      <div className="flex items-center gap-3">
        <AnimatePresence initial={false}>
          {output.length === 0 && (
            <motion.span
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-neutral-600"
              style={{ fontSize: 24 }}
            >
              —
            </motion.span>
          )}
          {output.map((v, i) => (
            <motion.div
              key={`${i}-${v}`}
              layout
              initial={{ opacity: 0, scale: 0.6, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="flex items-center justify-center rounded-xl border-2 border-green-500/70 bg-green-500/10 font-mono font-semibold text-green-200"
              style={{ width: 56, height: 56, fontSize: 28, boxShadow: '0 0 16px rgba(34,197,94,0.4)' }}
            >
              {v}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
