import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../palette'
import { QUESTION, type AgenticStep, type DocState } from './agenticRag'
import { AnswerIcon, AskIcon, LlmIcon, VectorDbIcon } from '../rag/Icons'
import { BrainIcon } from '../ai-agent/Icons'

const BOARD_W = 920

const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const

const VERDICT_STYLE = {
  sufficient: NODE.done,
  insufficient: { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B', shadow: '0 2px 12px rgba(220,38,38,0.18)' },
} as const

export default function AgenticRagView({ step }: { step: AgenticStep; stepKey: number }) {
  const retrieving = step.phase === 'retrieve'
  const grading = step.phase === 'grade'
  const rewriting = step.phase === 'rewrite'
  const generating = step.phase === 'generate'
  const validating = step.phase === 'validate'
  const dbLit = retrieving || grading || rewriting
  const llmLit = step.phase === 'plan' || generating || validating || rewriting

  return (
    <div className="relative flex flex-col" style={{ width: BOARD_W, gap: 16 }}>
      {/* Question */}
      <motion.div
        className="flex items-center rounded-2xl border-2"
        animate={{ borderColor: NODE.info.border, background: NODE.info.bg }}
        transition={SPRING}
        style={{ gap: 14, padding: '14px 22px', height: 74 }}
      >
        <span style={{ display: 'flex', color: NODE.info.border, flexShrink: 0 }}>
          <AskIcon size={32} />
        </span>
        <div className="flex flex-col" style={{ gap: 1, minWidth: 0 }}>
          <span className="font-mono font-semibold" style={{ fontSize: 15, color: NODE.info.text, letterSpacing: 1 }}>
            QUESTION
          </span>
          <span style={{ fontSize: 22, color: '#20243A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {QUESTION}
          </span>
        </div>
      </motion.div>

      {/* Agent controller + current query chip */}
      <div className="flex items-center" style={{ gap: 18 }}>
        <motion.div
          className="flex items-center rounded-2xl border-2"
          animate={{
            borderColor: llmLit ? NODE.active.border : NODE.idle.border,
            background: llmLit ? NODE.active.bg : '#FFFFFF',
            boxShadow: llmLit ? NODE.active.shadow : NODE.idle.shadow,
          }}
          transition={SPRING}
          style={{ gap: 13, padding: '14px 20px', width: 340, flexShrink: 0 }}
        >
          <motion.span animate={{ color: llmLit ? NODE.active.border : '#8C7FB8' }} style={{ display: 'flex' }}>
            <BrainIcon size={32} />
          </motion.span>
          <div className="flex flex-col" style={{ gap: 1 }}>
            <span className="font-semibold" style={{ fontSize: 24, color: '#20243A' }}>
              Agent
            </span>
            <span className="font-mono" style={{ fontSize: 16, color: '#9FA3BC' }}>
              orchestrates the loop
            </span>
          </div>
        </motion.div>

        {/* The query the agent is currently using (changes on rewrite) */}
        <div className="flex flex-1 flex-col rounded-2xl border-2" style={{ padding: '12px 18px', gap: 4, borderColor: NODE.idle.border, background: '#FBF9F5' }}>
          <span className="font-mono font-semibold" style={{ fontSize: 14, color: '#8C7FB8', letterSpacing: 1 }}>
            CURRENT QUERY
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={step.query}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="font-mono"
              style={{ fontSize: 21, color: rewriting ? NODE.active.text : '#3A3550' }}
            >
              "{step.query}"{rewriting && '  ← rewritten'}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Vector DB / retrieved docs panel with grades */}
      <motion.div
        className="flex flex-col rounded-2xl border-2"
        animate={{ borderColor: dbLit ? NODE.active.border : NODE.idle.border, boxShadow: dbLit ? NODE.active.shadow : NODE.idle.shadow }}
        transition={SPRING}
        style={{ padding: '16px 20px', gap: 11, background: '#FFFFFF', minHeight: 196 }}
      >
        <div className="flex items-center" style={{ gap: 11 }}>
          <span style={{ display: 'flex', color: dbLit ? NODE.active.border : '#8C7FB8' }}>
            <VectorDbIcon size={28} />
          </span>
          <span className="font-semibold" style={{ fontSize: 23, color: '#20243A' }}>
            Vector DB
          </span>
          <span className="font-mono" style={{ fontSize: 16, color: '#9FA3BC' }}>
            retrieved chunks · graded by the agent
          </span>
          {step.verdict && (
            <motion.span
              className="ml-auto rounded-full font-mono font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '6px 16px',
                fontSize: 17,
                background: VERDICT_STYLE[step.verdict].bg,
                color: VERDICT_STYLE[step.verdict].text,
                border: `1px solid ${VERDICT_STYLE[step.verdict].border}`,
              }}
            >
              {step.verdict === 'sufficient' ? '✓ sufficient' : '✗ insufficient'}
            </motion.span>
          )}
        </div>

        {step.docs.length === 0 ? (
          <span style={{ fontSize: 20, color: '#A39A8A', fontStyle: 'italic' }}>nothing retrieved yet</span>
        ) : (
          <div className="flex flex-col" style={{ gap: 10 }}>
            <AnimatePresence mode="popLayout">
              {step.docs.map((d) => (
                <DocRow key={`${step.attempt}-${d.id}`} doc={d} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Answer + validation */}
      <AnimatePresence>
        {step.answer && (
          <motion.div
            className="flex items-center rounded-2xl border-2"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={SPRING}
            style={{ gap: 15, padding: '14px 22px', minHeight: 74, borderColor: NODE.done.border, background: NODE.done.bg }}
          >
            <span style={{ display: 'flex', color: NODE.done.border, flexShrink: 0 }}>
              {step.validated ? <AnswerIcon size={32} /> : <LlmIcon size={32} />}
            </span>
            <span className="font-semibold" style={{ fontSize: 24, color: NODE.done.text, lineHeight: 1.3 }}>
              {step.answer}
            </span>
            {step.validated && (
              <motion.span
                className="ml-auto rounded-full font-mono"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ padding: '6px 15px', fontSize: 16, flexShrink: 0, background: '#FFFFFF', color: NODE.done.text, border: `1px solid ${NODE.done.border}` }}
              >
                ✓ grounded in d3
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DocRow({ doc }: { doc: DocState }) {
  const relevant = doc.grade === 'relevant'
  const weak = doc.grade === 'weak'
  const border = relevant ? NODE.done.border : weak ? '#E3B7B7' : '#E2E2EE'
  const bg = relevant ? NODE.done.bg : weak ? '#FBEFEF' : '#F7F7FB'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: -8 }}
      animate={{ opacity: weak ? 0.62 : 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={SPRING}
      className="flex items-center rounded-xl border"
      style={{ height: 56, gap: 14, padding: '0 16px', borderColor: border, background: bg }}
    >
      <span
        className="flex items-center justify-center rounded-md font-mono font-semibold"
        style={{ width: 46, height: 32, fontSize: 18, flexShrink: 0, background: '#FFFFFF', color: '#5B5470', border: '1px solid #D9D9E6' }}
      >
        {doc.id}
      </span>
      <span className="rounded-full font-mono" style={{ padding: '4px 12px', fontSize: 16, flexShrink: 0, background: '#FFFFFF', color: '#7A7290', border: '1px solid #E2E2EE' }}>
        {doc.tag}
      </span>
      <span style={{ fontSize: 21, color: '#3A3550', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
        {doc.text}
      </span>
      {doc.grade && (
        <span
          className="rounded-full font-mono font-semibold"
          style={{
            padding: '5px 13px',
            fontSize: 16,
            flexShrink: 0,
            background: '#FFFFFF',
            color: relevant ? NODE.done.text : '#A14242',
            border: `1px solid ${relevant ? NODE.done.border : '#E3B7B7'}`,
          }}
        >
          {relevant ? '✓ relevant' : '✗ off-topic'}
        </span>
      )}
    </motion.div>
  )
}
