import { AnimatePresence, motion } from 'framer-motion'
import { CarIcon, BikeIcon, PinIcon } from './Icons'
import {
  DRIVERS,
  DRIVER_MAP,
  ELIGIBLE,
  PICKUP,
  RIDER_B,
  eligible,
  type RideStep,
  type Driver,
} from './rideMatching'

const W = 1000
const H = 700
const M = 60 // inner margin so cars near the edge stay on the paper

const px = (x: number) => M + (x / 100) * (W - 2 * M)
const py = (y: number) => M + (y / 100) * (H - 2 * M)

/** Heading (deg, 0 = north) that points the car toward — or away from — pickup. */
function heading(d: Driver): number {
  const dx = PICKUP[0] - d.pos[0]
  const dy = PICKUP[1] - d.pos[1]
  const toPickup = (Math.atan2(dx, -dy) * 180) / Math.PI
  return d.toward ? toPickup : toPickup + 180
}

/** Manhattan (horizontal-then-vertical) route between two map points, in px. */
function routePath(a: [number, number], b: [number, number]): string {
  return `M ${px(a[0])} ${py(a[1])} L ${px(b[0])} ${py(a[1])} L ${px(b[0])} ${py(b[1])}`
}

const STREETS = [12.5, 25, 37.5, 50, 62.5, 75, 87.5]

export default function MapView({ step }: { step: RideStep }) {
  const phase = step.phase
  const dimas = DRIVER_MAP.dimas
  const pkx = px(PICKUP[0])
  const pky = py(PICKUP[1])

  const valueOf = (d: Driver) => (phase === 'nearest' ? `${d.dist.toFixed(1)} km` : `${d.eta} min`)
  const target = (to: 'you' | 'b'): [number, number] => (to === 'you' ? PICKUP : RIDER_B)
  const assignedTo = (id: string) => step.assignments.find((a) => a.driverId === id)?.to

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: W,
        height: H,
        borderRadius: 28,
        border: '1px solid #CFE0D8',
        background: 'linear-gradient(160deg, #FBFDFC 0%, #EEF5F1 100%)',
        boxShadow: 'inset 0 1px 20px rgba(20,48,40,0.05)',
      }}
    >
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {/* street grid */}
        {STREETS.map((v) => (
          <line key={`v${v}`} x1={px(v)} y1={M * 0.5} x2={px(v)} y2={H - M * 0.5} stroke="#DCE8E2" strokeWidth={v === 50 ? 10 : 6} strokeLinecap="round" />
        ))}
        {STREETS.map((h) => (
          <line key={`h${h}`} x1={M * 0.5} y1={py(h)} x2={W - M * 0.5} y2={py(h)} stroke="#DCE8E2" strokeWidth={h === 50 ? 10 : 6} strokeLinecap="round" />
        ))}

        {/* congestion on Dimas' road to pickup */}
        {step.traffic && (
          <path d={routePath(dimas.pos, PICKUP)} fill="none" stroke="#EF4444" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />
        )}

        {/* straight 'as the crow flies' lines */}
        {step.lines === 'straight' &&
          ELIGIBLE.map((d) => {
            const mx = (px(d.pos[0]) + pkx) / 2
            const my = (py(d.pos[1]) + pky) / 2
            return (
              <g key={`s${d.id}`}>
                <line x1={px(d.pos[0])} y1={py(d.pos[1])} x2={pkx} y2={pky} stroke={d.color} strokeWidth={2.5} strokeDasharray="7 7" opacity={0.7} />
                <g transform={`translate(${mx}, ${my})`}>
                  <rect x={-34} y={-15} width={68} height={28} rx={14} fill="#FFFFFF" opacity={0.92} stroke={d.color} strokeWidth={1.2} />
                  <text x={0} y={5} textAnchor="middle" fontSize={19} fontFamily="ui-monospace, monospace" fontWeight={700} fill={d.color}>
                    {d.dist.toFixed(1)} km
                  </text>
                </g>
              </g>
            )
          })}

        {/* single matched route */}
        {step.lines === 'route' && step.chosenId && step.assignments.length === 0 && (
          <motion.path
            key={step.chosenId}
            d={routePath(DRIVER_MAP[step.chosenId].pos, PICKUP)}
            fill="none"
            stroke="#15803D"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
          />
        )}

        {/* batch assignment routes */}
        {step.assignments.map((a) => (
          <motion.path
            key={`a${a.driverId}`}
            d={routePath(DRIVER_MAP[a.driverId].pos, target(a.to))}
            fill="none"
            stroke={a.to === 'you' ? '#15803D' : '#0EA5E9'}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
          />
        ))}
      </svg>

      {/* TRAFFIC tag */}
      {step.traffic && (
        <div
          className="absolute font-mono"
          style={{
            left: (px(dimas.pos[0]) + pkx) / 2 - 44,
            top: (py(dimas.pos[1]) + pky) / 2 - 30,
            fontSize: 16,
            fontWeight: 700,
            color: '#B91C1C',
            background: 'rgba(254,242,242,0.9)',
            border: '1px solid #FCA5A5',
            borderRadius: 999,
            padding: '2px 10px',
          }}
        >
          ⚠ traffic
        </div>
      )}

      {/* pickup pin (you) */}
      <Pin x={pkx} y={pky} color="#0D9488" label="You" pulse={step.pickupPulse} />

      {/* second rider (batch phase) */}
      {step.riderB && <Pin x={px(RIDER_B[0])} y={py(RIDER_B[1])} color="#0EA5E9" label="Rider B" pulse />}

      {/* drivers */}
      {step.driversShown &&
        DRIVERS.map((d) => {
          const isElig = eligible(d)
          const isCandidate = step.candidateId === d.id
          const toB = assignedTo(d.id) === 'b'
          const isChosen = step.chosenId === d.id || assignedTo(d.id) === 'you'
          const revealed = step.revealed.includes(d.id)
          const ring = isChosen ? '#15803D' : toB ? '#0EA5E9' : isCandidate ? d.color : null
          return (
            <motion.div
              key={d.id}
              className="absolute flex flex-col items-center"
              style={{ left: px(d.pos[0]), top: py(d.pos[1]), transform: 'translate(-50%, -50%)', zIndex: isChosen || isCandidate ? 5 : 2 }}
              animate={{ scale: isChosen ? 1.18 : isCandidate ? 1.12 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              {ring && (
                <span
                  className="absolute rounded-full"
                  style={{ width: 86, height: 86, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', boxShadow: `0 0 0 4px ${ring}`, background: `${ring}14` }}
                />
              )}
              {isElig ? <CarIcon color={d.color} rotate={heading(d)} /> : <BikeIcon color={d.color} rotate={heading(d)} opacity={0.55} />}
              <div
                className="flex items-center"
                style={{
                  gap: 7,
                  marginTop: 2,
                  padding: '3px 11px',
                  borderRadius: 999,
                  background: isChosen ? '#DCFCE7' : toB ? '#E0F2FE' : 'rgba(255,255,255,0.92)',
                  border: `1.5px solid ${isChosen ? '#15803D' : toB ? '#0EA5E9' : isElig ? `${d.color}66` : '#CBD5E1'}`,
                  boxShadow: '0 2px 8px rgba(20,48,40,0.08)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: isElig ? '#1C2A24' : '#94A3B8', fontFamily: 'ui-sans-serif, system-ui' }}>{d.name}</span>
                {!isElig ? (
                  <span style={{ fontSize: 15, color: '#94A3B8', fontFamily: 'ui-monospace, monospace' }}>car only ✗</span>
                ) : isChosen ? (
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#15803D', fontFamily: 'ui-monospace, monospace' }}>✓ matched</span>
                ) : toB ? (
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#0369A1', fontFamily: 'ui-monospace, monospace' }}>→ Rider B</span>
                ) : revealed ? (
                  <span style={{ fontSize: 16, fontWeight: 700, color: d.color, fontFamily: 'ui-monospace, monospace' }}>{valueOf(d)}</span>
                ) : null}
              </div>
            </motion.div>
          )
        })}

      {/* centered concept headline (intro / factor beats) */}
      <AnimatePresence>
        {step.note && (
          <motion.div
            key={step.note}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute"
            style={{ left: '50%', top: 18, transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 8 }}
          >
            <span
              style={{
                fontSize: 26,
                fontWeight: 700,
                fontFamily: 'ui-serif, Georgia, serif',
                color: '#163029',
                background: 'rgba(255,255,255,0.82)',
                border: '1px solid #CFE0D8',
                borderRadius: 999,
                padding: '8px 22px',
                whiteSpace: 'nowrap',
              }}
            >
              {step.note}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Pin({ x, y, color, label, pulse }: { x: number; y: number; color: string; label: string; pulse: boolean }) {
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -100%)', zIndex: 6 }}>
      {pulse && (
        <motion.span
          className="absolute rounded-full"
          style={{ left: '50%', top: '100%', width: 30, height: 30, transform: 'translate(-50%, -50%)', background: `${color}33` }}
          animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <PinIcon color={color} />
      <div
        className="absolute font-semibold"
        style={{ left: '50%', top: -30, transform: 'translateX(-50%)', fontSize: 18, color, whiteSpace: 'nowrap', fontFamily: 'ui-sans-serif, system-ui' }}
      >
        {label}
      </div>
    </div>
  )
}
