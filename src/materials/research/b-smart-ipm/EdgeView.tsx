import { AnimatePresence, motion } from 'framer-motion'
import { NODE } from '../../../shared/theme'
import { SENSORS, MODULES, type SensorId, type ModuleId, type Step } from './edgeLoop'
import {
  LightIcon, PirIcon, CameraIcon, ClimateIcon, PowerIcon,
  FilterIcon, GateIcon, GaugeIcon, RainIcon, TrapIcon, DeterrentIcon, SunIcon, MoonIcon,
} from './Icons'

const BOARD_W = 960
const SPRING = { type: 'spring', stiffness: 300, damping: 26 } as const

/** Red "reject" style — the one state the shared semantic NODE set doesn't cover. */
const REJECT = { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B', shadow: '0 2px 12px rgba(220,38,38,0.18)' }

const SENSOR_ICON: Record<SensorId, (p: { size?: number }) => JSX.Element> = {
  light: LightIcon, pir: PirIcon, camera: CameraIcon, climate: ClimateIcon, power: PowerIcon,
}
const MODULE_ICON: Record<ModuleId, (p: { size?: number }) => JSX.Element> = {
  trap: TrapIcon, deterrent: DeterrentIcon,
}

/** Colour the attack-level bar by severity. */
function levelColor(level: number) {
  if (level >= 70) return REJECT
  if (level >= 35) return NODE.active
  return NODE.done
}

export default function EdgeView({ step }: { step: Step }) {
  const sensing = step.phase === 'sense'
  const deciding = step.phase === 'decide'

  return (
    <div className="flex flex-col" style={{ width: BOARD_W, gap: 16 }}>
      {/* ── Context strip: day/night · clock · power ── */}
      <ContextStrip step={step} />

      {/* ── Sensors  |  Edge gateway ── */}
      <div className="flex" style={{ gap: 16 }}>
        {/* Sensor bus */}
        <div
          className="flex flex-col rounded-2xl border-2"
          style={{ width: 360, padding: '16px 16px', gap: 9, borderColor: NODE.idle.border, background: '#FBFCF7' }}
        >
          <span className="font-mono font-semibold" style={{ fontSize: 15, color: '#7C8A6C', letterSpacing: 1 }}>
            JALUR SENSOR
          </span>
          {SENSORS.map((s) => {
            const lit = (sensing || deciding) && step.triggers.includes(s.id)
            const Icon = SENSOR_ICON[s.id]
            const st = lit ? NODE.active : NODE.idle
            return (
              <motion.div
                key={s.id}
                className="flex items-center rounded-xl border-2"
                animate={{
                  borderColor: lit ? st.border : '#E5E2D2',
                  background: lit ? st.bg : '#FFFFFF',
                  scale: lit ? 1.02 : 1,
                  boxShadow: lit ? st.shadow : 'none',
                }}
                transition={SPRING}
                style={{ gap: 11, padding: '9px 12px' }}
              >
                <motion.span animate={{ color: lit ? st.border : '#A6B295' }} style={{ display: 'flex', flexShrink: 0 }}>
                  <Icon size={26} />
                </motion.span>
                <div className="flex flex-col" style={{ gap: 1, minWidth: 0 }}>
                  <span className="font-semibold" style={{ fontSize: 19, color: '#2A3120', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                  <span className="font-mono" style={{ fontSize: 13.5, color: '#9AA889', whiteSpace: 'nowrap' }}>
                    {s.spec}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Edge gateway */}
        <div
          className="flex flex-1 flex-col rounded-2xl border-2"
          style={{ padding: '16px 18px', gap: 12, borderColor: NODE.idle.border, background: '#FFFFFF' }}
        >
          <div className="flex items-center" style={{ gap: 10 }}>
            <span className="font-semibold" style={{ fontSize: 22, color: '#2A3120' }}>Edge Gateway</span>
            <span className="font-mono" style={{ fontSize: 15, color: '#9AA889' }}>di perangkat · tanpa cloud</span>
          </div>

          {/* live reading */}
          <div
            className="flex items-center rounded-xl"
            style={{ padding: '9px 14px', minHeight: 46, background: '#F4F6EE', border: '1px dashed #CFD8BD' }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={step.reading}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="font-mono"
                style={{ fontSize: 18, color: '#3A4430' }}
              >
                {step.reading}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* three checks */}
          <CheckRow
            icon={FilterIcon}
            label="Filter pemicu palsu"
            value={step.checks.filter === 'idle' ? '—' : step.checks.filter === 'pass' ? 'lolos' : 'tolak'}
            st={step.checks.filter === 'pass' ? NODE.done : step.checks.filter === 'reject' ? REJECT : NODE.idle}
          />
          <CheckRow
            icon={RainIcon}
            label="Gerbang cuaca"
            value={step.checks.weather === 'idle' ? '—' : step.checks.weather === 'ok' ? 'cerah · aman' : 'tahan · hujan'}
            st={step.checks.weather === 'ok' ? NODE.done : step.checks.weather === 'hold' ? NODE.active : NODE.idle}
          />
          <CheckRow
            icon={GateIcon}
            label={`Gerbang konteks · ${step.env === 'night' ? 'malam' : 'siang'}`}
            value={step.checks.context === 'idle' ? '—' : step.checks.context === 'ok' ? 'jendela terbuka' : 'terblokir'}
            st={step.checks.context === 'ok' ? NODE.done : step.checks.context === 'blocked' ? REJECT : NODE.idle}
          />

          {/* attack-level gauge */}
          <div className="flex items-center rounded-xl border-2" style={{ gap: 12, padding: '9px 13px', borderColor: '#E5E2D2', background: '#FFFFFF' }}>
            <span style={{ display: 'flex', color: levelColor(step.checks.level).border, flexShrink: 0 }}>
              <GaugeIcon size={24} />
            </span>
            <div className="flex flex-1 flex-col" style={{ gap: 5, minWidth: 0 }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ fontSize: 18, color: '#2A3120' }}>Level serangan</span>
                <span className="font-mono font-semibold" style={{ fontSize: 18, color: levelColor(step.checks.level).text }}>
                  {step.checks.level}
                </span>
              </div>
              <div style={{ height: 9, borderRadius: 999, background: '#ECEFE2', overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${step.checks.level}%`, background: levelColor(step.checks.level).border }}
                  transition={SPRING}
                  style={{ height: '100%', borderRadius: 999 }}
                />
              </div>
            </div>
          </div>

          {/* decision chip */}
          <div className="flex items-center" style={{ gap: 10 }}>
            <span className="font-mono" style={{ fontSize: 15, color: '#9AA889' }}>KEPUTUSAN</span>
            <AnimatePresence mode="wait">
              {step.decision ? (
                <motion.span
                  key={step.decision}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="rounded-full border-2 font-mono font-semibold"
                  style={{
                    padding: '5px 16px', fontSize: 18,
                    borderColor: step.decision === 'activate' ? NODE.done.border : REJECT.border,
                    background: step.decision === 'activate' ? NODE.done.bg : REJECT.bg,
                    color: step.decision === 'activate' ? NODE.done.text : REJECT.text,
                  }}
                >
                  {step.decision === 'activate' ? 'AKTIFKAN' : 'TAHAN'}
                </motion.span>
              ) : (
                <span className="font-mono" style={{ fontSize: 18, color: '#B7C2A6' }}>menunggu…</span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Actuator modules ── */}
      <div className="flex" style={{ gap: 16 }}>
        {MODULES.map((m) => {
          const active = step.activeModule === m.id
          const Icon = MODULE_ICON[m.id]
          const st = NODE.active
          return (
            <motion.div
              key={m.id}
              className="flex flex-1 flex-col rounded-2xl border-2"
              animate={{
                borderColor: active ? st.border : NODE.idle.border,
                background: active ? st.bg : '#FFFFFF',
                boxShadow: active ? st.shadow : 'none',
              }}
              transition={SPRING}
              style={{ padding: '14px 18px', gap: 8, minHeight: 104 }}
            >
              <div className="flex items-center" style={{ gap: 11 }}>
                <motion.span animate={{ color: active ? st.border : '#A6B295' }} style={{ display: 'flex' }}>
                  <Icon size={30} />
                </motion.span>
                <div className="flex flex-col" style={{ gap: 1 }}>
                  <span className="font-semibold" style={{ fontSize: 21, color: '#2A3120' }}>{m.label}</span>
                  <span className="font-mono" style={{ fontSize: 14, color: '#9AA889' }}>{m.spec}</span>
                </div>
                <span className="ml-auto font-mono" style={{ fontSize: 14, color: m.window === 'night' ? '#5B6BA8' : '#B07A2E' }}>
                  {m.window === 'night' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
                </span>
              </div>
              <AnimatePresence>
                {active && step.pattern && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg font-mono"
                    style={{ padding: '7px 12px', fontSize: 16, background: '#FFFFFF', border: `1px solid ${st.border}`, color: st.text }}
                  >
                    {step.pattern}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* ── Event log → dashboard ── */}
      <div
        className="flex flex-col rounded-2xl border-2"
        style={{ padding: '14px 18px', gap: 9, borderColor: NODE.idle.border, background: '#FBFCF7', minHeight: 116 }}
      >
        <div className="flex items-center" style={{ gap: 10 }}>
          <span className="font-semibold" style={{ fontSize: 20, color: '#2A3120' }}>Log kejadian</span>
          <span className="font-mono" style={{ fontSize: 14, color: '#9AA889' }}>dashboard · umpan rekomendasi</span>
        </div>
        {step.log.length === 0 ? (
          <span style={{ fontSize: 18, color: '#A6B295', fontStyle: 'italic' }}>belum ada kejadian</span>
        ) : (
          <div className="flex flex-col" style={{ gap: 7 }}>
            <AnimatePresence>
              {step.log.slice(0, 3).map((e) => {
                const ok = e.result === 'activated'
                const st = ok ? NODE.done : REJECT
                return (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={SPRING}
                    className="flex items-center rounded-xl border"
                    style={{ gap: 12, padding: '8px 13px', borderColor: st.border, background: st.bg }}
                  >
                    <span className="font-mono" style={{ fontSize: 15, color: st.text, flexShrink: 0 }}>{e.time}</span>
                    <span style={{ fontSize: 18, color: '#2A3120', whiteSpace: 'nowrap' }}>{e.label}</span>
                    <span
                      className="ml-auto rounded-full font-mono font-semibold"
                      style={{ padding: '3px 12px', fontSize: 14, background: '#FFFFFF', border: `1px solid ${st.border}`, color: st.text }}
                    >
                      {e.result === 'activated' ? 'aktif' : 'ditahan'}
                    </span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── small parts ─────────────────────────────────────────── */

function ContextStrip({ step }: { step: Step }) {
  const night = step.env === 'night'
  const tint = night
    ? { border: '#5B6BA8', bg: '#E9ECF7', text: '#3A4576' }
    : { border: '#C08A2E', bg: '#FBF1DD', text: '#8A621F' }
  return (
    <div className="flex items-center rounded-2xl border-2" style={{ gap: 16, padding: '11px 18px', borderColor: NODE.idle.border, background: '#FFFFFF' }}>
      <span
        className="flex items-center rounded-full font-semibold"
        style={{ gap: 9, padding: '6px 15px', fontSize: 19, border: `2px solid ${tint.border}`, background: tint.bg, color: tint.text }}
      >
        <span style={{ display: 'flex' }}>{night ? <MoonIcon size={22} /> : <SunIcon size={22} />}</span>
        {night ? 'Malam' : 'Siang'}
      </span>
      <span className="font-mono" style={{ fontSize: 20, color: '#2A3120' }}>{step.time}</span>
      <div className="ml-auto flex items-center" style={{ gap: 18 }}>
        <Metric label="BATERAI" value={`${step.battery}%`} />
        <Metric label="SURYA" value={`${step.solar.toFixed(1)} V`} />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      <span className="font-mono" style={{ fontSize: 13.5, color: '#9AA889', letterSpacing: 1 }}>{label}</span>
      <span className="font-mono font-semibold" style={{ fontSize: 19, color: '#3C6E22' }}>{value}</span>
    </div>
  )
}

function CheckRow({
  icon: Icon,
  label,
  value,
  st,
}: {
  icon: (p: { size?: number }) => JSX.Element
  label: string
  value: string
  st: { border: string; bg: string; text: string }
}) {
  const idle = value === '—'
  return (
    <motion.div
      className="flex items-center rounded-xl border-2"
      animate={{ borderColor: idle ? '#E5E2D2' : st.border, background: idle ? '#FFFFFF' : st.bg }}
      transition={SPRING}
      style={{ gap: 12, padding: '9px 13px' }}
    >
      <span style={{ display: 'flex', color: idle ? '#A6B295' : st.border, flexShrink: 0 }}>
        <Icon size={24} />
      </span>
      <span className="font-semibold" style={{ fontSize: 18, color: '#2A3120' }}>{label}</span>
      <span className="ml-auto font-mono font-semibold" style={{ fontSize: 17, color: idle ? '#B7C2A6' : st.text }}>
        {value}
      </span>
    </motion.div>
  )
}
