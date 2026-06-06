export type Mode = 'merge' | 'quick' | 'heap'

export type Cue = 'compare' | 'swap' | 'done' | null

export interface Cell {
  id: number
  value: number
}

export interface AdvStep {
  cells: Cell[]
  /** Ids being compared (amber). */
  compareIds: number[]
  /** Quick: pivot id (violet). */
  pivotId: number | null
  /** Active sub-range bracket [lo, hi]; null when none. */
  rangeLo: number | null
  rangeHi: number | null
  /** Indices already in their final sorted position (green). */
  sorted: number[]
  /** Pointer labels under bars, keyed by index, e.g. { 4: 'j' }. */
  pointers: Record<number, string>
  line: number
  status: string
  sound: Cue
}

const ARRAY = [38, 27, 43, 3, 9, 82, 10]

export const MODES: Record<Mode, { label: string; desc: string; filename: string; code: string[] }> = {
  merge: {
    label: 'Merge Sort',
    desc: 'Divide & Conquer · bagi dua, lalu gabung (merge) terurut',
    filename: 'merge_sort.py',
    code: [
      'def merge_sort(arr, lo, hi):',
      '    if lo >= hi: return',
      '    mid = (lo + hi) // 2',
      '    merge_sort(arr, lo, mid)',
      '    merge_sort(arr, mid + 1, hi)',
      '    merge(arr, lo, mid, hi)',
      '',
      'def merge(arr, lo, mid, hi):',
      '    L, R = arr[lo:mid+1], arr[mid+1:hi+1]',
      '    i = j = 0',
      '    for k in range(lo, hi + 1):',
      '        if j >= len(R) or (i < len(L)',
      '                and L[i] <= R[j]):',
      '            arr[k] = L[i]; i += 1',
      '        else:',
      '            arr[k] = R[j]; j += 1',
    ],
  },
  quick: {
    label: 'Quick Sort',
    desc: 'Divide & Conquer · pivot + partisi (Lomuto), in-place',
    filename: 'quick_sort.py',
    code: [
      'def quick_sort(arr, low, high):',
      '    if low < high:',
      '        p = partition(arr, low, high)',
      '        quick_sort(arr, low, p - 1)',
      '        quick_sort(arr, p + 1, high)',
      '',
      'def partition(arr, low, high):',
      '    pivot = arr[high]',
      '    i = low - 1',
      '    for j in range(low, high):',
      '        if arr[j] <= pivot:',
      '            i += 1',
      '            arr[i], arr[j] = arr[j], arr[i]',
      '    arr[i+1], arr[high] = arr[high], arr[i+1]',
      '    return i + 1',
    ],
  },
  heap: {
    label: 'Heap Sort',
    desc: 'Build max-heap, lalu ambil max ke belakang berulang · in-place',
    filename: 'heap_sort.py',
    code: [
      'def heap_sort(arr):',
      '    n = len(arr)',
      '    for i in range(n//2 - 1, -1, -1):',
      '        heapify(arr, n, i)      # build max heap',
      '    for i in range(n - 1, 0, -1):',
      '        arr[0], arr[i] = arr[i], arr[0]',
      '        heapify(arr, i, 0)',
      '',
      'def heapify(arr, n, i):',
      '    largest = i',
      '    l, r = 2*i + 1, 2*i + 2',
      '    if l < n and arr[l] > arr[largest]:',
      '        largest = l',
      '    if r < n and arr[r] > arr[largest]:',
      '        largest = r',
      '    if largest != i:',
      '        arr[i], arr[largest] = arr[largest], arr[i]',
      '        heapify(arr, n, largest)',
    ],
  },
}

// ── Merge Sort ───────────────────────────────────────────────────────────────

function buildMerge(): AdvStep[] {
  const cells: Cell[] = ARRAY.map((value, i) => ({ id: i, value }))
  const n = cells.length
  const steps: AdvStep[] = []
  const sorted: number[] = []

  const snap = (p: Partial<AdvStep>) =>
    steps.push({
      cells: cells.map((c) => ({ ...c })),
      compareIds: [],
      pivotId: null,
      rangeLo: null,
      rangeHi: null,
      sorted: [...sorted],
      pointers: {},
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  const merge = (lo: number, mid: number, hi: number) => {
    const L = cells.slice(lo, mid + 1)
    const R = cells.slice(mid + 1, hi + 1)
    snap({ rangeLo: lo, rangeHi: hi, line: 7, status: `Merge [${lo}..${mid}] & [${mid + 1}..${hi}]` })
    let i = 0
    let j = 0
    for (let k = lo; k <= hi; k++) {
      if (i < L.length && j < R.length) {
        snap({
          rangeLo: lo,
          rangeHi: hi,
          compareIds: [L[i].id, R[j].id],
          line: 11,
          status: `${L[i].value} ≤ ${R[j].value}?`,
          sound: 'compare',
        })
      }
      let chosen: Cell
      if (j >= R.length || (i < L.length && L[i].value <= R[j].value)) {
        chosen = L[i++]
      } else {
        chosen = R[j++]
      }
      cells[k] = chosen
      snap({ rangeLo: lo, rangeHi: hi, compareIds: [chosen.id], line: 13, status: `Ambil ${chosen.value}`, sound: 'swap' })
    }
  }

  const msort = (lo: number, hi: number) => {
    if (lo >= hi) return
    const mid = (lo + hi) >> 1
    snap({ rangeLo: lo, rangeHi: hi, line: 2, status: `Bagi [${lo}..${hi}] → mid ${mid}` })
    msort(lo, mid)
    msort(mid + 1, hi)
    merge(lo, mid, hi)
  }

  snap({ line: 0, status: `Merge Sort: ${ARRAY.join(' ')}` })
  msort(0, n - 1)
  for (let i = 0; i < n; i++) sorted.push(i)
  snap({ sorted: [...sorted], line: 0, status: `Selesai · ${cells.map((c) => c.value).join(' ')}`, sound: 'done' })
  return steps
}

// ── Quick Sort (Lomuto, pivot = last) ─────────────────────────────────────────

function buildQuick(): AdvStep[] {
  const cells: Cell[] = ARRAY.map((value, i) => ({ id: i, value }))
  const n = cells.length
  const steps: AdvStep[] = []
  const sorted: number[] = []

  const snap = (p: Partial<AdvStep>) =>
    steps.push({
      cells: cells.map((c) => ({ ...c })),
      compareIds: [],
      pivotId: null,
      rangeLo: null,
      rangeHi: null,
      sorted: [...sorted],
      pointers: {},
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  const partition = (low: number, high: number): number => {
    const pivotId = cells[high].id
    const pivotVal = cells[high].value
    snap({ rangeLo: low, rangeHi: high, pivotId, pointers: { [high]: 'pivot' }, line: 7, status: `pivot = ${pivotVal}` })
    let i = low - 1
    for (let j = low; j < high; j++) {
      snap({
        rangeLo: low,
        rangeHi: high,
        pivotId,
        compareIds: [cells[j].id],
        pointers: { [high]: 'pivot', [j]: 'j', ...(i >= low ? { [i]: 'i' } : {}) },
        line: 10,
        status: `${cells[j].value} ≤ ${pivotVal}?`,
        sound: 'compare',
      })
      if (cells[j].value <= pivotVal) {
        i++
        if (i !== j) {
          ;[cells[i], cells[j]] = [cells[j], cells[i]]
          snap({
            rangeLo: low,
            rangeHi: high,
            pivotId,
            compareIds: [cells[i].id, cells[j].id],
            pointers: { [high]: 'pivot', [i]: 'i', [j]: 'j' },
            line: 12,
            status: `${cells[i].value} ≤ pivot → tukar ke kiri`,
            sound: 'swap',
          })
        }
      }
    }
    ;[cells[i + 1], cells[high]] = [cells[high], cells[i + 1]]
    const p = i + 1
    sorted.push(p)
    snap({ rangeLo: low, rangeHi: high, pivotId, sorted: [...sorted], line: 13, status: `Pivot ${pivotVal} → posisi akhir ${p}`, sound: 'swap' })
    return p
  }

  const quick = (low: number, high: number) => {
    if (low > high) return
    if (low === high) {
      if (!sorted.includes(low)) sorted.push(low)
      snap({ sorted: [...sorted], status: `${cells[low].value} sudah di tempat` })
      return
    }
    const p = partition(low, high)
    quick(low, p - 1)
    quick(p + 1, high)
  }

  snap({ line: 0, status: `Quick Sort: ${ARRAY.join(' ')}` })
  quick(0, n - 1)
  snap({ sorted: Array.from({ length: n }, (_, i) => i), line: 0, status: `Selesai · ${cells.map((c) => c.value).join(' ')}`, sound: 'done' })
  return steps
}

// ── Heap Sort (max-heap, in-place) ────────────────────────────────────────────

function buildHeap(): AdvStep[] {
  const cells: Cell[] = ARRAY.map((value, i) => ({ id: i, value }))
  const n = cells.length
  const steps: AdvStep[] = []
  const sorted: number[] = []

  const snap = (p: Partial<AdvStep>) =>
    steps.push({
      cells: cells.map((c) => ({ ...c })),
      compareIds: [],
      pivotId: null,
      rangeLo: null,
      rangeHi: null,
      sorted: [...sorted],
      pointers: {},
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  const heapify = (size: number, i: number) => {
    let largest = i
    const l = 2 * i + 1
    const r = 2 * i + 2
    snap({ rangeLo: 0, rangeHi: size - 1, pivotId: cells[i].id, pointers: { [i]: 'i' }, line: 9, status: `Heapify node idx ${i} (${cells[i].value})` })

    if (l < size) {
      snap({
        rangeLo: 0,
        rangeHi: size - 1,
        pivotId: cells[i].id,
        compareIds: [cells[l].id, cells[largest].id],
        pointers: { [i]: 'i', [l]: 'L' },
        line: 11,
        status: `anak kiri ${cells[l].value} > ${cells[largest].value}?`,
        sound: 'compare',
      })
      if (cells[l].value > cells[largest].value) largest = l
    }
    if (r < size) {
      snap({
        rangeLo: 0,
        rangeHi: size - 1,
        pivotId: cells[i].id,
        compareIds: [cells[r].id, cells[largest].id],
        pointers: { [i]: 'i', [r]: 'R' },
        line: 13,
        status: `anak kanan ${cells[r].value} > ${cells[largest].value}?`,
        sound: 'compare',
      })
      if (cells[r].value > cells[largest].value) largest = r
    }
    if (largest !== i) {
      ;[cells[i], cells[largest]] = [cells[largest], cells[i]]
      snap({ rangeLo: 0, rangeHi: size - 1, pivotId: cells[largest].id, line: 16, status: `Tukar ${cells[i].value} ↔ ${cells[largest].value}`, sound: 'swap' })
      heapify(size, largest)
    }
  }

  snap({ line: 0, status: `Heap Sort: ${ARRAY.join(' ')}` })
  // Phase 1: build max heap
  snap({ line: 2, status: `Tahap 1: bangun Max Heap` })
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i)
  snap({ rangeLo: 0, rangeHi: n - 1, line: 3, status: `Max Heap terbentuk: ${cells.map((c) => c.value).join(' ')}` })

  // Phase 2: extract max repeatedly
  for (let i = n - 1; i > 0; i--) {
    ;[cells[0], cells[i]] = [cells[i], cells[0]]
    sorted.push(i)
    snap({ rangeLo: 0, rangeHi: i - 1, sorted: [...sorted], line: 5, status: `Pindahkan max ${cells[i].value} ke akhir`, sound: 'swap' })
    heapify(i, 0)
  }
  sorted.push(0)
  snap({ sorted: [...sorted], line: 0, status: `Selesai · ${cells.map((c) => c.value).join(' ')}`, sound: 'done' })
  return steps
}

export function buildSteps(mode: Mode): AdvStep[] {
  if (mode === 'merge') return buildMerge()
  if (mode === 'quick') return buildQuick()
  return buildHeap()
}
