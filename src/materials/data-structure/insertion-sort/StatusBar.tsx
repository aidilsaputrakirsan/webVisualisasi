import { AnimatePresence, motion } from 'framer-motion'

export default function StatusBar({ status }: { status: string }) {
  return (
    <div className="flex items-center justify-center" style={{ height: 56 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="rounded-full border border-neutral-800 bg-neutral-900/60 font-mono text-neutral-300"
          style={{ fontSize: 24, padding: '10px 26px' }}
        >
          {status}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
