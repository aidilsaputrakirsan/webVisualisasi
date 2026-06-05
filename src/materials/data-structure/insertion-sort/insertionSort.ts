import type { Cell, Step } from './types'

/** The Python source shown in the code panel. Line indices below map 1:1 to
 *  this array, so keep them in sync. */
export const PYTHON_SOURCE: string[] = [
  'def insertion_sort(a):',
  '    for i in range(1, len(a)):',
  '        key = a[i]',
  '        j = i - 1',
  '        while j >= 0 and a[j] > key:',
  '            a[j + 1] = a[j]',
  '            j -= 1',
  '        a[j + 1] = key',
  '    return a',
]

const LINE = {
  DEF: 0,
  FOR: 1,
  KEY: 2,
  J: 3,
  WHILE: 4,
  SHIFT: 5,
  DEC_J: 6,
  INSERT: 7,
  RETURN: 8,
} as const

/**
 * Pre-compute every animation frame of insertion sort.
 *
 * The visual model uses adjacent swaps to "bubble" the key box leftward into
 * its slot. That is visually identical to insertion sort's shift-right and
 * keeps every box's `id` stable so `layout` animations slide cleanly.
 */
export function buildInsertionSortSteps(values: number[]): Step[] {
  const cells: Cell[] = values.map((value, i) => ({ id: i, value }))
  const steps: Step[] = []

  const snapshot = (
    partial: Omit<Step, 'cells'> & { cells?: Cell[] },
  ): void => {
    steps.push({
      ...partial,
      cells: (partial.cells ?? cells).map((c) => ({ ...c })),
    })
  }

  const n = cells.length

  // Initial frame: the first element is a trivially-sorted prefix of size 1.
  snapshot({
    sortedCount: Math.min(1, n),
    keyId: null,
    comparingId: null,
    line: LINE.DEF,
    status:
      n <= 1
        ? 'Array already sorted ✓'
        : 'The first element is a sorted prefix of length 1',
  })

  for (let i = 1; i < n; i++) {
    const keyCell = cells[i]
    const keyId = keyCell.id
    const keyVal = keyCell.value
    // From now on the sorted region we are building has size i + 1.
    const sortedCount = i + 1

    snapshot({
      sortedCount,
      keyId,
      comparingId: null,
      line: LINE.FOR,
      status: `Start pass i = ${i}`,
    })
    snapshot({
      sortedCount,
      keyId,
      comparingId: null,
      line: LINE.KEY,
      status: `key = a[${i}] = ${keyVal}`,
    })

    let j = i - 1
    snapshot({
      sortedCount,
      keyId,
      comparingId: null,
      line: LINE.J,
      status: `j = ${j}`,
    })

    // Bubble the key left while the element to its left is larger.
    while (j >= 0 && cells[j].value > keyVal) {
      snapshot({
        sortedCount,
        keyId,
        comparingId: cells[j].id,
        line: LINE.WHILE,
        status: `a[${j}] = ${cells[j].value} > key ${keyVal} → shift right`,
      })

      // Shift right == swap the key with its left neighbour.
      ;[cells[j], cells[j + 1]] = [cells[j + 1], cells[j]]

      snapshot({
        sortedCount,
        keyId,
        comparingId: cells[j + 1].id,
        line: LINE.SHIFT,
        status: `a[${j + 1}] ← ${cells[j + 1].value}`,
      })

      j -= 1
      snapshot({
        sortedCount,
        keyId,
        comparingId: null,
        line: LINE.DEC_J,
        status: `j = ${j}`,
      })
    }

    // Loop exit condition (insertion point found).
    snapshot({
      sortedCount,
      keyId,
      comparingId: j >= 0 ? cells[j].id : null,
      line: LINE.WHILE,
      status:
        j < 0
          ? `j < 0 → insert at front`
          : `a[${j}] = ${cells[j].value} ≤ key ${keyVal} → insert`,
    })

    snapshot({
      sortedCount,
      keyId,
      comparingId: null,
      line: LINE.INSERT,
      status: `Insert key ${keyVal} at position ${j + 1}`,
    })
  }

  // Final frame: everything sorted.
  snapshot({
    sortedCount: n,
    keyId: null,
    comparingId: null,
    line: LINE.RETURN,
    status: 'Array sorted ✓',
  })

  return steps
}
