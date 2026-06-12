import { AnimatePresence, motion } from 'framer-motion'
import { theme } from './theme'

/** Satu kalimat status teknis ringkas dalam pill, beranimasi per step. */
export default function StatusPill({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center" style={{ height: 46 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="rounded-full border font-mono"
          style={{
            fontSize: 21,
            padding: '8px 24px',
            borderColor: theme.line,
            background: theme.surface,
            color: theme.ink,
            maxWidth: 920,
            textAlign: 'center',
          }}
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
