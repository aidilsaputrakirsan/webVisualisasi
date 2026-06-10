/**
 * Tebak angka 1–100 sebagai binary search. Satu Step = snapshot lengkap
 * permainan (rentang [low, high], tebakan saat ini, riwayat tebakan) —
 * animasi tinggal memutar frame-frame ini.
 *
 * Tiga ronde (angka rahasia berbeda) membuktikan klaim yang sama: berapa pun
 * angkanya, menebak dari tengah lalu membuang setengah rentang selalu selesai
 * dalam maksimal 7 tebakan — versus menebak satu-satu yang bisa butuh sampai
 * 100 tebakan.
 */

export type Mode = 'r1' | 'r2' | 'r3'
export type Verdict = 'up' | 'down' | 'hit'
export type Cue = 'guess' | 'up' | 'down' | 'hit' | 'done' | null

export const RANGE_MIN = 1
export const RANGE_MAX = 100
/** ceil(log2(100)) — maksimum tebakan binary search di rentang 1–100. */
export const MAX_GUESSES = 7

export interface GuessEntry {
  id: string
  value: number
  verdict: Verdict
}

export interface GnStep {
  low: number
  high: number
  /** Tebakan yang sedang diajukan (null = di luar fase menebak). */
  guess: number | null
  /** Respons atas tebakan saat ini (null = baru diajukan, belum dijawab). */
  verdict: Verdict | null
  history: GuessEntry[]
  attempts: number
  /** Angka rahasia ditampilkan terbuka (kartu terbalik) di akhir. */
  revealed: boolean
  line: number
  status: string
  story: string
  sound: Cue
}

export const CODE_SOURCE = [
  'low, high = 1, 100',
  'while True:',
  '    guess = (low + high) // 2   # tengah',
  '    if guess == secret:',
  '        return guess            # ketemu!',
  '    if guess < secret:',
  '        low = guess + 1         # "lebih besar"',
  '    else:',
  '        high = guess - 1        # "lebih kecil"',
]

export interface ModeDef {
  label: string
  secret: number
}

export const MODES: Record<Mode, ModeDef> = {
  r1: { label: 'Ronde 1', secret: 67 },
  r2: { label: 'Ronde 2', secret: 13 },
  r3: { label: 'Ronde 3', secret: 91 },
}

export function buildSteps(mode: Mode): GnStep[] {
  const { secret } = MODES[mode]
  const steps: GnStep[] = []
  const history: GuessEntry[] = []
  let low = RANGE_MIN
  let high = RANGE_MAX

  const snap = (
    guess: number | null,
    verdict: Verdict | null,
    revealed: boolean,
    line: number,
    status: string,
    story: string,
    sound: Cue,
  ) =>
    steps.push({
      low,
      high,
      guess,
      verdict,
      history: [...history],
      attempts: history.length,
      revealed,
      line,
      status,
      story,
      sound,
    })

  snap(
    null,
    null,
    false,
    0,
    `low = ${RANGE_MIN} · high = ${RANGE_MAX}`,
    'Aku memikirkan satu angka antara 1 sampai 100. Berani menebak berapa kali?',
    null,
  )

  let found = false
  while (!found) {
    const guess = Math.floor((low + high) / 2)
    const n = history.length + 1
    snap(
      guess,
      null,
      false,
      2,
      `tebakan #${n}: (${low} + ${high}) // 2 = ${guess}`,
      `Tebakan ke-${n}: ambil tengah rentang ${low}–${high} → ${guess}.`,
      'guess',
    )

    if (guess === secret) {
      history.push({ id: `g${n}`, value: guess, verdict: 'hit' })
      snap(
        guess,
        'hit',
        true,
        4,
        `${guess} == secret → ketemu dalam ${n} tebakan!`,
        `Tepat! Angkanya memang ${guess} — ketemu hanya dalam ${n} tebakan.`,
        'hit',
      )
      found = true
    } else if (guess < secret) {
      history.push({ id: `g${n}`, value: guess, verdict: 'up' })
      low = guess + 1
      snap(
        guess,
        'up',
        false,
        6,
        `${guess} < secret → "lebih besar" · sisa ${high - low + 1} angka`,
        `"Lebih besar!" — semua angka sampai ${guess} tercoret. Tinggal ${high - low + 1} kandidat.`,
        'up',
      )
    } else {
      history.push({ id: `g${n}`, value: guess, verdict: 'down' })
      high = guess - 1
      snap(
        guess,
        'down',
        false,
        8,
        `${guess} > secret → "lebih kecil" · sisa ${high - low + 1} angka`,
        `"Lebih kecil!" — semua angka dari ${guess} ke atas tercoret. Tinggal ${high - low + 1} kandidat.`,
        'down',
      )
    }
  }

  const n = history.length
  snap(
    null,
    'hit',
    true,
    4,
    `binary search: ${n} tebakan · linear (1,2,3,…): ${secret} tebakan`,
    `Menebak satu-satu dari 1 butuh ${secret} tebakan. Membagi dua rentang? Cukup ${n} — dan tak pernah lebih dari ${MAX_GUESSES}.`,
    'done',
  )

  return steps
}
