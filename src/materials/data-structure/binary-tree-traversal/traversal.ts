import { node } from './tree'

export type Kind = 'preorder' | 'inorder' | 'postorder' | 'levelorder'

/** Audio cue to play when this step becomes active. */
export type SoundCue = 'descend' | 'visit' | 'return' | 'enqueue' | 'dequeue' | 'done' | null

/** One frozen frame of a traversal animation. */
export interface TreeStep {
  /** Node the algorithm is currently "at" (amber pointer), or null. */
  activeId: number | null
  /** Cumulative ids of nodes whose value has been emitted (green). */
  visited: number[]
  /** Node ids currently sitting in the BFS queue (blue outline). */
  queued: number[]
  /** Queue contents (node ids) for the queue strip — level-order only. */
  queue: number[]
  /** Values emitted so far. */
  output: number[]
  /** Active line in this traversal's code (0-based). */
  line: number
  /** Status text shown between the tree and the code. */
  status: string
  /** Which sound to play on this step. */
  sound: SoundCue
}

export interface TraversalDef {
  label: string
  order: string
  /** Python source shown in the code panel. */
  code: string[]
}

export const TRAVERSALS: Record<Kind, TraversalDef> = {
  preorder: {
    label: 'Preorder',
    order: 'Root → Left → Right',
    code: [
      'def preorder(node):',
      '    if node is None:',
      '        return',
      '    print(node.data)        # Root',
      '    preorder(node.left)     # Left',
      '    preorder(node.right)    # Right',
    ],
  },
  inorder: {
    label: 'Inorder',
    order: 'Left → Root → Right',
    code: [
      'def inorder(node):',
      '    if node is None:',
      '        return',
      '    inorder(node.left)      # Left',
      '    print(node.data)        # Root',
      '    inorder(node.right)     # Right',
    ],
  },
  postorder: {
    label: 'Postorder',
    order: 'Left → Right → Root',
    code: [
      'def postorder(node):',
      '    if node is None:',
      '        return',
      '    postorder(node.left)    # Left',
      '    postorder(node.right)   # Right',
      '    print(node.data)        # Root',
    ],
  },
  levelorder: {
    label: 'Level-order',
    order: 'Level by level (BFS)',
    code: [
      'def level_order(root):',
      '    queue = deque([root])',
      '    while queue:',
      '        node = queue.popleft()',
      '        print(node.data)',
      '        if node.left:  queue.append(node.left)',
      '        if node.right: queue.append(node.right)',
    ],
  },
}

// Which sub-actions a DFS performs, in order. The visit position is what makes
// pre/in/post different.
const DFS_ORDER: Record<'preorder' | 'inorder' | 'postorder', Array<'visit' | 'left' | 'right'>> = {
  preorder: ['visit', 'left', 'right'],
  inorder: ['left', 'visit', 'right'],
  postorder: ['left', 'right', 'visit'],
}

// Line index of the visit/left/right statements per traversal (see code above).
const DFS_LINES: Record<
  'preorder' | 'inorder' | 'postorder',
  { enter: number; ret: number; visit: number; left: number; right: number }
> = {
  preorder: { enter: 1, ret: 2, visit: 3, left: 4, right: 5 },
  inorder: { enter: 1, ret: 2, left: 3, visit: 4, right: 5 },
  postorder: { enter: 1, ret: 2, left: 3, right: 4, visit: 5 },
}

function buildDfs(kind: 'preorder' | 'inorder' | 'postorder'): TreeStep[] {
  const L = DFS_LINES[kind]
  const steps: TreeStep[] = []
  const visited: number[] = []
  const output: number[] = []

  const push = (activeId: number | null, line: number, status: string, sound: SoundCue = null) =>
    steps.push({
      activeId,
      visited: [...visited],
      queued: [],
      queue: [],
      output: [...output],
      line,
      status,
      sound,
    })

  const recurse = (id: number | null) => {
    if (id === null) {
      push(null, L.ret, '∅ node None → kembali (return)', 'return')
      return
    }
    const v = node(id).value
    push(id, L.enter, `Masuk node ${v}`, 'descend')

    for (const action of DFS_ORDER[kind]) {
      if (action === 'visit') {
        output.push(v)
        visited.push(id)
        push(id, L.visit, `Kunjungi ${v} → output: ${output.join(' ')}`, 'visit')
      } else if (action === 'left') {
        push(id, L.left, `Telusuri subtree kiri dari ${v}`)
        recurse(node(id).left)
      } else {
        push(id, L.right, `Telusuri subtree kanan dari ${v}`)
        recurse(node(id).right)
      }
    }
  }

  recurse(1)
  steps.push({
    activeId: null,
    visited: [...visited],
    queued: [],
    queue: [],
    output: [...output],
    line: 0,
    status: `Selesai · hasil ${TRAVERSALS[kind].label}: ${output.join(' ')}`,
    sound: 'done',
  })
  return steps
}

function buildLevelOrder(): TreeStep[] {
  const steps: TreeStep[] = []
  const visited: number[] = []
  const output: number[] = []
  const queue: number[] = []

  const push = (activeId: number | null, line: number, status: string, sound: SoundCue = null) =>
    steps.push({
      activeId,
      visited: [...visited],
      queued: [...queue],
      queue: [...queue],
      output: [...output],
      line,
      status,
      sound,
    })

  queue.push(1)
  push(1, 1, `Enqueue root (${node(1).value}) → queue: [${queue.map((q) => node(q).value).join(', ')}]`, 'enqueue')

  while (queue.length) {
    const id = queue.shift()!
    const v = node(id).value
    push(id, 3, `Dequeue ${v} → queue: [${queue.map((q) => node(q).value).join(', ')}]`, 'dequeue')

    output.push(v)
    visited.push(id)
    push(id, 4, `Kunjungi ${v} → output: ${output.join(' ')}`, 'visit')

    const l = node(id).left
    if (l !== null) {
      queue.push(l)
      push(id, 5, `Enqueue left (${node(l).value}) → queue: [${queue.map((q) => node(q).value).join(', ')}]`, 'enqueue')
    }
    const r = node(id).right
    if (r !== null) {
      queue.push(r)
      push(id, 6, `Enqueue right (${node(r).value}) → queue: [${queue.map((q) => node(q).value).join(', ')}]`, 'enqueue')
    }
  }

  steps.push({
    activeId: null,
    visited: [...visited],
    queued: [],
    queue: [],
    output: [...output],
    line: 2,
    status: `Queue kosong → selesai · hasil: ${output.join(' ')}`,
    sound: 'done',
  })
  return steps
}

/** Pre-compute every animation frame for the chosen traversal. */
export function buildTraversalSteps(kind: Kind): TreeStep[] {
  return kind === 'levelorder' ? buildLevelOrder() : buildDfs(kind)
}
