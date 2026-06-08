import { motion } from 'framer-motion'
import { LANES, MAXTOTAL, laneTotal, type CompareStep, type Lane, type Segment } from './jwt'

const TRACK_W = 660
const PX = TRACK_W / MAXTOTAL

const FAIL = { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B' }
const OK = { border: '#15803D', bg: '#DCFCE7', text: '#166534' }

const SEG_COLOR: Record<Segment['kind'], string> = {
  normal: '#E7E3F6',
  auth: '#FCA5A5',
  verify: '#99F6E4',
  db: '#BFDBFE',
}

export default function CombinedView({ step }: { step: CompareStep }) {
  return (
    <div className="flex flex-col" style={{ gap: 20 }}>
      {LANES.map((lane) => (
        <LaneRow key={lane.id} lane={lane} t={step.t} />
      ))}
    </div>
  )
}

function LaneRow({ lane, t }: { lane: Lane; t: number }) {
  const total = laneTotal(lane)
  const reached = Math.min(t, total)
  const packetX = reached * PX
  const done = t >= total
  const authLoad = lane.authLoadAt != null && t >= lane.authLoadAt ? 1 : 0
  const authTone = lane.authLoadAt != null ? (authLoad ? FAIL : { border: '#D6D8E2', bg: '#F1F1F6', text: '#8A8FA3' }) : OK

  return (
    <div className="flex flex-col rounded-2xl border-2" style={{ width: TRACK_W + 40, padding: '12px 20px', gap: 10, borderColor: done ? OK.border : '#D9DCE9', background: '#FFFFFF' }}>
      {/* header */}
      <div className="flex items-center" style={{ gap: 12 }}>
        <span className="font-semibold" style={{ fontSize: 20, color: '#1B2233', whiteSpace: 'nowrap' }}>
          {lane.label}
        </span>
        <span className="ml-auto font-mono font-semibold" style={{ fontSize: 22, color: done ? OK.text : '#39405A' }}>
          {reached}ms
        </span>
        <span
          className="rounded-full border font-mono"
          style={{ fontSize: 13, padding: '2px 10px', borderColor: authTone.border, background: authTone.bg, color: authTone.text, whiteSpace: 'nowrap' }}
        >
          Auth {authLoad}
        </span>
        {done && (
          <span className="rounded-full border font-mono font-semibold" style={{ fontSize: 13, padding: '2px 10px', borderColor: OK.border, background: OK.bg, color: OK.text }}>
            ✓ 201
          </span>
        )}
      </div>

      {/* track */}
      <div className="relative" style={{ width: TRACK_W, height: 42 }}>
        {/* segments */}
        <div className="flex h-full overflow-hidden rounded-lg" style={{ width: total * PX, border: '1px solid #E3E1EE' }}>
          {lane.segments.map((seg, i) => (
            <div
              key={i}
              className="flex items-center justify-center font-mono"
              style={{ width: seg.w * PX, background: SEG_COLOR[seg.kind], fontSize: 13, color: seg.kind === 'auth' ? '#991B1B' : '#4A4E66', whiteSpace: 'nowrap', overflow: 'hidden', borderRight: i < lane.segments.length - 1 ? '1px solid rgba(255,255,255,0.7)' : 'none' }}
            >
              {seg.label}
            </div>
          ))}
        </div>

        {/* traveled overlay */}
        <motion.div
          animate={{ width: packetX }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="absolute inset-y-0 left-0 rounded-lg"
          style={{ background: 'rgba(109,69,217,0.16)', borderRight: '2px solid #6D45D9' }}
        />

        {/* packet */}
        <motion.div
          animate={{ left: packetX }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="absolute rounded-full"
          style={{ top: '50%', width: 16, height: 16, marginTop: -8, marginLeft: -8, background: done ? OK.border : '#6D45D9', boxShadow: '0 1px 6px rgba(0,0,0,0.2)' }}
        />
      </div>
    </div>
  )
}
