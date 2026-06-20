import { motion } from 'framer-motion'
import { OC, type TopoStage } from './guide'
import { OCIcon } from './Icons'

/**
 * The hero diagram: your messaging Channels → the Gateway → your Agent (with
 * memory & skills) → the Models you control, all on infrastructure you own.
 * The active stage glows and the relevant edge "flows". This is the material's
 * signature visual (distinct from a loop ring or a pipeline).
 */

const W = 1000
const H = 540

const CHANNELS = [
  { label: 'iMessage', glyph: 'apple' },
  { label: 'Telegram', glyph: 'send' },
  { label: 'Slack', glyph: 'hash' },
  { label: 'WhatsApp', glyph: 'phone' },
  { label: 'Discord', glyph: 'game' },
  { label: 'Signal', glyph: 'shieldchat' },
]
const PROVIDERS = [
  { label: 'Anthropic', glyph: 'sparkles' },
  { label: 'OpenAI', glyph: 'swirl' },
  { label: 'Gemini', glyph: 'star' },
  { label: 'Ollama · local', glyph: 'home' },
]

const ORDER: TopoStage[] = ['channels', 'gateway', 'agent', 'models']

export default function Topology({ active }: { active: TopoStage }) {
  const all = active === 'all' || active === 'reply'
  const idx = ORDER.indexOf(active)
  const lit = (stage: TopoStage) => all || (idx >= 0 && ORDER.indexOf(stage) <= idx)

  const e1Lit = all || active === 'gateway' || idx >= 1
  const e2Lit = all || idx >= 2
  const e3Lit = all || idx >= 3
  const e1Flow = active === 'gateway' || active === 'reply'
  const e2Flow = active === 'agent' || active === 'reply'
  const e3Flow = active === 'models' || active === 'reply'

  return (
    <div className="relative" style={{ width: W, height: H }}>
      <svg width={W} height={H} className="absolute inset-0">
        <Edge x1={270} y1={250} x2={395} y2={150} lit={e1Lit} flow={e1Flow} />
        <Edge x1={500} y1={187} x2={500} y2={285} lit={e2Lit} flow={e2Flow} />
        <Edge x1={625} y1={345} x2={730} y2={270} lit={e3Lit} flow={e3Flow} />
      </svg>

      {/* Channels group */}
      <Group x={40} y={66} w={230} h={392} title="Your apps" sub="channels" lit={lit('channels')} accent={OC.cyan}>
        {CHANNELS.map((ch, i) => (
          <Chip key={ch.label} top={48 + i * 56} glyph={ch.glyph} label={ch.label} lit={lit('channels')} accent={OC.cyan} />
        ))}
      </Group>

      {/* Gateway */}
      <Node x={395} y={113} w={210} h={74} lit={lit('gateway')} accent={OC.emerald} glyph="plug" title="Gateway" sub="localhost · auth" />

      {/* Agent + memory/skills */}
      <Node x={375} y={285} w={250} h={120} lit={lit('agent')} accent={OC.emerald} glyph="agent" title="Your Agent" sub="runs on your box">
        <div className="flex" style={{ gap: 8, marginTop: 10 }}>
          <SubChip glyph="database" label="Memory" lit={lit('agent')} />
          <SubChip glyph="book" label="Skills" lit={lit('agent')} />
        </div>
      </Node>

      {/* Models group */}
      <Group x={730} y={116} w={230} h={300} title="Models you control" sub="cloud or local" lit={lit('models')} accent={OC.lime}>
        {PROVIDERS.map((p, i) => (
          <Chip key={p.label} top={58 + i * 56} glyph={p.glyph} label={p.label} lit={lit('models')} accent={OC.lime} />
        ))}
      </Group>
    </div>
  )
}

function Edge({ x1, y1, x2, y2, lit, flow }: { x1: number; y1: number; x2: number; y2: number; lit: boolean; flow: boolean }) {
  const color = lit ? OC.emerald : OC.line
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} strokeLinecap="round" opacity={lit ? 1 : 0.6} />
      {flow && (
        <motion.line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={OC.emeraldText}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="2 12"
          animate={{ strokeDashoffset: [0, -28] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </g>
  )
}

function Group({
  x, y, w, h, title, sub, lit, accent, children,
}: {
  x: number; y: number; w: number; h: number; title: string; sub: string; lit: boolean; accent: string; children: React.ReactNode
}) {
  return (
    <motion.div
      className="absolute rounded-3xl"
      style={{ left: x, top: y, width: w, height: h, border: '2px dashed', background: OC.panel }}
      animate={{ borderColor: lit ? accent : OC.line, boxShadow: lit ? `0 0 0 5px ${accent}1A` : 'none' }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-x-0 text-center" style={{ top: 14 }}>
        <div className="font-semibold" style={{ fontSize: 21, color: lit ? OC.ink : OC.inkSoft }}>{title}</div>
        <div className="font-mono" style={{ fontSize: 15, color: OC.inkFaint, letterSpacing: '0.08em' }}>{sub}</div>
      </div>
      {children}
    </motion.div>
  )
}

function Chip({ top, glyph, label, lit, accent }: { top: number; glyph: string; label: string; lit: boolean; accent: string }) {
  return (
    <motion.div
      className="absolute flex items-center rounded-xl"
      style={{ left: 16, right: 16, top, height: 46, gap: 12, padding: '0 14px', border: '1.5px solid', background: OC.panelSoft }}
      animate={{ borderColor: lit ? accent : OC.line, opacity: lit ? 1 : 0.7 }}
      transition={{ duration: 0.3 }}
    >
      <span style={{ color: lit ? accent : OC.inkFaint, display: 'flex' }}>
        <OCIcon name={glyph} size={24} />
      </span>
      <span className="font-semibold" style={{ fontSize: 20, color: lit ? OC.ink : OC.inkSoft }}>{label}</span>
    </motion.div>
  )
}

function Node({
  x, y, w, h, lit, accent, glyph, title, sub, children,
}: {
  x: number; y: number; w: number; h: number; lit: boolean; accent: string; glyph: string; title: string; sub: string; children?: React.ReactNode
}) {
  return (
    <motion.div
      className="absolute flex flex-col items-center justify-center rounded-2xl text-center"
      style={{ left: x, top: y, width: w, height: h, border: '2px solid', background: OC.panelHi }}
      animate={{
        borderColor: lit ? accent : OC.line,
        boxShadow: lit ? `0 0 0 6px ${accent}22, 0 10px 30px rgba(0,0,0,0.5)` : '0 4px 16px rgba(0,0,0,0.35)',
        scale: lit ? 1.03 : 1,
      }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      <div className="flex items-center" style={{ gap: 12 }}>
        <span style={{ color: lit ? accent : OC.inkFaint, display: 'flex' }}>
          <OCIcon name={glyph} size={30} strokeWidth={lit ? 2 : 1.8} />
        </span>
        <div className="flex flex-col items-start">
          <span className="font-semibold" style={{ fontSize: 24, color: lit ? OC.ink : OC.inkSoft, lineHeight: 1.05 }}>{title}</span>
          <span className="font-mono" style={{ fontSize: 15, color: OC.inkFaint }}>{sub}</span>
        </div>
      </div>
      {children}
    </motion.div>
  )
}

function SubChip({ glyph, label, lit }: { glyph: string; label: string; lit: boolean }) {
  return (
    <span
      className="flex items-center rounded-lg font-mono"
      style={{ gap: 7, padding: '5px 11px', fontSize: 16, border: `1px solid ${lit ? OC.emerald : OC.line}`, color: lit ? OC.emeraldText : OC.inkFaint, background: OC.panelSoft }}
    >
      <OCIcon name={glyph} size={18} />
      {label}
    </span>
  )
}
