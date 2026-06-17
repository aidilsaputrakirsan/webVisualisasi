/**
 * Precomputed "embeddings / vector space" walkthrough — one Step = a full
 * snapshot of the 3D scene. The animation just replays these frames.
 *
 * Story (continues the AI / RAG series — this is the geometry behind it):
 *   - 'embed'   : each word becomes a vector → a point in 3D space.
 *   - 'cluster' : points with similar meaning land close together (clusters).
 *   - 'search'  : a new query word finds its nearest neighbours = semantic search.
 *
 * Positions are hand-placed so the four clusters read clearly in 3D. The scene
 * lerps toward each step's targets; a gentle turntable spin sells the depth.
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
export const QUERY = { label: 'wolf', pos: [-2.7, -0.1, 1.4] as Vec3 }

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

/** Word ids sorted by distance to a point, nearest first. */
export function nearest(point: Vec3, k: number): { id: string; d: number }[] {
  return WORDS.map((w) => ({ id: w.id, d: distance(point, w.pos) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
}

const NEIGHBOURS = nearest(QUERY.pos, 3)
const NEIGHBOUR_IDS = NEIGHBOURS.map((n) => n.id)
const NEIGHBOUR_NAMES = NEIGHBOUR_IDS.map((id) => WORD_MAP[id].label).join(', ')

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
  status: string
  sound: Cue
}

export const PHASES: Record<Phase, { label: string }> = {
  embed: { label: 'Embed' },
  cluster: { label: 'Cluster' },
  search: { label: 'Search' },
}

const ALL = WORDS.map((w) => w.id)

export function buildSteps(): EmbStep[] {
  return [
    {
      phase: 'embed',
      visible: [],
      colored: false,
      query: false,
      neighbors: [],
      dimOthers: false,
      status: "Words are just text — a computer can't compare their meaning directly.",
      sound: null,
    },
    {
      phase: 'embed',
      visible: ALL,
      colored: false,
      query: false,
      neighbors: [],
      dimOthers: false,
      status: 'An embedding turns each word into a vector — a point in space.',
      sound: 'appear',
    },
    {
      phase: 'cluster',
      visible: ALL,
      colored: true,
      query: false,
      neighbors: [],
      dimOthers: false,
      status: 'Words with similar meaning land close together — they form clusters.',
      sound: 'cluster',
    },
    {
      phase: 'cluster',
      visible: ALL,
      colored: true,
      query: false,
      neighbors: [],
      dimOthers: false,
      status: 'Animals, royalty, food, and tech each own a region of the space.',
      sound: 'cluster',
    },
    {
      phase: 'search',
      visible: ALL,
      colored: true,
      query: true,
      neighbors: [],
      dimOthers: false,
      status: `A new word arrives: "${QUERY.label}". Where does it land?`,
      sound: 'query',
    },
    {
      phase: 'search',
      visible: ALL,
      colored: true,
      query: true,
      neighbors: NEIGHBOUR_IDS,
      dimOthers: true,
      status: `Find the closest points — its nearest neighbours: ${NEIGHBOUR_NAMES}.`,
      sound: 'match',
    },
    {
      phase: 'search',
      visible: ALL,
      colored: true,
      query: true,
      neighbors: NEIGHBOUR_IDS,
      dimOthers: true,
      status: 'All animals — matched by meaning, not spelling. This is semantic search.',
      sound: 'done',
    },
  ]
}

export { NEIGHBOUR_IDS }
