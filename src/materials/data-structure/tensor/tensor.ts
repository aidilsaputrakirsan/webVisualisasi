export type Mode = 'scalar' | 'vector' | 'matrix' | 'tensor'

export type Cue = 'reveal' | 'done' | null

export interface TensorStep {
  /** How many cells are revealed so far. */
  revealed: number
  line: number
  status: string
  sound: Cue
}

export interface ModeDef {
  label: string
  dim: string
  shape: string
  ndim: number
  example: string
  layers: number
  rows: number
  cols: number
  /** Cell values in reveal order (layer-major, then row-major). */
  cells: number[]
  filename: string
  code: string[]
}

export const MODES: Record<Mode, ModeDef> = {
  scalar: {
    label: 'Scalar',
    dim: '0-D',
    shape: '()',
    ndim: 0,
    example: 'Suhu: 36.5°C',
    layers: 1,
    rows: 1,
    cols: 1,
    cells: [42],
    filename: 'scalar.py',
    code: ['import numpy as np', '', 'scalar = np.array(42)', '# shape: (), ndim: 0'],
  },
  vector: {
    label: 'Vector',
    dim: '1-D',
    shape: '(4,)',
    ndim: 1,
    example: 'Harga saham 4 hari',
    layers: 1,
    rows: 1,
    cols: 4,
    cells: [1, 2, 3, 4],
    filename: 'vector.py',
    code: ['import numpy as np', '', 'vector = np.array([1, 2, 3, 4])', '# shape: (4,), ndim: 1'],
  },
  matrix: {
    label: 'Matrix',
    dim: '2-D',
    shape: '(2, 3)',
    ndim: 2,
    example: 'Gambar grayscale (baris × kolom)',
    layers: 1,
    rows: 2,
    cols: 3,
    cells: [1, 2, 3, 4, 5, 6],
    filename: 'matrix.py',
    code: ['import numpy as np', '', 'matrix = np.array([[1, 2, 3],', '                   [4, 5, 6]])', '# shape: (2, 3), ndim: 2'],
  },
  tensor: {
    label: 'Tensor 3-D',
    dim: '3-D',
    shape: '(3, 2, 2)',
    ndim: 3,
    example: 'Gambar RGB (tinggi × lebar × channel)',
    layers: 3,
    rows: 2,
    cols: 2,
    cells: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    filename: 'tensor_3d.py',
    code: [
      'import numpy as np',
      '',
      't = np.array([[[1, 2], [3, 4]],',
      '              [[5, 6], [7, 8]],',
      '              [[9, 10], [11, 12]]])',
      '# shape: (3, 2, 2), ndim: 3',
    ],
  },
}

export function buildSteps(mode: Mode): TensorStep[] {
  const def = MODES[mode]
  const total = def.cells.length
  const steps: TensorStep[] = []
  const perLayer = def.rows * def.cols

  steps.push({ revealed: 0, line: 2, status: `${def.label} (${def.dim}) — mulai membangun`, sound: null })

  for (let k = 1; k <= total; k++) {
    const idx = k - 1
    const layer = Math.floor(idx / perLayer)
    const within = idx % perLayer
    const row = Math.floor(within / def.cols)
    const col = within % def.cols
    const val = def.cells[idx]

    let status: string
    if (mode === 'scalar') status = `Scalar = ${val} (nilai tunggal, tanpa shape)`
    else if (mode === 'vector') status = `v[${col}] = ${val}`
    else if (mode === 'matrix') status = `m[${row}][${col}] = ${val}`
    else status = `t[${layer}][${row}][${col}] = ${val}`

    steps.push({ revealed: k, line: 2, status, sound: 'reveal' })
  }

  steps.push({
    revealed: total,
    line: def.code.length - 1,
    status: `shape ${def.shape}, ndim ${def.ndim} · ${def.example}`,
    sound: 'done',
  })
  return steps
}
