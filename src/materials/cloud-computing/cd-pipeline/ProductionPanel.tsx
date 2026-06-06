import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../../../shared/theme'
import type { CdStep, ServiceStatus, ServiceView } from './cd'
import { BrowserIcon, CloudIcon, DatabaseIcon, GlobeIcon, LockIcon, ServerIcon } from './Icons'

const SVC_ICON = {
  backend: ServerIcon,
  frontend: BrowserIcon,
  db: DatabaseIcon,
} as const

function styleFor(status: ServiceStatus) {
  if (status === 'live') return NODE.done
  if (status === 'deploying') return NODE.active
  return NODE.idle
}

function label(status: ServiceStatus) {
  if (status === 'live') return 'live'
  if (status === 'deploying') return 'deploying…'
  return 'belum deploy'
}

function ServiceChip({ service, pulsing }: { service: ServiceView; pulsing: boolean }) {
  const st = styleFor(service.status)
  const Icon = SVC_ICON[service.id]
  return (
    <motion.div
      animate={{
        borderColor: st.border,
        background: service.status === 'idle' ? '#FFFFFF' : st.bg,
        scale: pulsing ? [1, 1.04, 1] : 1,
      }}
      transition={{ scale: { repeat: pulsing ? Infinity : 0, duration: 1 } }}
      className="flex flex-col items-center rounded-xl border-2"
      style={{ width: 168, padding: '14px 10px', gap: 6 }}
    >
      <motion.span animate={{ color: st.border }} style={{ display: 'flex' }}>
        <Icon size={30} />
      </motion.span>
      <span className="font-semibold" style={{ fontSize: 19, color: '#211C16' }}>
        {service.label}
      </span>
      <span className="font-mono" style={{ fontSize: 14, color: '#9C8F7B' }}>
        {service.host}
      </span>
      <motion.span
        animate={{ color: st.text, borderColor: st.border, background: st.bg }}
        className="flex items-center rounded-full border font-mono"
        style={{ fontSize: 14, padding: '2px 10px', gap: 6 }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.border }} />
        {label(service.status)}
      </motion.span>
    </motion.div>
  )
}

export default function ProductionPanel({ step }: { step: CdStep }) {
  const deployingId =
    step.focus === 'deployBe' ? 'backend' : step.focus === 'deployFe' ? 'frontend' : null

  return (
    <div
      className="flex flex-col items-center rounded-2xl border-2"
      style={{ width: 700, borderColor: NODE.info.border, background: '#F4F8FE', padding: 20, gap: 16 }}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <span style={{ color: NODE.info.border, display: 'flex' }}>
          <CloudIcon size={26} />
        </span>
        <span className="font-semibold" style={{ fontSize: 22, color: NODE.info.text }}>
          Railway Cloud
        </span>
      </div>

      <div className="flex items-stretch justify-center" style={{ gap: 16 }}>
        {step.services.map((s) => (
          <ServiceChip key={s.id} service={s} pulsing={deployingId === s.id} />
        ))}
      </div>

      {/* Public URL bar — muncul saat production live */}
      <AnimatePresence>
        {step.live && step.url && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="flex items-center rounded-full border-2 font-mono"
            style={{
              gap: 10,
              padding: '9px 22px',
              fontSize: 19,
              borderColor: NODE.done.border,
              background: NODE.done.bg,
              color: NODE.done.text,
            }}
          >
            <span style={{ display: 'flex' }}>
              <LockIcon size={17} />
            </span>
            https://{step.url}
            <span style={{ display: 'flex', color: NODE.done.border }}>
              <GlobeIcon size={17} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
