/**
 * Precomputed "Block & Chain Structure" walkthrough — one Step = a full snapshot
 * of the chain. The animation just replays these frames.
 *
 * A blockchain is, structurally, a linked list where each block is sealed by the
 * SHA-256 hash of its own contents, and stores the PREVIOUS block's hash:
 *
 *     hash = SHA-256( index | data | prevHash | nonce )
 *
 * Because prevHash threads each block to the one before it, the blocks form a
 * tamper-evident chain (proved in the next material, "Immutability").
 *
 * Every hash below is the REAL SHA-256 of "index|data|prevHash|0".
 */

export type Cue = 'new' | 'compute' | 'link' | 'done' | null

export interface Block {
  id: string
  index: number
  data: string
  prevHash: string
  /** null until the block is sealed (hashed). */
  hash: string | null
}

export interface ChainStep {
  blocks: Block[]
  /** id of the block being acted on this frame (null = none). */
  activeId: string | null
  /** what is happening to the active block. */
  phase: 'idle' | 'new' | 'hashing' | 'linked'
  line: number
  status: string
  sound: Cue
}

const GENESIS_PREV = '00000000'

// Real SHA-256 digests of "index|data|prevHash|0", chained in order.
const RAW: { data: string; hash: string }[] = [
  { data: 'Genesis Block', hash: 'c91a1b77165100491d3e5337f70292151ca05c44984d845018fb0097294165b5' },
  { data: 'Alice -> Bob: 5 BTC', hash: '491bf8ad1a104e6a80f8b188ba8213dbb8c75987dd9377a6322e0b7536003773' },
  { data: 'Bob -> Carol: 2 BTC', hash: 'b13a7bc78164b9820b76291c46664d84c3bc22c9d6fb1683feed9aeefe252990' },
  { data: 'Carol -> Dave: 1 BTC', hash: 'fff2925230150c52b978bcd0c14e8c9f2b107318a45ee5501eb5c9ac49ab574b' },
]

/** Short form of a hash for the cards. */
export function short(h: string): string {
  return h.slice(0, 12) + '…'
}

/** Python that builds the chain — shown in the CodeBlock. */
export const CODE_SOURCE = [
  'import hashlib',
  '',
  'def block_hash(b):',
  '    raw = f"{b.index}|{b.data}|{b.prev}|{b.nonce}"',
  '    return hashlib.sha256(raw.encode()).hexdigest()',
  '',
  'chain = [genesis()]              # prev = 00000000',
  'for data in txs:',
  '    prev = chain[-1].hash        # tunjuk ke belakang',
  '    b = Block(len(chain), data, prev)',
  '    b.hash = block_hash(b)       # kunci bloknya',
  '    chain.append(b)',
]

type Req = Pick<ChainStep, 'line' | 'status'>

function b(p: Partial<ChainStep> & Req): ChainStep {
  return {
    blocks: [],
    activeId: null,
    phase: 'idle',
    sound: null,
    ...p,
  }
}

export function buildSteps(): ChainStep[] {
  const steps: ChainStep[] = []
  const blocks: Block[] = []
  const snap = () => blocks.map((x) => ({ ...x }))

  // 1 — Intro: empty chain.
  steps.push(
    b({ blocks: [], line: 6, status: 'Blockchain itu kumpulan blok yang disambung pakai hash — ayo kita rakit.', sound: 'new' }),
  )

  RAW.forEach((r, i) => {
    const id = `b${i}`
    const prevHash = i === 0 ? GENESIS_PREV : RAW[i - 1].hash
    const isGenesis = i === 0

    // NEW — the block is created, prevHash filled, hash empty.
    blocks.push({ id, index: i, data: r.data, prevHash, hash: null })
    steps.push(
      b({
        blocks: snap(),
        activeId: id,
        phase: 'new',
        line: isGenesis ? 6 : 9,
        status: isGenesis
          ? 'Blok 0 — blok genesis. Tak punya induk, jadi prevHash = 00000000.'
          : `Blok ${i} menyalin hash blok ${i - 1} ke prevHash miliknya.`,
        sound: 'new',
      }),
    )

    // HASHING — compute the block's own hash.
    steps.push(
      b({
        blocks: snap(),
        activeId: id,
        phase: 'hashing',
        line: 4,
        status: 'hash = SHA-256( index | data | prevHash | nonce )',
        sound: 'compute',
      }),
    )

    // SEALED — hash assigned; for non-genesis the link is now proven.
    blocks[i].hash = r.hash
    steps.push(
      b({
        blocks: snap(),
        activeId: id,
        phase: 'linked',
        line: isGenesis ? 10 : 11,
        status: isGenesis
          ? `Genesis terkunci dengan hash ${short(r.hash)}`
          : `Tersambung: prevHash blok ${i}  ==  hash blok ${i - 1}`,
        sound: isGenesis ? 'done' : 'link',
      }),
    )
  })

  // Final — whole chain highlighted.
  steps.push(
    b({
      blocks: snap(),
      activeId: null,
      phase: 'idle',
      line: 11,
      status: 'Tiap blok menunjuk ke belakang lewat hash → satu rantai anti-palsu.',
      sound: 'done',
    }),
  )

  return steps
}
