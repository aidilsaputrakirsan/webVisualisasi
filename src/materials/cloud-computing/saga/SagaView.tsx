import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../palette'
import { SERVICES, type LogEntry, type SagaStep, type ServiceDef, type ServiceId, type ServiceState } from './saga'
import { BoxIcon, CardIcon, CartIcon, CheckIcon, CrossIcon, SpinnerIcon, TruckIcon, UndoIcon } from './Icons'

const FAIL = { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B', shadow: '0 4px 18px rgba(220,38,38,0.22)' }
const COMP = { border: '#D97706', bg: '#FDEBC8', text: '#92400E', shadow: '0 4px 16px rgba(217,119,6,0.22)' }
const GREY = { border: '#CBD0DC', bg: '#F1F2F6', text: '#8A8FA3', shadow: 'none' }

const ICON: Record<ServiceId, ({ size }: { size?: number }) => JSX.Element> = {
  order: CartIcon,
  payment: CardIcon,
  inventory: BoxIcon,
  shipping: TruckIcon,
}

function styleFor(s: ServiceState) {
  switch (s) {
    case 'committed':
      return NODE.done
    case 'running':
      return NODE.active
    case 'failed':
      return FAIL
    case 'compensating':
    case 'compensated':
      return COMP
    case 'skipped':
      return GREY
    default:
      return NODE.idle
  }
}

function chipFor(s: ServiceState): { label: string; icon: React.ReactNode; tone: { border: string; bg: string; text: string } } {
  switch (s) {
    case 'running':
      return { label: 'menjalankan', icon: <SpinnerIcon />, tone: NODE.active }
    case 'committed':
      return { label: 'commit', icon: <CheckIcon />, tone: NODE.done }
    case 'failed':
      return { label: 'gagal', icon: <CrossIcon />, tone: FAIL }
    case 'compensating':
      return { label: 'kompensasi', icon: <SpinnerIcon />, tone: COMP }
    case 'compensated':
      return { label: 'dibatalkan', icon: <UndoIcon />, tone: COMP }
    case 'skipped':
      return { label: 'dilewati', icon: <span style={{ fontSize: 13 }}>—</span>, tone: GREY }
    default:
      return { label: 'menunggu', icon: <span style={{ fontSize: 13 }}>○</span>, tone: NODE.idle }
  }
}

export default function SagaView({ step }: { step: SagaStep }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 22 }}>
      {/* Service chain */}
      <div className="flex items-stretch justify-center" style={{ gap: 14 }}>
        {SERVICES.map((svc, i) => (
          <div key={svc.id} className="flex items-center" style={{ gap: 14 }}>
            <ServiceCard def={svc} state={step.states[svc.id]} focused={step.current === svc.id} />
            {i < SERVICES.length - 1 && <Chevron />}
          </div>
        ))}
      </div>

      {/* Saga log */}
      <div className="overflow-hidden rounded-2xl border" style={{ width: 900, borderColor: '#E1E3EE', background: '#FFFFFF', boxShadow: '0 6px 18px rgba(20,24,40,0.06)' }}>
        <div className="flex items-center border-b" style={{ borderColor: '#ECEDF4', background: '#F3F2FA', padding: '10px 20px', gap: 11 }}>
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#C9BEEA' }} />
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#D6CDEF' }} />
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#CFD2E2' }} />
          <span className="ml-2 font-mono" style={{ fontSize: 16, color: '#8990A8' }}>
            saga.log
          </span>
        </div>
        <div className="flex flex-col" style={{ padding: '12px 18px', gap: 8, minHeight: 232 }}>
          {step.log.length === 0 && (
            <span className="font-mono" style={{ fontSize: 16, color: '#A6A9BC', padding: '6px 2px' }}>
              menunggu transaksi…
            </span>
          )}
          <AnimatePresence initial={false}>
            {step.log.map((entry, i) => (
              <LogLine key={i} entry={entry} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function ServiceCard({ def, state, focused }: { def: ServiceDef; state: ServiceState; focused: boolean }) {
  const st = styleFor(state)
  const chip = chipFor(state)
  const Icon = ICON[def.id]
  const struck = state === 'compensated'
  return (
    <motion.div
      animate={{
        borderColor: st.border,
        background: state === 'idle' ? '#FFFFFF' : st.bg,
        boxShadow: focused ? st.shadow : '0 1px 4px rgba(0,0,0,0.05)',
        scale: focused ? 1.04 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="flex flex-col rounded-2xl border-2"
      style={{ width: 196, padding: '14px 16px', gap: 9 }}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <motion.span animate={{ color: st.border }} style={{ display: 'flex' }}>
          <Icon size={26} />
        </motion.span>
        <span className="font-semibold" style={{ fontSize: 20, color: '#1B2233' }}>
          {def.name}
        </span>
      </div>

      <div className="flex flex-col font-mono" style={{ gap: 2, fontSize: 14 }}>
        <span style={{ color: state === 'committed' || state === 'running' ? '#166534' : '#6A6F84', textDecoration: struck ? 'line-through' : 'none' }}>
          T: {def.t}
        </span>
        <span style={{ color: state === 'compensating' || state === 'compensated' ? COMP.text : '#A6A9BC', fontWeight: state === 'compensating' ? 700 : 400 }}>
          C: {def.c}
        </span>
      </div>

      <motion.span
        animate={{ background: chip.tone.bg, color: chip.tone.text, borderColor: chip.tone.border }}
        className="flex items-center rounded-full border font-mono"
        style={{ fontSize: 13, padding: '3px 10px', gap: 6, alignSelf: 'flex-start' }}
      >
        <span style={{ display: 'flex', color: chip.tone.border }}>{chip.icon}</span>
        {chip.label}
      </motion.span>
    </motion.div>
  )
}

function Chevron() {
  return (
    <span className="font-mono" style={{ fontSize: 22, color: '#B9BECE' }}>
      →
    </span>
  )
}

function LogLine({ entry }: { entry: LogEntry }) {
  const tone = entry.kind === 'commit' ? NODE.done : entry.kind === 'fail' ? FAIL : COMP
  const Glyph = entry.kind === 'commit' ? CheckIcon : entry.kind === 'fail' ? CrossIcon : UndoIcon
  const svcName = SERVICES.find((s) => s.id === entry.service)?.name ?? entry.service
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="flex items-center font-mono"
      style={{ gap: 12, padding: '6px 12px', fontSize: 17 }}
    >
      <span className="rounded-md" style={{ display: 'flex', padding: 3, color: tone.text, background: tone.bg, border: `1px solid ${tone.border}` }}>
        <Glyph size={15} />
      </span>
      <span style={{ color: '#3A4256', minWidth: 110 }}>{svcName}</span>
      <span style={{ color: entry.kind === 'fail' ? FAIL.text : entry.kind === 'compensate' ? COMP.text : '#2D3A34' }}>{entry.text}</span>
    </motion.div>
  )
}
