import { AnimatePresence, motion } from 'framer-motion'
import { CC, type ContextState } from './guide'

/**
 * Context-window visual: a single bar that fills with stacked segments (system,
 * CLAUDE.md, files, history…). /compact distils history into a small summary;
 * /clear empties it. The cap line marks the window limit.
 */
const BAR_W = 880
const CAP = 78 // total "units" the bar represents

export default function ContextMeter({ ctx }: { ctx: ContextState }) {
  const total = ctx.segments.reduce((s, seg) => s + seg.size, 0)
  const pct = Math.min(100, Math.round((total / CAP) * 100))
  const near = pct >= 80

  return (
    <div className="flex flex-col items-center" style={{ width: BAR_W, gap: 20 }}>
      <div className="flex w-full items-center justify-between font-mono" style={{ fontSize: 23 }}>
        <span style={{ color: CC.inkFaint }}>context window</span>
        <span style={{ color: ctx.mode === 'compact' ? CC.green : near ? CC.amber : CC.coralText }}>
          {pct}% used
        </span>
      </div>

      {/* the bar */}
      <div
        className="relative flex w-full overflow-hidden rounded-2xl"
        style={{ height: 84, background: CC.panel, border: `1px solid ${CC.line}`, padding: 6, gap: 6 }}
      >
        <AnimatePresence mode="popLayout">
          {ctx.segments.map((seg) => (
            <motion.div
              key={seg.id}
              layout
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${(seg.size / CAP) * 100}%`, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              className="flex items-center justify-center rounded-xl overflow-hidden"
              style={{ background: seg.color, minWidth: 0 }}
            >
              <span
                className="px-2 font-mono font-semibold"
                style={{ fontSize: 18, color: '#16120F', whiteSpace: 'nowrap' }}
              >
                {seg.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* free space hint */}
        <div className="flex flex-1 items-center justify-center" style={{ minWidth: 0 }}>
          <span className="font-mono" style={{ fontSize: 18, color: CC.inkFaint }}>
            free
          </span>
        </div>
      </div>

      {/* note */}
      <div className="flex w-full items-center" style={{ minHeight: 40 }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={ctx.note}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="font-mono"
            style={{ fontSize: 24, color: ctx.mode === 'compact' ? CC.green : ctx.mode === 'clear' ? CC.coralText : CC.inkSoft }}
          >
            {ctx.mode === 'compact' && '▸ '}
            {ctx.mode === 'clear' && '▸ '}
            {ctx.note}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
