import { motion } from 'framer-motion'
import { NODE } from '../../../shared/theme'
import type { CdStep, StageId, StageStatus, StageView } from './cd'
import {
  BranchIcon,
  BrowserIcon,
  CheckIcon,
  DotIcon,
  FlaskIcon,
  GlobeIcon,
  PulseIcon,
  ServerIcon,
  SkipIcon,
  SpinnerIcon,
} from './Icons'

const SKIP = { border: '#C9BFAE', bg: '#F2EDE4', text: '#A89E90', shadow: '0 1px 4px rgba(0,0,0,0.04)' }

const STAGE_ICON: Record<StageId, ({ size }: { size?: number }) => JSX.Element> = {
  ci: FlaskIcon,
  gate: BranchIcon,
  deployBe: ServerIcon,
  deployFe: BrowserIcon,
  health: PulseIcon,
  live: GlobeIcon,
}

function styleFor(status: StageStatus) {
  switch (status) {
    case 'pass':
      return NODE.done
    case 'running':
      return NODE.active
    case 'skip':
      return SKIP
    default:
      return NODE.idle
  }
}

function Glyph({ status }: { status: StageStatus }) {
  if (status === 'pass') return <span style={{ color: NODE.done.border, display: 'flex' }}><CheckIcon /></span>
  if (status === 'running') return <span style={{ color: NODE.active.border, display: 'flex' }}><SpinnerIcon /></span>
  if (status === 'skip') return <span style={{ color: SKIP.text, display: 'flex' }}><SkipIcon /></span>
  return <span style={{ color: '#C2B7A4', display: 'flex' }}><DotIcon /></span>
}

function StageRow({ stage, focused, gateBlocked }: { stage: StageView; focused: boolean; gateBlocked: boolean }) {
  const st = styleFor(stage.status)
  const Icon = STAGE_ICON[stage.id]
  const dashed = stage.status === 'skip'
  // The gate row gets a small verdict tag once decided.
  const verdict =
    stage.id === 'gate' && stage.status === 'pass'
      ? gateBlocked
        ? { ...SKIP, tag: 'ditutup' }
        : { ...NODE.done, tag: 'terbuka' }
      : null

  return (
    <motion.div
      layout
      animate={{
        borderColor: st.border,
        boxShadow: focused ? st.shadow : '0 1px 3px rgba(0,0,0,0.04)',
        scale: focused ? 1.015 : 1,
        opacity: stage.status === 'skip' ? 0.72 : 1,
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="flex items-center rounded-xl border-2"
      style={{
        width: 640,
        background: stage.status === 'idle' ? '#FFFFFF' : st.bg,
        padding: '12px 18px',
        gap: 14,
        borderStyle: dashed ? 'dashed' : 'solid',
      }}
    >
      <motion.span animate={{ color: st.border }} style={{ display: 'flex' }}>
        <Icon size={26} />
      </motion.span>
      <div className="flex flex-col" style={{ gap: 2 }}>
        <span className="font-semibold" style={{ fontSize: 22, color: stage.status === 'skip' ? '#9C8F7B' : '#211C16' }}>
          {stage.label}
        </span>
        <span className="font-mono" style={{ fontSize: 15, color: '#9C8F7B' }}>
          {stage.sub}
        </span>
      </div>

      <div className="ml-auto flex items-center" style={{ gap: 12 }}>
        {verdict && (
          <span
            className="rounded-full border font-mono"
            style={{ fontSize: 15, padding: '3px 11px', background: verdict.bg, color: verdict.text, borderColor: verdict.border }}
          >
            {verdict.tag}
          </span>
        )}
        <Glyph status={stage.status} />
      </div>
    </motion.div>
  )
}

function Link({ active, done }: { active: boolean; done: boolean }) {
  const color = done ? NODE.done.border : active ? NODE.active.border : '#D3C8B6'
  return (
    <div className="flex justify-center" style={{ height: 16 }}>
      <motion.div animate={{ background: color }} style={{ width: 3, height: 16, borderRadius: 2 }} />
    </div>
  )
}

export default function StageFlow({ step }: { step: CdStep }) {
  const gateBlocked = step.gate === 'blocked'
  return (
    <div className="flex flex-col items-center">
      {step.stages.map((stage, i) => {
        const prev = step.stages[i - 1]
        return (
          <div key={stage.id} className="flex flex-col items-center">
            {i > 0 && (
              <Link
                active={prev.status === 'running' || stage.status === 'running'}
                done={prev.status === 'pass' && stage.status !== 'idle' && stage.status !== 'skip'}
              />
            )}
            <StageRow stage={stage} focused={step.focus === stage.id} gateBlocked={gateBlocked} />
          </div>
        )
      })}
    </div>
  )
}
