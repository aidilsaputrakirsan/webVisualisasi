import { ADJ } from './graph'

export type Mode = 'bfs' | 'dfs'

export type Cue = 'enqueue' | 'dequeue' | 'visit' | 'compare' | 'backtrack' | 'done' | null

export interface GraphStep {
  /** Vertex currently being processed (amber pointer). */
  activeId: string | null
  /** Neighbour currently being checked (drives active-edge highlight). */
  consideringId: string | null
  /** Vertices already visited & emitted (green). */
  output: string[]
  /** Vertices waiting in the queue (BFS) — rendered blue. */
  frontier: string[]
  /** Contents of the queue (BFS) or call stack (DFS) for the strip. */
  container: string[]
  line: number
  status: string
  sound: Cue
}

export const START = 'A'

export const MODES: Record<Mode, { label: string; desc: string; filename: string; code: string[]; strip: string }> = {
  bfs: {
    label: 'BFS',
    desc: 'Breadth-First Search · selapis demi selapis (Queue)',
    filename: 'bfs.py',
    strip: 'Queue',
    code: [
      'def bfs(graph, start):',
      '    visited = {start}',
      '    queue = deque([start])',
      '    while queue:',
      '        v = queue.popleft()',
      '        print(v)                 # kunjungi',
      '        for n in graph[v]:',
      '            if n not in visited:',
      '                visited.add(n)',
      '                queue.append(n)',
    ],
  },
  dfs: {
    label: 'DFS',
    desc: 'Depth-First Search · sedalam mungkin dulu (Stack/rekursi)',
    filename: 'dfs.py',
    strip: 'Stack',
    code: [
      'def dfs(graph, v, visited):',
      '    visited.add(v)',
      '    print(v)                     # kunjungi',
      '    for n in graph[v]:',
      '        if n not in visited:',
      '            dfs(graph, n, visited)',
    ],
  },
}

function buildBfs(): GraphStep[] {
  const steps: GraphStep[] = []
  const visited = new Set<string>()
  const output: string[] = []
  const queue: string[] = []

  const snap = (p: Partial<GraphStep>) =>
    steps.push({
      activeId: null,
      consideringId: null,
      output: [...output],
      frontier: [...queue],
      container: [...queue],
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  visited.add(START)
  queue.push(START)
  snap({ line: 2, status: `Mulai dari ${START}: tandai visited, enqueue ${START}`, sound: 'enqueue' })

  while (queue.length) {
    const v = queue.shift()!
    snap({ activeId: v, line: 4, status: `Dequeue ${v} → queue [${queue.join(', ')}]`, sound: 'dequeue' })
    output.push(v)
    snap({ activeId: v, line: 5, status: `Kunjungi ${v} → hasil: ${output.join(' ')}`, sound: 'visit' })

    for (const n of ADJ[v]) {
      if (!visited.has(n)) {
        snap({ activeId: v, consideringId: n, line: 7, status: `${n} belum dikunjungi → enqueue`, sound: 'compare' })
        visited.add(n)
        queue.push(n)
        snap({ activeId: v, consideringId: n, line: 9, status: `Enqueue ${n} → queue [${queue.join(', ')}]`, sound: 'enqueue' })
      } else {
        snap({ activeId: v, consideringId: n, line: 7, status: `${n} sudah dikunjungi → lewati`, sound: 'compare' })
      }
    }
  }

  snap({ line: 3, status: `Queue kosong → selesai · hasil BFS: ${output.join(' ')}`, sound: 'done' })
  return steps
}

function buildDfs(): GraphStep[] {
  const steps: GraphStep[] = []
  const visited = new Set<string>()
  const output: string[] = []
  const stack: string[] = []

  const snap = (p: Partial<GraphStep>) =>
    steps.push({
      activeId: null,
      consideringId: null,
      output: [...output],
      frontier: [],
      container: [...stack],
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  const dfs = (v: string) => {
    visited.add(v)
    output.push(v)
    stack.push(v)
    snap({ activeId: v, line: 2, status: `Kunjungi ${v} → hasil: ${output.join(' ')}`, sound: 'visit' })

    for (const n of ADJ[v]) {
      if (!visited.has(n)) {
        snap({ activeId: v, consideringId: n, line: 4, status: `${v}: ${n} belum dikunjungi → masuk`, sound: 'compare' })
        dfs(n)
        snap({ activeId: v, line: 5, status: `Kembali (backtrack) ke ${v}`, sound: 'backtrack' })
      } else {
        snap({ activeId: v, consideringId: n, line: 4, status: `${v}: ${n} sudah dikunjungi → lewati`, sound: 'compare' })
      }
    }
    stack.pop()
  }

  dfs(START)
  snap({ line: 0, status: `Selesai · hasil DFS: ${output.join(' ')}`, sound: 'done' })
  return steps
}

export function buildSteps(mode: Mode): GraphStep[] {
  return mode === 'bfs' ? buildBfs() : buildDfs()
}
