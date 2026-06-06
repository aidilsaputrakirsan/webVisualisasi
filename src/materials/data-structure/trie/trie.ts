export type Mode = 'build' | 'autocomplete'

export type Cue = 'compare' | 'create' | 'mark' | 'found' | 'done' | null

export interface TrieNodeData {
  id: number
  char: string
  isEnd: boolean
  children: Map<string, number>
}

export type NodeMap = Map<number, TrieNodeData>

export interface PNode {
  id: number
  char: string
  x: number
  y: number
  parent: number | null
  isEnd: boolean
}

export interface TrieStep {
  nodes: PNode[]
  activeId: number | null
  createdId: number | null
  pathIds: number[]
  resultIds: number[]
  phaseLabel: string
  phaseWord: string
  charIndex: number
  resultWords: string[]
  line: number
  status: string
  sound: Cue
}

export const WORDS = ['cat', 'car', 'card', 'care', 'dog', 'do']
export const PREFIX = 'car'

// layout geometry
export const TRIE_W = 900
export const TRIE_H = 720
export const NODE_R = 34
const COL_W = 120
const ROW_H = 150
const TOP = 56
const CENTER_X = TRIE_W / 2

export const MODES: Record<Mode, { label: string; desc: string; filename: string; code: string[] }> = {
  build: {
    label: 'Build (Insert)',
    desc: 'Bangun Trie · tiap karakter = satu node, path = prefix',
    filename: 'trie_insert.py',
    code: [
      'def insert(self, word):',
      '    node = self.root',
      '    for char in word:',
      '        if char not in node.children:',
      '            node.children[char] = TrieNode()',
      '        node = node.children[char]',
      '    node.is_end_of_word = True',
    ],
  },
  autocomplete: {
    label: 'Autocomplete',
    desc: 'Telusuri prefix, lalu DFS kumpulkan semua kata',
    filename: 'trie_autocomplete.py',
    code: [
      'def autocomplete(self, prefix):',
      '    node = self.root',
      '    for char in prefix:',
      '        if char not in node.children:',
      '            return []',
      '        node = node.children[char]',
      '    return self._collect(node, prefix)',
      '',
      'def _collect(self, node, word):',
      '    res = []',
      '    if node.is_end_of_word:',
      '        res.append(word)',
      '    for ch, child in sorted(node.children.items()):',
      '        res += self._collect(child, word + ch)',
      '    return res',
    ],
  },
}

function newTrie(): { nodes: NodeMap; rootId: number; nextId: { v: number } } {
  const nodes: NodeMap = new Map()
  nodes.set(0, { id: 0, char: '', isEnd: false, children: new Map() })
  return { nodes, rootId: 0, nextId: { v: 1 } }
}

export function layoutTrie(nodes: NodeMap, rootId: number): PNode[] {
  const pos = new Map<number, { col: number; depth: number }>()
  const parentOf = new Map<number, number | null>()
  let leaf = 0

  const place = (id: number, depth: number, parent: number | null) => {
    parentOf.set(id, parent)
    const node = nodes.get(id)!
    const childIds = [...node.children.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map((e) => e[1])
    if (childIds.length === 0) {
      pos.set(id, { col: leaf++, depth })
    } else {
      childIds.forEach((c) => place(c, depth + 1, id))
      const f = pos.get(childIds[0])!.col
      const l = pos.get(childIds[childIds.length - 1])!.col
      pos.set(id, { col: (f + l) / 2, depth })
    }
  }
  place(rootId, 0, null)

  const leafCount = Math.max(leaf, 1)
  const out: PNode[] = []
  nodes.forEach((n) => {
    const p = pos.get(n.id)
    if (!p) return
    out.push({
      id: n.id,
      char: n.char,
      parent: parentOf.get(n.id) ?? null,
      isEnd: n.isEnd,
      x: CENTER_X + (p.col - (leafCount - 1) / 2) * COL_W,
      y: TOP + p.depth * ROW_H,
    })
  })
  return out
}

function buildBuild(): TrieStep[] {
  const { nodes, rootId, nextId } = newTrie()
  const steps: TrieStep[] = []

  const snap = (p: Partial<TrieStep>) =>
    steps.push({
      nodes: layoutTrie(nodes, rootId),
      activeId: null,
      createdId: null,
      pathIds: [],
      resultIds: [],
      phaseLabel: 'Insert',
      phaseWord: '',
      charIndex: -1,
      resultWords: [],
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  for (const word of WORDS) {
    let cur = rootId
    const path = [rootId]
    snap({ phaseWord: word, charIndex: -1, activeId: rootId, pathIds: [...path], line: 1, status: `Insert "${word}" — mulai dari root` })

    for (let ci = 0; ci < word.length; ci++) {
      const char = word[ci]
      const node = nodes.get(cur)!
      snap({ phaseWord: word, charIndex: ci, activeId: cur, pathIds: [...path], line: 3, status: `Cek '${char}' di children`, sound: 'compare' })

      if (!node.children.has(char)) {
        const id = nextId.v++
        nodes.set(id, { id, char, isEnd: false, children: new Map() })
        node.children.set(char, id)
        path.push(id)
        snap({ phaseWord: word, charIndex: ci, activeId: id, createdId: id, pathIds: [...path], line: 4, status: `'${char}' belum ada → buat node baru`, sound: 'create' })
      } else {
        const id = node.children.get(char)!
        path.push(id)
        snap({ phaseWord: word, charIndex: ci, activeId: id, pathIds: [...path], line: 5, status: `'${char}' sudah ada → ikuti`, sound: 'compare' })
      }
      cur = node.children.get(char)!
    }

    nodes.get(cur)!.isEnd = true
    snap({ phaseWord: word, charIndex: word.length - 1, activeId: cur, pathIds: [...path], line: 6, status: `Tandai akhir kata: "${word}" ✓`, sound: 'mark' })
  }

  snap({ line: 6, status: `Selesai · ${WORDS.length} kata tersimpan` , sound: 'done' })
  return steps
}

function buildAutocomplete(): TrieStep[] {
  const { nodes, rootId, nextId } = newTrie()
  // build silently
  for (const word of WORDS) {
    let cur = rootId
    for (const char of word) {
      const node = nodes.get(cur)!
      if (!node.children.has(char)) {
        const id = nextId.v++
        nodes.set(id, { id, char, isEnd: false, children: new Map() })
        node.children.set(char, id)
      }
      cur = node.children.get(char)!
    }
    nodes.get(cur)!.isEnd = true
  }

  const steps: TrieStep[] = []
  const path: number[] = [rootId]
  const resultIds: number[] = []
  const resultWords: string[] = []

  const snap = (p: Partial<TrieStep>) =>
    steps.push({
      nodes: layoutTrie(nodes, rootId),
      activeId: null,
      createdId: null,
      pathIds: [...path],
      resultIds: [...resultIds],
      phaseLabel: 'Autocomplete',
      phaseWord: PREFIX,
      charIndex: -1,
      resultWords: [...resultWords],
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  let cur = rootId
  snap({ activeId: rootId, line: 1, status: `Autocomplete "${PREFIX}" — telusuri prefix` })

  for (let ci = 0; ci < PREFIX.length; ci++) {
    const char = PREFIX[ci]
    const node = nodes.get(cur)!
    snap({ charIndex: ci, activeId: cur, line: 3, status: `Cek '${char}'`, sound: 'compare' })
    cur = node.children.get(char)!
    path.push(cur)
    snap({ charIndex: ci, activeId: cur, line: 5, status: `Turun ke '${char}'`, sound: 'compare' })
  }

  snap({ charIndex: PREFIX.length - 1, activeId: cur, line: 6, status: `Prefix "${PREFIX}" ditemukan → kumpulkan kata (DFS)` })

  const collect = (id: number, word: string) => {
    const node = nodes.get(id)!
    if (node.isEnd) {
      resultIds.push(id)
      resultWords.push(word)
      snap({ activeId: id, line: 11, status: `Kata ditemukan: "${word}"`, sound: 'found' })
    }
    const childEntries = [...node.children.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
    for (const [ch, child] of childEntries) {
      snap({ activeId: child, line: 12, status: `Telusuri '${ch}'...`, sound: 'compare' })
      collect(child, word + ch)
    }
  }
  collect(cur, PREFIX)

  snap({ line: 14, status: `Hasil autocomplete: ${resultWords.join(', ')}`, sound: 'done' })
  return steps
}

export function buildSteps(mode: Mode): TrieStep[] {
  return mode === 'build' ? buildBuild() : buildAutocomplete()
}
