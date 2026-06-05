/** A single box on screen. `id` is stable across the whole animation so that
 *  Framer Motion's `layout` prop can slide a box smoothly when it changes
 *  position in the array. */
export interface Cell {
  id: number
  value: number
}

/** One frozen frame of the algorithm. The animation just plays these in order;
 *  the sorting loop itself is never animated directly. */
export interface Step {
  /** Current ordering of the boxes. */
  cells: Cell[]
  /** Size of the sorted prefix — boxes at index < sortedCount render green. */
  sortedCount: number
  /** Id of the box currently being inserted (amber + lifted), or null. */
  keyId: number | null
  /** Id of the box currently being compared against the key, or null. */
  comparingId: number | null
  /** Line number (0-based) of the Python source that is "executing". */
  line: number
  /** Human-readable status shown between the array and the code. */
  status: string
}
