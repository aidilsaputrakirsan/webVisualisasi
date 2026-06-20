import { AnimatePresence, motion } from 'framer-motion'
import { OC, type GridItem } from './guide'
import { OCIcon } from './Icons'

/** Grid of feature cards with one lit at a time + a detail callout below. */
export default function TipGrid({
  items,
  cols,
  activeId,
  width = 980,
}: {
  items: GridItem[]
  cols: number
  activeId: string | null
  width?: number
}) {
  const active = items.find((it) => it.id === activeId) ?? null
  const dim = activeId !== null
  return (
    <div className="flex flex-col items-center" style={{ width, gap: 22 }}>
      <div className="grid" style={{ width: '100%', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
        {items.map((it) => {
          const on = it.id === activeId
          return (
            <motion.div
              key={it.id}
              layout
              className="relative flex items-center rounded-2xl"
              style={{ gap: 18, padding: cols === 1 ? '22px 28px' : '20px 22px', border: `2px solid ${OC.line}`, background: OC.panel }}
              animate={{
                borderColor: on ? it.color : OC.line,
                background: on ? OC.panelHi : OC.panel,
                opacity: dim && !on ? 0.42 : 1,
                scale: on ? 1.03 : 1,
                boxShadow: on ? `0 0 0 5px ${it.color}22, 0 10px 28px rgba(0,0,0,0.42)` : '0 3px 12px rgba(0,0,0,0.3)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 58, height: 58, background: on ? it.color : OC.panelSoft, border: `1px solid ${on ? it.color : OC.line}`, color: on ? '#0E1512' : it.color }}
              >
                <OCIcon name={it.glyph} size={32} strokeWidth={on ? 2 : 1.8} />
              </div>
              <div className="flex flex-col" style={{ minWidth: 0 }}>
                <span className="font-semibold" style={{ fontSize: 27, color: on ? OC.ink : OC.inkSoft, lineHeight: 1.1 }}>
                  {it.label}
                </span>
                <span className="font-mono" style={{ fontSize: 18, color: on ? it.color : OC.inkFaint, marginTop: 4 }}>
                  {it.tag}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="flex w-full items-start" style={{ minHeight: 96 }}>
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="flex w-full items-start rounded-2xl"
              style={{ gap: 16, padding: '20px 26px', background: OC.panelSoft, border: `1px solid ${active.color}`, borderLeft: `5px solid ${active.color}` }}
            >
              <span style={{ color: active.color, flexShrink: 0, marginTop: 2 }}>
                <OCIcon name={active.glyph} size={36} strokeWidth={1.9} />
              </span>
              <p style={{ fontSize: 30, color: OC.inkSoft, lineHeight: 1.35 }}>
                <span style={{ color: active.color, fontWeight: 600 }}>{active.label}.</span> {active.detail}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full items-center justify-center rounded-2xl"
              style={{ padding: '20px 26px', background: OC.panelSoft, border: `1px dashed ${OC.line}`, minHeight: 96 }}
            >
              <span className="font-mono" style={{ fontSize: 22, color: OC.inkFaint }}>
                stepping through each one…
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
