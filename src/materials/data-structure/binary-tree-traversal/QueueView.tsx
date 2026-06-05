import { AnimatePresence, motion } from 'framer-motion'
import { node } from './tree'

/** The BFS queue strip (level-order only). FIFO: front is on the left. */
export default function QueueView({ queue }: { queue: number[] }) {
  return (
    <div className="flex items-center justify-center gap-4" style={{ minHeight: 78 }}>
      <span className="font-mono text-neutral-500" style={{ fontSize: 24 }}>
        Queue
      </span>
      <div
        className="flex items-center gap-2.5 rounded-2xl border border-neutral-800 bg-neutral-900/50 px-4"
        style={{ minHeight: 64, minWidth: 120 }}
      >
        <AnimatePresence initial={false}>
          {queue.length === 0 ? (
            <motion.span
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-neutral-600"
              style={{ fontSize: 22 }}
            >
              kosong
            </motion.span>
          ) : (
            queue.map((id) => (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="flex items-center justify-center rounded-lg border-2 border-blue-400/70 bg-blue-400/10 font-mono font-semibold text-blue-200"
                style={{ width: 48, height: 48, fontSize: 24 }}
              >
                {node(id).value}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
