/**
 * Sliding Window — the classic "shortest subarray with sum ≥ target" problem.
 * One Step = a full snapshot of a frame (window position [left..right], running
 * sum, shortest record, operation counter) — the animation just replays them.
 *
 * Two modes compare approaches to the SAME problem:
 *   - 'brute'  : try EVERY subarray (start × end). Each start recomputes the sum
 *                from scratch → O(n²), lots of wasted work.
 *   - 'window' : two pointers. Grow the right edge; once the sum is enough, shrink
 *                the left. Each element enters and leaves the window once → O(n).
 */

export const NUMS = [2, 3, 1, 2, 4, 3]
export const TARGET = 7

export type Mode = 'brute' | 'window'
export type Phase = 'init' | 'expand' | 'shrink' | 'record' | 'restart' | 'done'
export type Cue = 'expand' | 'shrink' | 'record' | 'restart' | 'done' | null

export interface SwStep {
  /** Left window edge / start index. */
  left: number
  /** Right window edge / end index; right < left = empty window. */
  right: number
  /** Sum of the elements currently inside the window. */
  sum: number
  /** Length of the shortest subarray found (null = none yet). */
  best: number | null
  /** Indices [a, b] of the shortest subarray so far. */
  bestRange: [number, number] | null
  /** Whether [left..right] is highlighted as the live window. */
  windowActive: boolean
  /** Whether the current window sum is already ≥ target (for colouring). */
  meets: boolean
  /** "+=" operation counter — the work meter (brute ≫ window). */
  ops: number
  phase: Phase
  line: number
  status: string
  story: string
  sound: Cue
}

export const CODE_WINDOW = [
  'def shortest_subarray(nums, target):',
  '    left = 0',
  '    total = 0',
  '    best = inf',
  '    for right in range(len(nums)):',
  '        total += nums[right]      # grow the right',
  '        while total >= target:',
  '            best = min(best, right - left + 1)',
  '            total -= nums[left]    # shrink the left',
  '            left += 1',
  '    return best if best != inf else 0',
]

export const CODE_BRUTE = [
  'def shortest_subarray(nums, target):',
  '    best = inf',
  '    for start in range(len(nums)):',
  '        cur = 0                    # recompute from zero',
  '        for end in range(start, len(nums)):',
  '            cur += nums[end]',
  '            if cur >= target:',
  '                best = min(best, end - start + 1)',
  '                break              # enough, next start',
  '    return best if best != inf else 0',
]

export interface ModeDef {
  label: string
  code: string[]
  complexity: string
}

export const MODES: Record<Mode, ModeDef> = {
  brute: { label: 'Brute Force', code: CODE_BRUTE, complexity: 'O(n²)' },
  window: { label: 'Sliding Window', code: CODE_WINDOW, complexity: 'O(n)' },
}

const sub = (a: number, b: number) => `[${NUMS.slice(a, b + 1).join(', ')}]`

function buildWindow(): SwStep[] {
  const steps: SwStep[] = []
  let left = 0
  let sum = 0
  let best: number | null = null
  let bestRange: [number, number] | null = null
  let ops = 0

  steps.push({
    left,
    right: -1,
    sum,
    best,
    bestRange,
    windowActive: false,
    meets: false,
    ops,
    phase: 'init',
    line: 3,
    status: `target = ${TARGET} · find the SHORTEST contiguous subarray with sum ≥ ${TARGET}`,
    story: `The rule: find the shortest run of consecutive numbers whose total is at least ${TARGET}.`,
    sound: null,
  })

  for (let right = 0; right < NUMS.length; right++) {
    sum += NUMS[right]
    ops++
    steps.push({
      left,
      right,
      sum,
      best,
      bestRange,
      windowActive: true,
      meets: sum >= TARGET,
      ops,
      phase: 'expand',
      line: 5,
      status: `right → ${right}: grow the window to ${sub(left, right)}, sum = ${sum}`,
      story: `Slide the right edge: add ${NUMS[right]}. The window total is now ${sum}.`,
      sound: 'expand',
    })

    while (sum >= TARGET) {
      const len = right - left + 1
      const better = best === null || len < best
      if (better) {
        best = len
        bestRange = [left, right]
      }
      steps.push({
        left,
        right,
        sum,
        best,
        bestRange,
        windowActive: true,
        meets: true,
        ops,
        phase: 'record',
        line: 7,
        status: `sum ${sum} ≥ ${TARGET} → length ${len}${better ? ' (new record!)' : ''}`,
        story: better
          ? `Enough! Length ${len} is the shortest so far.`
          : `Enough, but length ${len} doesn't beat ${best}.`,
        sound: 'record',
      })

      const dropped = NUMS[left]
      sum -= dropped
      left++
      steps.push({
        left,
        right,
        sum,
        best,
        bestRange,
        windowActive: left <= right,
        meets: sum >= TARGET,
        ops,
        phase: 'shrink',
        line: 8,
        status: `shrink from the left: drop ${dropped} → sum = ${sum}`,
        story: `Try to shorten it: drop ${dropped} from the left. The total falls to ${sum}.`,
        sound: 'shrink',
      })
    }
  }

  steps.push({
    left,
    right: NUMS.length - 1,
    sum,
    best,
    bestRange,
    windowActive: false,
    meets: false,
    ops,
    phase: 'done',
    line: 10,
    status:
      best !== null
        ? `done · shortest = ${best} · only ${ops} operations (O(n))`
        : `no subarray has sum ≥ ${TARGET}`,
    story: bestRange
      ? `Answer: ${sub(bestRange[0], bestRange[1])} (length ${best}). Each element enters and leaves the window once — O(n).`
      : `No run reaches ${TARGET}.`,
    sound: 'done',
  })

  return steps
}

function buildBrute(): SwStep[] {
  const steps: SwStep[] = []
  let best: number | null = null
  let bestRange: [number, number] | null = null
  let ops = 0

  steps.push({
    left: 0,
    right: -1,
    sum: 0,
    best,
    bestRange,
    windowActive: false,
    meets: false,
    ops,
    phase: 'init',
    line: 1,
    status: `brute force: try EVERY subarray — each start × each end`,
    story: 'The naive way: try every starting point, then extend until the sum is enough.',
    sound: null,
  })

  for (let start = 0; start < NUMS.length; start++) {
    let cur = 0
    steps.push({
      left: start,
      right: start - 1,
      sum: 0,
      best,
      bestRange,
      windowActive: false,
      meets: false,
      ops,
      phase: 'restart',
      line: 3,
      status: `start = ${start}: reset the sum to 0 (recompute!)`,
      story: `Begin a new run at index ${start}. Unfortunately, the total is added up from scratch again.`,
      sound: 'restart',
    })

    for (let end = start; end < NUMS.length; end++) {
      cur += NUMS[end]
      ops++
      const meets = cur >= TARGET
      steps.push({
        left: start,
        right: end,
        sum: cur,
        best,
        bestRange,
        windowActive: true,
        meets,
        ops,
        phase: 'expand',
        line: 5,
        status: `${sub(start, end)} sum = ${cur}`,
        story: `Add ${NUMS[end]} → total ${cur}.`,
        sound: 'expand',
      })

      if (meets) {
        const len = end - start + 1
        const better = best === null || len < best
        if (better) {
          best = len
          bestRange = [start, end]
        }
        steps.push({
          left: start,
          right: end,
          sum: cur,
          best,
          bestRange,
          windowActive: true,
          meets: true,
          ops,
          phase: 'record',
          line: 7,
          status: `sum ${cur} ≥ ${TARGET} → length ${len}${better ? ' (record!)' : ''}, stop this line`,
          story: better
            ? `Found it! Length ${len}, the shortest so far. Move on to the next start.`
            : `Enough (length ${len}), but no better. Move on.`,
          sound: 'record',
        })
        break
      }
    }
  }

  steps.push({
    left: 0,
    right: -1,
    sum: 0,
    best,
    bestRange,
    windowActive: false,
    meets: false,
    ops,
    phase: 'done',
    line: 9,
    status:
      best !== null
        ? `done · shortest = ${best} · took ${ops} operations (O(n²))`
        : `no subarray has sum ≥ ${TARGET}`,
    story: bestRange
      ? `Same answer: ${sub(bestRange[0], bestRange[1])} (length ${best}) — but ${ops} operations. Sliding window needs only ${NUMS.length}.`
      : `No run reaches ${TARGET}.`,
    sound: 'done',
  })

  return steps
}

export function buildSteps(mode: Mode): SwStep[] {
  return mode === 'brute' ? buildBrute() : buildWindow()
}
