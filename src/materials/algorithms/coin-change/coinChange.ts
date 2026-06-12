/**
 * Coin change (uang kembalian) dengan strategi greedy. Satu Step = snapshot
 * lengkap (sisa kembalian, pecahan yang sedang dicoba, lembar/kupon yang sudah
 * diberikan) — animasi tinggal memutar frame-frame ini.
 *
 * Dua mode membandingkan kasus pada algoritma yang SAMA:
 *   - 'rupiah' : pecahan rupiah standar → greedy selalu menghasilkan jumlah
 *                lembar minimum (optimal).
 *   - 'kupon'  : pecahan tak lazim (4rb · 3rb · 1rb) → greedy tetap cepat,
 *                tapi hasilnya BUKAN yang paling hemat (twist edukatif).
 *
 * Setiap step membawa dua lapis teks: `status` (teknis, untuk pill + mode kode)
 * dan `story` (analogi kasir, untuk mode cerita / penonton awam).
 */

export type Mode = 'rupiah' | 'kupon'
export type Cue = 'check' | 'take' | 'skip' | 'done' | 'twist' | null

export interface Denom {
  value: number
  color: string
}

export interface Piece {
  id: string
  value: number
  color: string
}

export interface CcStep {
  remaining: number
  /** Index pecahan di `denoms` yang sedang dipertimbangkan (null = di luar loop). */
  denomIndex: number | null
  taken: Piece[]
  /** Kombinasi paling hemat — hanya terisi pada step twist mode kupon. */
  optimal: Piece[] | null
  line: number
  status: string
  story: string
  sound: Cue
}

export const fmtRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`

export const CODE_SOURCE = [
  'def kembalian(sisa, pecahan):',
  '    hasil = []',
  '    for p in pecahan:        # besar -> kecil',
  '        while p <= sisa:     # masih muat?',
  '            hasil.append(p)  # ambil 1 lembar',
  '            sisa -= p',
  '    return hasil',
]

export interface ModeDef {
  label: string
  desc: string
  /** Satuan benda yang diberikan: 'lembar' (uang) / 'kupon'. */
  unit: string
  /** Kalimat konteks di atas visual, mis. transaksi belanja. */
  scenario: string
  target: number
  denoms: Denom[]
  /** Kombinasi optimal bila greedy TIDAK optimal; null bila greedy sudah optimal. */
  optimal: number[] | null
  filename: string
}

export const MODES: Record<Mode, ModeDef> = {
  rupiah: {
    label: 'Rupiah',
    desc: 'Greedy: ambil pecahan terbesar dulu — untuk rupiah hasilnya selalu paling hemat',
    unit: 'lembar',
    scenario: 'Belanja Rp 12.000 · Bayar Rp 50.000 → kembalian Rp 38.000',
    target: 38000,
    denoms: [
      { value: 10000, color: '#7C3AED' },
      { value: 5000, color: '#B45309' },
      { value: 2000, color: '#64748B' },
      { value: 1000, color: '#0D9488' },
    ],
    optimal: null,
    filename: 'kembalian.py',
  },
  kupon: {
    label: 'Kupon',
    desc: 'Pecahan tak lazim (4rb · 3rb · 1rb): greedy tetap cepat, tapi bukan yang paling hemat',
    unit: 'kupon',
    scenario: 'Tukar saldo Rp 6.000 dengan kupon kantin (4rb · 3rb · 1rb)',
    target: 6000,
    denoms: [
      { value: 4000, color: '#2563EB' },
      { value: 3000, color: '#DB2777' },
      { value: 1000, color: '#0D9488' },
    ],
    optimal: [3000, 3000],
    filename: 'kupon.py',
  },
}

export function buildSteps(mode: Mode): CcStep[] {
  const def = MODES[mode]
  const steps: CcStep[] = []
  const taken: Piece[] = []
  let remaining = def.target
  let pieceSeq = 0

  const colorOf = (v: number) => def.denoms.find((d) => d.value === v)?.color ?? '#64748B'

  const snap = (
    denomIndex: number | null,
    line: number,
    status: string,
    story: string,
    sound: Cue,
    optimal: Piece[] | null = null,
  ) => steps.push({ remaining, denomIndex, taken: [...taken], optimal, line, status, story, sound })

  snap(
    null,
    0,
    `sisa = ${fmtRp(def.target)}`,
    `Kasir harus memberi ${fmtRp(def.target)}. Bagaimana caranya dengan ${def.unit} sesedikit mungkin?`,
    null,
  )

  for (let i = 0; i < def.denoms.length; i++) {
    if (remaining === 0) break
    const p = def.denoms[i].value
    snap(i, 2, `p = ${fmtRp(p)}`, `Coba pecahan terbesar berikutnya: ${fmtRp(p)}.`, 'check')
    if (p > remaining) {
      snap(
        i,
        3,
        `${fmtRp(p)} > sisa ${fmtRp(remaining)} → lewati`,
        `${fmtRp(p)} lebih besar dari sisa ${fmtRp(remaining)} — lewati.`,
        'skip',
      )
      continue
    }
    while (p <= remaining) {
      taken.push({ id: `c${pieceSeq++}`, value: p, color: def.denoms[i].color })
      remaining -= p
      snap(
        i,
        4,
        `ambil ${fmtRp(p)} · sisa ${fmtRp(remaining)}`,
        remaining === 0
          ? `Ambil 1 ${def.unit} ${fmtRp(p)} — pas, sisa Rp 0!`
          : `Ambil 1 ${def.unit} ${fmtRp(p)} — sisa tinggal ${fmtRp(remaining)}.`,
        'take',
      )
    }
    if (remaining > 0) {
      snap(
        i,
        3,
        `${fmtRp(p)} > sisa ${fmtRp(remaining)} → pecahan lebih kecil`,
        `${fmtRp(p)} sudah tidak muat — turun ke pecahan yang lebih kecil.`,
        'skip',
      )
    }
  }

  const count = taken.length
  const sum = taken.map((t) => fmtRp(t.value)).join(' + ')
  if (def.optimal) {
    snap(
      null,
      6,
      `greedy selesai: ${count} ${def.unit}`,
      `Greedy selesai: ${sum} = ${count} ${def.unit}. Hemat? Belum tentu…`,
      'done',
    )
    const optimal = def.optimal.map((v, k) => ({ id: `o${k}`, value: v, color: colorOf(v) }))
    snap(
      null,
      6,
      `optimal: ${optimal.length} ${def.unit} → greedy ≠ optimal!`,
      `Ternyata ${def.optimal.map(fmtRp).join(' + ')} cuma ${optimal.length} ${def.unit}! Di pecahan tak lazim, greedy TIDAK selalu paling hemat.`,
      'twist',
      optimal,
    )
  } else {
    snap(
      null,
      6,
      `selesai: ${count} ${def.unit} (minimum)`,
      `Selesai! ${fmtRp(def.target)} pas dengan ${count} ${def.unit} — di pecahan rupiah, greedy selalu paling hemat.`,
      'done',
    )
  }

  return steps
}
