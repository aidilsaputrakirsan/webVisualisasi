/**
 * Precomputed "Immutability" walkthrough — one Step = a full snapshot of the
 * chain. The animation just replays these frames.
 *
 * Builds directly on "Block & Chain Structure": we take the sealed 4-block chain
 * and watch an attacker quietly edit an old block. Because each block is named by
 * the hash of its own contents — and stores the previous block's hash — a single
 * edit cascades: the block no longer matches its hash, the next block's prevHash
 * no longer matches, and every block after it becomes invalid. To hide it the
 * attacker would have to re-mine the whole tail (and still not match everyone
 * else's copy). That practical impossibility is what "immutable" means.
 *
 * All hashes below are REAL SHA-256 of "index|data|prevHash|0".
 */

import { short } from '../block-chain/chain'

export type Cue = 'tamper' | 'check' | 'break' | 'done' | null
export type BState = 'valid' | 'invalid' | 'checking' | 'idle'

export interface TBlock {
  id: string
  index: number
  data: string
  prevHash: string
  hash: string
  state: BState
  /** data was edited by the attacker (shown in red). */
  tampered: boolean
  /** link to the previous block is broken / part of the broken tail. */
  linkBroken: boolean
  /** short caption under the card (null = none). */
  note: string | null
}

const H0 = 'c91a1b77165100491d3e5337f70292151ca05c44984d845018fb0097294165b5'
const H1 = '491bf8ad1a104e6a80f8b188ba8213dbb8c75987dd9377a6322e0b7536003773'
const H2 = 'b13a7bc78164b9820b76291c46664d84c3bc22c9d6fb1683feed9aeefe252990'
const H3 = 'fff2925230150c52b978bcd0c14e8c9f2b107318a45ee5501eb5c9ac49ab574b'
/** Re-hash of block 1 after the attacker changes "5 BTC" → "500 BTC". */
const H1B = '6cb7d571389fadf9a1ec9a8259fbe62d37a3c36061c87c887eed2faf5b5cb15c'

const DATA1_TAMPERED = 'Alice -> Bob: 500 BTC'

/** Chain validation in Python — shown in the CodeBlock. */
export const CODE_SOURCE = [
  'def is_valid(chain):',
  '    for i, b in enumerate(chain):',
  '        if block_hash(b) != b.hash:   # isi cocok?',
  '            return False              # blok diubah',
  '        if i > 0:',
  '            prev = chain[i - 1]',
  '            if b.prev != prev.hash:   # sambungan cocok?',
  '                return False          # link putus',
  '    return True',
]

type Req = Pick<TamperStep, 'line' | 'status'>

export interface TamperStep {
  blocks: TBlock[]
  line: number
  status: string
  sound: Cue
}

function b(p: Partial<TamperStep> & Req): TamperStep {
  return { blocks: [], sound: null, ...p }
}

export function buildSteps(): TamperStep[] {
  // Working chain (the sealed result of material #2).
  const blocks: TBlock[] = [
    { id: 'b0', index: 0, data: 'Genesis Block', prevHash: '00000000', hash: H0, state: 'valid', tampered: false, linkBroken: false, note: null },
    { id: 'b1', index: 1, data: 'Alice -> Bob: 5 BTC', prevHash: H0, hash: H1, state: 'valid', tampered: false, linkBroken: false, note: null },
    { id: 'b2', index: 2, data: 'Bob -> Carol: 2 BTC', prevHash: H1, hash: H2, state: 'valid', tampered: false, linkBroken: false, note: null },
    { id: 'b3', index: 3, data: 'Carol -> Dave: 1 BTC', prevHash: H2, hash: H3, state: 'valid', tampered: false, linkBroken: false, note: null },
  ]
  const snap = () => blocks.map((x) => ({ ...x }))
  const steps: TamperStep[] = []

  // 1 — Intro: the valid chain.
  steps.push(b({ blocks: snap(), line: 8, status: 'Kita mulai dari rantai yang sudah sah — semua blok terkunci.', sound: 'check' }))

  // 2 — The rule of validity.
  steps.push(
    b({ blocks: snap(), line: 2, status: 'Aturan sah: hash tiap blok cocok dengan isinya, dan prevHash nyambung.', sound: 'check' }),
  )

  // 3 — Attacker edits block 1's data.
  blocks[1].data = DATA1_TAMPERED
  blocks[1].tampered = true
  blocks[1].state = 'invalid'
  blocks[1].note = 'isi diubah diam-diam'
  steps.push(b({ blocks: snap(), line: 1, status: 'Penyerang mengubah isi Blok 1 secara diam-diam:  5 → 500 BTC.', sound: 'tamper' }))

  // 4 — Self-check fails: contents no longer match the stored hash.
  blocks[1].note = `hash dari isi baru = ${short(H1B)}  ≠  hash tersimpan ${short(H1)}`
  steps.push(
    b({ blocks: snap(), line: 2, status: 'Cek Blok 1: hash dari isi baru tak sama dengan hash tersimpan. Ketahuan!', sound: 'break' }),
  )

  // 5 — Attacker tries to cover it: recompute block 1's hash.
  blocks[1].hash = H1B
  blocks[1].state = 'checking'
  blocks[1].note = `hash dihitung ulang → ${short(H1B)} (cocok lagi dengan isi)`
  steps.push(
    b({ blocks: snap(), line: 3, status: 'Penyerang menghitung ulang hash Blok 1 agar cocok lagi dengan isinya.', sound: 'check' }),
  )

  // 6 — But now block 2's prevHash no longer matches block 1's new hash.
  blocks[1].note = 'isi & hash kini cocok lagi'
  blocks[2].linkBroken = true
  blocks[2].state = 'invalid'
  blocks[2].note = `prevHash (lama ${short(H1)}) ≠ hash Blok 1 (baru ${short(H1B)})`
  steps.push(
    b({ blocks: snap(), line: 6, status: 'Tapi Blok 2 menyimpan prevHash lama. prevHash ≠ hash Blok 1 → link PUTUS.', sound: 'break' }),
  )

  // 7 — Cascade: everything after the break is invalid.
  blocks[3].linkBroken = true
  blocks[3].state = 'invalid'
  blocks[3].note = 'dibangun di atas blok yang rusak'
  steps.push(
    b({ blocks: snap(), line: 7, status: 'Blok 2 tidak sah → Blok 3 yang menumpuk di atasnya ikut tidak sah.', sound: 'break' }),
  )

  // 8 — One small edit broke the whole tail.
  steps.push(
    b({ blocks: snap(), line: 7, status: 'Satu perubahan kecil merusak Blok 2 hingga ujung rantai — efek beruntun.', sound: 'break' }),
  )

  // 9 — To truly hide it: re-mine every following block.
  blocks[2].note = 'harus di-mining ulang'
  blocks[3].note = 'harus di-mining ulang'
  blocks[2].state = 'checking'
  blocks[3].state = 'checking'
  steps.push(
    b({ blocks: snap(), line: 0, status: 'Untuk menutupi, semua blok sesudahnya harus di-mining ulang dari nol.', sound: 'check' }),
  )

  // 10 — And the network still holds the original.
  steps.push(
    b({ blocks: snap(), line: 8, status: 'Di jaringan, peserta lain tetap memegang salinan rantai yang asli.', sound: 'check' }),
  )

  // 11 — Rejected by the majority.
  steps.push(
    b({ blocks: snap(), line: 7, status: 'Hash versi penyerang beda dari salinan mayoritas → langsung ditolak.', sound: 'break' }),
  )

  // 12 — Summary.
  steps.push(
    b({
      blocks: snap(),
      line: 8,
      status: 'Immutability: mengubah masa lalu = menghitung ulang seluruh sisa rantai. Praktis mustahil.',
      sound: 'done',
    }),
  )

  return steps
}
