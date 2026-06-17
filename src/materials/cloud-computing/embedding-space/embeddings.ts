/**
 * Precomputed "embeddings / vector space" walkthrough — one Step = a full
 * snapshot of the 3D scene + overlays. The animation just replays these frames.
 *
 * Story (continues the AI / RAG series — this is the geometry behind it). The
 * whole point is to answer the layperson's question: "how does it KNOW wolf is
 * an animal?" Answer: it doesn't. Each word is turned into a list of numbers (a
 * vector); 'similar meaning' is just 'small distance'; the category emerges from
 * arithmetic, not a hand-written rule.
 *
 *   - 'embed'   : a word is just text → turn it into a vector → plot it as a point.
 *   - 'cluster' : similar usage → similar numbers → points land close (clusters).
 *               + measure distances to teach 'near = similar, far = unrelated'.
 *   - 'search'  : embed a new word, measure its distance to every point, the
 *                 smallest ones are its nearest neighbours = semantic search.
 *
 * Positions are hand-placed so the four clusters read clearly in 3D. The scene
 * lerps toward each step's targets; a gentle rock sells the depth.
 */

export type Phase = 'embed' | 'cluster' | 'search'
export type Cue = 'appear' | 'cluster' | 'query' | 'match' | 'done' | null
export type ClusterId = 'animals' | 'royalty' | 'food' | 'tech'

export interface Cluster {
  id: ClusterId
  label: string
  color: string
}

export const CLUSTERS: Record<ClusterId, Cluster> = {
  animals: { id: 'animals', label: 'animals', color: '#0D9488' },
  royalty: { id: 'royalty', label: 'royalty', color: '#D97706' },
  food: { id: 'food', label: 'food', color: '#DB2777' },
  tech: { id: 'tech', label: 'tech', color: '#6D45D9' },
}

/** Neutral grey used before clusters are coloured (the 'embed' phase). */
export const NEUTRAL = '#97A0BF'

export type Vec3 = [number, number, number]

export interface Word {
  id: string
  label: string
  cluster: ClusterId
  pos: Vec3
}

export const WORDS: Word[] = [
  { id: 'cat', label: 'cat', cluster: 'animals', pos: [-3.4, 0.1, 0.4] },
  { id: 'dog', label: 'dog', cluster: 'animals', pos: [-2.5, -0.4, 1.0] },
  { id: 'kitten', label: 'kitten', cluster: 'animals', pos: [-3.1, -0.9, 0.0] },
  { id: 'horse', label: 'horse', cluster: 'animals', pos: [-2.2, 0.6, 0.2] },
  { id: 'king', label: 'king', cluster: 'royalty', pos: [3.2, 1.3, -0.7] },
  { id: 'queen', label: 'queen', cluster: 'royalty', pos: [2.6, 0.7, -1.1] },
  { id: 'prince', label: 'prince', cluster: 'royalty', pos: [3.4, 0.5, -0.3] },
  { id: 'pizza', label: 'pizza', cluster: 'food', pos: [-1.0, -2.4, 2.4] },
  { id: 'burger', label: 'burger', cluster: 'food', pos: [-0.3, -1.9, 1.9] },
  { id: 'sushi', label: 'sushi', cluster: 'food', pos: [-1.2, -2.0, 2.7] },
  { id: 'laptop', label: 'laptop', cluster: 'tech', pos: [2.4, 2.2, 1.6] },
  { id: 'server', label: 'server', cluster: 'tech', pos: [1.9, 1.7, 2.1] },
  { id: 'cloud', label: 'cloud', cluster: 'tech', pos: [2.6, 1.6, 1.4] },
]

export const WORD_MAP: Record<string, Word> = Object.fromEntries(WORDS.map((w) => [w.id, w]))

/** A new word, embedded near the animals — used to demo semantic search. */
export const QUERY = { id: 'query', label: 'wolf', pos: [-2.7, -0.1, 1.4] as Vec3 }

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

/** Resolve a point id ('query' or a word id) to its position + display label. */
export function resolve(id: string): { label: string; pos: Vec3 } {
  return id === 'query' ? { label: QUERY.label, pos: QUERY.pos } : WORD_MAP[id]
}

/** Word ids sorted by distance to a point, nearest first. */
export function nearest(point: Vec3, k: number): { id: string; d: number }[] {
  return WORDS.map((w) => ({ id: w.id, d: distance(point, w.pos) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
}

export interface RankRow {
  id: string
  label: string
  cluster: ClusterId
  d: number
  rank: number
}

/** Every word ranked by distance to the query — drives the search ranking panel. */
export function rankingToQuery(): RankRow[] {
  return WORDS.map((w) => ({ id: w.id, label: w.label, cluster: w.cluster, d: distance(QUERY.pos, w.pos) }))
    .sort((a, b) => a.d - b.d)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

const NEIGHBOURS = nearest(QUERY.pos, 3)
const NEIGHBOUR_IDS = NEIGHBOURS.map((n) => n.id)
const NEIGHBOUR_NAMES = NEIGHBOUR_IDS.map((id) => WORD_MAP[id].label).join(', ')

/** A measured distance line drawn in the 3D scene. */
export interface Measure {
  a: string
  b: string
  /** Amber + thicker (search match) vs slate (teaching the metric). */
  strong?: boolean
}

export interface EmbStep {
  phase: Phase
  /** Word ids currently visible (others are hidden / shrunk to the origin). */
  visible: string[]
  /** Colour points by cluster (true) or show them neutral grey (false). */
  colored: boolean
  /** Show the query point + its label. */
  query: boolean
  /** Nearest-neighbour ids to highlight + link to the query. */
  neighbors: string[]
  /** Fade every non-neighbour point (search focus). */
  dimOthers: boolean
  /** Distance lines to draw between point pairs ('query' or a word id). */
  measures: Measure[]
  /** Focus a single point's vector in the readout panel (id or 'query'). */
  focus: string | null
  /** Show the ranked distance-to-query panel. */
  ranking: boolean
  /** Highlight cluster labels floating over each region. */
  regions: boolean
  /** Big centered concept headline (used on the text-only intro beats). */
  note?: string
  status: string
  sound: Cue
}

export const PHASES: Record<Phase, { label: string }> = {
  embed: { label: 'Embed' },
  cluster: { label: 'Cluster' },
  search: { label: 'Search' },
}

const ALL = WORDS.map((w) => w.id)

/** Shared defaults so each step only spells out what changes. */
function step(overrides: Partial<EmbStep> & Pick<EmbStep, 'phase' | 'status' | 'sound'>): EmbStep {
  return {
    visible: ALL,
    colored: true,
    query: false,
    neighbors: [],
    dimOthers: false,
    measures: [],
    focus: null,
    ranking: false,
    regions: false,
    ...overrides,
  }
}

/** Distance lines from the query to its nearest neighbours (search matches). */
const MATCH_LINES: Measure[] = NEIGHBOUR_IDS.map((id) => ({ a: 'query', b: id, strong: true }))

export function buildSteps(): EmbStep[] {
  return [
    // ── EMBED ──────────────────────────────────────────────────────────────
    step({
      phase: 'embed',
      visible: [],
      colored: false,
      note: 'A word is just symbols',
      status: 'To a computer, “cat” is three letters — there is no meaning attached to it.',
      sound: null,
    }),
    step({
      phase: 'embed',
      visible: [],
      colored: false,
      note: 'Letters ≠ meaning',
      status: '“cat” and “kitten” mean almost the same yet share few letters; “cat” and “cot” look alike but are unrelated.',
      sound: null,
    }),
    step({
      phase: 'embed',
      visible: [],
      colored: false,
      note: '“Know a word by the company it keeps”',
      status: 'The trick: look at the contexts a word appears in. Words used in similar sentences are probably related.',
      sound: null,
    }),
    step({
      phase: 'embed',
      visible: ['cat'],
      colored: false,
      focus: 'cat',
      status: 'So each word becomes a vector — a list of numbers summarizing the contexts it shows up in.',
      sound: 'appear',
    }),
    step({
      phase: 'embed',
      visible: ['cat'],
      colored: false,
      focus: 'cat',
      status: 'Those numbers are coordinates, so the word is now a point in space.',
      sound: 'appear',
    }),
    step({
      phase: 'embed',
      visible: ALL,
      colored: false,
      status: 'Embed the entire vocabulary and you get a whole cloud of points.',
      sound: 'appear',
    }),

    // ── CLUSTER ────────────────────────────────────────────────────────────
    step({
      phase: 'cluster',
      status: 'Words used in similar contexts get similar numbers — so their points land close together.',
      sound: 'cluster',
    }),
    step({
      phase: 'cluster',
      measures: [{ a: 'cat', b: 'kitten' }],
      status: '“cat” and “kitten” sit close — a small distance means similar meaning.',
      sound: 'cluster',
    }),
    step({
      phase: 'cluster',
      measures: [{ a: 'cat', b: 'kitten' }, { a: 'cat', b: 'king' }],
      status: '“cat” and “king” sit far apart — a large distance means unrelated.',
      sound: 'cluster',
    }),
    step({
      phase: 'cluster',
      measures: [{ a: 'cat', b: 'king' }],
      status: 'The metric is just straight-line distance in this space — geometry, not grammar.',
      sound: 'cluster',
    }),
    step({
      phase: 'cluster',
      regions: true,
      status: 'Four regions emerge on their own: animals, royalty, food, tech. Nobody labeled them — geometry did.',
      sound: 'cluster',
    }),

    // ── SEARCH ─────────────────────────────────────────────────────────────
    step({
      phase: 'search',
      regions: true,
      focus: 'query',
      status: 'A new word arrives: “wolf”. We never tell the model that a wolf is an animal.',
      sound: 'query',
    }),
    step({
      phase: 'search',
      query: true,
      focus: 'query',
      status: 'We embed “wolf” the exact same way — it becomes a point from its own numbers.',
      sound: 'query',
    }),
    step({
      phase: 'search',
      query: true,
      ranking: true,
      status: 'Now it is pure arithmetic: measure the distance from “wolf” to every other point.',
      sound: 'match',
    }),
    step({
      phase: 'search',
      query: true,
      ranking: true,
      status: 'Sort those distances smallest-first — no spelling, no rules, just numbers.',
      sound: 'match',
    }),
    step({
      phase: 'search',
      query: true,
      neighbors: NEIGHBOUR_IDS,
      dimOthers: true,
      ranking: true,
      measures: MATCH_LINES,
      status: `Keep the three smallest — its nearest neighbours: ${NEIGHBOUR_NAMES}.`,
      sound: 'match',
    }),
    step({
      phase: 'search',
      query: true,
      neighbors: NEIGHBOUR_IDS,
      dimOthers: true,
      ranking: true,
      measures: MATCH_LINES,
      status: '“wolf” shares no letters with cat or dog — a keyword search would miss them entirely.',
      sound: 'match',
    }),
    step({
      phase: 'search',
      query: true,
      neighbors: NEIGHBOUR_IDS,
      dimOthers: true,
      ranking: true,
      measures: MATCH_LINES,
      status: 'All animals — found by meaning alone. This is semantic search.',
      sound: 'done',
    }),
    step({
      phase: 'search',
      regions: true,
      status: 'Same idea powers RAG: your question is embedded, and the nearest documents get retrieved.',
      sound: 'done',
    }),
  ]
}

export { NEIGHBOUR_IDS }
