import {
  layoutTree,
  makeStandardTree,
  type NodeMap,
  type PositionedNode,
  type WNode,
} from './bst'

export type Mode = 'build' | 'search' | 'delete'

/** Audio cue per step. */
export type Cue = 'compare' | 'place' | 'found' | 'fail' | 'remove' | 'done' | null

export interface BstStep {
  nodes: PositionedNode[]
  /** Node currently being compared (amber pointer), or null. */
  activeId: number | null
  /** Node to flash green (just inserted / found / value copied), or null. */
  highlightId: number | null
  /** Ids on the walked path (blue), e.g. the search path. */
  path: number[]
  /** Label + value shown in the header chip, e.g. "Insert" / 70. */
  phaseLabel: string
  phaseValue: number | null
  /** Active line in this mode's code (0-based). */
  line: number
  status: string
  sound: Cue
}

export const SEQUENCE = [50, 30, 70, 20, 40, 60, 80]
export const SEARCH_TARGET = 40
export const DELETE_TARGETS = [20, 30, 70]

export const MODES: Record<Mode, { label: string; desc: string; filename: string; code: string[] }> = {
  build: {
    label: 'Build (Insert)',
    desc: 'Bangun BST · data < node → kiri, data > node → kanan',
    filename: 'insert.py',
    code: [
      'def insert(node, data):',
      '    if node is None:',
      '        return Node(data)',
      '    if data < node.data:',
      '        node.left = insert(node.left, data)',
      '    elif data > node.data:',
      '        node.right = insert(node.right, data)',
      '    return node',
    ],
  },
  search: {
    label: 'Search',
    desc: 'Cari nilai · seperti binary search di pohon',
    filename: 'search.py',
    code: [
      'def search(node, target):',
      '    if node is None:',
      '        return None',
      '    if target == node.data:',
      '        return node',
      '    elif target < node.data:',
      '        return search(node.left, target)',
      '    else:',
      '        return search(node.right, target)',
    ],
  },
  delete: {
    label: 'Delete',
    desc: 'Hapus node · 3 kasus: leaf, 1 child, 2 child',
    filename: 'delete.py',
    code: [
      'def delete(node, target):',
      '    if node is None:',
      '        return None',
      '    if target < node.data:',
      '        node.left = delete(node.left, target)',
      '    elif target > node.data:',
      '        node.right = delete(node.right, target)',
      '    else:                       # ditemukan',
      '        if node.left is None:',
      '            return node.right',
      '        if node.right is None:',
      '            return node.left',
      '        succ = find_min(node.right)',
      '        node.data = succ.data',
      '        node.right = delete(node.right, succ.data)',
      '    return node',
    ],
  },
}

// ── Build (insert sequence) ──────────────────────────────────────────────────

function buildBuild(): BstStep[] {
  const nodes: NodeMap = new Map()
  let rootId: number | null = null
  let nextId = 0
  const steps: BstStep[] = []

  const snap = (p: Partial<BstStep>) =>
    steps.push({
      nodes: layoutTree(nodes, rootId),
      activeId: null,
      highlightId: null,
      path: [],
      phaseLabel: 'Insert',
      phaseValue: null,
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  const newNode = (value: number): number => {
    const id = nextId++
    nodes.set(id, { id, value, left: null, right: null })
    return id
  }

  for (const v of SEQUENCE) {
    if (rootId === null) {
      rootId = newNode(v)
      snap({ phaseValue: v, highlightId: rootId, line: 2, status: `Tree kosong → ${v} menjadi root`, sound: 'place' })
      continue
    }

    let curId = rootId
    snap({ phaseValue: v, activeId: curId, line: 0, status: `Insert ${v}: mulai dari root ${nodes.get(curId)!.value}` })

    while (true) {
      const cur: WNode = nodes.get(curId)!
      if (v < cur.value) {
        snap({ phaseValue: v, activeId: curId, line: 3, status: `${v} < ${cur.value} → ke kiri`, sound: 'compare' })
        if (cur.left === null) {
          const id = newNode(v)
          cur.left = id
          snap({ phaseValue: v, activeId: curId, highlightId: id, line: 2, status: `Posisi kiri kosong → pasang ${v}`, sound: 'place' })
          break
        }
        curId = cur.left
      } else {
        snap({ phaseValue: v, activeId: curId, line: 5, status: `${v} > ${cur.value} → ke kanan`, sound: 'compare' })
        if (cur.right === null) {
          const id = newNode(v)
          cur.right = id
          snap({ phaseValue: v, activeId: curId, highlightId: id, line: 2, status: `Posisi kanan kosong → pasang ${v}`, sound: 'place' })
          break
        }
        curId = cur.right
      }
    }
  }

  snap({ line: 7, status: `Selesai · BST dari ${SEQUENCE.join(', ')}`, sound: 'done' })
  return steps
}

// ── Search ───────────────────────────────────────────────────────────────────

function buildSearch(): BstStep[] {
  const { nodes, rootId } = makeStandardTree()
  const target = SEARCH_TARGET
  const steps: BstStep[] = []
  const path: number[] = []

  const snap = (p: Partial<BstStep>) =>
    steps.push({
      nodes: layoutTree(nodes, rootId),
      activeId: null,
      highlightId: null,
      path: [...path],
      phaseLabel: 'Search',
      phaseValue: target,
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  let curId: number | null = rootId
  snap({ activeId: curId, line: 0, status: `Search ${target}: mulai dari root` })

  while (true) {
    if (curId === null) {
      snap({ line: 2, status: `Mencapai None → ${target} tidak ditemukan`, sound: 'fail' })
      break
    }
    const cur: WNode = nodes.get(curId)!
    path.push(curId)
    if (target === cur.value) {
      snap({ activeId: curId, highlightId: curId, line: 4, status: `${target} == ${cur.value} → ditemukan! ✓`, sound: 'found' })
      break
    } else if (target < cur.value) {
      snap({ activeId: curId, line: 6, status: `${target} < ${cur.value} → cari di kiri`, sound: 'compare' })
      curId = cur.left
    } else {
      snap({ activeId: curId, line: 8, status: `${target} > ${cur.value} → cari di kanan`, sound: 'compare' })
      curId = cur.right
    }
  }
  return steps
}

// ── Delete (leaf / one child / two children) ─────────────────────────────────

function buildDelete(): BstStep[] {
  const { nodes, rootId } = makeStandardTree()
  let root: number | null = rootId
  const steps: BstStep[] = []

  const snap = (p: Partial<BstStep>) =>
    steps.push({
      nodes: layoutTree(nodes, root),
      activeId: null,
      highlightId: null,
      path: [],
      phaseLabel: 'Delete',
      phaseValue: null,
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  const relink = (parentId: number | null, isLeft: boolean, child: number | null) => {
    if (parentId === null) {
      root = child
    } else {
      const p = nodes.get(parentId)!
      if (isLeft) p.left = child
      else p.right = child
    }
  }

  for (const target of DELETE_TARGETS) {
    // 1. Walk to the node, tracking parent + which side.
    let parentId: number | null = null
    let isLeft = false
    let curId: number | null = root
    snap({ phaseValue: target, activeId: curId, line: 0, status: `Delete ${target}: cari node-nya` })

    let found = false
    while (curId !== null) {
      const cur: WNode = nodes.get(curId)!
      if (target === cur.value) {
        snap({ phaseValue: target, activeId: curId, line: 7, status: `Node ${target} ditemukan` })
        found = true
        break
      } else if (target < cur.value) {
        snap({ phaseValue: target, activeId: curId, line: 3, status: `${target} < ${cur.value} → ke kiri`, sound: 'compare' })
        parentId = curId
        isLeft = true
        curId = cur.left
      } else {
        snap({ phaseValue: target, activeId: curId, line: 5, status: `${target} > ${cur.value} → ke kanan`, sound: 'compare' })
        parentId = curId
        isLeft = false
        curId = cur.right
      }
    }
    if (!found || curId === null) {
      snap({ phaseValue: target, line: 2, status: `${target} tidak ada di tree`, sound: 'fail' })
      continue
    }

    const cur: WNode = nodes.get(curId)!

    if (cur.left === null && cur.right === null) {
      // Case 1: leaf.
      snap({ phaseValue: target, activeId: curId, line: 8, status: `Kasus 1: ${target} leaf → hapus langsung`, sound: 'remove' })
      relink(parentId, isLeft, null)
      nodes.delete(curId)
      snap({ phaseValue: target, line: 8, status: `${target} terhapus` })
    } else if (cur.left === null || cur.right === null) {
      // Case 2: one child.
      const childId = (cur.left ?? cur.right)!
      const line = cur.left === null ? 9 : 11
      snap({ phaseValue: target, activeId: curId, highlightId: childId, line, status: `Kasus 2: ${target} punya 1 child → ganti dengan ${nodes.get(childId)!.value}`, sound: 'remove' })
      relink(parentId, isLeft, childId)
      nodes.delete(curId)
      snap({ phaseValue: target, highlightId: childId, line, status: `${nodes.get(childId)!.value} naik menggantikan ${target}` })
    } else {
      // Case 3: two children → inorder successor (min of right subtree).
      snap({ phaseValue: target, activeId: curId, line: 12, status: `Kasus 3: ${target} punya 2 child → cari inorder successor` })
      let succParent = curId
      let succId = cur.right!
      while (nodes.get(succId)!.left !== null) {
        snap({ phaseValue: target, activeId: succId, line: 12, status: `Cari minimum di subtree kanan...`, sound: 'compare' })
        succParent = succId
        succId = nodes.get(succId)!.left!
      }
      const succVal = nodes.get(succId)!.value
      snap({ phaseValue: target, activeId: succId, highlightId: succId, line: 12, status: `Inorder successor = ${succVal}`, sound: 'found' })

      // Copy successor value into the target node (id stays, value changes).
      cur.value = succVal
      snap({ phaseValue: target, highlightId: curId, line: 13, status: `Salin ${succVal} ke node target`, sound: 'place' })

      // Remove the successor from its original spot (it has no left child).
      const succRight = nodes.get(succId)!.right
      if (succParent === curId) cur.right = succRight
      else nodes.get(succParent)!.left = succRight
      nodes.delete(succId)
      snap({ phaseValue: target, line: 14, status: `Hapus ${succVal} dari posisi aslinya`, sound: 'remove' })
    }
  }

  snap({ line: 15, status: `Selesai · sisa (inorder): ${inorderValues(nodes, root).join(' ')}`, sound: 'done' })
  return steps
}

function inorderValues(nodes: NodeMap, rootId: number | null): number[] {
  const out: number[] = []
  const walk = (id: number | null) => {
    if (id === null) return
    const n = nodes.get(id)!
    walk(n.left)
    out.push(n.value)
    walk(n.right)
  }
  walk(rootId)
  return out
}

export function buildSteps(mode: Mode): BstStep[] {
  if (mode === 'build') return buildBuild()
  if (mode === 'search') return buildSearch()
  return buildDelete()
}
