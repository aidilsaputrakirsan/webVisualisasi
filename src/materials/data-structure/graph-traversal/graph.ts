/** A graph vertex with its position on the design canvas. */
export interface Vertex {
  id: string
  x: number
  y: number
}

export const GRAPH_W = 960
export const GRAPH_H = 540
export const NODE_R = 40

/**
 * The sample undirected graph from Modul 11 §4 (the one the BFS/DFS trace
 * tables use). Edges: A-B, A-C, B-D, B-E, C-F, D-E.
 *
 *        A ───── B
 *        │      ╱ ╲
 *        C     D ─ E
 *        │
 *        F
 */
export const VERTICES: Vertex[] = [
  { id: 'A', x: 250, y: 110 },
  { id: 'B', x: 630, y: 90 },
  { id: 'C', x: 250, y: 300 },
  { id: 'D', x: 780, y: 290 },
  { id: 'E', x: 620, y: 470 },
  { id: 'F', x: 250, y: 480 },
]

/** Adjacency list — neighbour order matters (it drives the traversal order
 *  and must match the module's trace results). */
export const ADJ: Record<string, string[]> = {
  A: ['B', 'C'],
  B: ['A', 'D', 'E'],
  C: ['A', 'F'],
  D: ['B', 'E'],
  E: ['B', 'D'],
  F: ['C'],
}

const POS = new Map(VERTICES.map((v) => [v.id, v]))
export function vertex(id: string): Vertex {
  const v = POS.get(id)
  if (!v) throw new Error(`Unknown vertex ${id}`)
  return v
}

/** Unique undirected edges (each pair once), for drawing. */
export const EDGES: Array<[string, string]> = (() => {
  const seen = new Set<string>()
  const out: Array<[string, string]> = []
  for (const [u, ns] of Object.entries(ADJ)) {
    for (const w of ns) {
      const key = [u, w].sort().join('-')
      if (!seen.has(key)) {
        seen.add(key)
        out.push([u, w])
      }
    }
  }
  return out
})()
