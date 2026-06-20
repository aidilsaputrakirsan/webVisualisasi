import { motion } from 'framer-motion'
import { VC, PIPELINE } from './guide'

/**
 * The workflow spine: Plan → Prompt → Build → Debug → Commit → Test → Ship.
 * The current stage glows violet, completed stages read mint, upcoming ones are
 * faint. This is the material's signature header (distinct from a loop ring).
 */
export default function Pipeline({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center" style={{ gap: 4, maxWidth: 1000 }}>
      {PIPELINE.map((stage, i) => {
        const done = current >= 0 && i < current
        const on = i === current
        const accent = on ? VC.violet : done ? VC.mint : VC.line
        const textCol = on ? '#15131F' : done ? VC.mint : VC.inkFaint
        return (
          <div key={stage.id} className="flex items-center" style={{ gap: 4 }}>
            <motion.div
              className="flex items-center rounded-full font-semibold"
              animate={{
                background: on ? VC.violet : done ? 'rgba(94,234,212,0.12)' : VC.panel,
                borderColor: accent,
                color: textCol,
                scale: on ? 1.08 : 1,
                boxShadow: on ? `0 0 0 5px rgba(167,139,250,0.16), 0 6px 20px rgba(0,0,0,0.4)` : 'none',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              style={{ fontSize: 21, padding: '8px 18px', border: '1.5px solid' }}
            >
              {stage.label}
            </motion.div>
            {i < PIPELINE.length - 1 && (
              <motion.span
                animate={{ color: done ? VC.mint : on ? VC.violet : VC.line }}
                style={{ fontSize: 22 }}
              >
                ›
              </motion.span>
            )}
          </div>
        )
      })}
    </div>
  )
}
