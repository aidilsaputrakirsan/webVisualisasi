import { motion } from 'framer-motion'
import { VC, type ChatMsg } from './guide'
import { VCIcon } from './Icons'

/**
 * The conversation panel — this material's bespoke stand-in for a code/terminal
 * block. Vibe coding is a dialogue, so we show a You ↔ AI thread; the line under
 * discussion is lit, the rest dimmed.
 */
export default function ChatThread({
  msgs,
  activeMsg,
  width = 980,
}: {
  msgs: ChatMsg[]
  activeMsg: number
  width?: number
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ width, background: VC.panel, border: `1px solid ${VC.line}`, boxShadow: '0 18px 50px rgba(0,0,0,0.45)' }}
    >
      <div
        className="flex items-center gap-3 px-6"
        style={{ height: 52, background: VC.panelSoft, borderBottom: `1px solid ${VC.lineSoft}` }}
      >
        <span style={{ color: VC.violet, display: 'flex' }}>
          <VCIcon name="chat" size={22} />
        </span>
        <span className="font-mono" style={{ fontSize: 20, color: VC.inkFaint }}>
          you <span style={{ color: VC.line }}>↔</span> ai
        </span>
      </div>

      <div className="flex flex-col" style={{ gap: 14, padding: '22px 26px' }}>
        {msgs.map((m, i) => {
          const active = i === activeMsg
          const dim = activeMsg >= 0 && !active
          if (m.who === 'note') {
            return (
              <div key={i} className="flex justify-center">
                <motion.span
                  className="font-mono"
                  animate={{ opacity: dim ? 0.4 : 1 }}
                  style={{ fontSize: 19, color: VC.inkFaint, padding: '6px 16px', border: `1px dashed ${VC.line}`, borderRadius: 999 }}
                >
                  {m.text}
                </motion.span>
              </div>
            )
          }
          const you = m.who === 'you'
          return (
            <motion.div
              key={i}
              className="flex"
              style={{ justifyContent: you ? 'flex-end' : 'flex-start' }}
              animate={{ opacity: dim ? 0.45 : 1 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex flex-col" style={{ maxWidth: '74%', alignItems: you ? 'flex-end' : 'flex-start' }}>
                <span className="font-mono" style={{ fontSize: 16, color: you ? VC.violetText : VC.cyan, marginBottom: 4, paddingInline: 6 }}>
                  {you ? 'you' : 'ai'}
                </span>
                <motion.div
                  animate={{
                    boxShadow: active ? `0 0 0 3px ${you ? 'rgba(167,139,250,0.35)' : 'rgba(56,189,248,0.28)'}` : '0 2px 10px rgba(0,0,0,0.3)',
                  }}
                  style={{
                    fontSize: 24,
                    lineHeight: 1.32,
                    padding: '14px 20px',
                    borderRadius: 18,
                    borderBottomRightRadius: you ? 4 : 18,
                    borderBottomLeftRadius: you ? 18 : 4,
                    background: you ? VC.violet : VC.panelHi,
                    color: you ? '#1A1430' : VC.ink,
                    border: you ? 'none' : `1px solid ${VC.line}`,
                  }}
                >
                  {m.text}
                </motion.div>
                {m.attach && (
                  <span
                    className="flex items-center gap-2 font-mono"
                    style={{ fontSize: 17, color: VC.inkSoft, marginTop: 6, padding: '4px 12px', background: VC.panelSoft, border: `1px solid ${VC.line}`, borderRadius: 10 }}
                  >
                    <VCIcon name="image" size={18} />
                    {m.attach}
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
