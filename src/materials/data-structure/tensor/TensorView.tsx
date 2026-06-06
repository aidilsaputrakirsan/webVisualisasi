import { motion } from 'framer-motion'
import { MODES, type Mode } from './tensor'

const BOX = 78
const GAP = 12
const STRIDE = BOX + GAP
const DX = 46
const DY = 46

function cellStyle(visible: boolean, highlight: boolean) {
  return {
    opacity: visible ? 1 : 0,
    scale: visible ? (highlight ? 1.12 : 1) : 0.3,
    borderColor: highlight ? '#D97706' : '#3B82F6',
    backgroundColor: highlight ? '#FDEBC8' : '#DBEAFE',
    color: highlight ? '#92400E' : '#1E40AF',
  }
}

function Layer({
  values,
  rows,
  cols,
  baseOrder,
  revealed,
  label,
}: {
  values: number[]
  rows: number
  cols: number
  baseOrder: number
  revealed: number
  label?: string
}) {
  const w = cols * BOX + (cols - 1) * GAP
  const h = rows * BOX + (rows - 1) * GAP
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {label && (
        <span className="absolute font-mono" style={{ top: -30, left: 0, fontSize: 18, color: '#9C8F7B' }}>
          {label}
        </span>
      )}
      {values.map((val, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        const order = baseOrder + i
        const visible = order < revealed
        const highlight = order === revealed - 1
        return (
          <motion.div
            key={i}
            className="absolute flex items-center justify-center rounded-xl font-mono font-bold"
            style={{ left: col * STRIDE, top: row * STRIDE, width: BOX, height: BOX, fontSize: 30, borderWidth: 3, borderStyle: 'solid' }}
            animate={cellStyle(visible, highlight)}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            {val}
          </motion.div>
        )
      })}
    </div>
  )
}

export default function TensorView({ mode, revealed }: { mode: Mode; revealed: number }) {
  const def = MODES[mode]

  if (mode !== 'tensor') {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 320 }}>
        <Layer values={def.cells} rows={def.rows} cols={def.cols} baseOrder={0} revealed={revealed} />
      </div>
    )
  }

  // 3-D tensor: stack layers diagonally for depth.
  const perLayer = def.rows * def.cols
  const layerW = def.cols * BOX + (def.cols - 1) * GAP
  const layerH = def.rows * BOX + (def.rows - 1) * GAP
  const totalW = layerW + (def.layers - 1) * DX
  const totalH = layerH + (def.layers - 1) * DY

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 360 }}>
      <div className="relative" style={{ width: totalW, height: totalH }}>
        {Array.from({ length: def.layers }, (_, L) => {
          const values = def.cells.slice(L * perLayer, (L + 1) * perLayer)
          return (
            <div
              key={L}
              className="absolute"
              style={{ left: L * DX, top: (def.layers - 1 - L) * DY, zIndex: def.layers - L }}
            >
              <Layer values={values} rows={def.rows} cols={def.cols} baseOrder={L * perLayer} revealed={revealed} label={`Layer ${L}`} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
