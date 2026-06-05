/** A node in the sample binary tree, with its position on the design canvas. */
export interface TreeNode {
  id: number
  value: number
  x: number
  y: number
  left: number | null
  right: number | null
}

/**
 * The perfect binary tree used throughout Modul 9:
 *
 *            1
 *          /   \
 *         2     3
 *        / \   / \
 *       4   5 6   7
 *
 * Coordinates live in a 920×480 local box (px), matching the 1080-wide canvas.
 */
export const TREE: TreeNode[] = [
  { id: 1, value: 1, x: 460, y: 70, left: 2, right: 3 },
  { id: 2, value: 2, x: 250, y: 235, left: 4, right: 5 },
  { id: 3, value: 3, x: 670, y: 235, left: 6, right: 7 },
  { id: 4, value: 4, x: 140, y: 400, left: null, right: null },
  { id: 5, value: 5, x: 360, y: 400, left: null, right: null },
  { id: 6, value: 6, x: 560, y: 400, left: null, right: null },
  { id: 7, value: 7, x: 780, y: 400, left: null, right: null },
]

export const TREE_W = 920
export const TREE_H = 470
export const NODE_R = 40

const byId = new Map(TREE.map((n) => [n.id, n]))
export function node(id: number): TreeNode {
  const n = byId.get(id)
  if (!n) throw new Error(`Unknown node id ${id}`)
  return n
}

/** Parent→child edges, for drawing and for highlighting traversed paths. */
export const EDGES: Array<{ from: number; to: number }> = TREE.flatMap((n) =>
  [n.left, n.right].filter((c): c is number => c !== null).map((c) => ({ from: n.id, to: c })),
)

/** Returns the [parent, child] edge connecting two nodes, or null if they are
 *  not directly connected (used to light up the edge the pointer walks along). */
export function connectingEdge(a: number | null, b: number | null): [number, number] | null {
  if (a === null || b === null) return null
  const e = EDGES.find((x) => (x.from === a && x.to === b) || (x.from === b && x.to === a))
  return e ? [e.from, e.to] : null
}
