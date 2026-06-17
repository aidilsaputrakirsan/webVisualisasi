import { motion } from 'framer-motion'

/**
 * Big centered concept headline for the text-only intro beats (shown while the
 * point cloud is still empty), so those frames carry a clear idea, not just a
 * status line.
 */
export default function NoteOverlay({ text }: { text: string }) {
  return (
    <motion.div
      key={text}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45 }}
      className="absolute inset-0 flex items-center justify-center"
      style={{ pointerEvents: 'none', padding: '0 80px' }}
    >
      <span
        style={{
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1.2,
          textAlign: 'center',
          fontFamily: 'ui-serif, Georgia, serif',
          color: '#2A2740',
          textWrap: 'balance',
        }}
      >
        {text}
      </span>
    </motion.div>
  )
}
