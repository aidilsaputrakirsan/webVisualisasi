import type { CSSProperties, ReactNode } from 'react'
import { DRIVERS, smartCost, eligible, PHASES, type RideStep, type Driver } from './rideMatching'

const HEAD = '#5A6B63'
const LINE = '#D6E3DD'

export default function ScoreBoard({ step }: { step: RideStep }) {
  const decider = PHASES[step.phase].decider
  const showScore = step.phase === 'smart' || step.phase === 'batch'

  return (
    <div
      style={{
        width: 1000,
        borderRadius: 22,
        border: `1px solid ${LINE}`,
        background: '#FFFFFF',
        boxShadow: '0 6px 22px rgba(20,48,40,0.06)',
        overflow: 'hidden',
      }}
    >
      <HeaderRow decider={decider} showScore={showScore} />
      {DRIVERS.map((d) => (
        <DriverRow
          key={d.id}
          d={d}
          revealed={step.revealed.includes(d.id)}
          candidate={step.candidateId === d.id}
          chosen={step.chosenId === d.id}
          decider={decider}
          showScore={showScore}
        />
      ))}
    </div>
  )
}

function cellStyle(active: boolean, w: number): CSSProperties {
  return {
    width: w,
    flexShrink: 0,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'ui-monospace, monospace',
    background: active ? '#FEF3C7' : 'transparent',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}

function HeaderRow({ decider, showScore }: { decider: string; showScore: boolean }) {
  return (
    <div className="flex items-center" style={{ height: 52, padding: '0 22px', borderBottom: `1.5px solid ${LINE}`, color: HEAD, fontWeight: 700, background: '#F4F8F6' }}>
      <span style={{ width: 150, flexShrink: 0, fontSize: 19, fontFamily: 'ui-sans-serif, system-ui' }}>Driver</span>
      <div style={cellStyle(decider === 'dist', 120)}>Dist</div>
      <div style={cellStyle(decider === 'eta', 120)}>ETA</div>
      <div style={cellStyle(false, 110)}>Rating</div>
      <div style={cellStyle(false, 150)}>Heading</div>
      <div style={cellStyle(false, 110)}>Wait</div>
      {showScore && <div style={cellStyle(decider === 'score', 130)}>Score</div>}
    </div>
  )
}

function DriverRow({
  d,
  revealed,
  candidate,
  chosen,
  decider,
  showScore,
}: {
  d: Driver
  revealed: boolean
  candidate: boolean
  chosen: boolean
  decider: string
  showScore: boolean
}) {
  const isElig = eligible(d)
  const dim = !isElig
  const bg = chosen ? '#DCFCE7' : candidate ? '#FFFBEB' : 'transparent'
  const dash = (v: ReactNode) => (revealed && isElig ? v : <span style={{ color: '#C2CCD6' }}>—</span>)

  return (
    <div
      className="flex items-center"
      style={{
        height: 54,
        padding: '0 22px',
        borderBottom: `1px solid ${LINE}`,
        background: bg,
        opacity: dim ? 0.55 : 1,
        transition: 'background-color 0.25s',
      }}
    >
      <span className="flex items-center" style={{ width: 150, flexShrink: 0, gap: 9 }}>
        <span style={{ width: 12, height: 12, borderRadius: 999, background: d.color, flexShrink: 0 }} />
        <span style={{ fontSize: 20, fontWeight: 700, color: '#1C2A24', fontFamily: 'ui-sans-serif, system-ui' }}>{d.name}</span>
        {chosen && <span style={{ fontSize: 16, color: '#15803D', fontWeight: 700 }}>✓</span>}
      </span>

      {!isElig ? (
        <div style={{ flex: 1, textAlign: 'center', fontSize: 18, color: '#94A3B8', fontFamily: 'ui-monospace, monospace' }}>
          motorbike — filtered out (you ordered a car)
        </div>
      ) : (
        <>
          <div style={{ ...cellStyle(decider === 'dist', 120), color: '#2C3A34' }}>{dash(`${d.dist.toFixed(1)}`)}</div>
          <div style={{ ...cellStyle(decider === 'eta', 120), color: d.eta >= 10 ? '#B91C1C' : '#2C3A34', fontWeight: d.eta >= 10 ? 700 : 400 }}>{dash(`${d.eta}m`)}</div>
          <div style={{ ...cellStyle(false, 110), color: '#2C3A34' }}>{dash(`★${d.rating}`)}</div>
          <div style={{ ...cellStyle(false, 150), color: d.toward ? '#15803D' : '#B91C1C' }}>{dash(d.toward ? '→ you' : 'away')}</div>
          <div style={{ ...cellStyle(false, 110), color: '#2C3A34' }}>{dash(`${d.wait}m`)}</div>
          {showScore && (
            <div style={{ ...cellStyle(decider === 'score', 130), color: chosen ? '#15803D' : '#1C2A24', fontWeight: 700 }}>
              {dash(smartCost(d).toFixed(1))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
