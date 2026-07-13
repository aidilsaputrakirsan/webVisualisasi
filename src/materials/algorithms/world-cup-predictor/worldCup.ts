/**
 * Prediksi juara Piala Dunia 2026 dengan Simulasi Monte Carlo — seluruh
 * langkah dihitung dulu jadi Step[]; animasi tinggal memutarnya.
 *
 * Cakupan: semifinal yang nyata. Per 13 Juli 2026 tersisa empat tim (Prancis,
 * Spanyol, Inggris, Argentina — kebetulan peringkat 4 besar FIFA saat ini).
 * Kemenangan perempatfinal mereka adalah hasil nyata; hanya tiga laga tersisa
 * (dua semifinal + final) yang belum dimainkan.
 *
 * SATU metode, yang terbukti & viral: Simulasi Monte Carlo — pendekatan
 * "superkomputer memainkan turnamen ribuan kali" yang dipakai Opta dan
 * FiveThirtyEight. Tiap laga = lemparan koin berbobot yang peluangnya diambil
 * dari selisih rating kedua tim (rumus ekspektasi Elo). Mainkan tiga laga sisa
 * 10.000 kali, hitung berapa sering tiap tim mengangkat trofi — rasio itulah
 * peluang juara. Bagan di layar menampilkan JALUR PALING MUNGKIN (pemenang
 * dengan peluang tertinggi tiap laga), sehingga bagan dan prediksi konsisten.
 *
 * Rating tim bersifat ilustratif (mengikuti urutan 4 besar FIFA, bukan feed
 * Elo resmi) — tujuannya mengajarkan metode, bukan menjual tebakan.
 */

export interface Team {
  id: string
  name: string
  rating: number
  color: string
  /** Cara mereka lolos ke semifinal (hasil perempatfinal nyata). */
  qf: string
}

/** Empat semifinalis nyata, rating mengikuti urutan 4 besar FIFA. */
export const TEAMS: Team[] = [
  { id: 'ARG', name: 'Argentina', rating: 92, color: '#5FA8D3', qf: 'menang 3–1 vs Swiss' },
  { id: 'FRA', name: 'Prancis', rating: 91, color: '#274CA0', qf: 'menang 2–0 vs Maroko' },
  { id: 'ESP', name: 'Spanyol', rating: 90, color: '#C8102E', qf: 'menang 2–1 vs Belgia' },
  { id: 'ENG', name: 'Inggris', rating: 89, color: '#6B2737', qf: 'menang 2–1 vs Norwegia' },
]

export const TEAM_MAP: Record<string, Team> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

/** Undian semifinal nyata. SF1: Prancis vs Spanyol (Dallas). SF2: Inggris vs Argentina (Atlanta). */
const SF_PAIRS: [string, string][] = [
  ['FRA', 'ESP'],
  ['ENG', 'ARG'],
]

const TRIALS = 10000
const CHECKPOINTS = [1, 20, 150, 600, 1500, 4000, TRIALS]
const RATING_SCALE = 20

export const SIM_COUNT = TRIALS

/** P(a menang atas b): rumus ekspektasi Elo diubah jadi peluang menang. */
export function winProbability(a: Team, b: Team): number {
  return 1 / (1 + 10 ** ((b.rating - a.rating) / RATING_SCALE))
}

export const formatPct = (p: number) => `${Math.round(p * 100)}%`

/** PRNG deterministik (mulberry32) — menjaga generator tetap fungsi murni. */
function mulberry32(seed: number): () => number {
  let s = seed
  return function rng() {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEED = 2026

function simulateMatch(a: Team, b: Team, rng: () => number): Team {
  return rng() < winProbability(a, b) ? a : b
}

/** Satu run diam: SF1, SF2, lalu final. Dipakai untuk ribuan trial. */
function simulateToChampion(rng: () => number): Team {
  const f1 = simulateMatch(TEAM_MAP[SF_PAIRS[0][0]], TEAM_MAP[SF_PAIRS[0][1]], rng)
  const f2 = simulateMatch(TEAM_MAP[SF_PAIRS[1][0]], TEAM_MAP[SF_PAIRS[1][1]], rng)
  return simulateMatch(f1, f2, rng)
}

/** Pemenang paling mungkin (peluang tertinggi) — untuk jalur prediksi di bagan. */
const likelier = (a: Team, b: Team): Team => (winProbability(a, b) >= 0.5 ? a : b)

const ratios = (counts: Record<string, number>, n: number): Record<string, number> =>
  Object.fromEntries(TEAMS.map((t) => [t.id, counts[t.id] / n]))

export type MatchKey = 'sf-0' | 'sf-1' | 'final'

export interface BracketMatch {
  key: MatchKey
  teamAId: string | null
  teamBId: string | null
  winnerId: string | null
}

export type Stage = 'intro' | 'method' | 'montecarlo' | 'result'
export type Sound = 'reveal' | 'advance' | 'tally' | 'done' | null

export interface PredictorStep {
  stage: Stage
  status: string
  line: number
  bracket: BracketMatch[]
  /** Tampilkan peluang menang per laga di bagan. */
  showProb: boolean
  trialCount: number
  probabilities: Record<string, number> | null
  championId: string | null
  sound: Sound
}

export const CODE_SOURCE = [
  'def prediksi_juara(tim, simulasi=10_000):',
  '    menang = {t.id: 0 for t in tim}',
  '    for _ in range(simulasi):',
  '        a = main(PRA, SPA)      # semifinal 1',
  '        b = main(ING, ARG)      # semifinal 2',
  '        juara = main(a, b)      # final',
  '        menang[juara.id] += 1',
  '    return {t: menang[t.id] / simulasi for t in tim}',
]

export function buildSteps(): PredictorStep[] {
  const rng = mulberry32(SEED)
  const steps: PredictorStep[] = []

  const bracket: BracketMatch[] = [
    { key: 'sf-0', teamAId: SF_PAIRS[0][0], teamBId: SF_PAIRS[0][1], winnerId: null },
    { key: 'sf-1', teamAId: SF_PAIRS[1][0], teamBId: SF_PAIRS[1][1], winnerId: null },
    { key: 'final', teamAId: null, teamBId: null, winnerId: null },
  ]
  const snap = () => bracket.map((m) => ({ ...m }))
  const get = (key: MatchKey) => bracket.find((m) => m.key === key)!

  const push = (over: Partial<PredictorStep> & Pick<PredictorStep, 'status' | 'line'>) => {
    steps.push({
      stage: 'intro',
      bracket: snap(),
      showProb: false,
      trialCount: 0,
      probabilities: null,
      championId: null,
      sound: null,
      ...over,
    })
  }

  // ── Kenalkan empat tim ──
  push({ status: 'Empat tim tersisa — semifinalis Piala Dunia 2026, peringkat 4 besar FIFA saat ini.', line: 0 })
  push({
    status: 'Prancis vs Spanyol, dan Inggris vs Argentina. Tersisa 3 laga: 2 semifinal dan 1 final.',
    line: 0,
  })

  // ── Jelaskan metode ──
  push({
    stage: 'method',
    status: 'Metodenya: Simulasi Monte Carlo — dipakai Opta & FiveThirtyEight untuk memprediksi.',
    line: 2,
    showProb: true,
    sound: 'tally',
  })
  push({
    stage: 'method',
    status: 'Tiap laga = lemparan koin berbobot; peluangnya dari selisih rating (rumus Elo).',
    line: 3,
    showProb: true,
    sound: 'reveal',
  })

  // ── Terjemahkan rating jadi peluang menang tiap laga (rumus Elo) ──
  const pFRA = winProbability(TEAM_MAP.FRA, TEAM_MAP.ESP)
  const pARG = winProbability(TEAM_MAP.ARG, TEAM_MAP.ENG)
  push({
    stage: 'method',
    status: `Semifinal 1 — Prancis (91) vs Spanyol (90): selisih rating tipis, jadi hampir imbang, ${formatPct(pFRA)} vs ${formatPct(1 - pFRA)}.`,
    line: 3,
    showProb: true,
    sound: 'reveal',
  })
  push({
    stage: 'method',
    status: `Semifinal 2 — Argentina (92) vs Inggris (89): rating lebih tinggi berarti peluang lebih besar, ${formatPct(pARG)} vs ${formatPct(1 - pARG)}.`,
    line: 4,
    showProb: true,
    sound: 'reveal',
  })

  // ── Monte Carlo: mainkan 3 laga sisa 10.000 kali ──
  const counts: Record<string, number> = Object.fromEntries(TEAMS.map((t) => [t.id, 0]))
  let ci = 0
  for (let i = 1; i <= TRIALS; i++) {
    counts[simulateToChampion(rng).id]++
    if (CHECKPOINTS[ci] === i) {
      push({
        stage: 'montecarlo',
        status:
          i === 1
            ? 'Sekali main hasilnya acak — satu tim seolah menang 100%. Satu sampel tidak berarti.'
            : `Setelah ${i.toLocaleString('id-ID')} simulasi turnamen, peluang juara makin stabil.`,
        line: i === 1 ? 6 : 2,
        showProb: true,
        trialCount: i,
        probabilities: ratios(counts, i),
        sound: 'tally',
      })
      ci++
    }
  }

  const final = steps[steps.length - 1].probabilities!
  const favorite = [...TEAMS].sort((x, y) => final[y.id] - final[x.id])[0]

  // ── Hukum Bilangan Besar: kenapa angkanya bisa dipercaya ──
  push({
    stage: 'montecarlo',
    status: 'Makin banyak simulasi, peluangnya makin menstabil dan berhenti berubah — inilah Hukum Bilangan Besar.',
    line: 7,
    showProb: true,
    trialCount: TRIALS,
    probabilities: final,
    sound: 'tally',
  })

  // ── Jalur prediksi dibangun bertahap (pemenang paling mungkin tiap laga) ──
  const sf0 = get('sf-0')
  const sf1 = get('sf-1')
  const finalM = get('final')
  const w0 = likelier(TEAM_MAP[sf0.teamAId!], TEAM_MAP[sf0.teamBId!])
  const w1 = likelier(TEAM_MAP[sf1.teamAId!], TEAM_MAP[sf1.teamBId!])

  sf0.winnerId = w0.id
  push({
    stage: 'result',
    status: `Menyusun jalur paling mungkin — di semifinal 1, ${w0.name} yang paling sering lolos.`,
    line: 3,
    showProb: true,
    trialCount: TRIALS,
    probabilities: final,
    sound: 'advance',
  })

  sf1.winnerId = w1.id
  finalM.teamAId = w0.id
  finalM.teamBId = w1.id
  push({
    stage: 'result',
    status: `Di semifinal 2, ${w1.name} yang paling sering lolos — mereka bertemu di final.`,
    line: 4,
    showProb: true,
    trialCount: TRIALS,
    probabilities: final,
    sound: 'advance',
  })

  finalM.winnerId = likelier(w0, w1).id

  push({
    stage: 'result',
    status: `Prediksi: ${favorite.name} paling mungkin juara — ${formatPct(final[favorite.id])} dari ${TRIALS.toLocaleString('id-ID')} simulasi.`,
    line: 7,
    showProb: true,
    trialCount: TRIALS,
    probabilities: final,
    championId: favorite.id,
    sound: 'done',
  })

  return steps
}
