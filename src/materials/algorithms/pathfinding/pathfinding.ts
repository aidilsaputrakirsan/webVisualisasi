/**
 * Precomputed pathfinding on a fixed grid. One Step = a full snapshot of the
 * search (current cell, open "frontier", closed "visited" in discovery order,
 * and — in the final phase — the reconstructed shortest path). The animation
 * just replays these frames, so the wavefront grows cell by cell.
 *
 * Three modes contrast classic strategies on the SAME maze:
 *   - 'bfs'    : melebar seragam (lapis demi lapis), optimal tapi boros.
 *   - 'greedy' : best-first pakai heuristik saja → meluncur ke goal, cepat
 *                tapi jalur belum tentu optimal.
 *   - 'astar'  : f = g + h → terarah ke goal SEKALIGUS optimal (efisien).
 */

export type Mode = 'bfs' | 'greedy' | 'astar'
export type Cue = 'visit' | 'frontier' | 'path' | 'done' | null

export const COLS = 13
export const ROWS = 15

export const idx = (r: number, c: number) => r * COLS + c
export const rc = (i: number): [number, number] => [Math.floor(i / COLS), i % COLS]

export const START = idx(1, 1)
export const GOAL = idx(13, 11)

/** Fixed maze: two staggered barriers (gap right, then gap left) + a stub. */
function buildWalls(): Set<number> {
  const w = new Set<number>()
  for (let c = 0; c <= 9; c++) w.add(idx(4, c)) // barrier 1 — gap at cols 10–12
  for (let c = 3; c <= 12; c++) w.add(idx(9, c)) // barrier 2 — gap at cols 0–2
  for (let r = 11; r <= 13; r++) w.add(idx(r, 6)) // stub near the goal
  w.delete(START)
  w.delete(GOAL)
  return w
}

export const WALLS = buildWalls()

function neighbors(i: number): number[] {
  const [r, c] = rc(i)
  const out: number[] = []
  const cand: [number, number][] = [
    [r - 1, c],
    [r, c + 1],
    [r + 1, c],
    [r, c - 1],
  ]
  for (const [nr, nc] of cand) {
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
    const ni = idx(nr, nc)
    if (WALLS.has(ni)) continue
    out.push(ni)
  }
  return out
}

const heuristic = (a: number, b: number) => {
  const [ra, ca] = rc(a)
  const [rb, cb] = rc(b)
  return Math.abs(ra - rb) + Math.abs(ca - cb)
}

export interface PfStep {
  current: number | null
  frontier: number[]
  visited: number[]
  path: number[]
  line: number
  status: string
  exploredCount: number
  pathLen: number | null
  sound: Cue
}

const BFS_CODE = [
  'frontier = deque([start])',
  'while frontier:',
  '    cur = frontier.popleft()      # FIFO',
  '    if cur == goal: break',
  '    for n in neighbors(cur):',
  '        if n not in came_from:',
  '            came_from[n] = cur',
  '            frontier.append(n)',
  'path = reconstruct(came_from)',
]

const GREEDY_CODE = [
  'frontier = PQ()        # urut: h(n)',
  'frontier.put(start, h(start, goal))',
  'while frontier:',
  '    cur = frontier.pop_min()      # h terkecil',
  '    if cur == goal: break',
  '    for n in neighbors(cur):',
  '        if n not in came_from:',
  '            came_from[n] = cur',
  '            frontier.put(n, h(n, goal))',
  'path = reconstruct(came_from)',
]

const ASTAR_CODE = [
  'frontier = PQ()        # urut: f = g + h',
  'g[start] = 0',
  'while frontier:',
  '    cur = frontier.pop_min()      # f terkecil',
  '    if cur == goal: break',
  '    for n in neighbors(cur):',
  '        ng = g[cur] + 1',
  '        if ng < g.get(n, inf):',
  '            g[n] = ng; came_from[n] = cur',
  '            frontier.put(n, ng + h(n, goal))',
  'path = reconstruct(came_from)',
]

export const MODES: Record<Mode, { label: string; desc: string; code: string[]; popLine: number; addLine: number; pathLine: number }> = {
  bfs: {
    label: 'BFS',
    desc: 'Breadth-First — melebar seragam lapis demi lapis (optimal, boros)',
    code: BFS_CODE,
    popLine: 2,
    addLine: 7,
    pathLine: 8,
  },
  greedy: {
    label: 'Greedy',
    desc: 'Best-First — pakai heuristik saja, meluncur ke goal (cepat, belum tentu optimal)',
    code: GREEDY_CODE,
    popLine: 3,
    addLine: 8,
    pathLine: 9,
  },
  astar: {
    label: 'A*',
    desc: 'A* — f = g + h: terarah ke goal sekaligus optimal & efisien',
    code: ASTAR_CODE,
    popLine: 3,
    addLine: 9,
    pathLine: 10,
  },
}

interface Entry {
  id: number
  key: number
  seq: number
}

export function buildSteps(mode: Mode): PfStep[] {
  const steps: PfStep[] = []
  const def = MODES[mode]
  const closed = new Set<number>()
  const order: number[] = []
  const cameFrom = new Map<number, number>()
  const g = new Map<number, number>()
  g.set(START, 0)

  let seq = 0
  const open: Entry[] = []
  const keyOf = (id: number, gv: number) =>
    mode === 'bfs' ? seq : mode === 'greedy' ? heuristic(id, GOAL) : gv + heuristic(id, GOAL)
  const push = (id: number, gv: number) => open.push({ id, key: keyOf(id, gv), seq: seq++ })
  push(START, 0)

  const popBest = (): Entry => {
    if (mode === 'bfs') return open.shift()!
    let bi = 0
    for (let i = 1; i < open.length; i++) {
      if (open[i].key < open[bi].key || (open[i].key === open[bi].key && open[i].seq < open[bi].seq)) bi = i
    }
    return open.splice(bi, 1)[0]
  }

  const snap = (cur: number | null, line: number, status: string, sound: Cue, path: number[] = []) =>
    steps.push({
      current: cur,
      frontier: open.map((e) => e.id).filter((id) => !closed.has(id)),
      visited: [...order],
      path,
      line,
      status,
      exploredCount: order.length,
      pathLen: path.length ? path.length : null,
      sound,
    })

  let found = false
  while (open.length) {
    const e = popBest()
    if (closed.has(e.id)) continue
    closed.add(e.id)
    order.push(e.id)
    const openCount = open.filter((o) => !closed.has(o.id)).length
    if (e.id === GOAL) {
      snap(e.id, def.popLine, `Goal tercapai! ${order.length} sel dieksplor.`, 'visit')
      found = true
      break
    }
    // Beat 1 — pop sel jadi "current" (frontier belum bertambah).
    snap(e.id, def.popLine, `Pop sel ke-${order.length} · frontier: ${openCount}`, 'visit')
    // Perluas tetangga.
    let added = 0
    for (const n of neighbors(e.id)) {
      if (closed.has(n)) continue
      const ng = (g.get(e.id) ?? 0) + 1
      if (!g.has(n) || ng < (g.get(n) as number)) {
        g.set(n, ng)
        cameFrom.set(n, e.id)
        push(n, ng)
        added++
      }
    }
    // Beat 2 — tetangga baru masuk frontier (highlight baris append/put).
    if (added > 0) {
      snap(e.id, def.addLine, `Tambah ${added} tetangga ke frontier`, 'frontier')
    }
  }

  if (found) {
    const path: number[] = []
    let c: number | undefined = GOAL
    while (c !== undefined) {
      path.unshift(c)
      if (c === START) break
      c = cameFrom.get(c)
    }
    for (let k = 0; k < path.length; k++) {
      snap(null, def.pathLine, `Menyusun jalur terpendek… (${k + 1}/${path.length})`, 'path', path.slice(0, k + 1))
    }
    const steps_taken = path.length - 1
    const verdict =
      mode === 'bfs'
        ? `BFS · ${order.length} sel dieksplor · jalur ${steps_taken} langkah (optimal, tapi boros).`
        : mode === 'greedy'
          ? `Greedy · ${order.length} sel dieksplor · jalur ${steps_taken} langkah (cepat, belum tentu optimal).`
          : `A* · ${order.length} sel dieksplor · jalur ${steps_taken} langkah (optimal & efisien).`
    snap(null, def.pathLine, verdict, 'done', path)
  }

  return steps
}
