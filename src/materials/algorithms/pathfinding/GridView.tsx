import { COLS, GOAL, ROWS, START, WALLS, type PfStep } from './pathfinding'

const CELL = 52
const GAP = 3

const COLOR = {
  empty: '#FFFFFF',
  emptyBorder: '#E3E7EF',
  wall: '#3A4256',
  start: '#0EA5E9',
  goal: '#EF4444',
  frontier: '#FBBF24',
  current: '#FB923C',
  path: '#22C55E',
}

/** Gradient applied to visited cells by discovery order (cyan → indigo → violet). */
const STOPS = [
  [0x67, 0xe8, 0xf9],
  [0x81, 0x8c, 0xf8],
  [0xc0, 0x84, 0xfc],
]
function heat(t: number): string {
  const x = Math.max(0, Math.min(1, t)) * (STOPS.length - 1)
  const i = Math.floor(x)
  const f = x - i
  const a = STOPS[i]
  const b = STOPS[Math.min(i + 1, STOPS.length - 1)]
  const ch = (k: number) => Math.round(a[k] + (b[k] - a[k]) * f)
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`
}

export default function GridView({ step }: { step: PfStep }) {
  const visitedOrder = new Map<number, number>()
  step.visited.forEach((id, k) => visitedOrder.set(id, k))
  const maxOrder = Math.max(1, step.visited.length - 1)
  const frontier = new Set(step.frontier)
  const path = new Set(step.path)

  const cells: { bg: string; border?: string; label?: string; ring?: boolean }[] = []
  for (let i = 0; i < COLS * ROWS; i++) {
    if (WALLS.has(i)) {
      cells.push({ bg: COLOR.wall })
      continue
    }
    if (i === START) {
      cells.push({ bg: COLOR.start, label: 'S' })
      continue
    }
    if (i === GOAL) {
      cells.push({ bg: path.has(i) ? COLOR.path : COLOR.goal, label: 'G' })
      continue
    }
    if (path.has(i)) {
      cells.push({ bg: COLOR.path })
      continue
    }
    if (i === step.current) {
      cells.push({ bg: COLOR.current, ring: true })
      continue
    }
    if (frontier.has(i)) {
      cells.push({ bg: COLOR.frontier })
      continue
    }
    if (visitedOrder.has(i)) {
      cells.push({ bg: heat(visitedOrder.get(i)! / maxOrder) })
      continue
    }
    cells.push({ bg: COLOR.empty, border: COLOR.emptyBorder })
  }

  return (
    <div className="flex flex-col items-center" style={{ gap: 16 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
          gridAutoRows: `${CELL}px`,
          gap: GAP,
        }}
      >
        {cells.map((c, i) => (
          <div
            key={i}
            style={{
              borderRadius: 7,
              background: c.bg,
              border: c.border ? `1.5px solid ${c.border}` : '1.5px solid transparent',
              boxShadow: c.ring ? '0 0 0 4px rgba(245,158,11,0.45)' : 'none',
              transition: 'background-color 0.16s ease, box-shadow 0.16s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 24,
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {c.label}
          </div>
        ))}
      </div>

      {/* Legend + stats */}
      <div className="flex items-center justify-center" style={{ gap: 18, flexWrap: 'wrap' }}>
        <Legend swatch={COLOR.start} label="Start" />
        <Legend swatch={COLOR.goal} label="Goal" />
        <Legend swatch={COLOR.frontier} label="Frontier" />
        <Legend swatch={`linear-gradient(90deg, ${heat(0)}, ${heat(0.5)}, ${heat(1)})`} label="Dieksplor" />
        <Legend swatch={COLOR.path} label="Jalur" />
        <Legend swatch={COLOR.wall} label="Dinding" />
      </div>

      <div className="flex items-center justify-center font-mono" style={{ gap: 22, fontSize: 19, color: '#3A4256' }}>
        <span>dieksplor: <b>{step.exploredCount}</b></span>
        <span>frontier: <b>{step.frontier.length}</b></span>
        <span>jalur: <b>{step.pathLen != null ? step.pathLen - 1 : '—'}</b></span>
      </div>
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center font-mono" style={{ gap: 7, fontSize: 16, color: '#4A4E66' }}>
      <span style={{ width: 18, height: 18, borderRadius: 5, background: swatch, border: '1px solid rgba(0,0,0,0.08)' }} />
      {label}
    </span>
  )
}
