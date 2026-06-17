import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../palette'
import {
  EDGES,
  NODES,
  QUESTION,
  VDB_BOX,
  edgeBetween,
  type ChunkState,
  type NodeId,
  type RagStep,
  type Tone,
} from './rag'
import { AnswerIcon, AskIcon, DocIcon, LlmIcon, SparkIcon, VectorDbIcon } from './Icons'

const BOARD_W = 920
const BOARD_H = 860

const CONTEXT = { stroke: '#7C3AED', bg: '#EDE9FE', text: '#5B21B6' }

const TONE: Record<Tone, { stroke: string; bg: string; text: string }> = {
  text: { stroke: NODE.active.border, bg: NODE.active.bg, text: NODE.active.text },
  vector: { stroke: NODE.info.border, bg: NODE.info.bg, text: NODE.info.text },
  context: CONTEXT,
  answer: { stroke: NODE.done.border, bg: NODE.done.bg, text: NODE.done.text },
}

const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const

/** Endpoint of an edge as seen travelling from→to. */
function point(from: NodeId | 'vdb', to: NodeId | 'vdb') {
  const e = edgeBetween(from, to)
  if (!e) return null
  const fromIsA = e.a === from
  return {
    sx: fromIsA ? e.ax : e.bx,
    sy: fromIsA ? e.ay : e.by,
    tx: fromIsA ? e.bx : e.ax,
    ty: fromIsA ? e.by : e.ay,
  }
}

export default function RagView({ step, stepKey }: { step: RagStep; stepKey: number }) {
  const active = new Set(step.activeNodes)
  const activeEdge = step.packet ? edgeBetween(step.packet.from, step.packet.to) : undefined
  const pts = step.packet ? point(step.packet.from, step.packet.to) : null
  const tone = step.packet ? TONE[step.packet.tone] : null

  const meta: Record<NodeId, { label: string; sub: string; Icon: (p: { size?: number }) => JSX.Element }> = {
    query:
      step.phase === 'index'
        ? { label: 'Documents', sub: 'knowledge source', Icon: DocIcon }
        : { label: 'User Question', sub: QUESTION, Icon: AskIcon },
    embed: { label: 'Embedding Model', sub: 'text → vector', Icon: SparkIcon },
    llm: { label: 'LLM', sub: 'generator', Icon: LlmIcon },
    answer: { label: 'Answer', sub: 'grounded', Icon: AnswerIcon },
  }

  return (
    <div className="relative" style={{ width: BOARD_W, height: BOARD_H }}>
      {/* Edges */}
      <svg width={BOARD_W} height={BOARD_H} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        {EDGES.map((e, i) => {
          const isActive = activeEdge === e
          const color = isActive ? (tone?.stroke ?? NODE.active.border) : '#C7CADD'
          return (
            <motion.line
              key={i}
              x1={e.ax}
              y1={e.ay}
              x2={e.bx}
              y2={e.by}
              animate={{ stroke: color, strokeWidth: isActive ? 3.5 : 2 }}
              strokeLinecap="round"
            />
          )
        })}
      </svg>

      {/* Service nodes (query / embed / llm), answer handled separately */}
      {(['query', 'embed', 'llm'] as NodeId[]).map((id) => {
        const n = NODES[id]
        const lit = active.has(id)
        const st = lit ? NODE.active : NODE.idle
        const { label, sub, Icon } = meta[id]
        return (
          <motion.div
            key={id}
            className="absolute flex items-center rounded-2xl border-2"
            animate={{
              borderColor: st.border,
              background: lit ? st.bg : '#FFFFFF',
              boxShadow: lit ? st.shadow : '0 1px 4px rgba(30,34,58,0.06)',
              scale: lit ? 1.04 : 1,
            }}
            transition={SPRING}
            style={{ left: n.cx - n.w / 2, top: n.cy - n.h / 2, width: n.w, height: n.h, gap: 15, padding: '0 24px' }}
          >
            <motion.span animate={{ color: st.border }} style={{ display: 'flex', flexShrink: 0 }}>
              <Icon size={36} />
            </motion.span>
            <div className="flex flex-col" style={{ gap: 3, minWidth: 0 }}>
              <span className="font-semibold" style={{ fontSize: 27, color: '#20243A', whiteSpace: 'nowrap' }}>
                {label}
              </span>
              <span className="font-mono" style={{ fontSize: 18, color: '#9FA3BC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: n.w - 100 }}>
                {sub}
              </span>
            </div>
            {/* Query-vector chip on the embedding model output */}
            {id === 'embed' && step.queryVec && (
              <motion.span
                className="ml-auto rounded-full border font-mono"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ padding: '5px 14px', fontSize: 18, flexShrink: 0, borderColor: NODE.info.border, background: NODE.info.bg, color: NODE.info.text }}
              >
                vector
              </motion.span>
            )}
          </motion.div>
        )
      })}

      {/* Vector DB panel with chunk rows */}
      <motion.div
        className="absolute flex flex-col rounded-2xl border-2"
        animate={{
          borderColor: active.has('vdb') ? NODE.active.border : NODE.idle.border,
          boxShadow: active.has('vdb') ? NODE.active.shadow : NODE.idle.shadow,
        }}
        transition={SPRING}
        style={{
          left: VDB_BOX.cx - VDB_BOX.w / 2,
          top: VDB_BOX.cy - VDB_BOX.h / 2,
          width: VDB_BOX.w,
          height: VDB_BOX.h,
          background: '#FFFFFF',
          padding: '18px 22px',
          gap: 12,
        }}
      >
        <div className="flex items-center" style={{ gap: 12, marginBottom: 2 }}>
          <span style={{ display: 'flex', color: active.has('vdb') ? NODE.active.border : '#8C7FB8' }}>
            <VectorDbIcon size={30} />
          </span>
          <span className="font-semibold" style={{ fontSize: 25, color: '#20243A' }}>
            Vector DB
          </span>
          <span className="font-mono" style={{ fontSize: 17, color: '#9FA3BC' }}>
            similarity search
          </span>
        </div>
        <div className="flex flex-col" style={{ gap: 10 }}>
          <AnimatePresence>
            {step.chunks
              .filter((c) => c.stored)
              .map((c) => (
                <ChunkRow key={c.id} chunk={c} dim={hasSelection(step.chunks) && !c.selected} />
              ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Answer box (appears at the end of generation) */}
      <AnimatePresence>
        {step.answer && (
          <motion.div
            className="absolute flex items-center rounded-2xl border-2"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={SPRING}
            style={{
              left: NODES.answer.cx - NODES.answer.w / 2,
              top: NODES.answer.cy - NODES.answer.h / 2,
              width: NODES.answer.w,
              height: NODES.answer.h,
              gap: 15,
              padding: '0 24px',
              borderColor: NODE.done.border,
              background: NODE.done.bg,
            }}
          >
            <span style={{ display: 'flex', color: NODE.done.border, flexShrink: 0 }}>
              <AnswerIcon size={34} />
            </span>
            <span style={{ fontSize: 25, color: NODE.done.text, lineHeight: 1.3 }}>{step.answer}</span>
            <span
              className="ml-auto rounded-full font-mono"
              style={{ padding: '5px 14px', fontSize: 17, flexShrink: 0, background: '#FFFFFF', color: NODE.done.text, border: `1px solid ${NODE.done.border}` }}
            >
              source: c1
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Travelling packet */}
      <AnimatePresence>
        {step.packet && pts && tone && (
          <motion.div
            key={stepKey}
            className="absolute flex items-center rounded-full border font-mono"
            initial={{ left: pts.sx, top: pts.sy, opacity: 0, scale: 0.7, x: '-50%', y: '-50%' }}
            animate={{ left: pts.tx, top: pts.ty, opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            style={{
              gap: 7,
              padding: '8px 18px',
              fontSize: 21,
              whiteSpace: 'nowrap',
              borderColor: tone.stroke,
              background: tone.bg,
              color: tone.text,
              zIndex: 20,
            }}
          >
            {step.packet.tag}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function hasSelection(chunks: ChunkState[]): boolean {
  return chunks.some((c) => c.selected)
}

function ChunkRow({ chunk, dim }: { chunk: ChunkState; dim: boolean }) {
  const sel = chunk.selected
  const border = sel ? NODE.done.border : '#E2E2EE'
  const bg = sel ? NODE.done.bg : '#F7F7FB'
  const barColor = sel ? NODE.done.border : NODE.info.border
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: dim ? 0.4 : 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={SPRING}
      className="flex items-center rounded-xl border"
      style={{ height: 58, gap: 14, padding: '0 16px', borderColor: border, background: bg }}
    >
      <span
        className="flex items-center justify-center rounded-md font-mono font-semibold"
        style={{ width: 46, height: 34, fontSize: 19, flexShrink: 0, background: '#FFFFFF', color: '#5B5470', border: '1px solid #D9D9E6' }}
      >
        {chunk.id}
      </span>
      <span
        className="rounded-full font-mono"
        style={{ padding: '4px 12px', fontSize: 17, flexShrink: 0, background: '#FFFFFF', color: '#7A7290', border: '1px solid #E2E2EE' }}
      >
        {chunk.tag}
      </span>
      <span style={{ fontSize: 23, color: '#3A3550', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
        {chunk.text}
      </span>
      {chunk.score != null && (
        <div className="flex items-center" style={{ gap: 11, flexShrink: 0 }}>
          <div className="rounded-full" style={{ width: 124, height: 11, background: '#E6E6F0', overflow: 'hidden' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(chunk.score * 100)}%`, background: barColor }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
            />
          </div>
          <span className="font-mono font-semibold" style={{ width: 52, fontSize: 21, textAlign: 'right', color: sel ? NODE.done.text : '#5B5470' }}>
            {chunk.score.toFixed(2)}
          </span>
        </div>
      )}
    </motion.div>
  )
}
