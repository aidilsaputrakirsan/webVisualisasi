/**
 * Algorithm Race EP. 01 — four sorting algorithms on the SAME shuffled array,
 * precomputed frame by frame.
 *
 * Fair clock: 1 tick = 1 comparison (the standard way to compare sorts).
 * Swaps / writes land in the tick of the comparison that caused them, so a
 * lane's finish time is simply its comparison count ÷ RATE. Nothing is tuned:
 * the finishing order falls out of the algorithms themselves.
 */

export type Algo = 'merge' | 'quick' | 'insertion' | 'bubble'

/** One tick: the array after this comparison, and the two indices compared. */
export interface Frame {
  v: number[]
  a: number
  b: number
}

export interface Lane {
  algo: Algo
  label: string
  /** Big-O shown on the result card. */
  big: string
  frames: Frame[]
  compares: number
}

export const N = 40
/** Comparisons per second of race time (at 1× speed). */
export const RATE = 48
export const HOOK_S = 2.4
export const RESULT_S = 3.4

/** Deterministic shuffle of 1..N so every run (and every lane) is identical. */
function shuffled(n: number, seed = 20260926): number[] {
  const a = Array.from({ length: n }, (_, i) => i + 1)
  let s = seed
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const START = shuffled(N)

/** Records one frame per comparison; writes patch the latest frame. */
function recorder(input: number[]) {
  const cur = [...input]
  const frames: Frame[] = []
  const patch = (i: number) => {
    const last = frames[frames.length - 1]
    if (last) last.v[i] = cur[i]
  }
  return {
    cur,
    frames,
    /** Is cur[i] > cur[j]? Costs one tick. */
    greater(i: number, j: number) {
      frames.push({ v: [...cur], a: i, b: j })
      return cur[i] > cur[j]
    },
    /** Compare two values that live at positions i and j (e.g. from an aux copy). */
    greaterVal(x: number, y: number, i: number, j: number) {
      frames.push({ v: [...cur], a: i, b: j })
      return x > y
    },
    swap(i: number, j: number) {
      ;[cur[i], cur[j]] = [cur[j], cur[i]]
      patch(i)
      patch(j)
    },
    write(i: number, value: number) {
      cur[i] = value
      patch(i)
    },
  }
}

function bubble(input: number[]) {
  const r = recorder(input)
  for (let end = input.length - 1; end > 0; end--) {
    let swapped = false
    for (let i = 0; i < end; i++) {
      if (r.greater(i, i + 1)) {
        r.swap(i, i + 1)
        swapped = true
      }
    }
    if (!swapped) break
  }
  return r.frames
}

function insertion(input: number[]) {
  const r = recorder(input)
  for (let i = 1; i < input.length; i++) {
    for (let j = i; j > 0 && r.greater(j - 1, j); j--) r.swap(j - 1, j)
  }
  return r.frames
}

function quick(input: number[]) {
  const r = recorder(input)
  const sort = (lo: number, hi: number) => {
    if (lo >= hi) return
    // Lomuto partition, last element as pivot.
    let store = lo
    for (let j = lo; j < hi; j++) {
      if (r.greater(hi, j)) {
        r.swap(store, j)
        store++
      }
    }
    r.swap(store, hi)
    sort(lo, store - 1)
    sort(store + 1, hi)
  }
  sort(0, input.length - 1)
  return r.frames
}

function merge(input: number[]) {
  const r = recorder(input)
  const sort = (lo: number, hi: number) => {
    if (lo >= hi) return
    const mid = (lo + hi) >> 1
    sort(lo, mid)
    sort(mid + 1, hi)
    const left = r.cur.slice(lo, mid + 1)
    const right = r.cur.slice(mid + 1, hi + 1)
    let i = 0
    let j = 0
    let k = lo
    while (i < left.length && j < right.length) {
      if (r.greaterVal(left[i], right[j], k, mid + 1 + j)) r.write(k++, right[j++])
      else r.write(k++, left[i++])
    }
    while (i < left.length) r.write(k++, left[i++])
    while (j < right.length) r.write(k++, right[j++])
  }
  sort(0, input.length - 1)
  return r.frames
}

const ALGOS: { algo: Algo; label: string; big: string; run: (a: number[]) => Frame[] }[] = [
  { algo: 'merge', label: 'Merge Sort', big: 'n log n', run: merge },
  { algo: 'quick', label: 'Quick Sort', big: 'n log n', run: quick },
  { algo: 'insertion', label: 'Insertion Sort', big: 'n²', run: insertion },
  { algo: 'bubble', label: 'Bubble Sort', big: 'n²', run: bubble },
]

export function buildLanes(): Lane[] {
  return ALGOS.map(({ algo, label, big, run }) => {
    const frames = run(START)
    // Closing frame: fully sorted, nothing highlighted.
    frames.push({ v: Array.from({ length: N }, (_, i) => i + 1), a: -1, b: -1 })
    return { algo, label, big, frames, compares: frames.length - 1 }
  })
}

// ── Timeline (captions as precomputed beats over race time) ─────────────────

export interface Beat {
  start: number
  end: number
  caption: string
  sub: string
}

export interface Timeline {
  lanes: Lane[]
  /** Lane indices sorted by finish (fewest comparisons first). */
  order: number[]
  raceS: number
  totalS: number
  beats: Beat[]
}

export const finishS = (lane: Lane) => lane.compares / RATE

export function buildTimeline(): Timeline {
  const lanes = buildLanes()
  const order = lanes.map((_, i) => i).sort((a, b) => lanes[a].compares - lanes[b].compares)
  const raceS = Math.max(...lanes.map(finishS)) + 0.4
  const first = lanes[order[0]]
  const last = lanes[order[order.length - 1]]
  const t0 = HOOK_S
  const ratio = Math.round(last.compares / first.compares)
  const tFirst = t0 + finishS(first)
  const tThird = t0 + finishS(lanes[order[2]])
  const tDuel = Math.min(tFirst + 2.8, tThird)
  const beats: Beat[] = [
    { start: 0, end: t0, caption: 'Which sorting algorithm *wins*?', sub: 'Same 40 bars. Pick one before they start. ↓' },
    { start: t0, end: tFirst, caption: '*Go!*', sub: 'Every comparison costs one tick of the clock.' },
    {
      start: tFirst,
      end: tDuel,
      caption: `*${first.label}* finishes first!`,
      sub: `${lanes[order[1]].label} right behind. Both split the work into halves.`,
    },
    {
      start: tDuel,
      end: tThird,
      caption: `Now it’s *${lanes[order[2]].label.split(' ')[0]}* vs *${last.label.split(' ')[0]}*.`,
      sub: 'Both compare neighbours, one pair at a time.',
    },
    {
      start: tThird,
      end: t0 + raceS,
      caption: `${last.label} is *still going*…`,
      sub: `${last.compares} comparisons for just ${N} bars.`,
    },
    {
      start: t0 + raceS,
      end: t0 + raceS + RESULT_S,
      caption: `*${first.label}* wins.`,
      sub: `${last.label} needed about ${ratio}× more comparisons. Did you guess right?`,
    },
  ]
  return { lanes, order, raceS, totalS: t0 + raceS + RESULT_S, beats }
}

/** Tick index into a lane's frames at a given timeline time. */
export function tickAt(t: number) {
  return Math.max(0, Math.floor((t - HOOK_S) * RATE))
}
