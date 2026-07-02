/**
 * Monte Carlo World Cup 2026 prediction — precomputed as a Step[]; the
 * animation just replays the frames.
 *
 * Grounded in the real tournament: the 32 teams below are the actual Round
 * of 32 field (12 groups of 4, top two + the 8 best third-placed teams —
 * confirmed, all group matches complete). Six Round-of-32 results are
 * already known (real scorelines, no prediction needed for those). The
 * other ten Round-of-32 games, plus everything from the Round of 16 to the
 * Final, are unresolved — that's what the model predicts, one match at a
 * time via an Elo-style win probability, then thousands of times over via
 * Monte Carlo so the audience watches the championship estimate converge.
 *
 * Team ratings are illustrative (hand-set from general footballing pedigree,
 * NOT an official Elo/FIFA feed) — the point is teaching the method, not
 * publishing a forecast.
 */

export interface Team {
  id: string
  name: string
  rating: number
  color: string
}

interface TeamSeed {
  id: string
  name: string
  rating: number
}

// Real Round-of-32 field, World Cup 2026 (group winners + runners-up + 8 best thirds).
const TEAM_SEEDS: TeamSeed[] = [
  { id: 'CAN', name: 'Canada', rating: 75 },
  { id: 'RSA', name: 'South Africa', rating: 70 },
  { id: 'BRA', name: 'Brazil', rating: 92 },
  { id: 'JPN', name: 'Japan', rating: 78 },
  { id: 'GER', name: 'Germany', rating: 85 },
  { id: 'PAR', name: 'Paraguay', rating: 75 },
  { id: 'NED', name: 'Netherlands', rating: 86 },
  { id: 'MAR', name: 'Morocco', rating: 82 },
  { id: 'CIV', name: 'Ivory Coast', rating: 77 },
  { id: 'NOR', name: 'Norway', rating: 79 },
  { id: 'FRA', name: 'France', rating: 91 },
  { id: 'SWE', name: 'Sweden', rating: 75 },
  { id: 'MEX', name: 'Mexico', rating: 78 },
  { id: 'ECU', name: 'Ecuador', rating: 76 },
  { id: 'ENG', name: 'England', rating: 88 },
  { id: 'COD', name: 'DR Congo', rating: 70 },
  { id: 'BEL', name: 'Belgium', rating: 85 },
  { id: 'SEN', name: 'Senegal', rating: 77 },
  { id: 'USA', name: 'United States', rating: 80 },
  { id: 'BIH', name: 'Bosnia and Herzegovina', rating: 71 },
  { id: 'ESP', name: 'Spain', rating: 90 },
  { id: 'AUT', name: 'Austria', rating: 76 },
  { id: 'SUI', name: 'Switzerland', rating: 81 },
  { id: 'ALG', name: 'Algeria', rating: 76 },
  { id: 'POR', name: 'Portugal', rating: 87 },
  { id: 'CRO', name: 'Croatia', rating: 81 },
  { id: 'AUS', name: 'Australia', rating: 71 },
  { id: 'EGY', name: 'Egypt', rating: 77 },
  { id: 'ARG', name: 'Argentina', rating: 91 },
  { id: 'CPV', name: 'Cape Verde', rating: 70 },
  { id: 'COL', name: 'Colombia', rating: 82 },
  { id: 'GHA', name: 'Ghana', rating: 76 },
]

/** Golden-angle hue rotation — 32 well-separated colours with no manual curation. */
const teamColor = (i: number) => `hsl(${Math.round((i * 137.508) % 360)}, 42%, 45%)`

export const TEAMS: Team[] = TEAM_SEEDS.map((t, i) => ({ ...t, color: teamColor(i) }))
export const TEAM_MAP: Record<string, Team> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

/** Round of 32 draw, bracket order (matches 73-88). */
const R32_PAIRS: [string, string][] = [
  ['CAN', 'RSA'],
  ['BRA', 'JPN'],
  ['GER', 'PAR'],
  ['NED', 'MAR'],
  ['CIV', 'NOR'],
  ['FRA', 'SWE'],
  ['MEX', 'ECU'],
  ['ENG', 'COD'],
  ['BEL', 'SEN'],
  ['USA', 'BIH'],
  ['ESP', 'AUT'],
  ['SUI', 'ALG'],
  ['POR', 'CRO'],
  ['AUS', 'EGY'],
  ['ARG', 'CPV'],
  ['COL', 'GHA'],
]

/** Already-played Round of 32 results (real scorelines) — indices into R32_PAIRS. */
const R32_RESULTS: Record<number, { winnerId: string; note: string }> = {
  0: { winnerId: 'CAN', note: '1–0' },
  1: { winnerId: 'BRA', note: '2–1' },
  2: { winnerId: 'PAR', note: '1–1, won 4–3 on penalties' },
  3: { winnerId: 'MAR', note: '1–1, won 3–2 on penalties' },
  4: { winnerId: 'NOR', note: '2–1' },
  5: { winnerId: 'FRA', note: '3–0' },
}

/**
 * Round of 16 pairings, as pairs of R32_PAIRS indices — sourced from the
 * official bracket (Wikipedia's raw match template, cross-checked against
 * two independent sources), NOT a made-up adjacent-pair guess:
 *   M89 = R32 #75 & #78 (Paraguay/France)   M93 = R32 #83 & #84 (Spain-Austria/Switzerland-Algeria)
 *   M90 = R32 #73 & #76 (Canada/Morocco)    M94 = R32 #81 & #82 (Belgium-Senegal/USA-Bosnia)
 *   M91 = R32 #74 & #77 (Brazil/Norway)     M95 = R32 #86 & #88 (Australia-Egypt/Colombia-Ghana)
 *   M92 = R32 #79 & #80 (Mexico-Ecuador/England-DR Congo)  M96 = R32 #85 & #87 (Portugal-Croatia/Argentina-Cape Verde)
 * Ordered here so consecutive pairs feed the real QF match numbers:
 * QF97=(M89,M90), QF98=(M93,M94), QF99=(M91,M92), QF100=(M95,M96) —
 * which is why Brazil (M91) and France (M89) only meet in the Final, not
 * the semifinal.
 */
const R16_INDEX_PAIRS: [number, number][] = [
  [2, 5], // M89: winner(GER/PAR) vs winner(FRA/SWE)
  [0, 3], // M90: winner(CAN/RSA) vs winner(NED/MAR)
  [10, 11], // M93: winner(ESP/AUT) vs winner(SUI/ALG)
  [8, 9], // M94: winner(BEL/SEN) vs winner(USA/BIH)
  [1, 4], // M91: winner(BRA/JPN) vs winner(CIV/NOR)
  [6, 7], // M92: winner(MEX/ECU) vs winner(ENG/COD)
  [13, 15], // M95: winner(AUS/EGY) vs winner(COL/GHA)
  [12, 14], // M96: winner(POR/CRO) vs winner(ARG/CPV)
]

const SEED = 2026
const TRIALS = 4000
const CHECKPOINTS = [50, 200, 600, 1500, TRIALS]
const RATING_SCALE = 20

/** P(a beats b), Elo-style expected score from the rating gap. */
export function winProbability(a: Team, b: Team): number {
  return 1 / (1 + 10 ** ((b.rating - a.rating) / RATING_SCALE))
}

export const formatPct = (p: number) => `${Math.round(p * 100)}%`

/** Deterministic PRNG (mulberry32) — keeps the generator a pure function. */
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

function simulateMatch(a: Team, b: Team, rng: () => number): Team {
  return rng() < winProbability(a, b) ? a : b
}

/** One full silent run of everything still unresolved: the 10 open Round of
 *  32 games (the other 6 are locked to their real result), then R16 -> QF ->
 *  SF -> Final. Used for the thousands of bulk Monte Carlo trials. */
function simulateRestOfTournament(rng: () => number): Team {
  const r32Winners = R32_PAIRS.map(([aId, bId], i) => {
    const real = R32_RESULTS[i]
    if (real) return TEAM_MAP[real.winnerId]
    return simulateMatch(TEAM_MAP[aId], TEAM_MAP[bId], rng)
  })
  const r16Winners = R16_INDEX_PAIRS.map(([i, j]) => simulateMatch(r32Winners[i], r32Winners[j], rng))
  const qfWinners = [0, 1, 2, 3].map((k) => simulateMatch(r16Winners[k * 2], r16Winners[k * 2 + 1], rng))
  const sfWinners = [simulateMatch(qfWinners[0], qfWinners[1], rng), simulateMatch(qfWinners[2], qfWinners[3], rng)]
  return simulateMatch(sfWinners[0], sfWinners[1], rng)
}

const ratios = (counts: Record<string, number>, n: number): Record<string, number> =>
  Object.fromEntries(TEAMS.map((t) => [t.id, counts[t.id] / n]))

export interface R32Match {
  index: number
  teamAId: string
  teamBId: string
  decided: boolean
  resultNote: string | null
  winnerId: string | null
}

export type Round = 0 | 1 | 2 | 3

export interface BracketMatch {
  round: Round
  matchIndex: number
  teamAId: string | null
  teamBId: string | null
  winnerId: string | null
}

export type Stage = 'intro' | 'r32' | 'tree' | 'montecarlo' | 'result'
export type Sound = 'reveal' | 'upset' | 'advance' | 'tally' | 'done' | null

export interface PredictorStep {
  stage: Stage
  status: string
  line: number
  r32: R32Match[]
  activeR32Index: number | null
  showR32Prob: boolean
  tree: BracketMatch[]
  activeTreeKey: string | null
  showTreeProb: boolean
  trialCount: number
  probabilities: Record<string, number> | null
  championId: string | null
  sound: Sound
}

export const CODE_SOURCE = [
  'def predict_champion(teams, trials=4000):',
  '    wins = {t.id: 0 for t in teams}',
  '    for i in range(1, trials + 1):',
  '        p = win_probability(team_a, team_b)     # Elo-style',
  '        champion = simulate_bracket(teams)       # R32 -> R16 -> QF -> SF -> F',
  '        wins[champion.id] += 1',
  '    return {t: wins[t] / trials for t in teams}',
]

export function buildSteps(): PredictorStep[] {
  const rng = mulberry32(SEED)
  const steps: PredictorStep[] = []

  const r32: R32Match[] = R32_PAIRS.map(([a, b], i) => ({
    index: i,
    teamAId: a,
    teamBId: b,
    decided: !!R32_RESULTS[i],
    resultNote: R32_RESULTS[i]?.note ?? null,
    winnerId: R32_RESULTS[i]?.winnerId ?? null,
  }))

  const tree: BracketMatch[] = [
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ round: 0 as Round, matchIndex: i, teamAId: null, teamBId: null, winnerId: null })),
    ...[0, 1, 2, 3].map((i) => ({ round: 1 as Round, matchIndex: i, teamAId: null, teamBId: null, winnerId: null })),
    ...[0, 1].map((i) => ({ round: 2 as Round, matchIndex: i, teamAId: null, teamBId: null, winnerId: null })),
    { round: 3 as Round, matchIndex: 0, teamAId: null, teamBId: null, winnerId: null },
  ]

  const snapR32 = () => r32.map((m) => ({ ...m }))
  const snapTree = () => tree.map((m) => ({ ...m }))
  const findTree = (round: Round, idx: number) => tree.find((m) => m.round === round && m.matchIndex === idx)!

  const push = (over: Partial<PredictorStep> & Pick<PredictorStep, 'status' | 'line'>) => {
    steps.push({
      stage: 'intro',
      r32: snapR32(),
      activeR32Index: null,
      showR32Prob: false,
      tree: snapTree(),
      activeTreeKey: null,
      showTreeProb: false,
      trialCount: 0,
      probabilities: null,
      championId: null,
      sound: null,
      ...over,
    })
  }

  push({ status: '32 teams have reached the Round of 32 — the real World Cup 2026 knockout field.', line: 0 })
  push({
    status: 'Six games are already decided. The other ten — and everything after — get an Elo-style win probability.',
    line: 1,
  })

  // ── Round of 32: real results where known, simulated (with reveal) where not ──
  function playR32(index: number): Team {
    const m = r32[index]
    const a = TEAM_MAP[m.teamAId]
    const b = TEAM_MAP[m.teamBId]
    const real = R32_RESULTS[index]

    if (real) {
      const winner = TEAM_MAP[real.winnerId]
      const loser = winner.id === a.id ? b : a
      push({
        stage: 'r32',
        status: `Real result: ${winner.name} beat ${loser.name} (${real.note}) — already through.`,
        line: 0,
        activeR32Index: index,
        showR32Prob: false,
        sound: 'advance',
      })
      return winner
    }

    const probA = winProbability(a, b)
    push({
      stage: 'r32',
      status: `${a.name} (${formatPct(probA)}) vs ${b.name} (${formatPct(1 - probA)}) — who takes the spot?`,
      line: 3,
      activeR32Index: index,
      showR32Prob: true,
      sound: 'reveal',
    })

    const winner = rng() < probA ? a : b
    const loser = winner.id === a.id ? b : a
    m.winnerId = winner.id
    const underdog = winner.rating < loser.rating
    push({
      stage: 'r32',
      status: underdog
        ? `Upset! ${winner.name} eliminates favourite ${loser.name}.`
        : `${winner.name} advances, as the rating favoured.`,
      line: 4,
      activeR32Index: index,
      showR32Prob: false,
      sound: underdog ? 'upset' : 'advance',
    })
    return winner
  }

  const r32Winners = R32_PAIRS.map((_, i) => playR32(i))

  // ── Round of 16 -> Final: a single-elimination tree over the 16 R32 winners ──
  function playTreeMatch(round: Round, matchIndex: number, a: Team, b: Team): Team {
    const rm = findTree(round, matchIndex)
    rm.teamAId = a.id
    rm.teamBId = b.id
    const probA = winProbability(a, b)
    const key = `${round}-${matchIndex}`

    push({
      stage: 'tree',
      status: `${a.name} (${formatPct(probA)}) vs ${b.name} (${formatPct(1 - probA)}) — who advances?`,
      line: 3,
      tree: snapTree(),
      activeTreeKey: key,
      showTreeProb: true,
      sound: 'reveal',
    })

    const winner = rng() < probA ? a : b
    const loser = winner.id === a.id ? b : a
    rm.winnerId = winner.id
    const underdog = winner.rating < loser.rating
    push({
      stage: 'tree',
      status: underdog
        ? `Upset! ${winner.name} knocks out favourite ${loser.name}.`
        : `${winner.name} advances, as the rating favoured.`,
      line: 4,
      tree: snapTree(),
      activeTreeKey: key,
      showTreeProb: false,
      sound: underdog ? 'upset' : 'advance',
    })
    return winner
  }

  const r16Winners = R16_INDEX_PAIRS.map(([i, j], k) => playTreeMatch(0, k, r32Winners[i], r32Winners[j]))
  const qfWinners = [0, 1, 2, 3].map((k) => playTreeMatch(1, k, r16Winners[k * 2], r16Winners[k * 2 + 1]))
  const sfWinners = [0, 1].map((k) => playTreeMatch(2, k, qfWinners[k * 2], qfWinners[k * 2 + 1]))
  const champion = playTreeMatch(3, 0, sfWinners[0], sfWinners[1])

  // ── Monte Carlo: keep rolling the SAME rng stream, trial 1 = the walkthrough above ──
  const counts: Record<string, number> = Object.fromEntries(TEAMS.map((t) => [t.id, 0]))
  counts[champion.id] = 1
  push({
    stage: 'montecarlo',
    status: `That was ONE simulated path — trial 1. Right now it looks like ${champion.name} wins every time. One sample isn't enough.`,
    line: 5,
    trialCount: 1,
    probabilities: ratios(counts, 1),
    sound: 'tally',
  })

  let ci = 0
  for (let i = 2; i <= TRIALS; i++) {
    const c = simulateRestOfTournament(rng)
    counts[c.id]++
    if (CHECKPOINTS[ci] === i) {
      push({
        stage: 'montecarlo',
        status: `After ${i.toLocaleString('en-US')} simulated tournaments, the estimate settles down.`,
        line: 2,
        trialCount: i,
        probabilities: ratios(counts, i),
        sound: 'tally',
      })
      ci++
    }
  }

  const final = steps[steps.length - 1].probabilities!
  const favorite = [...TEAMS].sort((x, y) => final[y.id] - final[x.id])[0]
  push({
    stage: 'result',
    status: `Predicted champion: ${favorite.name} — ${formatPct(final[favorite.id])} championship probability across ${TRIALS.toLocaleString('en-US')} simulated tournaments.`,
    line: 6,
    trialCount: TRIALS,
    probabilities: final,
    championId: favorite.id,
    sound: 'done',
  })

  return steps
}
