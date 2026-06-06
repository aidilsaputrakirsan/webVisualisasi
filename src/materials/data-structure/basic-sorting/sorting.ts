export type Mode = 'bubble' | 'selection' | 'insertion'

export type Cue = 'compare' | 'swap' | 'done' | null

export interface Cell {
  id: number
  value: number
}

export interface SortStep {
  cells: Cell[]
  /** Sorted prefix length (selection) — indices < sortedLeft are done. */
  sortedLeft: number
  /** Sorted suffix length (bubble) — indices >= n - sortedRight are done. */
  sortedRight: number
  /** Ids currently being compared (amber). */
  compareIds: number[]
  /** Selection: id of the current minimum (blue). */
  minId: number | null
  line: number
  status: string
  sound: Cue
}

export const MODES: Record<Mode, { label: string; desc: string; filename: string; array: number[]; code: string[] }> = {
  bubble: {
    label: 'Bubble Sort',
    desc: 'Tukar pasangan bersebelahan · elemen besar "menggelembung" ke kanan',
    filename: 'bubble_sort.py',
    array: [64, 34, 25, 12, 22],
    code: [
      'def bubble_sort(arr):',
      '    n = len(arr)',
      '    for i in range(n - 1):',
      '        swapped = False',
      '        for j in range(n - 1 - i):',
      '            if arr[j] > arr[j + 1]:',
      '                arr[j], arr[j+1] = arr[j+1], arr[j]',
      '                swapped = True',
      '        if not swapped:',
      '            break',
    ],
  },
  selection: {
    label: 'Selection Sort',
    desc: 'Cari elemen terkecil, taruh di depan · swap paling sedikit',
    filename: 'selection_sort.py',
    array: [64, 25, 12, 22, 11],
    code: [
      'def selection_sort(arr):',
      '    n = len(arr)',
      '    for i in range(n - 1):',
      '        min_idx = i',
      '        for j in range(i + 1, n):',
      '            if arr[j] < arr[min_idx]:',
      '                min_idx = j',
      '        if min_idx != i:',
      '            arr[i], arr[min_idx] = arr[min_idx], arr[i]',
    ],
  },
  insertion: {
    label: 'Insertion Sort',
    desc: 'Sisipkan tiap elemen ke posisi tepat di bagian terurut',
    filename: 'insertion_sort.py',
    array: [64, 34, 25, 12, 22],
    code: [
      'def insertion_sort(arr):',
      '    for i in range(1, len(arr)):',
      '        key = arr[i]',
      '        j = i - 1',
      '        while j >= 0 and arr[j] > key:',
      '            arr[j + 1] = arr[j]',
      '            j -= 1',
      '        arr[j + 1] = key',
    ],
  },
}

function buildBubble(): SortStep[] {
  const cells: Cell[] = MODES.bubble.array.map((value, i) => ({ id: i, value }))
  const n = cells.length
  const steps: SortStep[] = []
  let sortedRight = 0

  const snap = (p: Partial<SortStep>) =>
    steps.push({
      cells: cells.map((c) => ({ ...c })),
      sortedLeft: 0,
      sortedRight,
      compareIds: [],
      minId: null,
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  for (let i = 0; i < n - 1; i++) {
    let swapped = false
    for (let j = 0; j < n - 1 - i; j++) {
      const a = cells[j]
      const b = cells[j + 1]
      snap({ compareIds: [a.id, b.id], line: 5, status: `${a.value} > ${b.value}?`, sound: 'compare' })
      if (a.value > b.value) {
        ;[cells[j], cells[j + 1]] = [cells[j + 1], cells[j]]
        swapped = true
        snap({ compareIds: [a.id, b.id], line: 6, status: `Ya → tukar ${a.value} ↔ ${b.value}`, sound: 'swap' })
      }
    }
    sortedRight = i + 1
    snap({ line: 8, status: `Pass ${i + 1} selesai · ${cells[n - 1 - i].value} di posisi akhir` })
    if (!swapped) {
      snap({ line: 9, status: `Tidak ada swap → sudah terurut (early termination)` })
      break
    }
  }

  sortedRight = n
  snap({ sortedRight: n, line: 0, status: `Selesai · ${cells.map((c) => c.value).join(' ')}`, sound: 'done' })
  return steps
}

function buildSelection(): SortStep[] {
  const cells: Cell[] = MODES.selection.array.map((value, i) => ({ id: i, value }))
  const n = cells.length
  const steps: SortStep[] = []
  let sortedLeft = 0

  const snap = (p: Partial<SortStep>) =>
    steps.push({
      cells: cells.map((c) => ({ ...c })),
      sortedLeft,
      sortedRight: 0,
      compareIds: [],
      minId: null,
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i
    snap({ minId: cells[minIdx].id, line: 3, status: `Pass ${i + 1}: anggap min = ${cells[i].value}` })

    for (let j = i + 1; j < n; j++) {
      snap({
        compareIds: [cells[j].id],
        minId: cells[minIdx].id,
        line: 5,
        status: `${cells[j].value} < ${cells[minIdx].value}?`,
        sound: 'compare',
      })
      if (cells[j].value < cells[minIdx].value) {
        minIdx = j
        snap({ minId: cells[minIdx].id, line: 6, status: `min baru = ${cells[minIdx].value}`, sound: 'compare' })
      }
    }

    if (minIdx !== i) {
      const a = cells[i]
      const b = cells[minIdx]
      snap({ compareIds: [a.id, b.id], minId: b.id, line: 8, status: `Tukar ${a.value} ↔ ${b.value}`, sound: 'swap' })
      ;[cells[i], cells[minIdx]] = [cells[minIdx], cells[i]]
      snap({ compareIds: [a.id, b.id], line: 8, status: `${b.value} ditempatkan di index ${i}`, sound: 'swap' })
    } else {
      snap({ line: 7, status: `min sudah di tempat (index ${i})` })
    }
    sortedLeft = i + 1
    snap({ line: 2, status: `Index ${i} terurut` })
  }

  sortedLeft = n
  snap({ sortedLeft: n, line: 0, status: `Selesai · ${cells.map((c) => c.value).join(' ')}`, sound: 'done' })
  return steps
}

function buildInsertion(): SortStep[] {
  const cells: Cell[] = MODES.insertion.array.map((value, i) => ({ id: i, value }))
  const n = cells.length
  const steps: SortStep[] = []

  const snap = (sortedLeft: number, p: Partial<SortStep>) =>
    steps.push({
      cells: cells.map((c) => ({ ...c })),
      sortedLeft,
      sortedRight: 0,
      compareIds: [],
      minId: null,
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  snap(1, { line: 0, status: `Elemen pertama (${cells[0].value}) dianggap terurut` })

  for (let i = 1; i < n; i++) {
    const keyId = cells[i].id
    const keyVal = cells[i].value
    const region = i + 1
    snap(region, { compareIds: [keyId], line: 2, status: `Ambil key = ${keyVal}` })

    let j = i
    while (j > 0 && cells[j - 1].value > keyVal) {
      snap(region, {
        compareIds: [cells[j - 1].id, keyId],
        line: 4,
        status: `${cells[j - 1].value} > ${keyVal}? geser ke kanan`,
        sound: 'compare',
      })
      ;[cells[j - 1], cells[j]] = [cells[j], cells[j - 1]]
      snap(region, { compareIds: [keyId], line: 5, status: `Geser ${cells[j].value} ke kanan`, sound: 'swap' })
      j--
    }

    snap(region, { compareIds: [keyId], line: 7, status: `Sisipkan ${keyVal} di posisinya`, sound: 'swap' })
  }

  snap(n, { line: 0, status: `Selesai · ${cells.map((c) => c.value).join(' ')}`, sound: 'done' })
  return steps
}

export function buildSteps(mode: Mode): SortStep[] {
  if (mode === 'bubble') return buildBubble()
  if (mode === 'selection') return buildSelection()
  return buildInsertion()
}
