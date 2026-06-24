/**
 * Precomputed "Hashing (SHA-256)" walkthrough — one Step = a full snapshot of
 * the board. The animation just replays these frames.
 *
 * A cryptographic hash function maps ANY input to a fixed-size digest. The four
 * properties that make it the backbone of a blockchain:
 *   - DETERMINISTIC : same input -> same digest, every time.
 *   - FIXED SIZE    : any length in -> always 256 bits (64 hex) out.
 *   - AVALANCHE      : change one bit -> ~half the output bits flip.
 *   - ONE-WAY        : you cannot run it backwards to recover the input.
 *
 * All digests below are REAL SHA-256 outputs of the shown inputs.
 */

export type Cue = 'feed' | 'compute' | 'done' | 'diff' | null

export type Property = 'fixed' | 'deterministic' | 'avalanche' | 'oneway' | null

export interface HashStep {
  /** The message currently fed into the function. */
  input: string
  /** Short caption under the input box. */
  inputNote: string
  /** Index of the character that just changed (avalanche), else -1. */
  changedAt: number
  /** Stage of the pipeline this frame. */
  phase: 'idle' | 'feed' | 'compute' | 'result'
  /** The 64-hex digest to show (null until computed). */
  digest: string | null
  /** Earlier digest to diff against (avalanche); null otherwise. */
  compareTo: string | null
  /** Property being spotlighted this frame. */
  property: Property
  line: number
  status: string
  sound: Cue
}

const MSG = 'blockchain'
const MSG_CAP = 'Blockchain'
const LONG = 'Satoshi Nakamoto published the Bitcoin whitepaper on 31 Oct 2008.'

// Real SHA-256 digests of the inputs above.
const H_MSG = 'ef7797e13d3a75526946a3bcf00daec9fc9c9c4d51ddc7cc5df888f74dd434d1'
const H_CAP = '625da44e4eaf58d61cf048d168aa6f5e492dea166d8bb54ec06c30de07db57e1'
const H_LONG = 'e83db2b281ee6aba2d3b399801da76090437549b89396a06564bf6bb0c7ecb19'

/** SHA-256 in Python (stdlib) — shown in the CodeBlock. */
export const CODE_SOURCE = [
  'import hashlib',
  '',
  'def sha256(data: str) -> str:',
  '    return hashlib.sha256(',
  '        data.encode()',
  '    ).hexdigest()',
  '',
  'digest = sha256("blockchain")',
  '# 64 huruf hex · 256 bit · satu arah',
]

/** Count how many hex chars differ between two digests (avalanche metric). */
export function diffCount(a: string, b: string): number {
  let n = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++
  return n
}

type Req = Pick<HashStep, 'line' | 'status'>

function b(p: Partial<HashStep> & Req): HashStep {
  return {
    input: MSG,
    inputNote: '',
    changedAt: -1,
    phase: 'idle',
    digest: null,
    compareTo: null,
    property: null,
    sound: null,
    ...p,
  }
}

export function buildSteps(): HashStep[] {
  const steps: HashStep[] = []

  // 1 — Intro: a message sits at the input.
  steps.push(
    b({
      input: MSG,
      inputNote: 'data apa saja — teks, file, transaksi',
      phase: 'idle',
      line: 2,
      status: 'Fungsi hash mengubah data apa pun jadi "sidik jari" berukuran tetap.',
      sound: 'feed',
    }),
  )

  // 2 — Feed the message in.
  steps.push(
    b({
      input: MSG,
      inputNote: 'memasukkan pesan…',
      phase: 'feed',
      line: 4,
      status: 'Masukkan pesannya ke SHA-256.',
      sound: 'feed',
    }),
  )

  // 3 — Compute (mixing).
  steps.push(
    b({
      input: MSG,
      inputNote: 'mengaduk tiap bit…',
      phase: 'compute',
      line: 5,
      status: 'SHA-256 mengaduk semua bit dari pesan.',
      sound: 'compute',
    }),
  )

  // 4 — Result: the digest appears.
  steps.push(
    b({
      input: MSG,
      inputNote: 'pesan',
      phase: 'result',
      digest: H_MSG,
      property: 'fixed',
      line: 7,
      status: 'Keluar: sidik jari 64 huruf-hex (256 bit).',
      sound: 'done',
    }),
  )

  // 5 — Deterministic: run it again, identical digest.
  steps.push(
    b({
      input: MSG,
      inputNote: 'pesan sama, dijalankan lagi',
      phase: 'result',
      digest: H_MSG,
      property: 'deterministic',
      line: 7,
      status: 'Selalu sama: input sama → hasil hash selalu sama.',
      sound: 'compute',
    }),
  )

  // 6 — Fixed size: feed a much longer message.
  steps.push(
    b({
      input: LONG,
      inputNote: 'pesan jauh lebih panjang (64 huruf)',
      phase: 'feed',
      line: 4,
      status: 'Sekarang coba pesan yang jauh lebih panjang…',
      sound: 'feed',
    }),
  )

  // 7 — Compute the long one.
  steps.push(
    b({
      input: LONG,
      inputNote: 'mengaduk tiap bit…',
      phase: 'compute',
      line: 5,
      status: 'Sepanjang apa pun pesannya, semuanya tetap diringkas.',
      sound: 'compute',
    }),
  )

  // 8 — Result: still 64 hex.
  steps.push(
    b({
      input: LONG,
      inputNote: 'pesan panjang',
      phase: 'result',
      digest: H_LONG,
      property: 'fixed',
      line: 8,
      status: 'Ukuran tetap: input berapa pun → hasil selalu 64 hex (256 bit).',
      sound: 'done',
    }),
  )

  // 9 — Avalanche: change ONE letter (lowercase b → capital B).
  steps.push(
    b({
      input: MSG_CAP,
      inputNote: 'satu huruf berubah:  b → B',
      changedAt: 0,
      phase: 'feed',
      line: 4,
      status: 'Ubah sedikit saja: huruf pertama jadi kapital.',
      sound: 'feed',
    }),
  )

  // 10 — Compute.
  steps.push(
    b({
      input: MSG_CAP,
      inputNote: 'mengaduk tiap bit…',
      changedAt: 0,
      phase: 'compute',
      line: 5,
      status: 'Hash ulang pesan yang nyaris sama.',
      sound: 'compute',
    }),
  )

  // 11 — Result: avalanche — compare against the original digest.
  steps.push(
    b({
      input: MSG_CAP,
      inputNote: 'satu huruf beda',
      changedAt: 0,
      phase: 'result',
      digest: H_CAP,
      compareTo: H_MSG,
      property: 'avalanche',
      line: 7,
      status: `Efek longsor: 1 huruf berubah, ${diffCount(H_CAP, H_MSG)} dari 64 hex ikut berubah.`,
      sound: 'diff',
    }),
  )

  // 12 — One-way.
  steps.push(
    b({
      input: MSG_CAP,
      inputNote: 'hash → input?  mustahil',
      phase: 'result',
      digest: H_CAP,
      compareTo: H_MSG,
      property: 'oneway',
      line: 5,
      status: 'Satu arah: hash tidak bisa dibalik jadi input aslinya.',
      sound: 'compute',
    }),
  )

  // 13 — Why it matters for blockchain (teaser).
  steps.push(
    b({
      input: MSG,
      inputNote: 'isi sebuah blok',
      phase: 'result',
      digest: H_MSG,
      line: 7,
      status: 'Karena itu, tiap blok diberi nama dari hash isinya sendiri.',
      sound: 'compute',
    }),
  )

  // 14 — Summary.
  steps.push(
    b({
      input: MSG,
      inputNote: 'selalu sama · ukuran tetap · longsor · satu arah',
      phase: 'result',
      digest: H_MSG,
      line: 8,
      status: 'Hash = sidik jari anti-palsu — fondasi sebuah blockchain.',
      sound: 'done',
    }),
  )

  return steps
}
