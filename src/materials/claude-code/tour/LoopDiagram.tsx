import { motion } from 'framer-motion'
import { CC, type LoopPhase, type LoopState } from './guide'
import { CCIcon } from './Icons'

/**
 * The heart of Claude Code: an animated ring showing reason → act → observe,
 * repeating, with prompt feeding in and respond coming out. The active station
 * glows; a rotating arc traces the current edge of the loop.
 */

const W = 600
const H = 560
const CX = 300
const CY = 268
const R = 196

// station angles (degrees, 0 = top, clockwise)
const STATIONS: { id: LoopPhase; label: string; glyph: string; angle: number }[] = [
  { id: 'reason', label: 'Reason', glyph: 'think', angle: 0 },
  { id: 'act', label: 'Act', glyph: 'zap', angle: 90 },
  { id: 'observe', label: 'Observe', glyph: 'eye', angle: 180 },
  { id: 'prompt', label: 'Prompt', glyph: 'pencil', angle: 270 },
]

function pos(angle: number, r = R) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

const ORDER: LoopPhase[] = ['prompt', 'reason', 'act', 'observe']

export default function LoopDiagram({ loop, compact = false }: { loop: LoopState; compact?: boolean }) {
  const { phase, iteration, tool, caption } = loop
  const respond = phase === 'respond'
  const activeIdx = ORDER.indexOf(phase)

  return (
    <div className="relative" style={{ width: W, height: H, transform: compact ? 'scale(0.82)' : 'none', transformOrigin: 'top center' }}>
      {/* loop track */}
      <svg width={W} height={H} className="absolute inset-0">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={CC.line} strokeWidth={2} strokeDasharray="2 10" />
        {/* directional ticks between stations */}
        {STATIONS.map((s) => {
          const a = pos(s.angle + 45)
          return <ArrowTick key={s.angle} x={a.x} y={a.y} angle={s.angle + 45} />
        })}
      </svg>

      {/* central hub */}
      <motion.div
        className="absolute flex flex-col items-center justify-center rounded-full text-center"
        style={{
          left: CX - 96,
          top: CY - 96,
          width: 192,
          height: 192,
          background: CC.panel,
          border: `2px solid ${respond ? CC.green : CC.coral}`,
        }}
        animate={{
          boxShadow: respond
            ? '0 0 0 8px rgba(134,184,107,0.10), 0 10px 40px rgba(0,0,0,0.5)'
            : '0 0 0 8px rgba(217,119,87,0.10), 0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        <span className="font-mono" style={{ fontSize: 18, color: CC.inkFaint, letterSpacing: '0.12em' }}>
          TURN {Math.max(iteration, 1)}
        </span>
        <span className="font-serif font-semibold" style={{ fontSize: 38, color: respond ? CC.green : CC.coralText, marginTop: 2 }}>
          {respond ? 'Respond' : labelOf(phase)}
        </span>
        {tool && !respond && (
          <span
            className="mt-2 rounded-full font-mono"
            style={{ fontSize: 18, padding: '3px 15px', background: 'rgba(217,119,87,0.16)', color: CC.coralText, border: `1px solid ${CC.coral}` }}
          >
            {tool}
          </span>
        )}
        <span className="font-mono" style={{ fontSize: 16, color: CC.inkFaint, marginTop: tool && !respond ? 6 : 10 }}>
          ↻ loops until done
        </span>
      </motion.div>

      {/* stations */}
      {STATIONS.map((s) => {
        const p = pos(s.angle)
        const isActive = !respond && s.id === phase
        const isPast = respond || (activeIdx >= 0 && ORDER.indexOf(s.id) < activeIdx)
        const accent = isActive ? CC.coral : isPast ? CC.green : CC.line
        const textCol = isActive ? CC.coralText : isPast ? CC.green : CC.inkFaint
        return (
          <motion.div
            key={s.id}
            className="absolute flex items-center gap-3 rounded-2xl"
            style={{ left: p.x - 84, top: p.y - 33, width: 168, height: 66, justifyContent: 'center', border: `2px solid ${CC.line}` }}
            animate={{
              background: isActive ? CC.panelHi : CC.panel,
              borderColor: accent,
              boxShadow: isActive ? `0 0 0 6px ${CC.coral}22, 0 8px 26px rgba(0,0,0,0.45)` : '0 4px 16px rgba(0,0,0,0.3)',
              scale: isActive ? 1.06 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <span style={{ color: textCol, display: 'flex' }}>
              <CCIcon name={s.glyph} size={30} strokeWidth={isActive ? 2 : 1.8} />
            </span>
            <span className="font-semibold" style={{ fontSize: 27, color: textCol }}>
              {s.label}
            </span>
          </motion.div>
        )
      })}

      {/* prompt-in label */}
      <div className="absolute font-mono" style={{ left: 8, top: CY - 96, fontSize: 18, color: CC.inkFaint }}>
        goal&nbsp;→
      </div>

      {/* respond-out arrow */}
      <motion.div
        className="absolute flex items-center gap-2 font-mono"
        style={{ left: CX - 76, top: H - 40, fontSize: 21, color: CC.green }}
        animate={{ opacity: respond ? 1 : 0.18 }}
      >
        → final answer ✓
      </motion.div>

      {/* caption */}
      <Caption text={caption} />
    </div>
  )
}

function Caption({ text }: { text: string }) {
  return (
    <div
      className="absolute font-mono"
      style={{ left: 0, right: 0, top: H + 4, textAlign: 'center', fontSize: 22, color: CC.inkSoft }}
    >
      {text}
    </div>
  )
}

function ArrowTick({ x, y, angle }: { x: number; y: number; angle: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M -6 -6 L 6 0 L -6 6" fill="none" stroke={CC.inkFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function labelOf(phase: LoopPhase): string {
  switch (phase) {
    case 'prompt':
      return 'Prompt'
    case 'reason':
      return 'Reason'
    case 'act':
      return 'Act'
    case 'observe':
      return 'Observe'
    default:
      return 'Idle'
  }
}
