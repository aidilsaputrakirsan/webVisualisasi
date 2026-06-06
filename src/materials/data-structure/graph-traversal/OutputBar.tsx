import { AnimatePresence, motion } from 'framer-motion'

/** Running visit order (letters slide in as vertices are visited). */
export default function OutputBar({ output }: { output: string[] }) {
  return (
    <div className="flex items-center justify-center gap-4" style={{ minHeight: 80 }}>
      <span className="font-mono text-stone-500" style={{ fontSize: 24 }}>
        Hasil
      </span>
      <div className="flex items-center gap-3">
        <AnimatePresence initial={false}>
          {output.length === 0 && (
            <motion.span key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-mono text-stone-400" style={{ fontSize: 24 }}>
              —
            </motion.span>
          )}
          {output.map((v, i) => (
            <motion.div
              key={`${v}-${i}`}
              layout
              initial={{ opacity: 0, scale: 0.6, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="flex items-center justify-center rounded-xl border-2 font-mono font-semibold"
              style={{ width: 56, height: 56, fontSize: 28, borderColor: '#15803D', background: '#DCFCE7', color: '#166534', boxShadow: '0 2px 10px rgba(21,128,61,0.18)' }}
            >
              {v}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
