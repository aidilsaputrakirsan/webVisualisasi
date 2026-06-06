export type Mode = 'linear' | 'binary'

export type Cue = 'compare' | 'eliminate' | 'found' | 'fail' | 'done' | null

export interface SearchStep {
  /** Index currently being inspected (linear: i, binary: mid) — amber. */
  activeIndex: number | null
  /** Index where the target was found — green. */
  foundIndex: number | null
  /** Linear: indices already compared and rejected (muted). */
  checked: number[]
  /** Binary: current search window [low, high]; null in linear mode. */
  low: number | null
  high: number | null
  line: number
  status: string
  sound: Cue
}

export const TARGET = 35

export const MODES: Record<
  Mode,
  { label: string; desc: string; time: string; filename: string; array: number[]; code: string[] }
> = {
  linear: {
    label: 'Linear Search',
    desc: 'Periksa satu per satu dari kiri · data tak perlu terurut',
    time: 'O(n)',
    filename: 'linear_search.py',
    array: [10, 25, 35, 50, 15, 40],
    code: [
      'def linear_search(arr, target):',
      '    for i in range(len(arr)):',
      '        if arr[i] == target:',
      '            return i',
      '    return -1',
    ],
  },
  binary: {
    label: 'Binary Search',
    desc: 'Bagi dua tiap langkah · HARUS terurut',
    time: 'O(log n)',
    filename: 'binary_search.py',
    array: [10, 15, 20, 25, 30, 35, 40, 45, 50],
    code: [
      'def binary_search(arr, target):',
      '    left, right = 0, len(arr) - 1',
      '    while left <= right:',
      '        mid = (left + right) // 2',
      '        if arr[mid] == target:',
      '            return mid',
      '        elif target < arr[mid]:',
      '            right = mid - 1',
      '        else:',
      '            left = mid + 1',
      '    return -1',
    ],
  },
}

function buildLinear(): SearchStep[] {
  const arr = MODES.linear.array
  const steps: SearchStep[] = []
  const checked: number[] = []

  const snap = (p: Partial<SearchStep>) =>
    steps.push({
      activeIndex: null,
      foundIndex: null,
      checked: [...checked],
      low: null,
      high: null,
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  for (let i = 0; i < arr.length; i++) {
    const match = arr[i] === TARGET
    snap({
      activeIndex: i,
      line: 2,
      status: `arr[${i}] = ${arr[i]} == ${TARGET}? ${match ? 'ya ✓' : 'tidak'}`,
      sound: 'compare',
    })
    if (match) {
      snap({ activeIndex: i, foundIndex: i, line: 3, status: `Ditemukan di index ${i}!`, sound: 'found' })
      return steps
    }
    checked.push(i)
  }

  snap({ line: 4, status: `Tidak ditemukan → return -1`, sound: 'fail' })
  return steps
}

function buildBinary(): SearchStep[] {
  const arr = MODES.binary.array
  const steps: SearchStep[] = []
  let low = 0
  let high = arr.length - 1

  const snap = (p: Partial<SearchStep>) =>
    steps.push({
      activeIndex: null,
      foundIndex: null,
      checked: [],
      low,
      high,
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  snap({ line: 1, status: `left = 0, right = ${high}`, sound: 'compare' })

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    snap({ activeIndex: mid, line: 3, status: `mid = ${mid}, arr[mid] = ${arr[mid]}`, sound: 'compare' })

    if (arr[mid] === TARGET) {
      snap({ activeIndex: mid, foundIndex: mid, line: 5, status: `arr[${mid}] == ${TARGET} → ditemukan!`, sound: 'found' })
      return steps
    } else if (TARGET < arr[mid]) {
      high = mid - 1
      snap({ activeIndex: mid, line: 7, status: `${TARGET} < ${arr[mid]} → right = ${high} (buang kanan)`, sound: 'eliminate' })
    } else {
      low = mid + 1
      snap({ activeIndex: mid, line: 9, status: `${TARGET} > ${arr[mid]} → left = ${low} (buang kiri)`, sound: 'eliminate' })
    }
  }

  snap({ line: 10, status: `left > right → tidak ditemukan (-1)`, sound: 'fail' })
  return steps
}

export function buildSteps(mode: Mode): SearchStep[] {
  return mode === 'linear' ? buildLinear() : buildBinary()
}
