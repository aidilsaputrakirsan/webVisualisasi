/** Working node (mutable) used while generating steps. `id` is stable so the
 *  view can animate a node even when its `value` changes (delete case 3). */
export interface WNode {
  id: number
  value: number
  left: number | null
  right: number | null
}

export type NodeMap = Map<number, WNode>

/** A node with a computed on-canvas position, stored inside each step. */
export interface PositionedNode {
  id: number
  value: number
  x: number
  y: number
  left: number | null
  right: number | null
}

// Layout geometry (px) within the TreeView box.
export const TREE_AREA_W = 980
export const TREE_AREA_H = 470
export const NODE_R = 38
const COL_W = 118
const ROW_H = 140
const TREE_TOP = 64
const CENTER_X = TREE_AREA_W / 2

/**
 * Place every node: x by in-order rank (so the tree reads left→right ascending,
 * a key BST fact), y by depth. Re-run each step; Framer Motion `layout` then
 * slides nodes smoothly when the shape changes.
 */
export function layoutTree(nodes: NodeMap, rootId: number | null): PositionedNode[] {
  const pos = new Map<number, { col: number; depth: number }>()
  let col = 0
  const walk = (id: number | null, depth: number) => {
    if (id === null) return
    const n = nodes.get(id)!
    walk(n.left, depth + 1)
    pos.set(id, { col: col++, depth })
    walk(n.right, depth + 1)
  }
  walk(rootId, 0)

  const count = Math.max(col, 1)
  const out: PositionedNode[] = []
  nodes.forEach((n) => {
    const p = pos.get(n.id)
    if (!p) return
    out.push({
      id: n.id,
      value: n.value,
      left: n.left,
      right: n.right,
      x: CENTER_X + (p.col - (count - 1) / 2) * COL_W,
      y: TREE_TOP + p.depth * ROW_H,
    })
  })
  return out
}

/** The standard example BST from Modul 10, inserting 50,30,70,20,40,60,80.
 *  Ids are assigned in insert order (50→0, 30→1, ...). */
export function makeStandardTree(): { nodes: NodeMap; rootId: number } {
  const nodes: NodeMap = new Map()
  let rootId: number | null = null
  let nextId = 0
  const insert = (value: number) => {
    if (rootId === null) {
      nodes.set(nextId, { id: nextId, value, left: null, right: null })
      rootId = nextId++
      return
    }
    let cur = nodes.get(rootId)!
    while (true) {
      if (value < cur.value) {
        if (cur.left === null) {
          nodes.set(nextId, { id: nextId, value, left: null, right: null })
          cur.left = nextId++
          return
        }
        cur = nodes.get(cur.left)!
      } else {
        if (cur.right === null) {
          nodes.set(nextId, { id: nextId, value, left: null, right: null })
          cur.right = nextId++
          return
        }
        cur = nodes.get(cur.right)!
      }
    }
  }
  ;[50, 30, 70, 20, 40, 60, 80].forEach(insert)
  return { nodes, rootId: rootId! }
}
