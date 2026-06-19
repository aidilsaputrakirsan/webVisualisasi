import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../palette'
import { GOAL, TOOLS, type AgentStep, type ToolId } from './aiAgent'
import { AnswerIcon, BrainIcon, CalcIcon, CurrencyIcon, GoalIcon, SearchIcon } from './Icons'

const BOARD_W = 920

const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const

const TOOL_ICON: Record<ToolId, (p: { size?: number }) => JSX.Element> = {
  calc: CalcIcon,
  fx: CurrencyIcon,
  search: SearchIcon,
}

export default function AgentView({ step, stepKey }: { step: AgentStep; stepKey: number }) {
  const thinking = step.phase === 'think'
  const acting = step.phase === 'act'
  const observing = step.phase === 'observe'
  const final = step.phase === 'final'
  const agentLit = thinking || final

  return (
    <div className="relative flex flex-col" style={{ width: BOARD_W, gap: 18 }}>
      {/* Goal bar */}
      <motion.div
        className="flex items-center rounded-2xl border-2"
        animate={{ borderColor: NODE.info.border, background: NODE.info.bg }}
        transition={SPRING}
        style={{ gap: 14, padding: '16px 24px', height: 78 }}
      >
        <span style={{ display: 'flex', color: NODE.info.border, flexShrink: 0 }}>
          <GoalIcon size={34} />
        </span>
        <div className="flex flex-col" style={{ gap: 2, minWidth: 0 }}>
          <span className="font-mono font-semibold" style={{ fontSize: 16, color: NODE.info.text, letterSpacing: 1 }}>
            GOAL
          </span>
          <span style={{ fontSize: 25, color: '#20243A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {GOAL}
          </span>
        </div>
      </motion.div>

      {/* Agent  +  Tools */}
      <div className="flex" style={{ gap: 18 }}>
        {/* Agent (LLM brain) */}
        <motion.div
          className="flex flex-col rounded-2xl border-2"
          animate={{
            borderColor: agentLit ? NODE.active.border : NODE.idle.border,
            background: agentLit ? NODE.active.bg : '#FFFFFF',
            boxShadow: agentLit ? NODE.active.shadow : NODE.idle.shadow,
          }}
          transition={SPRING}
          style={{ width: 452, minHeight: 188, padding: '18px 22px', gap: 12 }}
        >
          <div className="flex items-center" style={{ gap: 13 }}>
            <motion.span animate={{ color: agentLit ? NODE.active.border : '#8C7FB8' }} style={{ display: 'flex' }}>
              <BrainIcon size={34} />
            </motion.span>
            <span className="font-semibold" style={{ fontSize: 26, color: '#20243A' }}>
              Agent
            </span>
            <span className="font-mono" style={{ fontSize: 17, color: '#9FA3BC' }}>
              LLM core
            </span>
          </div>

          {/* Current thought / reasoning bubble */}
          <div
            className="flex flex-1 items-start rounded-xl"
            style={{ padding: '12px 16px', background: '#FFFFFF', border: '1px dashed #D9D2C4', minHeight: 92 }}
          >
            <AnimatePresence mode="wait">
              {step.thought ? (
                <motion.div
                  key={step.thought + step.phase}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col"
                  style={{ gap: 8 }}
                >
                  <span className="font-mono" style={{ fontSize: 15, color: NODE.active.text, letterSpacing: 1 }}>
                    {final ? 'DECISION' : 'THOUGHT'}
                  </span>
                  <span style={{ fontSize: 23, color: '#3A3550', lineHeight: 1.35 }}>
                    {final ? 'Goal met — stop looping and finalize.' : step.thought}
                  </span>
                </motion.div>
              ) : (
                <motion.span
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ fontSize: 22, color: '#A39A8A', fontStyle: 'italic' }}
                >
                  reasoning about the goal…
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Tools the agent can choose from */}
        <div
          className="flex flex-1 flex-col rounded-2xl border-2"
          style={{ padding: '16px 18px', gap: 11, borderColor: NODE.idle.border, background: '#FBF9F5' }}
        >
          <span className="font-mono font-semibold" style={{ fontSize: 16, color: '#8C7FB8', letterSpacing: 1 }}>
            TOOLS
          </span>
          {TOOLS.map((t) => {
            const chosen = (acting || observing) && step.toolCall?.tool === t.id
            const Icon = TOOL_ICON[t.id]
            const st = chosen ? NODE.active : NODE.idle
            return (
              <motion.div
                key={t.id}
                className="flex items-center rounded-xl border-2"
                animate={{
                  borderColor: chosen ? st.border : '#E7E0D2',
                  background: chosen ? st.bg : '#FFFFFF',
                  scale: chosen ? 1.03 : 1,
                  boxShadow: chosen ? st.shadow : 'none',
                }}
                transition={SPRING}
                style={{ gap: 12, padding: '11px 14px' }}
              >
                <motion.span animate={{ color: chosen ? st.border : '#A79B86' }} style={{ display: 'flex', flexShrink: 0 }}>
                  <Icon size={28} />
                </motion.span>
                <div className="flex flex-col" style={{ gap: 1, minWidth: 0 }}>
                  <span className="font-semibold" style={{ fontSize: 21, color: '#20243A', whiteSpace: 'nowrap' }}>
                    {t.label}
                  </span>
                  <span className="font-mono" style={{ fontSize: 15, color: '#9FA3BC', whiteSpace: 'nowrap' }}>
                    {t.desc}
                  </span>
                </div>
                {chosen && step.toolCall && (
                  <motion.span
                    className="ml-auto rounded-full font-mono"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ padding: '5px 13px', fontSize: 16, flexShrink: 0, borderRadius: 999, background: '#FFFFFF', color: st.text, border: `1px solid ${st.border}`, whiteSpace: 'nowrap' }}
                  >
                    {observing ? `→ ${step.observation}` : step.toolCall.args}
                  </motion.span>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Scratchpad / memory — what the agent has learned so far */}
      <div
        className="flex flex-col rounded-2xl border-2"
        style={{ padding: '16px 20px', gap: 11, borderColor: NODE.idle.border, background: '#FFFFFF', minHeight: 110 }}
      >
        <div className="flex items-center" style={{ gap: 10 }}>
          <span className="font-semibold" style={{ fontSize: 22, color: '#20243A' }}>
            Memory
          </span>
          <span className="font-mono" style={{ fontSize: 16, color: '#9FA3BC' }}>
            scratchpad · what the agent knows
          </span>
        </div>
        {step.memory.length === 0 ? (
          <span style={{ fontSize: 20, color: '#A39A8A', fontStyle: 'italic' }}>empty — nothing observed yet</span>
        ) : (
          <div className="flex flex-col" style={{ gap: 9 }}>
            <AnimatePresence>
              {step.memory.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={SPRING}
                  className="flex items-center rounded-xl border"
                  style={{ gap: 12, padding: '10px 14px', borderColor: NODE.done.border, background: NODE.done.bg }}
                >
                  <span
                    className="flex items-center justify-center rounded-md font-mono font-semibold"
                    style={{ width: 40, height: 30, fontSize: 16, flexShrink: 0, background: '#FFFFFF', color: NODE.done.text, border: `1px solid ${NODE.done.border}` }}
                  >
                    #{m.iteration}
                  </span>
                  <span className="font-mono" style={{ fontSize: 18, color: '#3A3550', whiteSpace: 'nowrap' }}>
                    {m.tool}({m.args})
                  </span>
                  <span style={{ fontSize: 19, color: NODE.done.text }}>→</span>
                  <span className="font-mono font-semibold" style={{ fontSize: 19, color: NODE.done.text, whiteSpace: 'nowrap' }}>
                    {m.result}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Final grounded answer */}
      <AnimatePresence>
        {step.answer && (
          <motion.div
            key={`ans-${stepKey > 0}`}
            className="flex items-center rounded-2xl border-2"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={SPRING}
            style={{ gap: 15, padding: '16px 24px', height: 78, borderColor: NODE.done.border, background: NODE.done.bg }}
          >
            <span style={{ display: 'flex', color: NODE.done.border, flexShrink: 0 }}>
              <AnswerIcon size={34} />
            </span>
            <span className="font-semibold" style={{ fontSize: 27, color: NODE.done.text }}>
              {step.answer}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
